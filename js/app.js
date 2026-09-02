/* ============================================================
 * AI Knowledge OS · Phase 1 知识树浏览器 app
 * 全部数据来自 window.KNOWLEDGE（content/ → build.js 产物），
 * 本文件只做"渲染 + 过滤 + 交互"，不含任何硬编码内容。
 * ============================================================ */
(function () {
  "use strict";
  var K = window.KNOWLEDGE;
  if (!K) { document.body.innerHTML = "<p style='padding:40px;text-align:center'>知识库未加载</p>"; return; }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ---------- 状态 ---------- */
  var state = {
    path: null,        // path id 或 null(全部)
    status: null,      // ready|wip|planned|promotion|null
    level: null,       // base|inter|pro|null
    q: "",
    open: {}           // catId -> bool (展开状态)
  };
  var CAT_ORDER = K.categories.map(function (c) { return c.id; });
  var STATUS_LABEL = { ready: "ready", wip: "wip", planned: "planned" };
  var STATUS_TEXT = { ready: "已就绪", wip: "制作中", planned: "规划中" };
  var LEVEL_TEXT = { base: "小白", inter: "深入", pro: "专家" };

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function diffHtml(d) {
    var h = "";
    for (var i = 1; i <= 5; i++) h += "<i" + (i <= d ? " class='on'" : "") + "></i>";
    return "<span class='diff'>" + h + "</span>";
  }
  function conceptInPaths(id) {
    var arr = K.pathForConcept(id);
    return arr.map(function (pid) { return { pid: pid, p: K.getPath(pid) }; });
  }

  /* ---------- 主题 ---------- */
  var themeToggle = $("#themeToggle");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("aios_theme", t); } catch (e) {}
  }
  themeToggle.addEventListener("click", function () {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
  try {
    var saved = localStorage.getItem("aios_theme");
    if (saved) applyTheme(saved);
  } catch (e) {}

  /* ---------- 统计条 ---------- */
  function renderStats() {
    var m = K.meta;
    var items = [
      { v: m.concepts, l: "知识点（概念）", c: "var(--primary)" },
      { v: m.categories, l: "顶层分类", c: "var(--accent)" },
      { v: m.paths, l: "学习路径", c: "#ff7043" },
      { v: m.ready, l: "ready 已就绪", c: "#23b26d" },
      { v: m.wip, l: "wip 制作中", c: "#f2a33c" },
      { v: m.planned, l: "planned 规划中", c: "#7d86a5" }
    ];
    $("#statsGrid").innerHTML = items.map(function (it) {
      return "<div class='stat'><div class='v' style='color:" + it.c + "'>" + it.v + "</div><div class='l'>" + it.l + "</div></div>";
    }).join("");
  }

  /* ---------- 路径概览条（选中某条路径时显示其阶段顺序） ---------- */
  function renderPathBanner() {
    var holder = $("#pathBanner");
    if (!holder) return;
    if (!state.path) { holder.hidden = true; holder.innerHTML = ""; return; }
    var p = K.getPath(state.path);
    var stagesHtml = p.stages.map(function (st, si) {
      var chips = st.concepts.map(function (cid) {
        var c = K.getConcept(cid);
        if (!c) return "";
        return "<span class='pb-chip' data-id=\"" + cid + "\">" + esc(c.title) +
          "<i class='pb-st " + c.status + "'>" + c.status.substring(0, 2) + "</i></span>";
      }).join("");
      return "<div class='pb-stage'><div class='pb-idx'>" + (si + 1) + "</div>" +
        "<div class='pb-stage-body'><div class='pb-stage-title'>" + esc(st.title) + "</div>" +
        "<div class='pb-chips'>" + chips + "</div></div></div>";
    }).join("");
    holder.hidden = false;
    holder.innerHTML =
      "<div class='pb-head'>" + p.icon + " 路径 · " + esc(p.title) +
      " <span class='pb-aud'>" + esc(p.audience) + "</span></div>" +
      "<div class='pb-stages'>" + stagesHtml + "</div>" +
      "<div class='pb-note'>" + esc(p.outcome) + "</div>";
    $$(".pb-chip", holder).forEach(function (chip) {
      chip.addEventListener("click", function () {
        openConcept(chip.getAttribute("data-id"));
      });
    });
  }

  /* ---------- 分类区 ---------- */
  function catMatches(catId, conceptIds) {
    var any = false;
    conceptIds.forEach(function (cid) { if (!isHidden(cid)) any = true; });
    return any;
  }
  function isHidden(cid) {
    var c = K.getConcept(cid);
    if (!c) return true;
    if (state.q && !matchesQuery(c)) return true;
    if (state.status && c.status !== state.status) return true;
    if (state.level && c.level !== state.level) return true;
    return false;
  }
  function matchesQuery(c) {
    var t = state.q.toLowerCase();
    return (c.id || "").toLowerCase().indexOf(t) !== -1 ||
      (c.title || "").toLowerCase().indexOf(t) !== -1 ||
      (c.summary || "").toLowerCase().indexOf(t) !== -1 ||
      ((c.skills || []).some(function (s) { return s.toLowerCase().indexOf(t) !== -1; }));
  }

  function renderTree() {
    var list = $("#categoryList");
    list.innerHTML = "";
    var shownCat = 0;
    K.categories.forEach(function (cat) {
      var concepts = K.conceptsByCategory(cat.id);
      var visible = concepts.filter(function (c) { return !isHidden(c.id); });
      if (visible.length === 0 && state.q) return; // 搜索时隐藏空分类
      var sect = buildCategory(cat, concepts, visible);
      list.appendChild(sect);
      shownCat++;
    });
    var empty = $("#emptyState");
    if (shownCat === 0 || (state.q || state.status || state.level || state.path) && $$(".concept:not(.hidden)", list).length === 0) {
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
    renderCounts();
  }

  function buildCategory(cat, all, visible) {
    var sect = el("div", "category" + (state.open[cat.id] ? " open" : ""));
    sect.style.setProperty("--catc", cat.color);

    var nReady = 0, nWip = 0, nPl = 0;
    all.forEach(function (c) { if (c.status === "ready") nReady++; else if (c.status === "wip") nWip++; else nPl++; });
    var total = all.length;
    var rPct = (nReady / total * 100).toFixed(1), wPct = (nWip / total * 100).toFixed(1), pPct = (100 - rPct - wPct).toFixed(1);

    var deps = (cat.dependsOn || []).map(function (did) {
      var d = K.getCategory(did);
      return d ? "<span class='tag'>" + esc(d.title) + "</span>" : "";
    }).join("");

    var head = el("div", "cat-head");
    head.innerHTML =
      "<div class='cat-ico'>" + cat.icon + "</div>" +
      "<div class='cat-body'>" +
        "<div class='cat-title-row'><span class='cat-title'>" + esc(cat.title) + "</span>" +
          (cat.core ? "<span class='cat-core'>CORE 主干</span>" : "<span class='cat-core soft'>延伸</span>") +
        "</div>" +
        "<div class='cat-desc'>" + esc(cat.desc) + "</div>" +
        "<div class='cat-notes'>" +
          (deps ? "<span>地基：<b>" + cat.dependsOn.map(function(did){var d=K.getCategory(did);return d?esc(d.title):did;}).join(" / ") + "</b></span>" : "<span>根节点 · 无地基</span>") +
          "<span>概念 <b>" + total + "</b></span>" +
          "<span>难度 <b>" + levelRange(all) + "</b></span>" +
          (cat.core ? "<span class='st-core'>必修</span>" : "") +
        "</div>" +
      "</div>" +
      "<div class='cat-count'><div class='num'>" + total + "</div><div class='lbl'>个概念</div></div>" +
      "<div class='cat-arrow'><svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg></div>";
    head.addEventListener("click", function () {
      state.open[cat.id] = !state.open[cat.id];
      sect.classList.toggle("open", state.open[cat.id]);
    });

    // 内容区
    var body = el("div", "cat-concepts");
    var bar = el("div", "cat-stats");
    bar.innerHTML =
      "<span><b class='c-ready'>" + nReady + "</b> ready</span>" +
      "<span><b class='c-wip'>" + nWip + "</b> wip</span>" +
      "<span><b class='c-pl'>" + nPl + "</b> planned</span>" +
      "<div class='bar'><i class='bg-ready' style='width:" + rPct + "%'></i><i class='bg-wip' style='width:" + wPct + "%'></i><i class='bg-pl' style='width:" + pPct + "%'></i></div>";
    body.appendChild(bar);

    var grid = el("div", "concept-grid");
    all.forEach(function (c) {
      grid.appendChild(buildConcept(c));
    });
    if (visible.length === 0) {
      grid.appendChild(el("div", "cat-empty", "该分类下没有匹配的概念"));
    }
    body.appendChild(grid);
    sect.appendChild(head);
    sect.appendChild(body);
    return sect;
  }

  function levelRange(concepts) {
    var has = { base: 0, inter: 0, pro: 0 };
    concepts.forEach(function (c) { if (has[c.level] != null) has[c.level]++; });
    var parts = [];
    if (has.base) parts.push("小白 " + has.base);
    if (has.inter) parts.push("深入 " + has.inter);
    if (has.pro) parts.push("专家 " + has.pro);
    return parts.join(" · ");
  }

  function buildConcept(c) {
    var card = el("div", "concept" + (isHidden(c.id) ? " hidden" : ""));
    var inPath = state.path && K.pathForConcept(c.id).indexOf(state.path) !== -1;
    if (inPath) card.classList.add("is-inpath");
    if (state.path && !inPath) card.classList.add("hidden");
    card.style.setProperty("--catc", K.getCategory(c.category).color);

    var pathTag = "";
    if (state.path) {
      var inArr = conceptInPaths(c.id);
      var hit = inArr.filter(function (x) { return x.pid === state.path; })[0];
      if (hit) {
        var stageInfo = K.pathConcepts(state.path).filter(function (s) { return s.concept.id === c.id; })[0];
        if (stageInfo) pathTag = "<span class='c-stage'>阶段 " + (stageInfo.stageIndex + 1) + "</span>";
      }
    }

    card.innerHTML =
      "<div class='c-top'>" +
        "<span class='b-st " + "b-" + c.status + "'>" + STATUS_LABEL[c.status] + "</span>" +
        "<span class='c-title'>" + esc(c.title) + "</span>" +
      "</div>" +
      "<div class='c-id'>" + esc(c.id) + "</div>" +
      "<div class='c-summary'>" + esc(c.summary) + "</div>" +
      "<div class='c-badges'>" +
        "<span class='b-lv'>" + LEVEL_TEXT[c.level] + "</span>" +
        diffHtml(c.difficulty) +
        "<span class='badge b-time'>" + esc(c.estTime || "") + "</span>" +
        pathTag +
      "</div>"
    card.addEventListener("click", function () { openConcept(c.id); });
    return card;
  }

  function renderCounts() {
    // 更新各 chips 的计数（这里只做静态计数展示）
  }

  /* ---------- 筛选 chips ---------- */
  function buildPathChips() {
    var holder = $("#pathChips");
    holder.innerHTML = "";
    addChip(holder, "全部路径", null, "path");
    K.paths.forEach(function (p) {
      addChip(holder, p.icon + " " + p.title, p.id, "path");
    });
  }
  function buildStatusChips() {
    var holder = $("#statusChips");
    holder.innerHTML = "";
    addChip(holder, "全部状态", null, "status");
    ["ready", "wip", "planned"].forEach(function (s) {
      var n = K.concepts.filter(function (c) { return c.status === s; }).length;
      addChip(holder, STATUS_TEXT[s] + "<span class='n'>" + n + "</span>", s, "status");
    });
  }
  function buildLevelChips() {
    var holder = $("#levelChips");
    holder.innerHTML = "";
    addChip(holder, "全部深度", null, "level");
    ["base", "inter", "pro"].forEach(function (lv) {
      var n = K.concepts.filter(function (c) { return c.level === lv; }).length;
      addChip(holder, LEVEL_TEXT[lv] + "<span class='n'>" + n + "</span>", lv, "level");
    });
  }
  function addChip(holder, label, val, type) {
    var chip = el("button", "chip");
    chip.innerHTML = label;
    if (state[type] === val) chip.classList.add("on");
    chip.addEventListener("click", function () {
      state[type] = (state[type] === val ? null : val);
      refresh();
    });
    holder.appendChild(chip);
  }

  /* ---------- 搜索 ---------- */
  var searchTimer = null;
  $("#searchInput").addEventListener("input", function (e) {
    clearTimeout(searchTimer);
    var v = e.target.value;
    searchTimer = setTimeout(function () { state.q = v.trim(); refresh(); }, 160);
  });

  function refresh() {
    renderPathBanner();
    renderTree();
    buildPathChips(); buildStatusChips(); buildLevelChips();
    $("#clearFilters").hidden = !(state.path || state.status || state.level || state.q);
  }
  $("#clearFilters").addEventListener("click", function () {
    state.path = state.status = state.level = null; state.q = "";
    $("#searchInput").value = "";
    refresh();
  });

  /* ---------- 抽屉 ---------- */
  var drawer = $("#drawer"), mask = $("#drawerMask");
  function openConcept(id) {
    var c = K.getConcept(id);
    if (!c) return;
    var cat = K.getCategory(c.category);
    var chips = conceptInPaths(id);
    var prereqTags = (c.prereqs || []).map(function (rid) {
      var r = K.getConcept(rid);
      return "<span class='d-tag' data-id='" + esc(rid) + "'>" + esc(r ? r.title : rid) + "</span>";
    }).join("") || "<span class='d-tag none'>无前置（根节点）</span>";
    var nextTags = (c.next || []).map(function (rid) {
      var r = K.getConcept(rid);
      return "<span class='d-tag' data-id='" + esc(rid) + "'>" + esc(r ? r.title : rid) + "</span>";
    }).join("") || "<span class='d-tag none'>暂无后继</span>";
    var relTags = (c.related || []).map(function (rid) {
      var r = K.getConcept(rid);
      return "<span class='d-tag' data-id='" + esc(rid) + "'>" + esc(r ? r.title : rid) + "</span>";
    }).join("") || "<span class='d-tag none'>暂无相关</span>";
    var skills = (c.skills || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    var pathInfo = chips.map(function (x) {
      var stage = K.pathConcepts(x.pid).filter(function (s) { return s.concept.id === id; })[0];
      return "<span class='d-tag' data-path='" + x.pid + "'>" + x.p.icon + " " + esc(x.p.title) +
        (stage ? " · 阶段" + (stage.stageIndex + 1) : "") + "</span>";
    }).join("") || "<span class='d-tag none'>尚未被任何路径引用</span>";

    $("#dCat").textContent = cat.icon + " " + cat.title + " · " + LEVEL_TEXT[c.level];
    $("#dTitle").textContent = c.title + "（" + c.id + "）";
    $("#dSummary").textContent = c.summary;
    $("#dBadges").innerHTML =
      "<span class='badge b-" + c.status + "'>" + STATUS_LABEL[c.status] + " · " + STATUS_TEXT[c.status] + "</span>" +
      "<span class='badge b-lv'>" + LEVEL_TEXT[c.level] + "</span>" +
      "<span class='badge b-lv'>难度 " + c.difficulty + "/5</span>";
    $("#dPrereqs").innerHTML = "<h4>前置 · Prereqs</h4><div class='d-tags'>" + prereqTags + "</div>";
    $("#dNext").innerHTML = "<h4>后继 · Next</h4><div class='d-tags'>" + nextTags + "</div>";
    $("#dRelated").innerHTML = "<h4>相关 · Related</h4><div class='d-tags'>" + relTags + "</div>";
    $("#dSkills").innerHTML = "<h4>你将具备的技能</h4><ul class='d-skills'>" + (skills || "<li>（待补充）</li>") + "</ul>";
    $("#dMeta").innerHTML =
      "<span>难度 <b>" + c.difficulty + " / 5</b></span>" +
      "<span>预估 <b>" + esc(c.estTime || "—") + "</b></span>" +
      "<span>实验 <b>" + esc(c.lab || "—") + "</b></span>" +
      "<span>测验 <b>" + esc(c.quiz || "—") + "</b></span>" +
      "<span>项目 <b>" + esc(c.project || "—") + "</b></span>" +
      "<span>V1来源 <b>" + esc(c.source || "—") + "</b></span>";
    $("#dPaths").innerHTML = "<h4>出现在哪些路径</h4><div class='d-tags'>" + pathInfo + "</div>";

    // 可点击跳转
    $$(".d-tag[data-id]", drawer).forEach(function (t) {
      t.addEventListener("click", function () { openConcept(t.getAttribute("data-id")); });
    });
    $$(".d-tag[data-path]", drawer).forEach(function (t) {
      t.addEventListener("click", function () {
        var pid = t.getAttribute("data-path");
        state.path = pid; state.open = {};
        refresh();
        closeDrawer();
        var holder = $("#tree");
        holder.scrollIntoView({ behavior: "smooth" });
      });
    });

    drawer.classList.add("open");
    mask.classList.add("show");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    mask.classList.remove("show");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  $("#drawerClose").addEventListener("click", closeDrawer);
  mask.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  /* ---------- 顶部导航平滑滚动 ---------- */
  $$(".topnav a").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var id = a.getAttribute("href");
      var target = document.querySelector(id);
      if (target) target.scrollIntoView({ behavior: "smooth" });
      $$(".topnav a").forEach(function (x) { x.classList.remove("active"); });
      a.classList.add("active");
    });
  });

  /* ---------- 启动 ---------- */
  function init() {
    renderStats();
    // 首屏展开前 3 个主干分类
    CAT_ORDER.slice(0, 3).forEach(function (cid) { state.open[cid] = true; });
    buildPathChips(); buildStatusChips(); buildLevelChips();
    renderPathBanner();
    renderTree();
  }
  init();
})();
