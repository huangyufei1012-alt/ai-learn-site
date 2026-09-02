/* ============================================================
   AI 学堂 · 应用逻辑
   哈希路由 / 页面渲染 / 学习进度 / 主题切换 / 侧边栏
   依赖：COURSE（数据）、Quiz（测验模块，仅路由时调用）
   ============================================================ */
(function () {
  "use strict";

  /* ================= 存储：进度与成绩 ================= */
  var STORE_KEY = "aiProg_v1";
  var storeData = null;
  function load() {
    if (storeData) return storeData;
    try { storeData = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { storeData = {}; }
    if (!storeData.done) storeData.done = [];
    if (!storeData.best) storeData.best = {};
    return storeData;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(storeData)); } catch (e) {}
  }
  window.Store = {
    load: load,
    save: save,
    isDone: function (id) { return load().done.indexOf(id) >= 0; },
    toggleDone: function (id) {
      var d = load();
      var i = d.done.indexOf(id);
      if (i >= 0) d.done.splice(i, 1); else d.done.push(id);
      save();
    },
    doneCount: function () { return load().done.length; },
    progressPct: function () {
      var total = Object.keys(COURSE.lessons).length || 1;
      return Math.round(load().done.length / total * 100);
    },
    best: function (mid) { return load().best[mid] || null; },
    setBest: function (mid, pct) {
      var d = load();
      var cur = d.best[mid] || 0;
      d.best[mid] = Math.max(cur, pct);
      save();
    }
  };

  /* ================= 基础工具 ================= */
  var main = document.getElementById("main");
  function $(s) { return document.querySelector(s); }

  var THEME_KEY = "aiTheme";
  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY) || "light";
    document.documentElement.setAttribute("data-theme", saved);
    document.getElementById("themeToggle").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", cur);
      localStorage.setItem(THEME_KEY, cur);
    });
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  /* ================= 顶部栏：导航高亮 + 进度环 ================= */
  var NAV_VIEW = { home: "home", learn: "learn", lesson: "learn", glossary: "glossary", quiz: "quiz", roadmap: "roadmap", labs: "labs", projects: "projects", project: "projects" };
  function updateTopbar(view) {
    var activeNav = NAV_VIEW[view] || "home";
    Array.prototype.forEach.call(document.querySelectorAll("#topnav a"), function (a) {
      a.classList.toggle("active", a.getAttribute("data-nav") === activeNav);
    });
    var pct = Store.progressPct();
    var ring = document.getElementById("progressRing");
    var total = Object.keys(COURSE.lessons).length;
    var C = 2 * Math.PI * 12;
    ring.setAttribute("stroke-dashoffset", (C * (1 - pct / 100)).toFixed(2));
    document.getElementById("progressText").textContent = pct + "%";
    document.getElementById("progressChip").title = "已学 " + Store.doneCount() + "/" + total + " 节课 · " + pct + "%";
  }

  /* ================= 侧边栏 ================= */
  function renderSidebar(activeLid) {
    var wrap = document.getElementById("sidebarModules");
    var html = "";
    COURSE.modules.forEach(function (m) {
      var done = m.lessons.filter(function (id) { return Store.isDone(id); }).length;
      html += '<div class="side-module">'
        + '<div class="side-module-head">'
        + '<span class="m-ico" style="background:' + m.color + '">' + m.icon + '</span>'
        + '<span class="m-title">' + m.title + '</span>'
        + '<span class="m-count">' + done + '/' + m.lessons.length + '</span>'
        + '</div>'
        + '<div class="side-lessons">';
      m.lessons.forEach(function (lid, i) {
        var L = COURSE.lessons[lid];
        html += '<a class="side-lesson' + (activeLid === lid ? " active" : "") + (Store.isDone(lid) ? " done" : "") + '" href="#/lesson/' + lid + '" data-lid="' + lid + '">'
          + '<span class="lesson-num"><span class="ln">' + (i + 1) + '</span></span>'
          + '<span>' + L.title + '</span>'
          + '</a>';
      });
      html += '</div></div>';
    });
    wrap.innerHTML = html;
  }

  /* ================= 路由 ================= */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("/").filter(Boolean);
    if (!parts.length) return { view: "home" };
    if (parts[0] === "lesson" && parts[1]) return { view: "lesson", id: parts[1] };
    if (parts[0] === "project" && parts[1]) return { view: "project", id: parts[1] };
    if (parts[0] === "quiz") return parts[1] ? { view: "quiz-module", mid: parts[1] } : { view: "quiz" };
    if (["home", "learn", "glossary", "roadmap", "labs", "projects"].indexOf(parts[0]) >= 0) return { view: parts[0] };
    return { view: "lesson", id: parts[0] };
  }

  function route() {
    var r = parseHash();
    window.scrollTo(0, 0);
    closeSidebar();
    switch (r.view) {
      case "home": renderHome(); break;
      case "learn": renderLearn(); break;
      case "lesson": if (COURSE.lessons[r.id]) renderLesson(r.id); else renderNotFound(); break;
      case "glossary": renderGlossary(); break;
      case "roadmap": renderRoadmap(); break;
      case "labs": renderLabs(); break;
      case "projects": renderProjects(); break;
      case "project": if (window.PROJECT_COURSES && window.PROJECT_COURSES[r.id]) renderProject(r.id); else renderNotFound(); break;
      case "quiz": Quiz.renderPicker(main); break;
      case "quiz-module": Quiz.start(main, r.mid); break;
      default: renderHome();
    }
    renderSidebar(r.view === "lesson" ? r.id : null);
    updateTopbar(r.view);
  }

  /* ================= 首页 ================= */
  function moduleCardHTML(m) {
    var done = m.lessons.filter(function (id) { return Store.isDone(id); }).length;
    var pct = Math.round(done / m.lessons.length * 100);
    return '<div class="module-card" data-mid="' + m.id + '" style="border-top:3px solid ' + m.color + '">'
      + '<div class="mc-ico" style="background:' + m.color + '">' + m.icon + '</div>'
      + '<div class="mc-title">' + m.title + '</div>'
      + '<div class="mc-desc">' + m.shorts + '</div>'
      + '<div class="mc-meta">'
      + '<span>' + done + '/' + m.lessons.length + ' 课</span>'
      + '<div class="mc-progress"><i style="width:' + pct + '%"></i></div>'
      + '<span>' + pct + '%</span>'
      + '</div>'
      + '</div>';
  }

  function renderHome() {
    var total = Object.keys(COURSE.lessons).length;
    var vizCount = window.AIVIZ ? Object.keys(window.AIVIZ).length : 0;
    main.innerHTML = [
      '<section class="hero">',
      '<div class="hero-eyebrow">AI LEARNING · 从零开始</div>',
      '<h1>不想被 AI 时代甩开？<br>先搞懂它到底在干嘛。</h1>',
      '<p>你以为的“黑魔法”，拆开其实是一层层能听懂的概念。不啃教材，用生活类比 + 交互演示，把 Embedding、Transformer 这些词一次讲明白。</p>',
      '<div class="hero-stats">',
      '<div class="hero-stat"><b>4</b><span>大模块</span></div>',
      '<div class="hero-stat"><b>' + total + '</b><span>节课程</span></div>',
      '<div class="hero-stat"><b>' + vizCount + '</b><span>交互演示</span></div>',
      '<div class="hero-stat"><b>' + COURSE.glossary.length + '</b><span>术语解释</span></div>',
      '</div>',
      '<a class="hero-cta" href="#/learn">开始学习 →</a>',
      '</section>',
      '<div class="section-title"><span class="bar"></span>按模块进阶学习</div>',
      '<p class="section-sub">建议按 1 → 2 → 3 → 4 的顺序学习，前面的内容是后面的基础。</p>',
      '<div class="module-grid">' + COURSE.modules.map(moduleCardHTML).join("") + '</div>',
      '<div class="section-title"><span class="bar"></span>快捷工具</div>',
      '<div class="quick-tools">',
      '<a class="q-card" href="#/glossary"><div class="q-ico">📖</div><h4>术语表</h4><p>遇到不认识的词（Embedding？Token？）随时来查，中英对照 + 一句话解释。</p><span class="go">查看全部 →</span></a>',
      '<a class="q-card" href="#/quiz"><div class="q-ico">📝</div><h4>复习测验</h4><p>按模块做题，即时判分 + 错题解析，还能看到每个模块的最高分。</p><span class="go">去测一测 →</span></a>',
      '<a class="q-card" href="#/learn"><div class="q-ico">🗺️</div><h4>学习进度</h4><p>顶部进度环和每张卡片上的进度条，随时掌握自己学到了哪里。</p><span class="go">继续学习 →</span></a>',
      '<a class="q-card" href="#/roadmap"><div class="q-ico">🧭</div><h4>进阶路线</h4><p>入门之后还有路：从微软 21 课到 RAG 实战、Agent 深度、Transformer 原理，一条路线看清楚方向。</p><span class="go">查看进阶路线 →</span></a>',
      '<a class="q-card" href="#/projects"><div class="q-ico">🗂️</div><h4>项目实战</h4><p>你给的 8 个 GitHub 项目已整理成站内课程，不用跳去 GitHub，直接读讲解、看代码、玩演示。</p><span class="go">逐门学习 →</span></a>',
      '</div>'
    ].join("");

    Array.prototype.forEach.call(main.querySelectorAll(".module-card"), function (card) {
      card.addEventListener("click", function () {
        pendingModule = card.getAttribute("data-mid");
        location.hash = "#/learn";
      });
    });
  }

  /* ================= 课程目录 ================= */
  var pendingModule = null;

  function renderLearn() {
    var total = Object.keys(COURSE.lessons).length;
    var pct = Store.progressPct();
    var html = [
      '<div class="learn-top">',
      '<div><h1>课程目录</h1><p class="section-sub" style="margin-top:6px">共 4 个模块 · ' + total + ' 节课 · 建议按顺序学习</p></div>',
      '<div class="learn-total"><div class="lt-label">整体进度</div><div class="lt-bar"><i style="width:' + pct + '%"></i></div><div class="lt-num">' + pct + '%</div></div>',
      '</div>'
    ].join("");

    COURSE.modules.forEach(function (m, mi) {
      var done = m.lessons.filter(function (id) { return Store.isDone(id); }).length;
      var mpct = Math.round(done / m.lessons.length * 100);
      html += '<section class="lp-module" id="mod-' + m.id + '" style="border-top:4px solid ' + m.color + '">'
        + '<div class="lp-head">'
        + '<div class="lp-ico" style="background:' + m.color + '">' + m.icon + '</div>'
        + '<div class="lp-info"><h2>模块' + (mi + 1) + ' · ' + m.title + '</h2><p>' + m.shorts + '</p></div>'
        + '<div class="lp-meta"><div class="lp-bar"><i style="width:' + mpct + '%"></i></div><span>' + done + '/' + m.lessons.length + ' 课</span></div>'
        + '</div>'
        + '<div class="lp-lessons">';
      m.lessons.forEach(function (lid, li) {
        var L = COURSE.lessons[lid];
        var isDone = Store.isDone(lid);
        html += '<a class="lp-lesson' + (isDone ? " done" : "") + '" href="#/lesson/' + lid + '">'
          + '<span class="lp-num">' + (li + 1) + '</span>'
          + '<span class="lp-t"><b>' + L.title + '</b><em>' + L.subtitle + '</em></span>'
          + '<span class="lp-go">' + (isDone ? "✓ 已学完" : "开始学习") + '</span>'
          + '</a>';
      });
      html += '</div></section>';
    });
    main.innerHTML = html;

    if (pendingModule) {
      var target = document.getElementById("mod-" + pendingModule);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      pendingModule = null;
    }
  }

  /* ================= 课程详情 ================= */
  var LETTERS = ["A", "B", "C", "D", "E", "F"];

  function blockHTML(b) {
    switch (b.type) {
      case "h2":
        return '<div class="block"><h2>' + b.text + '</h2></div>';
      case "p":
        return '<div class="block"><p>' + b.text + '</p></div>';
      case "ul":
        return '<div class="block"><ul>' + b.items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ul></div>';
      case "callout": {
        var icon = b.t === "warn" ? "⚠️" : (b.t === "analogy" ? "💡" : "🍎");
        return '<div class="block"><div class="callout ' + b.t + '"><span class="c-ico">' + icon + '</span>'
          + '<div class="c-body"><div class="c-title">' + b.title + '</div>' + b.body + '</div></div></div>';
      }
      case "analogy":
        return '<div class="block"><div class="analogy-card">'
          + '<div class="analogy-src"><div class="a-label">🧑‍🏫 生活类比</div><div class="a-body">' + b.src + '</div></div>'
          + '<div class="analogy-arrow">→</div>'
          + '<div class="analogy-dst"><div class="a-label">🤖 AI 概念</div><div class="a-body">' + b.dst + '</div></div>'
          + '</div></div>';
      case "visual":
        return '<div class="block"><div class="visual-wrap"><div class="visual-card">'
          + '<div class="visual-head"><div class="visual-title"><span class="v-dot"></span>交互演示</div>'
          + '<span class="visual-hint">🔬 试着点一点、拖一拖</span></div>'
          + '<div class="visual-body" data-visual="' + b.id + '"></div>'
          + '</div></div></div>';
      case "review": {
        var items = b.items.map(function (it) {
          return '<div class="review-item"><span class="r-ico">✓</span><div class="r-body"><b>' + it.t + '</b> — ' + it.d + '</div></div>';
        }).join("");
        return '<div class="block"><div class="review-box">'
          + '<div class="review-head"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4L12 14l-3-3"/></svg>重点回顾</div>'
          + '<div class="review-list">' + items + '</div>'
          + '</div></div>';
      }
      case "miniquiz": {
        var opts = b.options.map(function (opt, i) {
          return '<button class="mq-opt' + (i === b.answer ? ' mq-right' : "") + '" data-i="' + i + '"' + (i === b.answer ? ' data-right="1"' : "") + '>'
            + '<span class="mq-letter">' + LETTERS[i] + '</span><span>' + opt + '</span></button>';
        }).join("");
        return '<div class="block"><div class="mini-quiz" data-explain="' + (b.explain || "").replace(/"/g, "&quot;") + '">'
          + '<div class="mq-q">' + b.q + '</div>'
          + '<div class="mq-opts">' + opts + '</div>'
          + '<div class="mq-feedback"></div></div></div>';
      }
      case "code":
        return '<div class="block"><div class="code-block"><div class="code-head">'
          + '<span class="code-dots"><i></i><i></i><i></i></span>'
          + '<span class="code-title">' + (b.label || "Code") + '</span>'
          + '<button class="code-copy" type="button">复制</button></div>'
          + '<pre><code>' + b.code + '</code></pre></div></div>';
      default:
        return "";
    }
  }

  function renderLesson(id) {
    var L = COURSE.lessons[id];
    var mod = COURSE.lessonOfModule[id];

    var flat = [];
    COURSE.modules.forEach(function (m) { m.lessons.forEach(function (lid) { flat.push(lid); }); });
    var idx = flat.indexOf(id);
    var prev = idx > 0 ? flat[idx - 1] : null;
    var next = idx < flat.length - 1 ? flat[idx + 1] : null;

    var isDone = Store.isDone(id);
    var goals = L.goals.map(function (g) { return '<span class="goal-tag">' + g + '</span>'; }).join("");
    var blocksHtml = L.blocks.map(blockHTML).join("");

    var completion = '<div class="lesson-done">'
      + '<button class="btn ' + (isDone ? "btn-ghost" : "btn-primary") + '" id="toggleDone">'
      + (isDone ? "✓ 已学完（点击取消）" : "标记为已学完") + '</button>'
      + '<span class="ld-hint">' + (isDone ? "真棒！这课已经学了，想重学可取消勾选" : "学完打勾，进度环会同步更新") + '</span>'
      + '</div>';

    var nav = '<div class="lesson-nav">'
      + (prev
        ? '<a class="nav-btn" href="#/lesson/' + prev + '"><span class="nb-ico">←</span><span class="nb-body"><div class="nb-label">上一课</div><div class="nb-title">' + COURSE.lessons[prev].title + '</div></span></a>'
        : '<span class="nav-btn" style="opacity:.35;pointer-events:none"><span class="nb-ico">←</span><span class="nb-body"><div class="nb-label">已是第一课</div><div class="nb-title">开始学习吧</div></span></span>')
      + (next
        ? '<a class="nav-btn next" href="#/lesson/' + next + '"><span class="nb-body"><div class="nb-label">下一课</div><div class="nb-title">' + COURSE.lessons[next].title + '</div></span><span class="nb-ico">→</span></a>'
        : '<span class="nav-btn next" style="opacity:.35;pointer-events:none"><span class="nb-body"><div class="nb-label">已是最后一课</div><div class="nb-title">去复习测验试试</div></span><span class="nb-ico">→</span></span>')
      + '</div>';

    main.innerHTML = [
      '<div class="lesson-hero">',
      '<div class="lesson-crumb"><a href="#/learn">课程</a><span class="sep">/</span>'
      + '<span class="lesson-module-chip" style="background:' + mod.color + '">' + mod.icon + ' ' + mod.title + '</span></div>',
      '<h1>' + L.title + '</h1>',
      '<div class="lesson-sub">' + L.subtitle + '</div>',
      '<div class="lesson-goals">' + goals + '</div>',
      '</div>',
      '<div class="lesson-body" id="lessonBody">' + blocksHtml + '</div>',
      completion,
      nav
    ].join("");

    // 挂载可视化
    Array.prototype.forEach.call(main.querySelectorAll("[data-visual]"), function (wrap) {
      var vid = wrap.getAttribute("data-visual");
      var fn = window.AIVIZ && window.AIVIZ[vid];
      if (typeof fn === "function") {
        try { fn(wrap); }
        catch (e) { wrap.innerHTML = '<p style="color:var(--text-3)">演示加载失败，请刷新重试。</p>'; }
      } else {
        wrap.innerHTML = '<p style="color:var(--text-3)">该演示暂不可用。</p>';
      }
    });

    // 课内小测验
    attachMiniQuiz(document.getElementById("lessonBody"));

    // 完成按钮
    document.getElementById("toggleDone").addEventListener("click", function () {
      var wasDone = Store.isDone(id);
      Store.toggleDone(id);
      var btn = document.getElementById("toggleDone");
      var hint = document.querySelector(".ld-hint");
      if (wasDone) {
        btn.className = "btn btn-primary";
        btn.textContent = "标记为已学完";
        hint.textContent = "学完打勾，进度环会同步更新";
        toast("已取消完成状态");
      } else {
        btn.className = "btn btn-ghost";
        btn.textContent = "✓ 已学完（点击取消）";
        hint.textContent = "真棒！这课已经学了，想重学可取消勾选";
        toast("🎉 本课已标记完成！");
      }
      renderSidebar(id);
      updateTopbar("lesson");
    });
  }

  function attachMiniQuiz(container) {
    if (!container) return;
    Array.prototype.forEach.call(container.querySelectorAll(".mini-quiz"), function (box) {
      var opts = box.querySelectorAll(".mq-opt");
      var fb = box.querySelector(".mq-feedback");
      var rightEl = box.querySelector('.mq-opt[data-right="1"]');
      var explain = box.getAttribute("data-explain") || "";
      var done = false;
      Array.prototype.forEach.call(opts, function (btn) {
        btn.addEventListener("click", function () {
          if (done) return;
          done = true;
          var ok = (btn === rightEl);
          btn.classList.add(ok ? "correct" : "wrong");
          if (rightEl && !ok) rightEl.classList.add("correct");
          Array.prototype.forEach.call(opts, function (c) { c.style.pointerEvents = "none"; });
          fb.classList.add("show", ok ? "ok" : "bad");
          fb.innerHTML = (ok ? "✅ 回答正确！<br>" : "❌ 回答错误<br>") + explain;
        });
      });
    });
  }

  /* ================= 术语表 ================= */
  var glossaryFilter = { q: "", tag: "全部" };

  function renderGlossary() {
    var tags = {};
    COURSE.glossary.forEach(function (t) { tags[t.tag] = (tags[t.tag] || 0) + 1; });
    var tagNames = Object.keys(tags).sort();

    main.innerHTML = [
      '<div class="glossary-hero"><h1>📖 术语表</h1>',
      '<p>遇到不认识的词随时来查，中英对照 + 一句话解释。共 ' + COURSE.glossary.length + ' 条。</p></div>',
      '<div class="search-box">',
      '<svg class="search-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
      '<input id="termSearch" type="text" placeholder="搜索术语（中文 / 英文）..." value="' + glossaryFilter.q + '">',
      '</div>',
      '<div class="pill-control" id="termTags">'
      + '<button class="pill' + (glossaryFilter.tag === "全部" ? " active" : "") + '" data-tag="全部">全部</button>'
      + tagNames.map(function (t) {
        return '<button class="pill' + (glossaryFilter.tag === t ? " active" : "") + '" data-tag="' + t + '">' + t + ' · ' + tags[t] + '</button>';
      }).join("")
      + '</div>',
      '<div class="term-grid" id="termGrid"></div>'
    ].join("");

    function apply() {
      var grid = document.getElementById("termGrid");
      var q = glossaryFilter.q.trim().toLowerCase();
      var tag = glossaryFilter.tag;
      var list = COURSE.glossary.filter(function (t) {
        if (tag !== "全部" && t.tag !== tag) return false;
        if (!q) return true;
        return t.en.toLowerCase().indexOf(q) >= 0 || t.zh.toLowerCase().indexOf(q) >= 0 || t.def.toLowerCase().indexOf(q) >= 0;
      });
      if (!list.length) {
        grid.innerHTML = '<div class="term-empty"><div style="font-size:40px">🔍</div><p>没有找到匹配的术语，换个关键词试试。</p></div>';
        return;
      }
      grid.innerHTML = list.map(function (t) {
        return '<div class="term-card"><h4>' + t.zh + ' <span class="t-en">' + t.en + '</span></h4>'
          + '<p>' + t.def + '</p><span class="t-tag">' + t.tag + '</span></div>';
      }).join("");
    }

    document.getElementById("termSearch").addEventListener("input", function () {
      glossaryFilter.q = this.value;
      apply();
    });
    Array.prototype.forEach.call(document.querySelectorAll("#termTags .pill"), function (p) {
      p.addEventListener("click", function () {
        glossaryFilter.tag = p.getAttribute("data-tag");
        Array.prototype.forEach.call(document.querySelectorAll("#termTags .pill"), function (x) { x.classList.remove("active"); });
        p.classList.add("active");
        apply();
      });
    });
    apply();
  }

  /* ================= 进阶学习路线 ================= */
  function levelPill(cls, label) {
    return '<span class="rp-level rp-' + cls + '">' + label + '</span>';
  }
  function itemCard(it) {
    var inSite = it.courseId && window.PROJECT_COURSES && window.PROJECT_COURSES[it.courseId];
    var go = inSite
      ? '<a class="rp-go" href="#/project/' + it.courseId + '">📖 在本站直接学习 →</a><a class="rp-go gh" href="' + it.url + '" target="_blank" rel="noopener">GitHub ↗</a>'
      : '<a class="rp-go" href="' + it.url + '" target="_blank" rel="noopener">去 GitHub 学习 →</a>';
    return '<div class="rp-card">'
      + '<div class="rp-card-top">'
      + '<span class="rp-ico" style="background:' + (it.iconBg || "var(--primary-soft)") + '">' + it.icon + '</span>'
      + '<span class="rp-tag">' + it.tag + '</span>'
      + '</div>'
      + '<h4 class="rp-name">' + it.name + '</h4>'
      + '<p class="rp-alias">' + it.alias + '</p>'
      + '<p class="rp-use">' + it.use + '</p>'
      + '<div class="rp-topics"><span class="rp-th">核心主题</span>'
      + it.topics.slice(0, 7).map(function (t) { return '<span class="rp-chip">' + t + '</span>'; }).join("")
      + (it.topics.length > 7 ? '<span class="rp-chip more">+' + (it.topics.length - 7) + '</span>' : "")
      + '</div>'
      + '<div class="rp-lv">' + levelPill(it.levelCls || "mid", "路线定位：" + it.level) + '</div>'
      + '<div class="rp-rows">'
      + '<div class="rp-row"><span class="rp-rk">前置</span><span>' + it.pre + '</span></div>'
      + '<div class="rp-row"><span class="rp-rk">收获</span><span>' + it.gain + '</span></div>'
      + '<div class="rp-row link"><span class="rp-rk">衔接</span><span>' + it.linkNote + '</span></div>'
      + '</div>'
      + '<div class="rp-go-wrap">' + go + '</div>'
      + '</div>';
  }

  function renderRoadmap() {
    if (!window.ROADMAP) { renderNotFound(); return; }
    var html = [
      '<section class="roadmap-hero">',
      '<div class="rm-eyebrow">LEARNING ROADMAP · 学完入门之后</div>',
      '<h1>进阶学习路线</h1>',
      '<p>本站 13 节课帮你把「概念地图」装进脑子。想继续深入，把 8 个项目整理成的站内课程逐门学起来：从生成式 AI 应用，到 LLM 实战与 RAG，再到 Agent 深度，最后可选啃模型原理——<b>不用跳去 GitHub，直接在本站逐章学习</b>。</p>',
      '<div class="rm-meta">'
      + '<span><b>' + window.ROADMAP.length + '</b> 个阶段</span>'
      + '<span><b>' + window.ROADMAP.reduce(function (s, st) { return s + st.items.length; }, 0) + '</b> 门项目课程</span>'
      + '<span><b>' + window.PROJECT_ORDER.length + '</b> 门可站内学习</span>'
      + '</div>',
      '<p class="rm-tip">💡 建议：先把本站 13 节课和测验完成，再按阶段顺序推进。<a href="#/projects" style="color:var(--primary);font-weight:600">前往「项目实战」逐门学习 →</a></p>',
      '</section>'
    ];

    window.ROADMAP.forEach(function (s, si) {
      var last = si === window.ROADMAP.length - 1;
      html.push(
        '<div class="rm-stage" data-stage="' + s.id + '">',
        '<div class="rm-stage-head">',
        '<span class="rm-stage-badge" style="background:' + s.color + '">' + s.icon + '</span>',
        '<div class="rm-stage-title"><span class="rm-stage-no">' + s.stage + '</span><h3>' + s.title + '</h3></div>',
        '</div>',
        '<p class="rm-stage-desc">' + s.desc + '</p>',
        '<div class="rp-grid">' + s.items.map(itemCard).join("") + '</div>',
        last ? '<div class="rm-end"><span>🏁</span><p>走到这里，你已走完一条从 AI 小白到能亲手构建 Agent / 读懂 Transformer 的完整进阶路线。</p></div>' : '<div class="rm-arrow">↓</div>'
      );
    });

    // 工具箱
    html.push(
      '<div class="rm-stage toolkit" data-stage="toolkit">',
      '<div class="rm-stage-head"><span class="rm-stage-badge" style="background:#666">🧰</span><div class="rm-stage-title"><span class="rm-stage-no">实战工具箱</span><h3>边学边用的 AI 编程助手</h3></div></div>',
      '<p class="rm-stage-desc">不是主线课程，却是全程都在用的「生产工具」——本站正是用它提供的设计系统反求方法论做出来的。</p>',
      '<div class="rp-grid">' + window.TOOLKIT.map(itemCard).join("") + '</div>',
      '</div>'
    );

    main.innerHTML = html.join("");
  }

  /* ================= 动画实验室 ================= */
  var LABS = [
    { id: "basics", icon: "🧠", title: "入门总览", desc: "先看全局——AI / ML / DL 是什么关系，发展时间线，以及机器学习的主要流派。",
      items: [
        ["aiVenn", "AI / 机器学习 / 深度学习的嵌套关系"],
        ["aiTimeline", "AI 发展大事记时间线"],
        ["mlFlow", "从原始问题到模型的完整流程"],
        ["mlTypes", "监督 / 无监督 / 强化学习三大流派"]
      ] },
    { id: "nn", icon: "⚙️", title: "神经网络单元", desc: "神经元怎么算、网络怎么连、错误怎么一步步传回去。",
      items: [
        ["neuron", "单个神经元：加权求和 + 激活函数"],
        ["network", "多层神经网络怎么把输入变成输出"],
        ["backprop", "反向传播：误差如何从后往前修正权重"]
      ] },
    { id: "text", icon: "🔤", title: "文字与向量", desc: "机器看不懂字，它只懂数字——看看文字是怎么被变成向量的。",
      items: [
        ["embedIntro", "为什么要做词嵌入（Embedding）"],
        ["embedMap", "把词映射到向量空间"],
        ["cosineDemo", "余弦相似度：两个词有多像"],
        ["tokenDemo", "Token：文字如何被切成小块"],
        ["bpeDemo", "BPE 子词切分算法"],
        ["position", "位置编码：怎么记住词的先后顺序"]
      ] },
    { id: "transformer", icon: "🏗️", title: "Transformer 核心", desc: "读懂 GPT 的地基——注意力机制如何让每个词『看见』上下文。",
      items: [
        ["attentionDemo", "注意力机制动态演示"],
        ["attentionLong", "长依赖：注意力如何跨远距离关联"],
        ["qkvFlow", "Q / K / V：查询-键-值的完整流程"],
        ["multiHead", "多头注意力：多路关注不同方面"],
        ["transformerBlock", "Transformer 整体结构拆解"]
      ] },
    { id: "train", icon: "📉", title: "训练与优化", desc: "模型是怎么『学』出来的，又怎样避免死记硬背。",
      items: [
        ["trainingPipeline", "预训练-微调-对齐的完整链路"],
        ["gradDescent", "梯度下降：小球滚下山坡找最低点"],
        ["epochDemo", "Epoch：同一批数据反复学几遍"],
        ["overfitDemo", "过拟合 vs 欠拟合：拟合复杂度的抉择"],
        ["sftDemo", "监督微调：让它学会对话"],
        ["rlhfDemo", "RLHF：用人类反馈对齐价值观"]
      ] },
    { id: "context", icon: "💬", title: "上下文与提示工程", desc: "模型记不住『无限』的话，怎么把需求讲清楚很关键。",
      items: [
        ["contextWindow", "上下文窗口到底能装多少"],
        ["windowOverflow", "超出上下文窗口会发生什么"],
        ["needleHaystack", "大海捞针：长文里能不能找到关键信息"],
        ["promptIntro", "提示词入门：怎么和模型说话"],
        ["promptFormula", "好提示词的万能公式"],
        ["promptCompare", "模糊提示 VS 精准提示对比"]
      ] },
    { id: "rag", icon: "📚", title: "RAG 检索增强", desc: "让模型『查资料』而不是凭空编——把知识库接进来。",
      items: [
        ["ragPain", "没检索时的痛点：凭空编造"],
        ["ragPipeline", "RAG 完整流水线：检索→增强→生成"],
        ["ragVector", "向量检索：怎么按『意思』找资料"]
      ] },
    { id: "agent", icon: "🤖", title: "Agent 智能体", desc: "不只是聊天——让它自己规划、动手调用工具完成任务。",
      items: [
        ["agentLoop", "Agent 循环：思考→行动→观察"],
        ["toolUse", "工具调用：让模型真的『会做事』"]
      ] },
    { id: "multimodal", icon: "🎨", title: "多模态", desc: "文字、图片、语音一起理解——不只看得懂字。",
      items: [
        ["multimodal", "多模态：多种信息如何融合"],
        ["multimodalFlow", "多模态模型的处理流程"],
        ["multimodalUse", "多模态的实际应用场景"]
      ] },
    { id: "infer", icon: "🎲", title: "生成与推理技巧", desc: "回答『蹦出来』的底层逻辑，以及怎么让答案更聪明。",
      items: [
        ["temperatureDemo", "温度：让回答更稳还是更发散"],
        ["topPDemo", "Top-p 采样：只从最可能的词里挑"],
        ["cotDemo", "思维链：一步步推理更靠谱"],
        ["fewShotDemo", "少样本：给例子 vs 不给例子"],
        ["hallucinationDemo", "幻觉：为什么模型会一本正经地编"]
      ] }
  ];

  function renderLabs() {
    var html = [
      '<section class="labs-hero">',
      '<div class="rm-eyebrow">DEMO LAB · 动手看得见</div>',
      '<h1>动画实验室</h1>',
      '<p>概念太抽象？这里是本站所有 <b>' + (window.AIVIZ ? Object.keys(window.AIVIZ).length : 0) + '</b> 个交互演示的集中营。点开任何一个名词的『▶ 运行』，亲手拖一拖滑杆、按一按按钮，难懂的概念一下就通了。</p>',
      '<div class="rm-meta">'
      + '<span><b>' + LABS.length + '</b> 大主题</span>'
      + '<span><b>' + LABS.reduce(function (s, g) { return s + g.items.length; }, 0) + '</b> 个演示</span>'
      + '<span>全部可交互</span>'
      + '</div>',
      '<div class="labs-pills" id="labsPills"></div>',
      '</section>'
    ];
    LABS.forEach(function (g) {
      html.push(
        '<section class="lab-group" data-group="' + g.id + '" id="lab-' + g.id + '">',
        '<div class="lab-group-head"><span class="lab-group-ico">' + g.icon + '</span><div><h2>' + g.title + '</h2><p>' + g.desc + '</p></div></div>',
        '<div class="lab-grid">' + g.items.map(function (it) {
          return '<div class="lab-card" data-lab="' + it[0] + '">'
            + '<div class="lab-card-head"><h3>' + it[1] + '</h3></div>'
            + '<div class="lab-body-wrap">'
            + '<div class="lab-launch"><button class="lab-run" data-viz="' + it[0] + '">▶ 运行演示</button></div>'
            + '<div class="visual-body lab-render" data-visual="' + it[0] + '" style="display:none"></div>'
            + '</div>'
            + '</div>';
        }).join("") + '</div>',
        '</section>'
      );
    });
    main.innerHTML = html.join("");

    // 目录锚点 pill
    var pillWrap = document.getElementById("labsPills");
    LABS.forEach(function (g) {
      var p = document.createElement("a");
      p.href = "#/labs";
      p.className = "pill";
      p.textContent = g.icon + " " + g.title;
      p.addEventListener("click", function (e) {
        e.preventDefault();
        var sec = document.getElementById("lab-" + g.id);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pillWrap.appendChild(p);
    });

    // 懒加载：点「运行」才挂载演示
    Array.prototype.forEach.call(main.querySelectorAll(".lab-run"), function (btn) {
      btn.addEventListener("click", function () {
        var viz = btn.getAttribute("data-viz");
        var card = btn.closest(".lab-card");
        var render = card.querySelector(".lab-render");
        var launch = card.querySelector(".lab-launch");
        var fn = window.AIVIZ && window.AIVIZ[viz];
        render.style.display = "block";
        launch.style.display = "none";
        if (typeof fn === "function") {
          try { fn(render); }
          catch (e) { render.innerHTML = '<p style="color:var(--text-3)">演示加载失败，请刷新重试。</p>'; }
        } else {
          render.innerHTML = '<p style="color:var(--text-3)">该演示暂不可用。</p>';
        }
      });
    });
  }

  /* ================= 项目实战：8 个开源项目站内学习 ================= */
  function projChips(p) {
    var html = "";
    if (p.tag) html += '<span class="proj-chip">' + p.tag + '</span>';
    if (p.level) html += '<span class="proj-chip alt">' + p.level + '</span>';
    html += '<span class="proj-chip gh"><a href="' + p.repoUrl + '" target="_blank" rel="noopener">GitHub ↗</a></span>';
    return html;
  }

  function projHero(p, crumbs) {
    return '<div class="proj-hero">'
      + '<div class="proj-crumb">' + crumbs + '</div>'
      + '<div class="proj-head">'
      + '<div class="proj-ico" style="background:' + p.color + '">' + p.icon + '</div>'
      + '<div class="proj-headinfo">'
      + '<div class="proj-eyebrow">' + p.stageNo + ' · ' + p.repoName + '</div>'
      + '<h1>' + p.title + '</h1>'
      + '<div class="proj-sub">' + p.subtitle + '</div>'
      + '<div class="proj-chips">' + projChips(p) + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="proj-intro"><p>' + p.intro + '</p>'
      + '<div class="proj-pre"><span class="proj-pre-k">前置</span><span>' + p.prereq + '</span></div>'
      + '</div>'
      + '</div>';
  }

  function projChapters(p) {
    return '<div class="proj-chapters"><div class="proj-chapters-t">📑 本章你将学到</div>'
      + '<div class="proj-chapters-list">' + p.chapters.map(function (c, i) {
        return '<div class="proj-chapter"><span class="proj-ch-no">' + (i + 1) + '</span><span>' + c + '</span></div>';
      }).join("") + '</div></div>';
  }

  function renderProjects() {
    if (!window.PROJECT_COURSES) { renderNotFound(); return; }
    var stages = {};
    window.PROJECT_ORDER.forEach(function (id) {
      var p = window.PROJECT_COURSES[id];
      p._id = id;
      (stages[p.stage] = stages[p.stage] || []).push(p);
    });
    var stageMeta = {
      s0: { no: "第 0 阶段", t: "地图与底色", icon: "🧭", d: "不打地基也能开始：先用地图看清全貌，再用一套通识课换个讲法学一遍。" },
      s1: { no: "第 1 阶段", t: "生成式 AI 应用入门", icon: "🚀", d: "微软官方 21 课，把概念变成能动手调 API 构建的真实应用。" },
      s2: { no: "第 2 阶段", t: "LLM 应用实战 · RAG", icon: "📚", d: "Datawhale 实战教程，用一个「个人知识库助手」把 RAG 全链路做一遍。" },
      s3: { no: "第 3 阶段", t: "Agent 深度", icon: "🤖", d: "先手搓原理，再上工程化框架——搞懂 Agent 从内到外。" },
      s4: { no: "第 4 阶段 · 选修", t: "模型原理", icon: "🔬", d: "Karpathy 从零实现教程，把神经网络和 GPT 的“内脏”翻给你看。" },
      toolkit: { no: "实战工具箱", t: "AI 编程工作流", icon: "🧰", d: "不是主线课程，却是全程都在用的“生产工具”。" }
    };
    var order = ["s0", "s1", "s2", "s3", "s4", "toolkit"];
    var html = [
      '<section class="roadmap-hero proj-hub-hero">',
      '<div class="rm-eyebrow">PROJECT LEARNING · 直接在网页里学</div>',
      '<h1>项目实战</h1>',
      '<p>你给到的 <b>8 个 GitHub 项目</b>，已整理成可直接在本站学习的章节内容——不用跳到 GitHub，逐章读讲解、看代码、玩演示、做小测验。每门课都标注了在整条进阶路线里的位置。</p>',
      '<div class="rm-meta">'
      + '<span><b>8</b> 门项目课</span>'
      + '<span><b>' + window.PROJECT_ORDER.length + '</b> 按路线编排</span>'
      + '<span>章节 + 代码 + 演示</span>'
      + '</div>',
      '</section>'
    ];
    order.forEach(function (sid) {
      var list = stages[sid];
      if (!list) return;
      var m = stageMeta[sid] || { no: sid, t: "", icon: "📌", d: "" };
      html.push(
        '<section class="proj-stage">',
        '<div class="proj-stage-head"><span class="proj-stage-badge">' + m.icon + '</span>'
        + '<div><span class="proj-stage-no">' + m.no + '</span><h2>' + m.t + '</h2></div></div>',
        '<p class="proj-stage-desc">' + m.d + '</p>',
        '<div class="proj-grid">' + list.map(projCardHTML).join("") + '</div>',
        '</section>'
      );
    });
    main.innerHTML = html.join("");
  }

  function projCardHTML(p) {
    var done = Store.isDone("proj:" + p._id);
    var viz = p.blocks.filter(function (b) { return b.type === "visual"; }).length;
    var code = p.blocks.filter(function (b) { return b.type === "code"; }).length;
    return '<a class="proj-card' + (done ? " done" : "") + '" href="#/project/' + p._id + '">'
      + '<div class="proj-card-head"><span class="proj-card-ico" style="background:' + p.color + '">' + p.icon + '</span>'
      + '<span class="proj-card-stage">' + p.stageNo + '</span></div>'
      + '<h3>' + p.title + '</h3>'
      + '<p class="proj-card-sub">' + p.subtitle + '</p>'
      + '<div class="proj-card-meta">'
      + '<span>' + p.chapters.length + ' 章</span>'
      + '<span>' + viz + ' 演示</span>'
      + '<span>' + code + ' 代码</span>'
      + (done ? '<span class="ok">✓ 已学完</span>' : '<span class="go">进入学习 →</span>')
      + '</div>'
      + '</a>';
  }

  function renderProject(id) {
    var P = window.PROJECT_COURSES[id];
    var idx = window.PROJECT_ORDER.indexOf(id);
    var prev = idx > 0 ? window.PROJECT_ORDER[idx - 1] : null;
    var next = idx < window.PROJECT_ORDER.length - 1 ? window.PROJECT_ORDER[idx + 1] : null;

    var blocksHtml = P.blocks.map(blockHTML).join("");
    var isDone = Store.isDone("proj:" + id);

    var completion = '<div class="lesson-done">'
      + '<button class="btn ' + (isDone ? "btn-ghost" : "btn-primary") + '" id="projToggleDone">'
      + (isDone ? "✓ 已学完（点击取消）" : "标记为已学完") + '</button>'
      + '<span class="ld-hint">' + (isDone ? "真棒！这门项目课学完了" : "学完整门课打勾，进度会记到本地") + '</span>'
      + '</div>';

    var nav = '<div class="lesson-nav">'
      + (prev
        ? '<a class="nav-btn" href="#/project/' + prev + '"><span class="nb-ico">←</span><span class="nb-body"><div class="nb-label">上一门</div><div class="nb-title">' + window.PROJECT_COURSES[prev].title + '</div></span></a>'
        : '<a class="nav-btn" href="#/projects"><span class="nb-ico">←</span><span class="nb-body"><div class="nb-label">上一门</div><div class="nb-title">返回项目列表</div></span></a>')
      + (next
        ? '<a class="nav-btn next" href="#/project/' + next + '"><span class="nb-body"><div class="nb-label">下一门</div><div class="nb-title">' + window.PROJECT_COURSES[next].title + '</div></span><span class="nb-ico">→</span></a>'
        : '<a class="nav-btn next" href="#/projects"><span class="nb-body"><div class="nb-label">下一门</div><div class="nb-title">返回项目列表</div></span><span class="nb-ico">🔁</span></a>')
      + '</div>';

    main.innerHTML = projHero(P, '<a href="#/projects">项目实战</a><span class="sep">/</span><span class="proj-crumb-cur">' + P.title + '</span>')
      + projChapters(P)
      + '<div class="lesson-body" id="projBody">' + blocksHtml + '</div>'
      + completion + nav;

    // 挂载可视化
    Array.prototype.forEach.call(main.querySelectorAll("[data-visual]"), function (wrap) {
      var vid = wrap.getAttribute("data-visual");
      var fn = window.AIVIZ && window.AIVIZ[vid];
      if (typeof fn === "function") {
        try { fn(wrap); }
        catch (e) { wrap.innerHTML = '<p style="color:var(--text-3)">演示加载失败，请刷新重试。</p>'; }
      } else {
        wrap.innerHTML = '<p style="color:var(--text-3)">该演示暂不可用。</p>';
      }
    });
    attachMiniQuiz(document.getElementById("projBody"));

    // 代码块复制
    Array.prototype.forEach.call(main.querySelectorAll(".code-copy"), function (btn) {
      btn.addEventListener("click", function () {
        var code = btn.closest(".code-block").querySelector("code").innerText;
        function done() {
          btn.textContent = "已复制 ✓";
          setTimeout(function () { btn.textContent = "复制"; }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(done, done);
        } else {
          var ta = document.createElement("textarea");
          ta.value = code; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta); done();
        }
      });
    });

    // 完成按钮
    var toggle = document.getElementById("projToggleDone");
    if (toggle) toggle.addEventListener("click", function () {
      var wasDone = Store.isDone("proj:" + id);
      Store.toggleDone("proj:" + id);
      var btn = document.getElementById("projToggleDone");
      var hint = document.querySelector(".lesson-done .ld-hint");
      if (wasDone) {
        btn.className = "btn btn-primary"; btn.textContent = "标记为已学完";
        hint.textContent = "学完整门课打勾，进度会记到本地";
        toast("已取消完成状态");
      } else {
        btn.className = "btn btn-ghost"; btn.textContent = "✓ 已学完（点击取消）";
        hint.textContent = "真棒！这门项目课学完了";
        toast("🎉 项目课已标记完成！");
      }
    });
  }

  function renderNotFound() {
    main.innerHTML = '<div class="empty-state"><div class="es-ico">🧭</div><h3>没有找到这一课</h3><p>它可能被移动或删除了，回课程目录看看。</p>'
      + '<p style="margin-top:18px"><a class="btn btn-primary" style="color:#fff" href="#/learn">← 返回课程目录</a></p></div>';
  }

  /* ================= 移动端侧边栏 ================= */
  function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sideMask").classList.add("show");
  }
  function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sideMask").classList.remove("show");
  }
  function initMenu() {
    document.getElementById("menuToggle").addEventListener("click", openSidebar);
    document.getElementById("sideClose").addEventListener("click", closeSidebar);
    document.getElementById("sideMask").addEventListener("click", closeSidebar);
    document.getElementById("sidebarModules").addEventListener("click", function (e) {
      if (e.target.closest("a")) closeSidebar();
    });
  }

  /* ================= 初始化 ================= */
  initTheme();
  initMenu();
  window.addEventListener("hashchange", route);
  route();
})();
