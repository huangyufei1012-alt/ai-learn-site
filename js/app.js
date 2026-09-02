/* ============================================================
 * AI Knowledge OS · Phase 2 学习者端 SPA（app）
 * ------------------------------------------------------------
 * 路由（hash）：#/dashboard #/learn #/lesson/:id #/map
 *              #/explore #/labs #/review #/search
 * 数据：window.KNOWLEDGE（概念/分类/路径）+ window.LEARN（课程）
 * 可视化：window.Viz（6 个交互组件）
 * 一切渲染由本文件完成；业务数据与内容零硬编码。
 * ============================================================ */
(function () {
  "use strict";
  var K = window.KNOWLEDGE, L = window.LEARN, Viz = window.Viz;
  var app = document.getElementById("app");

  /* ------------------ 工具 ------------------ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function catColor(catId) {
    var c = K.getCategory(catId);
    return (c && c.color) || "#5b6cff";
  }
  function go(hash) { location.hash = hash; }

  /* ------------------ 主题 ------------------ */
  var themeToggle = document.getElementById("themeToggle");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("aios_theme", t); } catch (e) {}
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }
  try {
    var savedTheme = localStorage.getItem("aios_theme");
    if (savedTheme) applyTheme(savedTheme);
  } catch (e) {}

  /* ------------------ 进度持久化 ------------------ */
  var STORE_KEY = "aios_progress_v2";
  var progress = (function () {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  })();
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {}
  }
  function setLastLesson(id) { progress.lastLesson = id; saveProgress(); }
  function setLastSection(id, idx) {
    progress.lastSection = progress.lastSection || {};
    progress.lastSection[id] = idx;
    saveProgress();
  }
  function markDone(id) {
    progress.done = progress.done || {};
    progress.done[id] = true;
    if (!progress.order) progress.order = [];
    if (progress.order.indexOf(id) === -1) progress.order.push(id);
    progress.lastLesson = id;
    saveProgress();
  }
  function isDone(id) { return !!(progress.done && progress.done[id]); }

  // 主线链（旗舰课 + 最后一门 AI Coding）
  var MAINLINE = ["l00-ai-world", "l-embedding", "l-attention", "l-transformer", "l-rag", "l-agent", "l22-ai-coding"];

  /* ==========================================================
   * 通用建块
   * ========================================================== */
  function pageShell(titleHtml, subHtml) {
    var w = el("div", "page-inner");
    var head = el("div", "pg-head");
    head.innerHTML = (titleHtml || "") + (subHtml || "");
    w.appendChild(head);
    app.innerHTML = "";
    app.appendChild(w);
    return w;
  }
  function statusBadge(ready) {
    return "<span class='bsok " + (ready ? "ok" : "no") + "'>" + (ready ? "已就绪 ✓" : "规划中") + "</span>";
  }
  function lessonCard(l, meta) {
    var ready = !!(meta && meta.ready) || !!L.getLesson(l.id);
    var done = isDone(l.id);
    var color = catColor(meta ? inferCat(l.id) : (l.category || ""));
    var card = el("div", "lesson-card" + (done ? " done" : "") + (ready ? "" : " soon"));
    card.style.setProperty("--lc", color);
    card.innerHTML =
      "<div class='lc-top'>" + statusBadge(ready) + (done ? "<span class='lc-done'>✓ 已学</span>" : "") + "</div>" +
      "<div class='lc-title'>" + esc(l.title || (meta && meta.title)) + "</div>" +
      (l.subtitle ? "<div class='lc-sub'>" + esc(l.subtitle) + "</div>" : "") +
      "<div class='lc-meta'>" +
        (l.estTime ? "<span>⏱ " + esc(l.estTime) + "</span>" : "") +
        (l.difficulty ? "<span>难度 " + l.difficulty + "/5</span>" : "") +
        (l.concepts ? "<span>" + l.concepts.length + " 个概念</span>" : "") +
      "</div>" +
      "<div class='lc-go'>" + (done ? "重新学习 →" : (ready ? "开始学习 →" : "即将上线")) + "</div>";
    return card;
  }
  function inferCat(lessonId) {
    var l = L.getLesson(lessonId);
    if (l && l.category) return l.category;
    var meta = L.getCurriculumLessonMeta(lessonId);
    if (meta && meta.category) return meta.category;
    // 从 curriculum 反查分类
    var res = findLessonMeta(lessonId);
    return res ? res.catId : "";
  }
  function findLessonMeta(id) {
    if (!L.curriculum) return null;
    var cs = L.curriculum.categories || [];
    for (var i = 0; i < cs.length; i++) {
      var chs = cs[i].chapters || [];
      for (var j = 0; j < chs.length; j++) {
        var ls = chs[j].lessons || [];
        for (var k = 0; k < ls.length; k++) {
          if (ls[k].id === id) return { catId: cs[i].category, chapter: chs[j].title, meta: ls[k] };
        }
      }
    }
    return null;
  }
  function curriculumCategory(catId) {
    if (!L.curriculum) return null;
    return (L.curriculum.categories || []).filter(function (c) { return c.category === catId; })[0] || null;
  }

  /* ==========================================================
   * Dashboard
   * ========================================================== */
  function renderDashboard() {
    var w = pageShell(
      "<h1>从零开始，<span class='grad'>看懂整个 AI 世界</span></h1>",
      "<p class='pg-sub'>这是一套真正的 11 段式交互课程：边看可视化、边动手实验、边做测验，一步步把 AI 从名词变成你脑子里的体系。</p>"
    );

    // CTA
    var cta = el("div", "dash-cta");
    var lastId = progress.lastLesson;
    var last = lastId ? L.getLesson(lastId) : null;
    var contBtn = "开始学习";
    if (last) {
      contBtn = isDone(lastId) ? "重新学习：" + last.title : "继续学习：" + last.title;
    }
    cta.innerHTML =
      "<button class='dash-btn primary' id='dashStart'>" + esc(contBtn) + " →</button>" +
      "<button class='dash-btn ghost' id='dashMap'>🧭 探索知识地图</button>" +
      "<button class='dash-btn ghost' id='dashLearn'>📚 查看全部课程</button>";
    w.appendChild(cta);
    $("#dashStart").addEventListener("click", function () { go("#/lesson/" + (lastId || "l00-ai-world")); });
    $("#dashMap").addEventListener("click", function () { go("#/map"); });
    $("#dashLearn").addEventListener("click", function () { go("#/learn"); });

    // 统计
    var stats = el("div", "stats-grid");
    var lCount = L.readyLessons().length;
    var items = [
      { v: lCount, l: "已就绪课程", c: "var(--primary)" },
      { v: K.meta.concepts, l: "知识概念", c: "var(--accent)" },
      { v: K.meta.categories, l: "AI 领域分类", c: "#ff7043" },
      { v: Object.keys(progress.done || {}).length, l: "已学完课程", c: "var(--good)" }
    ];
    stats.innerHTML = items.map(function (it) {
      return "<div class='stat'><div class='v' style='color:" + it.c + "'>" + it.v + "</div><div class='l'>" + it.l + "</div></div>";
    }).join("");
    w.appendChild(stats);

    // 旗舰课（建议先学）
    var fs = el("div", "block");
    fs.innerHTML = "<div class='block-title'><h2>✨ 主线课程 · 建议按顺序学</h2><span>从一张图看懂 AI，到亲手弄懂 Agent</span></div>";
    w.appendChild(fs);
    var mainlineWrap = el("div", "mainline");
    fs.appendChild(mainlineWrap);
    MAINLINE.forEach(function (id, i) {
      var l = L.getLesson(id);
      var meta = L.getCurriculumLessonMeta(id);
      var card = lessonCard(l && l.title ? l : { title: (meta && meta.title) || id }, meta);
      card.addEventListener("click", function () {
        if (L.getLesson(id)) go("#/lesson/" + id);
      });
      var node = el("div", "ml-node");
      node.appendChild(card);
      mainlineWrap.appendChild(node);
      if (i < MAINLINE.length - 1) {
        var arr = el("div", "ml-arrow", "<span>→</span>");
        mainlineWrap.appendChild(arr);
      }
    });

    // 领域分类预览
    var dept = el("div", "block");
    dept.innerHTML = "<div class='block-title'><h2>🗂 覆盖哪些领域</h2><span>12 大分类，从基础到产品全链路</span></div>";
    w.appendChild(dept);
    var catGrid = el("div", "cat-preview");
    K.categories.forEach(function (c) {
      var box = el("div", "cat-pv", "<div class='cp-ico'>" + (c.icon || "●") + "</div>" +
        "<div class='cp-body'><div class='cp-title'>" + esc(c.title) + "</div>" +
        "<div class='cp-n'>" + K.conceptsByCategory(c.id).length + " 个概念</div></div>");
      box.style.setProperty("--catc", c.color || "#5b6cff");
      box.addEventListener("click", function () { go("#/learn"); });
      catGrid.appendChild(box);
    });
    w.appendChild(catGrid);
  }

  /* ==========================================================
   * Learn（课程列表）
   * ========================================================== */
  function renderLearn() {
    var w = pageShell(
      "<h1>开始学习</h1>",
      "<p class='pg-sub'>四层结构：分类 → 章 → 课 → 概念。已就绪的课程可以点开完整学习，其余标明「规划中」。</p>"
    );
    if (!L.curriculum) { w.appendChild(el("div", "empty", "课程目录尚未就绪")); return; }

    var readyCnt = 0, total = 0;
    (L.curriculum.categories || []).forEach(function (cat) {
      (cat.chapters || []).forEach(function (ch) {
        (ch.lessons || []).forEach(function (l) { total++; if (l.ready) readyCnt++; });
      });
    });
    var prog = el("div", "learn-progress");
    prog.innerHTML = "<div class='lp-text'>课程进度：<b>" + readyCnt + " / " + total + "</b> 已就绪</div>" +
      "<div class='lp-bar'><i style='width:" + (readyCnt / total * 100).toFixed(1) + "%'></i></div>";
    w.appendChild(prog);

    (L.curriculum.categories || []).forEach(function (cat) {
      var loc = K.getCategory(cat.category);
      var sect = el("section", "learn-cat");
      sect.style.setProperty("--catc", (loc && loc.color) || "#5b6cff");
      var head = el("div", "learn-cat-head");
      head.innerHTML = "<span class='lch-ico'>" + ((loc && loc.icon) || "📘") + "</span>" +
        "<div class='lch-title'><b>" + esc(cat.title) + "</b>" +
        (cat.overview && cat.overview.headline ? "<span>" + esc(cat.overview.headline) + "</span>" : "") + "</div>";
      sect.appendChild(head);

      var chapters = cat.chapters || [];
      chapters.forEach(function (ch) {
        var chBlock = el("div", "learn-chapter");
        chBlock.innerHTML = "<div class='lc-ch-title'>" + esc(ch.title) + "</div>";
        var grid = el("div", "lesson-grid");
        ch.lessons.forEach(function (l) {
          var full = L.getLesson(l.id);
          var card = lessonCard(full || { title: l.title }, l);
          card.addEventListener("click", function () {
            if (full) { setLastLesson(l.id); go("#/lesson/" + l.id); }
          });
          grid.appendChild(card);
        });
        chBlock.appendChild(grid);
        sect.appendChild(chBlock);
      });
      w.appendChild(sect);
    });
  }

  /* ==========================================================
   * Lesson 渲染器（11 段）
   * ========================================================== */
  function renderLesson(id) {
    var lesson = L.getLesson(id);
    var meta = findLessonMeta(id);
    if (!lesson && !meta) { renderNotFound(); return; }
    var title = lesson ? lesson.title : (meta && meta.meta.title);
    var w = pageShell("", "");
    app.innerHTML = "";
    app.appendChild(buildLessonPage(lesson, meta, id));
  }

  function buildLessonPage(lesson, meta, id) {
    var root = el("div", "page-inner lesson-page");
    // 面包屑
    var crumbs = el("div", "crumbs");
    var catT = (meta && meta.catId && K.getCategory(meta.catId)) ? K.getCategory(meta.catId).title : "课程";
    crumbs.innerHTML = "<a href='#/learn'>课程</a> <span>/</span> <span>" + esc(catT) + "</span>" +
      (meta && meta.chapter ? " <span>/</span> <span class='cur'>" + esc(meta.chapter) + "</span>" : "");
    root.appendChild(crumbs);

    var title = lesson ? lesson.title : ((meta && meta.meta.title) || id);
    var head = el("div", "lesson-head");
    head.innerHTML =
      "<div class='lh-badges'>" +
        (lesson ? "<span class='badge b-lv'>" + esc(lesson.level || "base") + "</span>" : "") +
        (lesson && lesson.estTime ? "<span class='badge b-time'>⏱ " + esc(lesson.estTime) + "</span>" : "") +
        (lesson && lesson.difficulty ? "<span class='badge b-lv'>难度 " + lesson.difficulty + "/5</span>" : "") +
        (isDone(id) ? "<span class='badge b-ok'>✓ 已学完</span>" : "") +
      "</div>" +
      "<h1>" + esc(title) + "</h1>" +
      (lesson && lesson.subtitle ? "<p class='lh-subtitle'>" + esc(lesson.subtitle) + "</p>" : "");
    root.appendChild(head);

    // 前置 / 后继
    if (lesson && (lesson.prereqLessons.length || lesson.nextLesson)) {
      var links = el("div", "lesson-links");
      var pre = (lesson.prereqLessons || []).map(function (pid) {
        var p = L.getLesson(pid);
        return "<a href='#/lesson/" + esc(pid) + "' class='llink'><b>前置</b> " + esc((p && p.title) || pid) + "</a>";
      }).join("");
      var nxt = lesson.nextLesson ? (function () {
        var n = L.getLesson(lesson.nextLesson);
        return "<a href='#/lesson/" + esc(lesson.nextLesson) + "' class='llink'><b>下一课</b> " + esc((n && n.title) || lesson.nextLesson) + "</a>";
      })() : "";
      links.innerHTML = pre + nxt;
      root.appendChild(links);
    }

    // 概念清单
    if (lesson && lesson.concepts && lesson.concepts.length) {
      var ctags = el("div", "lesson-concepts");
      ctags.innerHTML = "<span class='lct-label'>本课涉及概念</span>" +
        lesson.concepts.map(function (cid) {
          var c = K.getConcept(cid);
          return "<span class='lct' title='" + esc(cid) + "'>" + esc((c && c.title) || cid) + "</span>";
        }).join("");
      root.appendChild(ctags);
    }

    // sections
    if (lesson && lesson.sections) {
      var body = el("div", "lesson-body");
      lesson.sections.forEach(function (sec, si) {
        body.appendChild(renderSection(sec, si));
      });
      root.appendChild(body);
    } else {
      root.appendChild(el("div", "empty", "该课程内容尚未撰写。"));
    }

    // 完成按钮 + 上下课
    var foot = el("div", "lesson-foot");
    var doneBtn = el("button", "dash-btn primary", isDone(id) ? "✓ 已标记完成（点击取消）" : "标记为已学完");
    doneBtn.addEventListener("click", function () {
      if (isDone(id)) { delete progress.done[id]; progress.order = (progress.order || []).filter(function (x) { return x !== id; }); }
      else markDone(id);
      saveProgress();
      renderLesson(id);
    });
    foot.appendChild(doneBtn);
    if (lesson && lesson.nextLesson) {
      var nx = L.getLesson(lesson.nextLesson);
      var nb = el("button", "dash-btn ghost", "下一课 → " + esc((nx && nx.title) || lesson.nextLesson));
      nb.addEventListener("click", function () { go("#/lesson/" + lesson.nextLesson); });
      foot.appendChild(nb);
    }
    root.appendChild(foot);

    // 记录学习位置
    setLastLesson(id);
    return root;
  }

  function renderSection(sec, si) {
    var t = sec.type;
    switch (t) {
      case "oneline": return secOneline(sec, si);
      case "why": return secWhy(sec, si);
      case "visual": return secVisual(sec, si);
      case "intuition": return secIntuition(sec, si);
      case "how": return secHow(sec, si);
      case "deep": return secDeep(sec, si);
      case "realworld": return secRealworld(sec, si);
      case "compare": return secCompare(sec, si);
      case "mistakes": return secMistakes(sec, si);
      case "practice": return secPractice(sec, si);
      case "connection": return secConnection(sec, si);
      default: return el("div", "sec", "");
    }
  }

  function secShell(si, type, title, more) {
    var wrap = el("div", "sec sec-" + type);
    var label = el("div", "sec-label", LABELS[type] || type);
    wrap.appendChild(label);
    if (title) {
      var h = el("div", "sec-title", "<h2>" + esc(title) + "</h2>");
      wrap.appendChild(h);
    }
    if (more) wrap.appendChild(more);
    return wrap;
  }
  var LABELS = {
    oneline: "一句话看懂", why: "为什么需要它", visual: "动手看看",
    intuition: "直觉理解", how: "它是怎么工作的", deep: "深入一点",
    realworld: "现实中的应用", compare: "对比区分", mistakes: "常见误解",
    practice: "动手练 + 小测验", connection: "和前面/后面的联系"
  };

  function secOneline(sec, si) {
    var w = secShell(si, "oneline");
    w.appendChild(el("p", "oneline-text", "💡 " + esc(sec.text)));
    return w;
  }
  function secWhy(sec, si) {
    var w = secShell(si, "why", "", el("div", "why-block"));
    var block = $(".why-block", w);
    block.innerHTML =
      "<div class='why-cell'><div class='wc-tag before'>现状</div><p>" + esc(sec.before) + "</p></div>" +
      "<div class='why-cell'><div class='wc-tag problem'>问题</div><p>" + esc(sec.problem) + "</p></div>" +
      "<div class='why-cell'><div class='wc-tag need'>需要</div><p>" + esc(sec.need) + "</p></div>" +
      (sec.visualNote ? "<div class='why-note'>🎯 " + esc(sec.visualNote) + "</div>" : "");
    return w;
  }
  function secVisual(sec, si) {
    var w = secShell(si, "visual", sec.title);
    if (sec.hint) w.appendChild(el("div", "viz-hint-inline", esc(sec.hint)));
    var holder = el("div", "viz-mount");
    holder.id = "viz" + si;
    w.appendChild(holder);
    if (Viz && Viz.render) {
      // 延迟一帧，确保尺寸可用
      setTimeout(function () { Viz.render(holder, sec.kind, {}); }, 0);
    } else {
      holder.innerHTML = "<p class='viz-error'>可视化组件未加载。</p>";
    }
    return w;
  }
  function secIntuition(sec, si) {
    var w = secShell(si, "intuition");
    var grid = el("div", "int-grid");
    (sec.blocks || []).forEach(function (b) {
      var card = el("div", "int-card", "<div class='int-k'>" + esc(b.k) + "</div><div class='int-t'>" + esc(b.t) + "</div>");
      grid.appendChild(card);
    });
    w.appendChild(grid);
    return w;
  }
  function secHow(sec, si) {
    var w = secShell(si, "how");
    if (sec.intro) w.appendChild(el("p", "how-intro", esc(sec.intro)));
    var flow = el("div", "how-flow");
    (sec.steps || []).forEach(function (st, i) {
      var card = el("div", "how-card");
      card.innerHTML =
        "<div class='how-idx'>" + (i + 1) + "</div>" +
        "<div class='how-in'><b>输入</b><p>" + esc(st.in) + "</p></div>" +
        "<div class='how-proc'><b>处理</b><p>" + esc(st.process) + "</p></div>" +
        "<div class='how-out'><b>输出</b><p>" + esc(st.out) + "</p></div>";
      flow.appendChild(card);
    });
    w.appendChild(flow);
    return w;
  }
  function deepItemHtml(it) {
    if (typeof it === "string") {
      return "<p class='deep-p'>" + esc(it) + "</p>";
    }
    if (it && it.code != null) {
      return "<div class='codeblock'><div class='cb-head'><span class='cb-lang'>" + esc(it.lang || "text") + "</span></div><pre><code>" + esc(it.code) + "</code></pre></div>";
    }
    return "";
  }
  function secDeep(sec, si) {
    var w = secShell(si, "deep", sec.title || "深入一点");
    var tabs = el("div", "deep-tabs");
    tabs.innerHTML = "<button class='dt active' data-m='beginner'>🌱 新手版</button>" +
      "<button class='dt' data-m='advanced'>🧠 进阶版</button>";
    w.appendChild(tabs);
    var content = el("div", "deep-content");
    var bgArr = sec.beginner || [], adArr = sec.advanced || [];
    function paint(mode) {
      var arr = mode === "advanced" ? adArr : bgArr;
      content.innerHTML = arr.map(deepItemHtml).join("") || "<p class='muted'>（暂无内容）</p>";
    }
    w.appendChild(content);
    $$(".dt", tabs).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".dt", tabs).forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        paint(b.getAttribute("data-m"));
      });
    });
    paint("beginner");
    return w;
  }
  function secRealworld(sec, si) {
    var w = secShell(si, "realworld");
    var grid = el("div", "rw-grid");
    (sec.items || []).forEach(function (it) {
      grid.appendChild(el("div", "rw-card", "<div class='rw-name'>" + esc(it.name) + "</div><div class='rw-note'>" + esc(it.note) + "</div>"));
    });
    w.appendChild(grid);
    return w;
  }
  function secCompare(sec, si) {
    var w = secShell(si, "compare");
    var rows = el("div", "cmp");
    (sec.pairs || []).forEach(function (p) {
      var r = el("div", "cmp-row");
      r.innerHTML = "<div class='cmp-a'>" + esc(p.a) + "</div><div class='cmp-vs'>vs</div><div class='cmp-b'>" + esc(p.b) + "</div>" +
        "<div class='cmp-diff'>" + esc(p.diff) + "</div>";
      rows.appendChild(r);
    });
    w.appendChild(rows);
    return w;
  }
  function secMistakes(sec, si) {
    var w = secShell(si, "mistakes");
    var ul = el("ul", "mist-list");
    (sec.items || []).forEach(function (it) {
      ul.appendChild(el("li", "", esc(it)));
    });
    w.appendChild(ul);
    return w;
  }
  function secPractice(sec, si) {
    var w = secShell(si, "practice");
    // quiz
    var quiz = sec.quiz || [];
    if (quiz.length) {
      var qBox = el("div", "quiz-box");
      qBox.appendChild(el("div", "quiz-label", "📝 小测验 · 点击选项查看解析"));
      quiz.forEach(function (q, qi) {
        qBox.appendChild(renderQuiz(q, qi));
      });
      w.appendChild(qBox);
    }
    // lab
    var lab = sec.lab;
    if (lab && lab.kind) {
      var labBox = el("div", "lab-box");
      labBox.innerHTML = "<div class='lab-head'><b>🧪 " + esc(lab.title || "动手实验") + "</b></div>" +
        (lab.desc ? "<div class='lab-desc'>" + esc(lab.desc) + "</div>" : "");
      var mount = el("div", "viz-mount");
      mount.id = "lab" + si;
      labBox.appendChild(mount);
      w.appendChild(labBox);
      if (Viz && Viz.render) {
        setTimeout(function () { Viz.render(mount, lab.kind, {}); }, 0);
      }
    }
    return w;
  }
  function QuizSession() {
    // 全局题库统计（复习页用）
    window.__QUIZ_META__ = window.__QUIZ_META__ || { answered: {}, total: 0 };
  }
  function renderQuiz(q, qi) {
    var item = el("div", "quiz-item");
    item.innerHTML = "<div class='quiz-q'><span class='qi'>" + (qi + 1) + ".</span> " + esc(q.q) + "</div>";
    var opts = el("div", "quiz-opts");
    (q.opts || []).forEach(function (op, oi) {
      var b = el("button", "quiz-opt", esc(op));
      b.dataset.oi = oi;
      b.addEventListener("click", function () {
        if (item.classList.contains("answered")) return;
        item.classList.add("answered");
        var correct = q.a === oi;
        b.classList.add(correct ? "right" : "wrong");
        if (!correct) {
          $$(".quiz-opt", opts).forEach(function (x) { if (Number(x.dataset.oi) === q.a) x.classList.add("right"); });
        }
        var ex = el("div", "quiz-explain" + (correct ? " ok" : " no"), (correct ? "✅ 回答正确。" : "❌ 正确答案是「" + esc(q.opts[q.a]) + "」。") + " " + esc(q.explain));
        item.appendChild(ex);
        markAnswered(q, qi);
      });
      opts.appendChild(b);
    });
    item.appendChild(opts);
    return item;
  }
  function markAnswered(q, qi) {
    // 简单全局计数（用于 review 汇总，非持久）
    var m = window.__QUIZ_STAT__ = window.__QUIZ_STAT__ || { n: 0 };
    m.n++;
    var c = document.getElementById("rvCount");
    if (c) c.textContent = m.n;
  }
  function secConnection(sec, si) {
    var w = secShell(si, "connection");
    var know = (sec.known || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var learn = (sec.learned || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    w.innerHTML +=
      "<div class='conn-grid'>" +
        (know ? "<div class='conn-col known'><h3>你已掌握</h3><ul>" + know + "</ul></div>" : "") +
        (learn ? "<div class='conn-col learned'><h3>刚学到</h3><ul>" + learn + "</ul></div>" : "") +
        (sec.next ? "<div class='conn-next'><h3>接下来</h3><p>" + esc(sec.next) + "</p></div>" : "") +
      "</div>";
    return w;
  }

  /* ==========================================================
   * Map（知识地图）
   * ========================================================== */
  function renderMap() {
    var w = pageShell(
      "<h1>知识地图</h1>",
      "<p class='pg-sub'>先看一张图理解 AI 的内外关系，再看主线路径：6 门旗舰课 + AI Coding，一环扣一环。</p>"
    );
    var vizBox = el("div", "viz-mount map-viz");
    w.appendChild(vizBox);
    if (Viz && Viz.render) setTimeout(function () { Viz.render(vizBox, "ai-world-map", {}); }, 0);

    // 主线
    var ml = el("div", "block");
    ml.innerHTML = "<div class='block-title'><h2>🧭 推荐主线路径</h2><span>一条线从零走到能做事的 Agent</span></div>";
    w.appendChild(ml);
    var chain = el("div", "map-chain");
    MAINLINE.forEach(function (id, i) {
      var l = L.getLesson(id);
      var meta = L.getCurriculumLessonMeta(id);
      var tick = el("div", "mp-tick" + (isDone(id) ? " done" : ""));
      tick.innerHTML = "<div class='mp-dot'>" + (i + 1) + "</div><div class='mp-name'>" + esc((l && l.title) || (meta && meta.title) || id) + "</div>";
      if (l && l.nextLesson === "") { }
      tick.addEventListener("click", function () { if (l) go("#/lesson/" + id); });
      chain.appendChild(tick);
      if (i < MAINLINE.length - 1) chain.appendChild(el("div", "mp-arrow", "→"));
    });
    ml.appendChild(chain);

    // 全部分类
    var all = el("div", "block");
    all.innerHTML = "<div class='block-title'><h2>🗂 12 大领域</h2><span>点击跳转到对应课程</span></div>";
    w.appendChild(all);
    var grid = el("div", "cat-preview");
    K.categories.forEach(function (c) {
      var box = el("div", "cat-pv", "<div class='cp-ico'>" + (c.icon || "●") + "</div>" +
        "<div class='cp-body'><div class='cp-title'>" + esc(c.title) + "</div><div class='cp-n'>" +
        K.conceptsByCategory(c.id).length + " 概念</div></div>");
      box.style.setProperty("--catc", c.color || "#5b6cff");
      box.addEventListener("click", function () { go("#/learn"); });
      grid.appendChild(box);
    });
    all.appendChild(grid);
  }

  /* ==========================================================
   * Explore（探索概念库 —— 复用知识树）
   * ========================================================== */
  function renderExplore() {
    var w = pageShell(
      "<h1>探索概念库</h1>",
      "<p class='pg-sub'>按 12 大分类浏览全部概念；点击概念卡片查看详情与对应课程。</p>"
    );
    var filterBar = el("div", "exp-filter");
    var qInput = el("input", "exp-search");
    qInput.placeholder = "搜索概念…";
    filterBar.appendChild(qInput);
    var statRow = el("div", "exp-stats");
    statRow.innerHTML =
      "<span>共 <b>" + K.concepts.length + "</b> 个概念</span>" +
      "<span>已就绪 <b style='color:var(--good)'>" + K.meta.ready + "</b></span>" +
      "<span>制作中 <b style='color:#c77f1e'>" + K.meta.wip + "</b></span>" +
      "<span>规划中 <b>" + K.meta.planned + "</b></span>";
    filterBar.appendChild(statRow);
    w.appendChild(filterBar);

    var list = el("div", "exp-list");
    w.appendChild(list);

    function drawTree(q) {
      list.innerHTML = "";
      var ql = (q || "").trim().toLowerCase();
      K.categories.forEach(function (cat) {
        var concepts = K.conceptsByCategory(cat.id);
        var vis = ql ? concepts.filter(function (c) {
          return (c.title || "").toLowerCase().indexOf(ql) !== -1 || (c.id || "").toLowerCase().indexOf(ql) !== -1 || (c.summary || "").toLowerCase().indexOf(ql) !== -1;
        }) : concepts;
        if (ql && vis.length === 0) return;
        var sect = el("div", "exp-cat");
        sect.style.setProperty("--catc", cat.color || "#5b6cff");
        var head = el("div", "exp-cat-head");
        head.innerHTML = "<span class='ech-ico'>" + (cat.icon || "●") + "</span>" +
          "<b>" + esc(cat.title) + "</b><span class='ech-n'>" + concepts.length + "</span>";
        head.addEventListener("click", function () { sect.classList.toggle("open"); });
        sect.appendChild(head);
        var grid = el("div", "exp-cards");
        vis.forEach(function (c) {
          grid.appendChild(conceptTile(c, cat));
        });
        if (grid.childNodes.length === 0) grid.appendChild(el("div", "cat-empty", "无匹配概念"));
        sect.appendChild(grid);
        list.appendChild(sect);
      });
    }
    drawTree("");
    var timer = null;
    qInput.addEventListener("input", function () {
      clearTimeout(timer);
      var v = this.value;
      timer = setTimeout(function () { drawTree(v); }, 160);
    });
  }
  function conceptTile(c, cat) {
    var tile = el("div", "exp-tile");
    tile.style.setProperty("--catc", cat.color || "#5b6cff");
    var statusText = c.status === "ready" ? "已就绪" : (c.status === "wip" ? "制作中" : "规划中");
    var lessons = L.lessonForConcept(c.id);
    tile.innerHTML =
      "<div class='et-top'><span class='et-st st-" + (c.status || "") + "'>" + statusText + "</span>" +
      (lessons.length ? " <span class='et-lesson'>🎓 " + lessons.length + " 门课</span>" : "") + "</div>" +
      "<div class='et-title'>" + esc(c.title) + "</div>" +
      "<div class='et-id'>" + esc(c.id) + "</div>" +
      "<div class='et-sum'>" + esc(c.summary || "") + "</div>" +
      "<div class='et-meta'><span>难度 " + c.difficulty + "/5</span>" +
      (c.estTime ? "<span>" + esc(c.estTime) + "</span>" : "") + "</div>";
    tile.addEventListener("click", function () {
      openConceptModal(c, cat, lessons);
    });
    return tile;
  }
  function openConceptModal(c, cat, lessons) {
    var mask = el("div", "modal-mask");
    var modal = el("div", "modal");
    var prereq = (c.prereqs || []).map(function (id) {
      var r = K.getConcept(id); return "<span class='m-tag'>" + esc((r && r.title) || id) + "</span>";
    }).join("") || "<span class='m-tag none'>无（根节点）</span>";
    var next = (c.next || []).map(function (id) {
      var r = K.getConcept(id); return "<span class='m-tag'>" + esc((r && r.title) || id) + "</span>";
    }).join("") || "<span class='m-tag none'>—</span>";
    var llist = lessons.map(function (lid) {
      var l = L.getLesson(lid);
      return "<button class='m-go' data-lesson='" + esc(lid) + "'>" + esc((l && l.title) || lid) + " →</button>";
    }).join("");
    modal.innerHTML =
      "<button class='modal-close' aria-label='关闭'>×</button>" +
      "<div class='modal-cat' style='color:" + esc(cat.color) + "'>" + (cat.icon || "") + " " + esc(cat.title) + "</div>" +
      "<h3>" + esc(c.title) + "</h3>" +
      "<div class='modal-id'>" + esc(c.id) + "</div>" +
      "<p class='modal-sum'>" + esc(c.summary) + "</p>" +
      "<div class='modal-row'><b>前置</b><div class='m-tags'>" + prereq + "</div></div>" +
      "<div class='modal-row'><b>后继</b><div class='m-tags'>" + next + "</div></div>" +
      (llist ? "<div class='modal-row'><b>对应课程</b><div class='m-actions'>" + llist + "</div></div>" : "") +
      "<div class='modal-row meta'><span>难度 " + c.difficulty + "/5</span><span>预估 " + esc(c.estTime || "—") + "</span></div>";
    mask.appendChild(modal);
    document.body.appendChild(mask);
    document.body.style.overflow = "hidden";
    function close() { mask.remove(); document.body.style.overflow = ""; }
    $(".modal-close", modal).addEventListener("click", close);
    mask.addEventListener("click", function (e) { if (e.target === mask) close(); });
    $$(".m-go", modal).forEach(function (b) {
      b.addEventListener("click", function () { close(); go("#/lesson/" + b.getAttribute("data-lesson")); });
    });
    document.addEventListener("keydown", function escFn(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", escFn); }
    });
  }

  /* ==========================================================
   * Labs（实验）
   * ========================================================== */
  function renderLabs() {
    var w = pageShell(
      "<h1>交互实验</h1>",
      "<p class='pg-sub'>所有旗舰课的动手实验集中在这里，无需进入课程即可直接操作。</p>"
    );
    var Lb = L.flagshipLessons();
    var any = false;
    Lb.forEach(function (ls) {
      if (!ls || !ls.sections) return;
      ls.sections.forEach(function (sec) {
        if (sec.type === "practice" && sec.lab && sec.lab.kind) {
          any = true;
          var box = el("div", "lab-card");
          box.innerHTML = "<div class='lab-card-head'><a href='#/lesson/" + esc(ls.id) + "' class='lab-lesson'>📖 " + esc(ls.title) + "</a>" +
            "<span class='lab-card-title'>🧪 " + esc(sec.lab.title || "实验") + "</span></div>";
          box.insertAdjacentHTML("beforeend", sec.lab.desc ? "<div class='lab-desc'>" + esc(sec.lab.desc) + "</div>" : "");
          var mount = el("div", "viz-mount");
          mount.id = "labcard-" + ls.id + "-" + Math.random().toString(36).slice(2, 7);
          box.appendChild(mount);
          w.appendChild(box);
          if (Viz && Viz.render) {
            (function (m, k) { setTimeout(function () { Viz.render(m, k, {}); }, 0); })(mount, sec.lab.kind);
          }
        }
      });
    });
    if (!any) {
      w.appendChild(el("div", "empty", "暂无实验（旗舰课均已内置动手实验，正在整理中）。"));
    }
  }

  /* ==========================================================
   * Review（复习 —— 汇总所有测验）
   * ========================================================== */
  function renderReview() {
    var w = pageShell(
      "<h1>复习 · 测验汇总</h1>",
      "<p class='pg-sub'>把六门旗舰课的所有小测验集中起来，检验你是否真的懂了；点选项即可查看解析。</p>"
    );
    var total = 0, answered = 0;
    var statbar = el("div", "rv-stat");
    var collected = [];
    L.flagshipLessons().forEach(function (ls) {
      if (!ls || !ls.sections) return;
      ls.sections.forEach(function (sec) {
        if (sec.type === "practice" && sec.quiz) {
          var lessonMeta = L.getCurriculumLessonMeta(ls.id);
          sec.quiz.forEach(function (q) {
            total++;
            collected.push({ q: q, lesson: ls, chapter: (lessonMeta && lessonMeta.title) || ls.title });
          });
        }
      });
    });
    statbar.innerHTML = "共 <b>" + total + "</b> 道题 · 本轮已答 <b id='rvCount'>0</b>";
    w.appendChild(statbar);

    var box = el("div", "rv-box");
    collected.forEach(function (it, i) {
      var card = el("div", "rv-card");
      card.innerHTML = "<div class='rv-head'><a href='#/lesson/" + esc(it.lesson.id) + "' class='rv-lesson'>📖 " + esc(it.lesson.title) + "</a>" +
        "<span class='rv-ch'>" + esc(it.chapter || "") + "</span></div>";
      card.appendChild(renderQuiz(it.q, i));
      card.dataset.qid = i;
      box.appendChild(card);
    });
    w.appendChild(box);
    w.appendChild(el("div", "empty", "提示：本页测验为纯前端交互，刷新页面后会重置计数；进入对应课程可再次作答。"));
  }

  /* ==========================================================
   * Search（搜索）
   * ========================================================== */
  function renderSearch() {
    var w = pageShell(
      "<h1>搜索</h1>",
      "<p class='pg-sub'>同时搜索概念与课程：输入关键词，回车或自动出结果。</p>"
    );
    var bar = el("div", "search-bar");
    var inp = el("input", "search-input");
    inp.placeholder = "搜索概念或课程，例如「注意力」「RAG」「向量」…";
    bar.appendChild(inp);
    w.appendChild(bar);
    var results = el("div", "search-results");
    w.appendChild(results);

    function doSearch(q) {
      results.innerHTML = "";
      var ql = (q || "").trim().toLowerCase();
      if (!ql) {
        results.appendChild(el("div", "empty", "输入关键词开始搜索。"));
        return;
      }
      // 概念
      var concepts = K.concepts.filter(function (c) {
        return (c.title || "").toLowerCase().indexOf(ql) !== -1 ||
          (c.id || "").toLowerCase().indexOf(ql) !== -1 ||
          (c.summary || "").toLowerCase().indexOf(ql) !== -1 ||
          ((c.skills || []).some(function (s) { return s.toLowerCase().indexOf(ql) !== -1; }));
      });
      // 课程
      var lessons = L.readyLessons().filter(function (l) {
        return (l.title || "").toLowerCase().indexOf(ql) !== -1 ||
          (l.subtitle || "").toLowerCase().indexOf(ql) !== -1 ||
          (l.concepts || []).some(function (cid) {
            var c = K.getConcept(cid);
            return c && (c.title.toLowerCase().indexOf(ql) !== -1 || cid.toLowerCase().indexOf(ql) !== -1);
          });
      });

      if (concepts.length) {
        var cs = el("div", "search-group");
        cs.appendChild(el("div", "sg-title", "概念 · " + concepts.length));
        var cgrid = el("div", "sg-grid");
        concepts.slice(0, 24).forEach(function (c) {
          var cat = K.getCategory(c.category);
          var tile = el("button", "sg-tile", "<span class='sgt-title'>" + esc(c.title) + "</span><span class='sgt-id'>" + esc(c.id) + "</span><span class='sgt-cat'>" + esc((cat && cat.title) || "") + "</span>");
          tile.addEventListener("click", function () { openConceptModal(c, cat || { color: "#5b6cff" }, L.lessonForConcept(c.id)); });
          cgrid.appendChild(tile);
        });
        cs.appendChild(cgrid);
        results.appendChild(cs);
      }
      if (lessons.length) {
        var lg = el("div", "search-group");
        lg.appendChild(el("div", "sg-title", "课程 · " + lessons.length));
        var lgrid = el("div", "sg-grid");
        lessons.forEach(function (l) {
          var t = lessonCard(l, L.getCurriculumLessonMeta(l.id));
          var wrap = el("div", "sg-lesson");
          wrap.appendChild(t);
          wrap.addEventListener("click", function () { go("#/lesson/" + l.id); });
          lgrid.appendChild(wrap);
        });
        lg.appendChild(lgrid);
        results.appendChild(lg);
      }
      if (!concepts.length && !lessons.length) {
        results.appendChild(el("div", "empty", "没有找到与「" + esc(q) + "」相关的内容。"));
      }
    }
    var timer = null;
    inp.addEventListener("input", function () {
      clearTimeout(timer);
      var v = this.value;
      timer = setTimeout(function () { doSearch(v); }, 160);
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(this.value); });
  }

  /* ==========================================================
   * 路由器
   * ========================================================== */
  function renderNotFound() {
    var w = pageShell("<h1>页面不存在</h1>", "<p class='pg-sub'>你访问的页面不存在或已下线。</p>");
    w.appendChild(el("button", "dash-btn primary", "← 返回仪表盘"));
    $(".dash-btn", w).addEventListener("click", function () { go("#/dashboard"); });
  }

  var routers = {
    dashboard: renderDashboard,
    learn: renderLearn,
    map: renderMap,
    explore: renderExplore,
    labs: renderLabs,
    review: renderReview,
    search: renderSearch
  };
  function showNotFound() { renderNotFound(); }

  function route() {
    var hash = location.hash || "#/dashboard";
    var parts = hash.replace(/^#\/?/, "").split("/");
    var name = parts[0] || "dashboard";
    var arg = parts[1] ? decodeURIComponent(parts[1]) : null;

    // 高亮导航
    $$("#mainNav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === name);
    });

    // 滚动到顶
    window.scrollTo(0, 0);
    // 记录当前路由（不改 hash，仅备忘）
    currentRoute = { name: name, arg: arg };

    // 清空可能的遗留 modal
    $$(".modal-mask").forEach(function (m) { m.remove(); });

    if (name === "lesson") {
      renderLesson(arg || "");
      return;
    }
    if (routers[name]) { routers[name](); return; }
    if (name === "") { renderDashboard(); return; }
    renderNotFound();
  }
  var currentRoute = { name: "dashboard", arg: null };

  /* ---------- 启动 ---------- */
  if (!K) {
    app.innerHTML = "<div class='empty' style='padding:60px;text-align:center'>知识库未加载：请通过本地静态服务器打开 index.html（不要直接用 file:// 打开）。</div>";
  } else if (!L) {
    app.innerHTML = "<div class='empty' style='padding:60px;text-align:center'>课程库未加载：请确认 lessons-bundle.js 已引入。</div>";
  } else {
    window.addEventListener("hashchange", route);
    route();
  }
})();
