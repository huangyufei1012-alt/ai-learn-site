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
   * 唯一默认主学习路径「从零看懂 AI」（12 章，传统章节 TOC）
   * 让用户打开就能学，一课一课往下走，不需要理解整个系统。
   * ready 课程直接可学；其余标注「规划中」。
   * ========================================================== */
  var MAIN_PATH = [
    { no: "一", title: "看懂 AI 世界", lessons: [
      { no: "01", id: "l00-ai-world", title: "一张图看懂整个 AI 世界" },
      { no: "02", id: "l01-ai-vs-ml-dl", title: "AI / ML / DL 到底什么关系" },
      { no: "03", id: "pl-train-infer", title: "训练和使用模型有什么区别" }
    ]},
    { no: "二", title: "AI 怎么学习", lessons: [
      { no: "04", id: "pl-data", title: "数据：AI 的原料" },
      { no: "05", id: "l05-gradient-descent", title: "梯度下降：模型怎么自己变聪明" },
      { no: "06", id: "pl-overfitting", title: "过拟合：为什么训练好、现实差" }
    ]},
    { no: "三", title: "数据与向量", lessons: [
      { no: "07", id: "l02-vector-space", title: "向量与向量空间" },
      { no: "08", id: "l-embedding", title: "Embedding：把词变成数字" },
      { no: "09", id: "pl-semantic-search", title: "语义搜索" }
    ]},
    { no: "四", title: "机器如何学习", lessons: [
      { no: "10", id: "l03-matrix-gradient", title: "矩阵、函数与梯度" },
      { no: "11", id: "l08-neural-network", title: "神经网络：神经元如何学习" },
      { no: "12", id: "l09-backprop", title: "反向传播：误差如何传回去" }
    ]},
    { no: "五", title: "大语言模型", lessons: [
      { no: "13", id: "l-attention", title: "Attention：模型该关注哪个词" },
      { no: "14", id: "l-transformer", title: "Transformer：大模型的地基" },
      { no: "15", id: "pl-llm-training", title: "预训练 / 微调 / RLHF" }
    ]},
    { no: "六", title: "Prompt 与上下文", lessons: [
      { no: "16", id: "pl-prompt", title: "Prompt：怎么和模型说清楚" },
      { no: "17", id: "l12-context-window", title: "上下文窗口：模型一次能看多少" },
      { no: "18", id: "pl-inference", title: "推理：模型怎么一个字一个字说话" }
    ]},
    { no: "七", title: "RAG 检索增强", lessons: [
      { no: "19", id: "l-rag", title: "RAG：让模型先查资料再回答" }
    ]},
    { no: "八", title: "Agent 智能体", lessons: [
      { no: "20", id: "l-agent", title: "Agent：让 AI 自己动手做事" },
      { no: "21", id: "pl-function-calling", title: "Function Calling：让模型能动手" }
    ]},
    { no: "九", title: "多模态", lessons: [
      { no: "22", id: "pl-multimodal", title: "多模态：文字图片声音一起懂" },
      { no: "23", id: "pl-diffusion", title: "Diffusion：图片怎么被画出来" }
    ]},
    { no: "十", title: "AI Coding 编程", lessons: [
      { no: "24", id: "l22-ai-coding", title: "AI Coding：把 AI 变成结对程序员" }
    ]},
    { no: "十一", title: "AI 工程", lessons: [
      { no: "25", id: "pl-ai-eng", title: "AI 工程：从原型到生产" },
      { no: "26", id: "pl-eval-cost", title: "评估与成本：怎么判断值不值" }
    ]},
    { no: "十二", title: "AI 产品与应用", lessons: [
      { no: "27", id: "pl-ai-product", title: "AI 产品：从想法到落地" }
    ]}
  ];

  // 把 12 章扁平化，附带章索引，便于按顺序找上下课
  function pathFlat() {
    var out = [];
    MAIN_PATH.forEach(function (ch, ci) {
      ch.lessons.forEach(function (l) { out.push({ lesson: l, chapter: ch, chapterIdx: ci }); });
    });
    return out;
  }
  function pathIndexOf(id) {
    var a = pathFlat();
    for (var i = 0; i < a.length; i++) if (a[i].lesson.id === id) return i;
    return -1;
  }
  function pathChapterOf(id) {
    var a = pathFlat();
    for (var i = 0; i < a.length; i++) if (a[i].lesson.id === id) return a[i].chapter;
    return null;
  }
  // 找到路径中距离当前课最近的一门「已就绪」课（跳过规划中）
  function pathNeighbor(idx, dir) {
    var a = pathFlat();
    var i = idx + dir;
    while (i >= 0 && i < a.length) {
      if (L.getLesson(a[i].lesson.id)) return a[i].lesson;
      i += dir;
    }
    return null;
  }
  function pathPrev(id) { var idx = pathIndexOf(id); return idx < 0 ? null : pathNeighbor(idx, -1); }
  function pathNext(id) { var idx = pathIndexOf(id); return idx < 0 ? null : pathNeighbor(idx, 1); }

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
   * Dashboard（学习者仪表盘）
   * ========================================================== */
  /* ==========================================================
   * Dashboard（首页 = 极简：让我马上开始学习）
   * ========================================================== */
  function renderDashboard() {
    var w = el("div", "page-inner home-wrap");
    app.innerHTML = "";
    app.appendChild(w);

    // 主操作：开始 / 继续学习
    var lastId = progress.lastLesson && L.getLesson(progress.lastLesson) ? progress.lastLesson
      : (progress.order && progress.order.length ? progress.order[progress.order.length - 1] : null);
    var haveLast = lastId && L.getLesson(lastId);
    var doneCount = Object.keys(progress.done || {}).filter(function (k) { return L.getLesson(k); }).length;
    var readyTotal = L.readyLessons().length;
    var pct = readyTotal ? Math.round(doneCount / readyTotal * 100) : 0;

    var hero = el("div", "home-hero");
    hero.innerHTML =
      "<div class='hh-badge'>AI 学堂</div>" +
      "<h1>从零开始，一步一步看懂 AI</h1>" +
      "<p class='hh-sub'>不需要任何基础，打开就能学。一课一课往下走，<b>AI 会一步一步讲给你听</b>。</p>" +
      (haveLast
        ? "<button class='hh-cta' id='hhGo'>继续学习 · " + esc(L.getLesson(lastId).title) + " <span class='hh-arr'>→</span></button>"
        : "<button class='hh-cta' id='hhGo'>🚀 开始学习</button>") +
      (haveLast ? "<div class='hh-prog'><div class='hh-bar'><i style='width:" + pct + "%'></i></div><span>已完成 " + doneCount + " / " + readyTotal + " 课 · " + pct + "%</span></div>" : "");
    w.appendChild(hero);
    $("#hhGo").addEventListener("click", function () { go("#/lesson/" + (lastId || "l00-ai-world")); });

    // 课程路径：从零看懂 AI（12 章）
    var path = el("div", "block home-path");
    path.innerHTML = "<div class='block-title'><h2>课程路径 · 从零看懂 AI</h2><span>共 12 章，按顺序往下学</span></div>";
    w.appendChild(path);
    var steps = el("ol", "hp-steps");
    MAIN_PATH.forEach(function (ch, ci) {
      var li = el("li", "hp-step" + (ci === 0 ? " first" : ""));
      li.innerHTML = "<div class='hp-no'><b>" + esc(ch.no) + "</b></div>" +
        "<div class='hp-body'><div class='hp-title'>" + esc(ch.title) + "</div>" +
        "<div class='hp-sub'>" + ch.lessons.length + " 课</div></div>" +
        "<span class='hp-go'>查看 →</span>";
      li.addEventListener("click", function () { go("#/learn"); });
      steps.appendChild(li);
    });
    path.appendChild(steps);

    // 辅助入口：知识地图 / 实战
    var aux = el("div", "home-aux");
    aux.innerHTML =
      "<a class='aux-link' href='#/map'><span class='aux-ico'>🧭</span><div><b>知识地图</b><i>我在 AI 世界的什么位置</i></div><em>打开 →</em></a>" +
      "<a class='aux-link' href='#/projects'><span class='aux-ico'>🛠</span><div><b>实战项目</b><i>动手做出真东西</i></div><em>打开 →</em></a>";
    w.appendChild(aux);
  }

  /* ==========================================================
   * Learn（课程列表）
   * ========================================================== */
  function renderLearn() {
    var w = pageShell(
      "<h1>课程目录</h1>",
      "<p class='pg-sub'>从零看懂 AI · 一条主线 12 章。按顺序往下学，随时回来查看进度。</p>"
    );

    var doneCount = Object.keys(progress.done || {}).filter(function (k) { return L.getLesson(k); }).length;
    var readyTotal = L.readyLessons().length;
    var prog = el("div", "learn-progress");
    prog.innerHTML = "<div class='lp-text'>学习进度：已完成 <b>" + doneCount + "</b> / " + readyTotal + " 课</div>" +
      "<div class='lp-bar'><i style='width:" + (readyTotal ? Math.round(doneCount / readyTotal * 100) : 0) + "%'></i></div>";
    w.appendChild(prog);

    var curLesson = (progress.lastLesson && L.getLesson(progress.lastLesson)) ? progress.lastLesson : null;
    var toc = el("div", "toc");
    MAIN_PATH.forEach(function (ch, ci) {
      var sect = el("section", "toc-chapter" + (curLesson && chapterIdOf(curLesson) === ci ? " open" : ""));
      var head = el("div", "toc-ch-head");
      head.innerHTML = "<span class='toc-no'>第 " + esc(ch.no) + " 章</span><b>" + esc(ch.title) + "</b><span class='toc-cnt'>" + ch.lessons.length + " 课</span>";
      head.addEventListener("click", function () { sect.classList.toggle("open"); });
      sect.appendChild(head);
      var list = el("ol", "toc-list");
      ch.lessons.forEach(function (l) {
        var full = L.getLesson(l.id);
        var ready = !!full;
        var done = isDone(l.id);
        var row = el("li", "toc-row" + (done ? " done" : "") + (ready ? "" : " soon") + (curLesson === l.id ? " cur" : "") + (ready ? " clickable" : ""));
        row.innerHTML = "<span class='toc-num'>" + esc(l.no) + "</span>" +
          "<span class='toc-title'>" + esc(l.title) + "</span>" +
          (done ? "<span class='toc-st ok'>✔ 已学</span>" : (ready ? "<span class='toc-st'>开始</span>" : "<span class='toc-st plan'>规划中</span>"));
        row.addEventListener("click", function () { if (ready) { setLastLesson(l.id); go("#/lesson/" + l.id); } });
        list.appendChild(row);
      });
      sect.appendChild(list);
      toc.appendChild(sect);
    });
    w.appendChild(toc);
    w.appendChild(el("p", "toc-note", "标注「规划中」的课程正在编写，会陆续上线。已就绪的课程随时可以点开学习。"));
  }
  function chapterIdOf(id) {
    var a = pathFlat();
    for (var i = 0; i < a.length; i++) if (a[i].lesson.id === id) return a[i].chapterIdx;
    return -1;
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
    var root = el("div", "page-inner lesson-page three-col");

    // 面包屑：课程 → 第 X 章 · 章名 → 本课
    var chObj = pathChapterOf(id);
    var catT = (meta && meta.catId && K.getCategory(meta.catId)) ? K.getCategory(meta.catId).title : "课程";
    var crumbs = el("div", "crumbs");
    crumbs.innerHTML = "<a href='#/learn'>课程</a> <span>/</span> " +
      (chObj ? "<span class='cur'>第 " + esc(chObj.no) + " 章 · " + esc(chObj.title) + "</span>" : "<span>" + esc(catT) + "</span>") +
      (lesson ? " <span>/</span> <span class='cur'>" + esc(lesson.title) + "</span>" : "");
    root.appendChild(crumbs);

    // 页眉：只保留 预计时长 / 难度 / 学习状态 / 上一课·下一课 / 知识地图入口（隐藏系统信息）
    var title = lesson ? lesson.title : ((meta && meta.meta.title) || id);
    var done = isDone(id);
    var status = done ? "已完成" : (progress.lastLesson === id ? "学习中" : "未学习");
    var head = el("div", "lesson-head lp-head");
    var pv = pathPrev(id), nx = pathNext(id);
    head.innerHTML =
      "<div class='lp-meta'>" +
        (lesson && lesson.estTime ? "<span class='lm'>⏱ 预计 " + esc(lesson.estTime) + "</span>" : "") +
        (lesson && lesson.difficulty ? "<span class='lm'>难度 " + lesson.difficulty + " / 5</span>" : "") +
        "<span class='lm lm-status st-" + (done ? "done" : (progress.lastLesson === id ? "doing" : "todo")) + "'>" + status + "</span>" +
      "</div>" +
      "<h1>" + esc(title) + "</h1>" +
      (lesson && lesson.subtitle ? "<p class='lh-subtitle'>" + esc(lesson.subtitle) + "</p>" : "") +
      "<div class='lp-nav'>" +
        (pv ? "<a class='lp-prev' href='#/lesson/" + esc(pv.id) + "'>← 上一课 · " + esc(pv.title) + "</a>" : "<span class='lp-prev off'>← 已是第一课</span>") +
        "<a class='lp-map' href='#/map'>在知识地图中查看 →</a>" +
        (nx ? "<a class='lp-next' href='#/lesson/" + esc(nx.id) + "'>下一课 · " + esc(nx.title) + " →</a>" : "<span class='lp-next off'>已是最后一课 →</span>") +
      "</div>";
    root.appendChild(head);

    // 三栏布局
    var grid = el("div", "lp-grid");

    // 左栏：本章课程
    var left = el("aside", "lp-left");
    var chTitle = chObj ? ("第 " + chObj.no + " 章 · " + chObj.title) : "本章课程";
    left.innerHTML = "<div class='lp-side-title'>" + esc(chTitle) + "</div>";
    var chList = el("ol", "lp-ch-list");
    (chObj ? chObj.lessons : []).forEach(function (l) {
      var full = L.getLesson(l.id);
      var rdy = !!full;
      var dd = isDone(l.id);
      var li = el("li", "lp-ch-item" + (rdy ? " clickable" : " soon") + (l.id === id ? " cur" : ""));
      li.innerHTML = "<span class='lpc-no'>" + esc(l.no) + "</span>" +
        "<span class='lpc-t'>" + esc(l.title) + "</span>" +
        (dd ? "<span class='lpc-ok'>✔</span>" : "");
      li.addEventListener("click", function () { if (rdy && l.id !== id) { setLastLesson(l.id); go("#/lesson/" + l.id); } });
      chList.appendChild(li);
    });
    left.appendChild(chList);
    grid.appendChild(left);

    // 中栏：连续叙事正文（实验 + 测验内嵌）
    var mid = el("article", "lp-mid");
    if (lesson && lesson.sections) {
      lesson.sections.forEach(function (sec, si) {
        var sEl = renderSection(sec, si);
        if (sEl && sEl.tagName) sEl.id = "sec" + si;
        mid.appendChild(sEl);
      });
    } else {
      mid.appendChild(el("div", "empty", "该课程内容尚未撰写。"));
    }

    // 完成本课 + 上一课 / 下一课
    var foot = el("div", "lesson-foot");
    var doneBtn = el("button", "dash-btn primary", done ? "✓ 已完成本课（点击取消）" : "标记为已学完，下一课");
    doneBtn.addEventListener("click", function () {
      if (isDone(id)) { delete progress.done[id]; progress.order = (progress.order || []).filter(function (x) { return x !== id; }); }
      else markDone(id);
      saveProgress();
      renderLesson(id);
    });
    foot.appendChild(doneBtn);
    if (nx) {
      var nb = el("button", "dash-btn ghost", "下一课 · " + esc(nx.no) + " " + esc(nx.title) + " →");
      nb.addEventListener("click", function () { setLastLesson(nx.id); go("#/lesson/" + nx.id); });
      foot.appendChild(nb);
    }
    if (pv) {
      var pb = el("button", "dash-btn ghost", "← 上一课 · " + esc(pv.no) + " " + esc(pv.title));
      pb.addEventListener("click", function () { setLastLesson(pv.id); go("#/lesson/" + pv.id); });
      foot.appendChild(pb);
    }
    mid.appendChild(foot);
    grid.appendChild(mid);

    // 右栏：本课目录（章节锚点）
    var right = el("aside", "lp-right");
    right.innerHTML = "<div class='lp-side-title'>本课目录</div>";
    var toc = el("ol", "lp-toc");
    if (lesson && lesson.sections) {
      lesson.sections.forEach(function (sec, si) {
        var li = el("li", "lp-toc-item");
        li.innerHTML = "<span class='lpt-no'>" + (si + 1) + "</span><span>" + esc(sectionLabel(sec)) + "</span>";
        li.addEventListener("click", function () { var n = document.getElementById("sec" + si); if (n) n.scrollIntoView({ behavior: "smooth", block: "start" }); });
        toc.appendChild(li);
      });
    }
    right.appendChild(toc);
    grid.appendChild(right);

    root.appendChild(grid);

    // 记录学习位置
    setLastLesson(id);
    return root;
  }

  function sectionLabel(sec) {
    if (sec.title) return sec.title;
    return NARRATIVE[sec.type] || LABELS[sec.type] || sec.type;
  }
  function renderSection(sec, si) {
    var t = sec.type;
    switch (t) {
      case "opening": return secOpening(sec, si);
      case "exercise": return secExercise(sec, si);
      case "check": return secCheck(sec, si);
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
    var heading = title || NARRATIVE[type] || LABELS[type] || "";
    if (heading) {
      var h = el("div", "sec-title", "<h2>" + esc(heading) + "</h2>");
      wrap.appendChild(h);
    }
    if (more) wrap.appendChild(more);
    return wrap;
  }
  // 连续叙事的章节标题（让课程像一本书，从上往下读）
  var NARRATIVE = {
    opening: "先想一个问题",
    why: "为什么需要它？",
    oneline: "一句话，先看懂",
    visual: "动手，直观感受",
    intuition: "直觉理解",
    how: "它到底是怎么工作的",
    deep: "再深入一点",
    realworld: "它在真实世界怎么用",
    compare: "别把这几样搞混",
    mistakes: "最常见的误解",
    exercise: "你猜一下：接下来会怎样？",
    check: "小测验：你真的懂了吗",
    connection: "和前后课连起来",
    practice: "动手练一练"
  };
  var LABELS = {
    oneline: "一句话看懂", why: "为什么需要它", visual: "动手看看",
    intuition: "直觉理解", how: "它是怎么工作的", deep: "深入一点",
    realworld: "现实中的应用", compare: "对比区分", mistakes: "常见误解",
    opening: "开场问题", exercise: "你猜一下", check: "结课检测",
    practice: "动手练 + 小测验", connection: "和前面/后面的联系"
  };

  /* 滚动到指定锚点（用于"答错跳回对应教学段落"） */
  function scrollToTarget(t) {
    var id = t || "";
    var node = document.getElementById(id);
    if (!node && /^sec\d/.test(id)) { /* already raw id */ }
    else if (!node && /^\d+$/.test(id)) { node = document.getElementById("sec" + id); }
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      // 高亮提示
      node.classList.remove("flash");
      void node.offsetWidth;
      node.classList.add("flash");
    }
  }
  // 跳回可读提示按钮
  function jumpButton(target, label) {
    var b = el("button", "jump-btn", "📖 " + (label || "回讲义，再看一遍这一段"));
    b.addEventListener("click", function () { scrollToTarget(target); });
    return b;
  }

  /* ---------- 开场问题 ---------- */
  function secOpening(sec, si) {
    var w = secShell(si, "opening");
    var q = el("div", "opening");
    q.innerHTML =
      "<div class='op-tag'>🎯 先回答一个问题" + (sec.sub || "") + "</div>" +
      "<div class='op-q'>" + esc(sec.question) + "</div>" +
      (sec.guess ? "<div class='op-guess'>🤔 想好了吗？<b>" + esc(sec.guess) + "</b> —— 但先别翻答案，试着用自己的话先说一遍，再往下看。</div>" : "") +
      (sec.next ? "<div class='op-next'>👉 " + esc(sec.next) + "</div>" : "");
    w.appendChild(q);
    return w;
  }

  /* ---------- 课中练习（你猜一下 / 下一步会发生什么） ---------- */
  function secExercise(sec, si) {
    var w = secShell(si, "exercise");
    var item = el("div", "ex-item");
    var opts = sec.opts || [];
    item.innerHTML = "<div class='ex-q'><span class='ex-tag'>你猜一下</span> " + esc(sec.prompt) + "</div>";
    var oBox = el("div", "quiz-opts");
    (opts || []).forEach(function (op, oi) {
      var b = el("button", "quiz-opt", esc(op));
      b.dataset.oi = oi;
      b.addEventListener("click", function () {
        if (item.classList.contains("answered")) return;
        item.classList.add("answered");
        var correct = sec.a === oi;
        b.classList.add(correct ? "right" : "wrong");
        if (!correct) opts.forEach(function (x, xi) { if (xi === sec.a) oBox.querySelectorAll(".quiz-opt")[xi].classList.add("right"); });
        var ex = el("div", "quiz-explain" + (correct ? " ok" : " no"),
          (correct ? "✅ 猜对了。" : "❌ 其实答案更接近「" + esc(opts[sec.a]) + "」。") + " " + esc(sec.explain || ""));
        item.appendChild(ex);
        if (!correct && sec.jump) {
          var jb = jumpButton(sec.jump, sec.jumpLabel || "回到讲义，再看一遍相关内容");
          item.appendChild(jb);
        }
      });
      oBox.appendChild(b);
    });
    item.appendChild(oBox);
    w.appendChild(item);
    return w;
  }

  /* ---------- 结课检测（5 题，答错跳回教学段落） ---------- */
  function secCheck(sec, si) {
    var w = secShell(si, "check", sec.title || "结课检测：你真的懂了吗");
    var qs = sec.questions || [];
    if (!qs.length) return w;
    if (sec.intro) w.appendChild(el("p", "check-intro", esc(sec.intro)));
    var score = 0, answered = 0;
    var stat = el("div", "check-stat");
    stat.innerHTML = "进度 <b id='chkC'>0</b> / " + qs.length + " · 答对 <b id='chkS'>0</b> · <span class='chk-tip'>答错会带你回到对应段落复习，再看一遍就能重新作答。</span>";
    w.appendChild(stat ? stat : null);

    var list = el("div", "check-list");
    qs.forEach(function (q, qi) {
      var item = el("div", "quiz-item chk-item");
      item.innerHTML = "<div class='quiz-q'><span class='qi'>" + (qi + 1) + ".</span> " + esc(q.q) + "</div>";
      var oBox = el("div", "quiz-opts");
      (q.opts || []).forEach(function (op, oi) {
        var b = el("button", "quiz-opt", esc(op));
        b.dataset.oi = oi;
        b.addEventListener("click", function () {
          // 已答对就锁定
          if (item.classList.contains("got")) return;
          // 清除上一次的解析/跳回提示
          $$(".quiz-explain,.jump-btn", item).forEach(function (n) { n.remove(); });
          var correct = q.a === oi;
          $$(".quiz-opt", oBox).forEach(function (x) { x.classList.remove("wrong", "right"); });
          b.classList.add(correct ? "right" : "wrong");
          if (!correct) {
            oBox.querySelectorAll(".quiz-opt")[q.a].classList.add("right");
            item.classList.add("missed");
          }
          var ex = el("div", "quiz-explain" + (correct ? " ok" : " no"),
            (correct ? "✅ 回答正确。" : "❌ 正确答案是「" + esc(q.opts[q.a]) + "」。" ) + " " + esc(q.explain || "") +
            (correct ? "" : " 请回到相关段落复习后再回来答这道题。"));
          item.appendChild(ex);
          if (!correct) {
            if (q.jump) item.appendChild(jumpButton(q.jump, "回到讲义：复习「" + esc(q.jumpLabel || "这段内容") + "」再回来"));
            else item.appendChild(jumpButton("sec" + defaultsForJump(q, qi), "回到详情页顶部复习"));
          } else {
            item.classList.add("got");
            item.classList.remove("missed");
            score++;
            answered++;
            var c = document.getElementById("chkC"), s = document.getElementById("chkS");
            if (c && c.parentNode) c.textContent = answered;
            if (s && s.parentNode) s.textContent = score;
            if (answered === qs.length) finishCheck(w, qs.length, score, sec);
          }
        });
        oBox.appendChild(b);
      });
      item.appendChild(oBox);
      list.appendChild(item);
    });
    w.appendChild(list);
    return w;
  }
  // 默认跳回目标：没有显式 jump 时，回到本课"它是怎么工作的"段（按 13 段规范，该段通常在下标 5）
  function defaultsForJump(q, qi) {
    return 5;
  }
  function finishCheck(w, total, score, sec) {
    var box = el("div", "check-done" + (score === total ? " all" : ""));
    box.innerHTML = score === total
      ? "<div class='cd-ico'>🎉</div><div class='cd-t'>太棒了，全部答对！你对本课的理解已经成立。</div>" +
        (sec.done ? "<div class='cd-note'>" + esc(sec.done) + "</div>" : "") +
        (sec.nextLesson ? "<button class='dash-btn primary' data-nx>下一课 →</button>" : "")
      : "<div class='cd-ico'>💪</div><div class='cd-t'>答对 " + score + " / " + total + "。有答错的题，题目下方都有『回到讲义』按钮，复习后再回来把它们补上。</div>";
    var nx = box.querySelector("[data-nx]");
    if (nx) nx.addEventListener("click", function () { if (sec.nextLesson) go("#/lesson/" + sec.nextLesson); });
    w.appendChild(box);
  }

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
      card.id = "sec" + si + "-step" + i;
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
      "<span>" + K.categories.length + " 大领域</span>" +
      "<span>" + L.readyLessons().length + " 门已上线课程</span>";
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
      "<p class='pg-sub'>把六门旗舰课里的可视化实验集中在这里，无需进入课程即可直接动手操作。</p>"
    );
    var Lb = L.flagshipLessons();
    var any = false;
    Lb.forEach(function (ls) {
      if (!ls || !ls.sections) return;
      ls.sections.forEach(function (sec) {
        // 旗舰课的 visual 段携带可交互的 kind（embedding-space / rag-pipeline / agent-loop 等）
        if (sec.type === "visual" && sec.kind) {
          any = true;
          var kind = sec.kind;
          var box = el("div", "lab-card");
          box.innerHTML = "<div class='lab-card-head'><a href='#/lesson/" + esc(ls.id) + "' class='lab-lesson'>📖 " + esc(ls.title) + "</a>" +
            "<span class='lab-card-title'>🧪 " + esc(sec.title || "实验") + "</span></div>";
          if (sec.hint) box.insertAdjacentHTML("beforeend", "<div class='lab-desc'>" + esc(sec.hint) + "</div>");
          var mount = el("div", "viz-mount");
          mount.id = "labcard-" + ls.id + "-" + kind;
          box.appendChild(mount);
          w.appendChild(box);
          if (Viz && Viz.render) {
            (function (m, k) { setTimeout(function () { Viz.render(m, k, {}); }, 0); })(mount, kind);
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
      "<p class='pg-sub'>把六门旗舰课的「课中练习」和「结课检测」集中起来，检验你是否真的懂了；点选项即可查看解析。</p>"
    );
    var total = 0, answered = 0;
    var statbar = el("div", "rv-stat");
    var collected = [];
    L.flagshipLessons().forEach(function (ls) {
      if (!ls || !ls.sections) return;
      var lessonMeta = L.getCurriculumLessonMeta(ls.id);
      var chapter = (lessonMeta && lessonMeta.title) || ls.title;
      ls.sections.forEach(function (sec) {
        if (sec.type === "exercise" && sec.prompt) {
          // 课中练习：单题 {prompt, opts, a, explain}
          total++;
          collected.push({
            q: sec.prompt, opts: sec.opts || [], a: sec.a,
            explain: sec.explain || "", lesson: ls, chapter: chapter + " · 课中练习"
          });
        }
        if (sec.type === "check" && sec.questions) {
          // 结课检测：questions 数组
          sec.questions.forEach(function (q, qi) {
            total++;
            collected.push({
              q: q.q, opts: q.opts || [], a: q.a,
              explain: q.explain || "", lesson: ls, chapter: chapter + " · 结课检测 " + (qi + 1)
            });
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
      card.appendChild(renderQuiz({ q: it.q, opts: it.opts, a: it.a, explain: it.explain }, i));
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
    w.appendChild(el("button", "dash-btn primary", "← 返回首页"));
    $(".dash-btn", w).addEventListener("click", function () { go("#/dashboard"); });
  }

  /* ==========================================================
   * 实战（实践项目入口）
   * ========================================================== */
  function renderProjects() {
    var w = pageShell(
      "<h1>实战项目</h1>",
      "<p class='pg-sub'>把学到的动手做出来。每个项目都带有可交互实验，直接在对应课程里就能上手。</p>"
    );
    var grid = el("div", "proj-grid");
    var added = 0;
    var LABKINDS = ["ai-world-map", "embedding-space", "attention-heatmap", "transformer-flow", "rag-pipeline", "agent-loop"];
    (L.flagshipLessons && L.flagshipLessons() || L.readyLessons()).forEach(function (ls) {
      if (!ls || !ls.sections) return;
      ls.sections.forEach(function (sec) {
        if (sec.type === "visual" && LABKINDS.indexOf(sec.kind) !== -1) {
          added++;
          var card = el("a", "proj-card", "");
          card.setAttribute("href", "#/lesson/" + ls.id);
          card.innerHTML = "<div class='pc-ico'>🧪</div>" +
            "<div class='pc-body'><b>" + esc(sec.title || "动手实验") + "</b>" +
            "<span>" + esc(ls.title) + "</span></div>" +
            "<span class='pc-go'>去做 →</span>";
          grid.appendChild(card);
        }
      });
    });
    if (!added) grid.appendChild(el("div", "empty", "实战项目正在整理中，敬请期待。"));
    w.appendChild(grid);
    var coming = el("div", "proj-coming");
    coming.innerHTML = "<div class='block-title'><h2>规划中</h2><span>更多实战项目正在编写：做一个聊天机器人、搭建一个 RAG 问答、训练你的第一个小模型…</span></div>";
    w.appendChild(coming);
  }

  /* ==========================================================
   * 我的学习（极简学习状态）
   * ========================================================== */
  function renderMine() {
    var w = pageShell(
      "<h1>我的学习</h1>",
      "<p class='pg-sub'>沿着「从零看懂 AI」的主线，记录你每一课的进度。</p>"
    );
    var doneCount = Object.keys(progress.done || {}).filter(function (k) { return L.getLesson(k); }).length;
    var readyTotal = L.readyLessons().length;
    var pct = readyTotal ? Math.round(doneCount / readyTotal * 100) : 0;
    var ov = el("div", "mine-ov");
    ov.innerHTML = "<div class='mv-num'>" + pct + "<span>%</span></div>" +
      "<div class='mv-l'>已完成 <b>" + doneCount + "</b> / " + readyTotal + " 课 · 从零看懂 AI</div>" +
      "<div class='mv-bar'><i style='width:" + pct + "%'></i></div>";
    w.appendChild(ov);

    var list = el("div", "mine-list");
    MAIN_PATH.forEach(function (ch) {
      ch.lessons.forEach(function (l) {
        var full = L.getLesson(l.id);
        if (!full) return;
        var dd = isDone(l.id);
        var st = dd ? "已完成" : (progress.lastLesson === l.id ? "学习中" : "未学习");
        var row = el("div", "mine-row" + (dd ? " done" : ""));
        row.innerHTML = "<span class='mr-no'>" + esc(l.no) + "</span>" +
          "<div class='mr-t'><b>" + esc(l.title) + "</b><span>" + esc(ch.title) + "</span></div>" +
          "<span class='mr-st " + (dd ? "ok" : (progress.lastLesson === l.id ? "doing" : "todo")) + "'>" + st + "</span>";
        row.addEventListener("click", function () { go("#/lesson/" + l.id); });
        list.appendChild(row);
      });
    });
    w.appendChild(list);
  }

  var routers = {
    dashboard: renderDashboard,
    learn: renderLearn,
    map: renderMap,
    explore: renderExplore,
    labs: renderLabs,
    review: renderReview,
    search: renderSearch,
    projects: renderProjects,
    mine: renderMine
  };
  function showNotFound() { renderNotFound(); }

  function route() {
    var hash = location.hash || "#/dashboard";
    var parts = hash.replace(/^#\/?/, "").split("/");
    var name = parts[0] || "dashboard";
    var arg = parts[1] ? decodeURIComponent(parts[1]) : null;

    // 高亮导航（进入课程时高亮「学习」）
    var activeName = (name === "lesson") ? "learn" : name;
    $$("#mainNav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === activeName);
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
