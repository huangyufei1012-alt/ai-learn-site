/* ============================================================
 * AI Knowledge OS · 交互式可视化库（Viz）
 * ------------------------------------------------------------
 * 每个可视化是独立的小组件：Viz.render(container, kind, opts)
 * kind 与 lesson 的 visual.kind / lab.kind 对应：
 *   ai-world-map      一张图看懂 AI 世界（嵌套下钻）
 *   embedding-space   2D 语义空间（点一个位置/输入词，看最近邻）
 *   attention-heatmap Attention 热力图（点词看权重）
 *   transformer-flow  Transformer 流水线（逐步播放）
 *   rag-pipeline      RAG 全流程（逐步播放）
 *   agent-loop        Agent 循环（模拟跑几轮）
 * 全部为 SVG/HTML 交互，不依赖第三方库。
 * ============================================================ */
(function () {
  "use strict";
  var V = {};

  var NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  /* 主题色（与 CSS 变量联动，深/浅色自动适配） */
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return v.trim() || fallback;
  }
  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  /* ===================== 1. AI 世界地图 ===================== */
  function worldMap(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>从最外层的 AI 一路向内收缩到 LLM。点击任意一层可展开它指向的应用方向。</div>";
    c.appendChild(head);

    var wrap = el("div", "viz-canvas");
    c.appendChild(wrap);

    // 分层定义（内 → 外）
    var layers = [
      { key: "LLM", name: "大语言模型", sub: "ChatGPT · Claude · Gemini", color: "#6a5cff", r: 58 },
      { key: "FOUND", name: "基础模型", sub: "预训练好的通用大脑", color: "#2f9e77", r: 104 },
      { key: "DL", name: "深度学习", sub: "多层神经网络", color: "#0d9bb1", r: 152 },
      { key: "ML", name: "机器学习", sub: "从数据中找规律", color: "#2f6fdb", r: 202 },
      { key: "AI", name: "人工智能", sub: "全部智能技术", color: "#e2725b", r: 252 }
    ];
    var branches = {
      LLM: [["RAG", "让模型查资料", "#d98d2b"], ["Agent", "让模型会做事", "#9c4fd0"], ["Prompt", "怎么对模型说话", "#3f8f4f"], ["多模态", "看懂图听懂音", "#c04f8f"]],
      DL: [["CNN", "看图", "#0d9bb1"], ["RNN", "看序列", "#5a8bd6"], ["Transformer", "看全局", "#6a5cff"]],
      AI: [["视觉", "VISION", "#b5772e"], ["语音", "SPEECH", "#8a6fd0"], ["机器人", "ROBOT", "#3f8f8f"]]
    };

    var dim = Math.min(wrap.clientWidth || 620, 640);
    var cx = dim / 2, cy = dim / 2 + 8;
    var svg = svgEl("svg", { viewBox: "0 0 " + dim + " " + dim, class: "viz-svg", role: "img" });
    wrap.appendChild(svg);

    var detail = el("div", "viz-detail");
    detail.innerHTML = "<div class='vd-name'>AI 世界全景</div><div class='vd-sub'>从 AI 到 LLM 是一条不断收缩的链条：外层包含内层。</div>";
    c.appendChild(detail);

    var sel = null;

    function draw(hoverKey) {
      svg.innerHTML = "";
      for (var i = layers.length - 1; i >= 0; i--) {
        (function (ly) {
          var g = svgEl("g", { transform: "translate(" + cx + "," + cy + ")" });
          var active = sel === ly.key || hoverKey === ly.key;
          var circ = svgEl("circle", {
            r: ly.r,
            fill: ly.color,
            "fill-opacity": active ? 0.85 : 0.18,
            stroke: ly.color,
            "stroke-width": active ? 3 : 1.6,
            cx: 0, cy: 0,
            style: "cursor:pointer;transition:fill-opacity .25s"
          });
          g.appendChild(circ);
          var text = svgEl("text", {
            x: 0, y: 0, "text-anchor": "middle",
            "font-size": ly.key === "LLM" ? 22 : 17,
            "font-weight": 800, fill: isDark() || active ? "#fff" : ly.color
          });
          text.textContent = ly.name;
          g.appendChild(text);
          var s1 = svgEl("text", { x: 0, y: 20, "text-anchor": "middle", "font-size": 12, fill: isDark() || active ? "rgba(255,255,255,.85)" : "#556" });
          s1.textContent = ly.sub;
          g.appendChild(s1);
          var chip = svgEl("text", { x: 0, y: 38, "text-anchor": "middle", "font-size": 11, fill: isDark() ? "#889" : "#788", style: "cursor:pointer;font-weight:700" });
          chip.textContent = "点击展开 ▼";
          g.appendChild(chip);
          g.addEventListener("click", function () {
            sel = (sel === ly.key ? null : ly.key);
            if (sel) showDetail(ly);
            draw();
          });
          g.addEventListener("mouseenter", function () { draw(ly.key); });
          g.addEventListener("mouseleave", function () { draw(); });
          svg.appendChild(g);
        })(layers[i]);
      }
      // branch 标签
      if (sel && branches[sel]) {
        branches[sel].forEach(function (b, bi) {
          var ang = (Math.PI * (0.9 + 0.24 * bi));
          var rr = 302;
          var x = cx + rr * Math.cos(ang), y = cy + rr * Math.sin(ang);
          var g = svgEl("g", { transform: "translate(" + x + "," + y + ")" });
          var bg = svgEl("rect", { x: -76, y: -18, width: 152, height: 36, rx: 18, fill: b[2], "fill-opacity": 0.22, stroke: b[2], "stroke-width": 1.5 });
          g.appendChild(bg);
          var t = svgEl("text", { "text-anchor": "middle", y: 5, "font-size": 14, fill: b[2], "font-weight": 800 });
          t.textContent = b[0];
          g.appendChild(t);
          var ts = svgEl("text", { "text-anchor": "middle", y: -9, "font-size": 10, fill: b[2], opacity: 0.8 });
          ts.textContent = b[1];
          g.appendChild(ts);
          svg.appendChild(g);
        });
      }
    }

    function showDetail(ly) {
      var br = branches[ly.key] || [];
      var brHtml = br.length
        ? "<div class='vd-branches'>" + br.map(function (b) {
            return "<span class='chip' style='border-color:" + b[2] + ";color:" + b[2] + "'>" + b[0] + "<i>" + b[1] + "</i></span>";
          }).join("") + "</div>"
        : "";
      detail.innerHTML =
        "<div class='vd-name' style='color:" + ly.color + "'>" + ly.name + " <small>" + ly.key + "</small></div>" +
        "<div class='vd-sub'>" + ly.sub + "</div>" + brHtml;
    }
    draw();
  }

  /* ===================== 2. Embedding 2D 语义空间 ===================== */
  function embeddingSpace(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>坐标代表两种语义：「动物 ↔ 食物」＋「具体物 ↔ 抽象概念」。输入一个词，它会根据『意思』被放到一个位置——位置越近 = 语义越近。这就是 Embedding：给词找坐标。</div>" +
      "<div class='viz-note' style='margin-top:8px'>⚠️ 教学模拟：这里用 2 个维度示意。真实 Embedding 是几百到几千维的向量，下面给一个「真实语义向量 + 余弦相似度」的对照例子，帮你把示意图接到真模型上。</div>";
    c.appendChild(head);

    // 真实向量 + 余弦相似度对照（教学说明，非示意图）
    var realRef = el("div", "emb-real");
    realRef.innerHTML =
      "<div class='emb-real-t'>真实世界中（示意、非真实数值）：</div>" +
      "<div class='emb-real-row'><code>vec(猫)</code> = [0.91, -0.38, 0.66, 0.12, …]（数百维）</div>" +
      "<div class='emb-real-row'><code>vec(狗)</code> = [0.85, -0.31, 0.72, 0.09, …]</div>" +
      "<div class='emb-real-row'><code>vec(苹果)</code> = [-0.24, 0.88, -0.41, 0.55, …]</div>" +
      "<div class='emb-real-row'>余弦相似度 ▲</div>" +
      "<div class='emb-real-cos'>cos(猫, 狗) ≈ 0.92（语义近）　·　cos(猫, 苹果) ≈ 0.11（语义远）</div>" +
      "<div class='emb-real-note'>实用结论：模型不是记住字，而是把「意思」编码进向量的方向——所以「苹果-水果+公司 = 苹果公司」这类向量加减才有意义。</div>";
    c.appendChild(realRef);

    var toolbar = el("div", "viz-toolbar");
    toolbar.innerHTML = "<input class='viz-input' id='embWord' placeholder='输入一个词，回车投放（多词用空格隔开）' value='猫 苹果 狮子 香蕉 快乐'>" +
      "<button class='viz-btn' id='embGo'>投放</button>" +
      " <span class='viz-note'>最近邻：<b id='embNear'>—</b></span>";
    c.appendChild(toolbar);

    var wrap = el("div", "viz-canvas");
    c.appendChild(wrap);
    var dim = Math.min(wrap.clientWidth || 560, 620);
    var svg = svgEl("svg", { viewBox: "0 0 " + dim + " " + (dim * 0.72).toFixed(0), class: "viz-svg" });
    wrap.appendChild(svg);
    var W = dim, H = dim * 0.72;

    // 轴标签
    var ax = svgEl("text", { x: W - 90, y: H - 8, "font-size": 12, fill: "#888", "text-anchor": "end" });
    ax.textContent = "← 更像动物 / 具体    更像食物 / 抽象 →";
    svg.appendChild(ax);

    // 已知词簇：(x%, y%) 归一化 —— x 越大越"食物/抽象", y 越小越"动物/具体"
    var known = [
      { t: "猫", x: 0.16, y: 0.3, c: "#e2725b" },
      { t: "狗", x: 0.24, y: 0.42, c: "#e2725b" },
      { t: "狮子", x: 0.12, y: 0.5, c: "#e2725b" },
      { t: "老虎", x: 0.2, y: 0.55, c: "#e2725b" },
      { t: "苹果", x: 0.8, y: 0.22, c: "#2f9e77" },
      { t: "香蕉", x: 0.74, y: 0.3, c: "#2f9e77" },
      { t: "米饭", x: 0.82, y: 0.45, c: "#2f9e77" },
      { t: "面包", x: 0.78, y: 0.5, c: "#2f9e77" },
      { t: "笔", x: 0.42, y: 0.76, c: "#888" },
      { t: "书", x: 0.5, y: 0.7, c: "#888" },
      { t: "门", x: 0.6, y: 0.6, c: "#888" },
      { t: "快乐", x: 0.55, y: 0.14, c: "#6a5cff" },
      { t: "思考", x: 0.65, y: 0.08, c: "#6a5cff" }
    ];
    var placed = [];

    // 轻量语义评分：根据关键词猜测这个词属于哪个簇
    var ANIMALS = ["猫", "狗", "狮子", "老虎", "鸟", "鱼", "兔", "马", "牛", "猪", "猴", "熊", "鸡", "鸭", "elephant", "cat", "dog", "tiger", "lion", "animal", "宠物"];
    var FOODS = ["苹果", "香蕉", "米饭", "面包", "西瓜", "橙子", "葡萄", "猪肉", "鸡蛋", "牛奶", "菜", "肉", "火锅", "apple", "banana", "food", "水果", "食物"];
    var ABSTRACT = ["快乐", "思考", "爱", "知识", "自由", "梦想", "时间", "逻辑", "快乐", "难过", "happy", "thought", "love"];
    function embedScore(word) {
      var w = (word || "").toLowerCase();
      var ax2 = 0.5, ay2 = 0.6; // 默认落在"具体中性"区
      if (ANIMALS.some(function (k) { return w.indexOf(k) !== -1 || k.indexOf(w) !== -1; })) { ax2 = 0.15 + Math.random() * 0.12; ay2 = 0.3 + Math.random() * 0.28; }
      else if (FOODS.some(function (k) { return w.indexOf(k) !== -1 || k.indexOf(w) !== -1; })) { ax2 = 0.72 + Math.random() * 0.12; ay2 = 0.22 + Math.random() * 0.3; }
      else if (ABSTRACT.some(function (k) { return w.indexOf(k) !== -1 || k.indexOf(w) !== -1; })) { ax2 = 0.52 + Math.random() * 0.18; ay2 = 0.06 + Math.random() * 0.12; }
      else {
        // 未知词：用与已知词的"字符重叠"推断位置，默认接近中性
        var nx = 0.42, ny = 0.62, best = 1e9;
        known.concat(placed).forEach(function (k) {
          var ov = commonChars(w, (k.t || "").toLowerCase());
          if (ov > 0 && ov < best) { best = ov; nx = k.x; ny = k.y; }
        });
        ax2 = nx; ay2 = ny;
      }
      return { x: ax2, y: ay2 };
    }
    function commonChars(a, b) {
      var n = 0; for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) !== -1) n++;
      return n / Math.max(1, a.length);
    }

    function drawAll(nearTarget) {
      svg.querySelectorAll("circle.emb-dot, text.emb-lbl, line.emb-line").forEach(function (n) { n.remove(); });
      var all = known.concat(placed);
      all.forEach(function (w) {
        var px = w.x * W, py = w.y * H;
        var line = svgEl("line", { x1: px, y1: py + 20, x2: px, y2: py + 42, stroke: "#eef1f7", "stroke-width": 9, class: "emb-line" });
        svg.appendChild(line);
      });
      all.forEach(function (w) {
        var px = w.x * W, py = w.y * H;
        var isNew = w.user;
        var near = nearTarget && w.t !== nearTarget.t;
        var dot = svgEl("circle", { cx: px, cy: py, r: near ? 1.2 : 10, fill: isNew ? "#ff9800" : w.c, class: "emb-dot", style: "cursor:default" });
        svg.appendChild(dot);
        var lbl = svgEl("text", { x: px, y: py - 13, "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: isNew ? "#ff9800" : (isDark() ? "#fff" : "#334"), class: "emb-lbl" });
        lbl.textContent = w.t;
        svg.appendChild(lbl);
      });
      if (nearTarget) {
        var best = null, bd = 1e9;
        all.forEach(function (w) {
          if (w.t === nearTarget.t) return;
          var d = Math.hypot(w.x - nearTarget.x, w.y - nearTarget.y);
          if (d < bd) { bd = d; best = w; }
        });
        var nearEl = document.getElementById("embNear");
        if (nearEl) nearEl.textContent = best ? "和「" + nearTarget.t + "」语义最近的是「" + best.t + "」" : "—";
      }
    }

    function placeWord(text) {
      var sc = embedScore(text);
      placed.push({ t: text, x: sc.x, y: sc.y, c: "#ff9800", user: true });
      drawAll(placed[placed.length - 1]);
    }
    var go = document.getElementById("embGo") || toolbar.querySelector("#embGo");
    var input = document.getElementById("embWord") || toolbar.querySelector("#embWord");
    function onGo() {
      var v = input.value.trim();
      if (!v) return;
      // 支持一次投放多个词（空格/逗号分隔）
      var words = v.split(/[\s,，、]+/).filter(function (x) { return x; }).slice(0, 10);
      placed = [];
      words.forEach(function (w) {
        var exists = known.some(function (k) { return k.t === w; });
        if (!exists && !placed.some(function (p) { return p.t === w; })) {
          var sc = embedScore(w);
          placed.push({ t: w, x: sc.x, y: sc.y, c: "#ff9800", user: true });
        }
      });
      if (!placed.length) placed.push({ t: v, x: 0.43, y: 0.6, c: "#ff9800", user: true });
      drawAll(placed[placed.length - 1]);
    }
    go.addEventListener("click", onGo);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") onGo(); });

    // 点击画布投放（在点击处 + 语义微调）
    svg.addEventListener("click", function (e) {
      var r = svg.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      var v = (input.value || "").trim() || "新词";
      placed.push({ t: v, x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.08, Math.min(0.85, y)), c: "#ff9800", user: true });
      drawAll(placed[placed.length - 1]);
    });
    drawAll();
  }

  /* ===================== 3. Attention 热力图 ===================== */
  function attentionHeatmap(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>点句中任意一个<b>词</b>，看它把「注意力」分给了其它词（百分比越大越关注）。模型在理解某词时会临时对全句加权——这就是 Attention。</div>" +
      "<div class='viz-note' style='margin-top:8px'>⚠️ 教学模拟：下方为演示用示意权重，非真实模型输出，用于直观理解「加权聚焦」这一思想。</div>";
    c.appendChild(head);

    // 3 个预设例句（≤ 分词展示，均可独立点词）
    var PRESETS = [
      "那棵大树下有一株开满花的玫瑰",
      "小猫在河边追着一只蝴蝶",
      "机器人正在认真地阅读一本厚厚的书"
    ];
    var presetBar = el("div", "viz-toolbar");
    presetBar.innerHTML = "<span class='viz-note' style='opacity:.85'>例句：</span>";
    PRESETS.forEach(function (p) {
      var b = el("button", "viz-btn ghost", esc(p));
      b.addEventListener("click", function () { inputEl.value = p; run(); });
      presetBar.appendChild(b);
    });
    c.appendChild(presetBar);

    var toolbar = el("div", "viz-toolbar");
    toolbar.innerHTML = "<input class='viz-input' id='attSent' style='flex:1' value='" + PRESETS[0] + "'>" +
      "<button class='viz-btn' id='attGo'>分词并演示</button>";
    c.appendChild(toolbar);
    var inputEl = document.getElementById("attSent");

    var wrap = el("div", "viz-canvas");
    c.appendChild(wrap);
    var board = el("div", "att-board");
    wrap.appendChild(board);

    // 中文分词：优先按 2~4 字词表匹配，其余按单字切分（教学模拟）
    var DICT = ["大树", "开满", "满花", "玫瑰", "小猫", "蝴蝶", "机器人", "认真", "阅读", "厚的", "一本", "一只", "一棵", "那棵", "草地", "追着", "河边", "正在", "厚厚"];
    var STOP = ["的", "了", "下", "有", "一", "是", "在", "和", "与", "个", "只", "里", "上", "中", "都", "就", "很", "地", "着"];
    function tokenize(s) {
      var out = [], i = 0;
      while (i < s.length) {
        // 跳过标点/空白（作为切分点，不进入词表）
        if (/[\s，。、,.；;！!？?：:“”"（）()]/.test(s[i])) { i++; continue; }
        var got = null;
        for (var L = 4; L >= 2; L--) {
          if (i + L <= s.length && DICT.indexOf(s.substr(i, L)) !== -1) { got = s.substr(i, L); break; }
        }
        if (!got) got = s[i];
        out.push(got);
        i += got.length;
      }
      return out;
    }
    // 语义相关度启发：同现字 + 常见搭配加权（示意，不追求精确）
    var SIM = {
      "大树": { "玫瑰": 0.15, "下": 0.8, "有": 0.5, "开满": 0.6 },
      "玫瑰": { "大树": 0.15, "开满": 0.9, "满花": 0.75, "花": 0.7 },
      "小猫": { "蝴蝶": 0.75, "追着": 0.9, "河边": 0.6 },
      "蝴蝶": { "小猫": 0.75, "追着": 0.85},
      "机器人": { "阅读": 0.7, "认真": 0.75, "厚厚的": 0.4, "书": 0.6 },
      "阅读": { "机器人": 0.7, "书": 0.9, "厚厚的": 0.5, "认真": 0.6 }
    };
    function sim(a, b) {
      if (a === b) return 1.2;
      var t = SIM[a] && SIM[a][b];
      if (typeof t === "number") return t;
      var base = 0;
      var commons = 0;
      for (var i = 0; i < Math.min(a.length, 4); i++) {
        if (b.indexOf(a[i]) !== -1) commons++;
      }
      base += commons * 0.4;
      if (Math.abs(a.length - b.length) <= 1) base += 0.18;
      return base;
    }
    function run() {
      var sent = (inputEl.value || "").trim() || PRESETS[0];
      inputEl.value = sent;
      var tokens = tokenize(sent);
      var scoreMap = {};
      function sink() { return 1e-9; }
      tokens.forEach(function (t) {
        var scores = tokens.map(function (o) {
          var sc = sim(t, o);
          if (STOP.indexOf(o) !== -1) sc *= 0.3;
          if (STOP.indexOf(t) !== -1) sc *= 0.15;
          return sc;
        });
        var sum = scores.reduce(function (a, b) { return a + b; }, 0) || sink();
        scoreMap[t] = scores.map(function (s) { return s / sum; });
      });
      renderRow(tokens, scoreMap, null);
    }

    function pct(x) { return (x * 100).toFixed(1) + "%"; }
    function renderRow(tokens, scores, selToken) {
      board.innerHTML = "";
      var row = el("div", "att-row");
      tokens.forEach(function (t, ti) {
        var cell = el("button", "att-cell" + (t === selToken ? " sel" : ""));
        cell.textContent = t;
        cell.title = "点「" + t + "」看它的注意力分配";
        cell.addEventListener("click", function () { renderRow(tokens, scores, t); });
        row.appendChild(cell);
      });
      board.appendChild(row);

      if (selToken) {
        var w = scores[selToken] || [];
        var total = w.reduce(function (a, b) { return a + b; }, 0);
        var heat = el("div", "att-heat");
        var lab = el("div", "att-lab", "「" + esc(selToken) + "」的注意力（每项加总 ≈ 100%）：");
        heat.appendChild(lab);
        var bar = el("div", "att-barbox");
        tokens.forEach(function (t, ti) {
          var raw = (w[ti] || 0) / (total || 1);
          var cellW = Math.max(1.4, Math.min(96, raw * 100));
          var b = el("div", "att-bar");
          b.innerHTML = "<div class='att-bartrack'><i class='att-barfill' style='width:" + cellW + "%'></i></div><span>" + esc(t) + " <b style='color:var(--primary-strong)'>" + pct(raw) + "</b></span>";
          bar.appendChild(b);
        });
        heat.appendChild(bar);
        heat.appendChild(el("div", "att-hint", "看到没？当模型聚焦「" + esc(selToken) + "」这个词时，它主要看全句中和它语义相关的词——这就是「加权吸收上下文」。"));
        board.appendChild(heat);
      } else {
        var hint = el("div", "att-hint", "↑ 点上面任意一个<b>词</b>，看它把注意力分给了谁（百分比加总约等于 100%）。");
        board.appendChild(hint);
      }
    }
    var btn = document.getElementById("attGo");
    btn.addEventListener("click", run);
    run();
  }

  /* ===================== 4. Transformer 流水线 ===================== */
  function transformerFlow(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>点「下一步」：一个词从「数字向量」开始，经过位置编码、多头注意力、残差+归一化、前馈网络，重复 N 层，最后预测下一个词。</div>";
    c.appendChild(head);

    var stages = [
      { n: "输入", t: "Token + Embedding", d: "把词「模型」变成向量；再叠加位置编码，让它知道自己是第几个。", fin: "输入：词「猫狗」", fout: "输出：2 个向量（各数百维）" },
      { n: "嵌入", t: "位置编码", d: "每个词的位置被编码进向量：没有它，「狗追猫」和「猫追狗」无法区分。", fin: "输入：词向量", fout: "输出：词向量 + 位置信息" },
      { n: "注意力", t: "多头注意力", d: "Q/K/V 让每个词结合全局上下文；多组头并行，不同视角同时观察。", fin: "输入：带位置的向量", fout: "输出：融合了全句上下文的向量（「狗」看到「追」「猫」）" },
      { n: "残差", t: "残差 + 归一化", d: "把上一步的输入加回来（残差），再做归一化——信息低损耗跨层直达，能堆得很深。", fin: "输入：注意力输出 + 原始向量", fout: "输出：稳定、可继续下传的向量" },
      { n: "前馈", t: "前馈网络 FFN", d: "对每个词独立再做非线性变换，增强表达能力。", fin: "输入：层归一化后的向量", fout: "输出：表达能力更强的向量" },
      { n: "堆叠", t: "重复 N 层", d: "把 内部三件套 复制叠很多层，表示一层比一层抽象。", fin: "输入：第 L 层输出", fout: "输出：第 L+1 层输出（更抽象）" },
      { n: "输出", t: "预测下一个词", d: "线性层 + Softmax 得到词典概率，取最可能的词，拼回输入继续预测。", fin: "输入：最后一层向量", fout: "输出：下一个词的分布 + 最可能的词" }
    ];
    var idx = -1, timer = null, shownFull = false;

    var wrap = el("div", "viz-canvas");
    c.appendChild(wrap);
    var flowRow = el("div", "tf-flow");
    wrap.appendChild(flowRow);
    stages.forEach(function (s, i) {
      var node = el("div", "tf-node");
      node.innerHTML = "<div class='tf-idx'>" + (i + 1) + "</div><div class='tf-name'>" + s.t + "</div>";
      if (i < stages.length - 1) {
        var arr = el("span", "tf-arrow", "→");
        node.appendChild(arr);
      }
      node.dataset.i = i;
      flowRow.appendChild(node);
    });
    var detailBox = el("div", "tf-detail");
    detailBox.innerHTML = "<div class='vd-name' id='tfTitle'>准备就绪</div>" +
      "<div class='vd-sub' id='tfDesc'>点击「下一步」，看一个词走完整条流水线。</div>" +
      "<div class='tf-io' id='tfIO' style='display:none'></div>" +
      "<div class='tf-note-note' id='tfNote' style='display:none'></div>";
    wrap.appendChild(detailBox);
    // 完整架构（走完全部步骤后展示）
    var fullArch = el("div", "tf-full", "");
    fullArch.id = "tfFull";
    fullArch.style.display = "none";
    wrap.appendChild(fullArch);

    var ctrl = el("div", "viz-toolbar");
    ctrl.innerHTML = "<button class='viz-btn' id='tfNext'>下一步 ▶</button>" +
      "<button class='viz-btn ghost' id='tfReset'>重置</button>" +
      "<button class='viz-btn ghost' id='tfAuto'>自动播放</button>" +
      " <span class='viz-note' id='tfProg'>0 / " + stages.length + "</span>";
    c.appendChild(ctrl);

    function paint() {
      var nodes = flowRow.querySelectorAll(".tf-node");
      nodes.forEach(function (n, i) {
        n.classList.toggle("on", i <= idx);
        n.classList.toggle("cur", i === idx);
      });
      var t = document.getElementById("tfTitle"), d = document.getElementById("tfDesc");
      var p = document.getElementById("tfProg");
      var io = document.getElementById("tfIO"), note = document.getElementById("tfNote");
      var full = document.getElementById("tfFull");
      if (idx < 0) {
        t.textContent = "准备就绪"; d.textContent = "点击「下一步」，看一个词走完整条流水线。";
        p.textContent = "0 / " + stages.length;
        if (io) io.style.display = "none";
        if (note) note.style.display = "none";
        if (full) full.style.display = "none";
      } else {
        var s = stages[Math.min(idx, stages.length - 1)];
        t.textContent = "第 " + (idx + 1) + " 步 · " + s.t;
        d.textContent = s.d;
        p.textContent = (idx + 1) + " / " + stages.length;
        // 每步输入/输出
        if (io) {
          io.style.display = s.fin || s.fout ? "block" : "none";
          io.innerHTML = s.fin ? "<div><b>输入：</b>" + esc(s.fin) + "</div>" : "";
          io.innerHTML += s.fout ? "<div><b>输出：</b>" + esc(s.fout) + "</div>" : "";
        }
        // Attention 是 Transformer 的"子模块"说明（在第 3 步）
        if (note) {
          var showNote = (idx === 2);
          note.style.display = showNote ? "block" : "none";
          if (showNote) note.innerHTML = "🧩 注意：Attention 只是 Transformer 众多模块中的一个子部分。整座模型 = 位置编码 + 多头注意力 + 残差/归一化 + 前馈网络，反复堆叠。把「注意力」放到正确位置，才能不把它误当整个模型。";
        }
        // 走完全部：展示完整架构
        if (full) {
          if (idx === stages.length - 1) {
            full.style.display = "block";
            if (!full.dataset.built) { buildFullArch(full); full.dataset.built = "1"; }
          } else {
            full.style.display = "none";
          }
        }
      }
    }
    // 完整架构图（文字版分块示意）
    function buildFullArch(el_) {
      var rows = [
        ["输入序列", "Token + Embedding → 位置编码"],
        ["Transformer 块（重复 N 层）", "多头注意力 → 残差+归一化 → 前馈网络 → 残差+归一化", "tf-hl"],
        ["输出头", "线性层 → Softmax → 预测下一个词"]
      ];
      el_.innerHTML = "<div class='tf-full-t'>完整架构总览：</div>" +
        rows.map(function (r, i) {
          return "<div class='tf-full-row" + (r[2] || "") + "'><div class='tf-full-k'>" + esc(r[0]) + "</div><div class='tf-full-v'>" + esc(r[1]) + "</div></div>";
        }).join("");
    }
    function next() { idx = Math.min(idx + 1, stages.length - 1); paint(); }
    function reset() { idx = -1; paint(); }
    document.getElementById("tfNext").addEventListener("click", next);
    document.getElementById("tfReset").addEventListener("click", function () {
      clearTimeout(timer); reset();
    });
    document.getElementById("tfAuto").addEventListener("click", function () {
      clearTimeout(timer); reset();
      var tick = function () { if (idx >= stages.length - 1) { reset(); return; } next(); timer = setTimeout(tick, 900); };
      tick();
    });
    paint();
  }

  /* ===================== 5. RAG 全流程（真·输入） ===================== */
  function ragPipeline(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>输入你自己的「文档」和「问题」，点击运行，看 RAG 如何把它 切块 → 向量化 → 检索 Top-K → 重排 → 组装上下文 → 生成答案。</div>" +
      "<div class='viz-note' style='margin-top:8px'>⚠️ 教学模拟：向量化/相似度/重排均为演示用启发式示意，用于理解 RAG 的整体流程，非真实模型输出。</div>" +
      "<div class='viz-note' style='margin-top:6px'>💡 可点击右上角「一句话问出好问题」的预设问题，或自行改动文档，看 RAG 如何「有据可查」或「资料里没有就拒答」。</div>";
    c.appendChild(head);

    // 输入区
    var panel = el("div", "rag-input");
    panel.innerHTML =
      "<div class='rag-fld'><label>你的文档（几行资料，按句子切块）</label>" +
      "<textarea id='ragDoc' rows='4'>年假制度：入职满一年享每年 5 天带薪年假，工龄三年以上每年 8 天。报销流程：金额低于 1000 元走 OA 报销，超过 1000 元需部门经理审批。年假需提前 3 个工作日申请。</textarea></div>" +
      "<div class='rag-fld'><label>你的问题</label>" +
      "<input class='viz-input' id='ragQ' value='入职两年，我有几天年假？' style='flex:1'>" +
      "<button class='viz-btn' id='ragRun'>▶ 运行 RAG</button></div>" +
      "<div class='viz-toolbar' style='margin-top:4px'><span class='viz-note' style='opacity:.85'>预设问题：</span>" +
      "<button class='viz-btn ghost' data-q='入职两年，我有几天年假？'>②问年假</button>" +
      "<button class='viz-btn ghost' data-q='金额 800 元报销要审批吗？'>③问报销</button>" +
      "<button class='viz-btn ghost' data-q='公司有健身房吗？'>④问不存在信息（拒答）</button></div>";
    c.appendChild(panel);

    var wrap = el("div", "viz-canvas");
    c.appendChild(wrap);

    var flow = el("div", "rag-flow");
    wrap.appendChild(flow);
    var stages = [
      { k: "chunk", t: "切块" }, { k: "emb", t: "向量化" }, { k: "db", t: "向量库" },
      { k: "ret", t: "检索Top-K" }, { k: "rerank", t: "重排" }, { k: "ctx", t: "组装上下文" }, { k: "gen", t: "生成答案" }
    ];
    stages.forEach(function (s, i) {
      var node = el("div", "rag-node");
      node.innerHTML = "<div class='rag-ico'>" + s.k + "</div><div class='rag-name'>" + s.t + "</div>";
      if (i < stages.length - 1) node.appendChild(el("span", "rag-arrow", "→"));
      node.dataset.i = i;
      flow.appendChild(node);
    });

    var out = el("div", "rag-out");
    wrap.appendChild(out);

    var ann = el("div", "rag-annotate");
    c.appendChild(ann);

    function nodeOn(i) {
      var nodes = flow.querySelectorAll(".rag-node");
      nodes.forEach(function (n, k) {
        n.classList.toggle("on", k <= i);
        n.classList.toggle("cur", k === i);
      });
    }

    // 启发式"语义相关"打分：关键词重叠
    var KW = { "年假": ["年假", "休假", "天", "年"], "报销": ["报销", "金额", "元", "审批"], "审批": ["审批", "经理", "审核"] };
    function scoreChunk(chunk, q) {
      var sc = 0;
      var ql = q;
      for (var k in KW) {
        if (ql.indexOf(k) !== -1) {
          (KW[k] || []).forEach(function (w) { if (chunk.indexOf(w) !== -1) sc += 2; });
        }
      }
      // 通用：问题里的词在块里出现则加分
      ql.split(/[的，。？、\s当是]/).forEach(function (w) {
        if (w.length >= 2 && chunk.indexOf(w) !== -1) sc += 1;
      });
      return sc;
    }

    function inChunkOut(chunk) {
      var m = chunk.match(/^(.*?)[：:](.*)$/);
      return m ? m[1] : chunk.slice(0, 12);
    }

    var gen = 0; // RAG 播放代数令牌：重跑时使旧链路失效

    function run() {
      // 代数令牌：重新运行时使上一次嵌套 setTimeout 全部失效，避免两次播放结果交错
      var my = ++gen;
      var doc = document.getElementById("ragDoc").value || "";
      var q = document.getElementById("ragQ").value.trim() || "入职两年，我有几天年假？";
      // 1) 切块（按句子、标点）
      var chunks = doc.split(/[。；\n]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
      if (chunks.length === 0) chunks = doc ? [doc] : ["（文档为空）"];
      out.innerHTML = "<div class='rag-step'><b class='rs-t'>① 切块 Chunking</b> 文档按句子切成 <b>" + chunks.length + "</b> 块，保持信息完整。</div>";
      chunks.forEach(function (c, i) { out.appendChild(el("div", "chunk-chip", "块" + (i + 1) + "：「" + esc(c.slice(0, 26)) + (c.length > 26 ? "…" : "") + "」")); });
      nodeOn(0);
      setTimeout(function () {
        if (my !== gen) return; // 旧播放已失效
        // 2) 向量化
        out.appendChild(el("div", "rag-step", "<b class='rs-t'>② 向量化 Embedding</b> 把每块文字变成一个向量（语义相近 → 向量相近）。"));
        chunks.forEach(function (c, i) {
          var id = "vec" + i; out.appendChild(el("div", "chunk-chip", "vec" + i + " ← 块" + (i + 1)));
        });
        nodeOn(1);
        setTimeout(function () {
          if (my !== gen) return;
          // 3) 存库 + 4) 检索
          out.appendChild(el("div", "rag-step", "<b class='rs-t'>③④ 存库 → 检索</b> 向量存入 VectorDB，再把问题「" + esc(q) + "」向量化，在库里找最像的 Top-K。"));
          var scored = chunks.map(function (c, i) { return { c: c, s: scoreChunk(c, q), i: i }; });
          scored.sort(function (a, b) { return b.s - a.s; });
          var top = scored.filter(function (x) { return x.s > 0; }).slice(0, 3);
          if (!top.length) {
            out.appendChild(el("div", "chunk-chip miss", "未检索到与「" + esc(q) + "」相关的块（语义距离都很远）——这正是后面「拒答」的原因。"));
          }
          if (top.length) {
            top.forEach(function (t) { out.appendChild(el("div", "chunk-chip hit", "命中 块" + (t.i + 1) + " (相似度 " + (t.s + 1.0).toFixed(2) + ")「" + esc(t.c.slice(0, 22)) + "…」")); });
          } else {
            top = scored.slice(0, 2); // 保证重排/组装仍能走通，但 composeAnswer 会因无命中而拒答
          }
          nodeOn(3);
          setTimeout(function () {
            if (my !== gen) return;
            // 5) 重排
            var reranked = top.slice().sort(function (a, b) { return b.s - a.s; });
            out.appendChild(el("div", "rag-step", "<b class='rs-t'>⑤ 重排序 Rerank</b> 用更精细的模型把命中块按相关度重排，把真正相关的提到前。" + (reranked.length > 1 ? " → 优先块" + (reranked[0].i + 1) : "")));
            nodeOn(4);
            setTimeout(function () {
              if (my !== gen) return;
              // 6) 组装
              var ctx = reranked.map(function (t) { return t.c; }).join(" ").slice(0, 200);
              out.appendChild(el("div", "rag-step", "<b class='rs-t'>⑥ 组装上下文</b> 把命中的资料拼进 Prompt：<div class='ctx-box'>「以下是参考资料：<i>" + esc(ctx) + "…</i> 请只依据资料回答并注明出处。」</div>"));
              nodeOn(5);
              setTimeout(function () {
                if (my !== gen) return;
                // 7) 生成答案（依据命中块拼装）
                var answer = composeAnswer(reranked, q);
                out.appendChild(el("div", "rag-step", "<b class='rs-t'>⑦ 生成答案</b> 模型依据资料作答：" +
                  "<div class='answer-box'>" + esc(answer.text) +
                  (answer.cites.length ? "<div class='answer-cite'>📎 引用来源：" + answer.cites.map(function (i) { return "块" + i; }).join("、") + "</div>" : "") +
                  "</div>"));
                nodeOn(6);
                ann.innerHTML = "<div class='rag-ann'><b>发生了什么：</b>" + esc(q) + " → 先切块 → 向量化 → 检索命中「年假」相关块 → 重排 → 拼进上下文 → 模型照着资料回答并给出引用。如果文档里没有相关信息，模型就只能回答『资料里没有』——这就是为什么 RAG 有据可查。右上角可改文档/问题重新运行。</div>";
              }, 350);
            }, 300);
          }, 300);
        }, 300);
      }, 300);
    }
    function composeAnswer(ranked, q) {
      var txt = "";
      var cites = [];
      // 相关度判定：没有任何块命中关键词 → 属于"资料里没有"的情况 → 必须拒答
      var yannian = q.indexOf("年假") !== -1 || q.indexOf("休假") !== -1;
      var baoxiao = q.indexOf("报销") !== -1 || q.indexOf("审批") !== -1;
      for (var i = 0; i < ranked.length; i++) {
        var c = ranked[i].c, ci = ranked[i].i;
        // 年假：解析天数规则
        if (yannian && c.indexOf("年假") !== -1) {
          cites.push(ci + 1);
          var m = c.match(/入职满一年享每年\s*(\d+)\s*天/);
          if (m) { txt = "入职两年，每年享有 " + m[1] + " 天带薪年假。"; }
          else { txt = "根据资料，入职两年享有" + (c.match(/每年\s*(\d+)\s*天/) ? c.match(/每年\s*(\d+)\s*天/)[1] : "对应") + "天带薪年假。"; }
          break;
        }
        // 报销：解析阈值
        if (baoxiao && c.indexOf("报销") !== -1) {
          cites.push(ci + 1);
          var m2 = c.match(/金额低于\s*(\d+)\s*元/);
          if (m2) { txt = "金额低于 " + m2[1] + " 元的报销走 OA 流程即可，超过" + (c.match(/超过\s*(\d+)\s*元/)?c.match(/超过\s*(\d+)\s*元/)[1]:"1000") + " 元才需部门经理审批。"; }
          else { txt = "根据资料：金额 800 元（未超阈值）走 OA 报销即可。" ; }
          break;
        }
      }
      // 没有任何可依据的块 → 无答案必须拒答，而非硬编
      if (!cites.length) {
        txt = "根据你提供的资料，没有任何内容涉及这个问题，我无法作答。建议补充相关文档后再用 RAG 查询。（正确拒答，不编造）";
      }
      return { text: txt, cites: cites };
    }
    document.getElementById("ragRun").addEventListener("click", run);
    // 预设问题快捷按钮
    panel.querySelectorAll("[data-q]").forEach(function (pb) {
      pb.addEventListener("click", function () {
        var qIn = document.getElementById("ragQ");
        if (qIn) qIn.value = pb.getAttribute("data-q");
        run();
      });
    });
    run();
  }

  /* ===================== 6. Agent 循环（真·模拟器） ===================== */
  function agentLoop(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>这是 Codex / Claude Code 的循环模拟器：每一步都由「你」（扮演 Agent）选择下一步调用哪个工具。选对了就推进，选错了会得到报错反馈。体会：Agent 不是一口气做完，而是想→做→看→再想。</div>";
    c.appendChild(head);

    // 迷你 Codex 场景：改一个 bug
    var scenario = {
      name: "修注册页 Bug（模拟 Codex）",
      goal: "用户点击「注册」后没有任何反应。请修复它并跑测试。",
      steps: [
        { clue: "先定位问题在哪。你决定调用哪个工具？", tools: [
          { label: "read register.js（读代码）", ok: true, verb: "read_file(register.js)", why: "先读再改：只有看清代码才知道 bug 在哪，避免盲改。", out: "读到 register.js：提交按钮『只在页面加载时绑过一次事件，且写错了选择器』。" },
          { label: "直接 edit（不先读就改）", ok: false, verb: "edit_file(register.js)", out: "⚠ 报错：你还没读文件，不知道改哪里。请先 read。" },
          { label: "run bundle.js（乱跑命令）", ok: false, verb: "run(bundle.js)", out: "⚠ 报错：命令不存在。请先读代码定位。" }
        ]},
        { clue: "现在你知道原因了：按钮事件绑错了。你决定？", tools: [
          { label: "edit_file 修正选择器并绑定 click", ok: true, verb: "edit_file(register.js)", why: "读到的信息已经足够定位，直接改最有价值。", out: "已将提交按钮绑定到正确的 click → submit()。" },
          { label: "再 read 一次（读两遍）", ok: false, verb: "read_file", out: "你重复读了，没有新信息。请直接改。" },
          { label: "直接删掉文件", ok: false, verb: "rm(register.js)", out: "⚠ 危险操作：删除文件需要你（用户）授权。请求被拦截。" }
        ]},
        { clue: "改完了，接下来验证。你决定？", tools: [
          { label: "run npm test（跑测试）", ok: true, verb: "run(npm test)", why: "改动必须验证：跑测试才能确认没改坏别的功能。", out: "✅ 2 个测试全部通过。" },
          { label: "不测试直接交付", ok: false, verb: "report()", out: "⚠ 你还没验证改动是否正确，建议先跑测试。" },
          { label: "read 自己刚写的代码", ok: false, verb: "read_file", out: "没问题，但还没验证功能。先跑测试更稳。" }
        ]},
        { clue: "测试通过。最后一步？", tools: [
          { label: "report() 总结改动并汇报", ok: true, verb: "report()", why: "目标已达成，该收尾汇报，而不是继续空转。", out: "完成：修复了注册按钮无响应的 bug，测试通过。" },
          { label: "继续无限改下去", ok: false, verb: "edit_file(...)", out: "没有目标了，继续改会造成无意义循环（这正是 Agent 要避免的失控）。" }
        ]}
      ]
    };

    var phase = 0, busy = false;

    var goalBar = el("div", "ag-goal", "目标：<b>" + esc(scenario.goal) + "</b><span class='ag-scene'>" + esc(scenario.name) + "</span>");
    c.appendChild(goalBar);

    // 工具栏：重新开始（随时可用，避免任何"卡死"）
    var ctrl = el("div", "viz-toolbar");
    ctrl.innerHTML = "<button class='viz-btn ghost' id='agRestart'>↺ 重新开始</button>" +
      " <span class='viz-note' id='agProg'>第 " + (phase + 1) + " / " + scenario.steps.length + " 步</span>";
    c.appendChild(ctrl);

    var loop = el("div", "ag-loop");
    loop.innerHTML =
      "<div class='ag-node' data-step='think'><b>想</b><span>下一步做什么</span></div>" +
      "<div class='ag-node' data-step='act'><b>做</b><span>调用工具</span></div>" +
      "<div class='ag-node' data-step='observe'><b>看</b><span>读反馈</span></div>";
    c.appendChild(loop);

    var log = el("div", "ag-log");
    c.appendChild(log);

    function paintActive(step) {
      var nodes = loop.querySelectorAll(".ag-node");
      nodes.forEach(function (n) { n.classList.toggle("cur", n.dataset.step === step); });
    }
    function addLine(html, cls) {
      log.appendChild(el("div", "ag-round " + (cls || ""), html));
      log.scrollTop = log.scrollHeight;
    }
    function renderClue() {
      if (phase >= scenario.steps.length) return;
      var st = scenario.steps[phase];
      var card = el("div", "ag-choice");
      card.innerHTML = "<div class='ag-clue'>🔎 " + esc(st.clue) + "</div>" +
        "<div class='ag-sub'>这步该调用哪个工具？选错了会得到反馈并<b>允许重试</b>。</div>";
      var btns = el("div", "ag-tools");
      st.tools.forEach(function (t, ti) {
        var b = el("button", "ag-tool-btn", t.label);
        b.addEventListener("click", function () { choose(t, btns); });
        btns.appendChild(b);
      });
      card.appendChild(btns);
      log.appendChild(card);
    }
    function choose(t, btns) {
      if (busy) return; // 只要 busy 就忽略，绝不重复进入；每次异常路径都会复位 busy
      busy = true;
      // 禁用当前步所有按钮（防止连点）
      btns.querySelectorAll(".ag-tool-btn").forEach(function (x) { x.disabled = true; });
      paintActive("act");
      // 叙述 1：想了什么、调用什么工具
      addLine("💡 想：我决定调用 <code>" + esc(t.verb) + "</code>——" + esc(t.why || "调用工具观察反馈"), "alt");
      setTimeout(function () {
        paintActive("observe");
        // 叙述 2：工具返回什么
        addLine("👀 看（<code>" + esc(t.verb) + "</code> 返回）：" + esc(t.out), t.ok ? "good" : "bad");
        if (t.ok) {
          // 叙述 3：为什么下一步
          addLine("➡️ 为什么这样能推进：" + esc(t.why || "反馈确认了当前目标，进入下一环节"), "hint");
          setTimeout(function () {
            phase++;
            busy = false;
            paintActive("think");
            progEl.textContent = phase < scenario.steps.length ? "第 " + (phase + 1) + " / " + scenario.steps.length + " 步" : "完成";
            if (phase < scenario.steps.length) { renderClue(); }
            else {
              addLine("<div class='ag-done'>✅ 任务完成！你自己走完了一个 Agent 循环：<b>想→做→看→再想</b>，直到目标达成。注意错误选项演示了【失败→反馈→修正】和【危险操作需授权】。</div>", "");
              paintActive(null);
            }
          }, 700);
        } else {
          // 失败反馈：明确告知，并复位 busy + 允许重选本步（不永久锁死）
          addLine("⚠️ 这一步没选对：Agent 没有推进，下面<b>允许你重试本步</b>。", "bad");
          setTimeout(function () {
            busy = false;
            paintActive("think");
            btns.querySelectorAll(".ag-tool-btn").forEach(function (x) { x.disabled = false; });
            addLine("↩ 反馈已经消化，重新思考这一步……（这就是【看】→【再想】）", "hint");
          }, 700);
        }
      }, 500);
    }
    // 重新开始：清空日志、复位到第 1 步
    var progEl = document.getElementById("agProg");
    var restartBtn = document.getElementById("agRestart");
    restartBtn.addEventListener("click", function () {
      log.innerHTML = "";
      phase = 0;
      busy = false;
      paintActive("think");
      progEl.textContent = "第 1 / " + scenario.steps.length + " 步";
      addLine("🔄 已重新开始。新的 Agent 循环从第 1 步走起。", "alt");
      renderClue();
    });
    renderClue();
  }

  /* ===================== Vibe Coding 路径 · V系列新组件 ===================== */
  /* 风格沿用既有 viz-XXX 基础样式，组件级样式后缀见 style.css。
     所有异步步骤都带代数令牌，避免重复触发交错。 */

  /* ---------- V1. 请求流：一个 URL 从输入到渲染经历了什么 ---------- */
  function requestFlow(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>你在地址栏敲下回车到页面出现，中间隔着 7 个环节，且分布在不同『层』。点『开始一个请求』逐步播放，看每个环节属于哪一层、出错会是什么现象。</div>";
    c.appendChild(head);

    var bar = el("div", "vf-bar");
    bar.innerHTML = "<div class='vf-addr'><span class='vf-lock'>🔒</span>https://xiaodian.shop/login</div>" +
      "<button class='viz-btn' id='vfPlay'>▶ 开始一个请求</button>" +
      "<button class='viz-btn ghost' id='vfReset'>↺ 重置</button>";
    c.appendChild(bar);

    var flow = el("div", "vf-flow");
    c.appendChild(flow);

    var nodes = [
      { i: "🌐", t: "输入网址", l: "前端", d: "在地址栏回车，浏览器准备访问 xiaodian.shop。" },
      { i: "📇", t: "DNS 解析", l: "网络", d: "把域名『xiaodian.shop』翻译成服务器的 IP 地址（像查通讯录）。" },
      { i: "🔗", t: "建立连接+HTTP", l: "网络", d: "浏览器与服务器建立连接，并发出 HTTP 请求：GET /login。" },
      { i: "🖥️", t: "服务器→后端", l: "后端", d: "Web 服务器把请求转交给应用后端程序，开始处理业务。" },
      { i: "🗄️", t: "后端读写数据库", l: "数据", d: "后端查数据库：这个用户存在吗？密码对吗？（SQL 查询）" },
      { i: "📦", t: "返回 HTTP 响应", l: "后端", d: "后端拼好响应：状态码 200 + HTML/JSON，发回浏览器。" },
      { i: "🎨", t: "浏览器渲染", l: "前端", d: "浏览器把 HTML/CSS/JS 画成你看到的登录页面。" }
    ];
    var layerColor = { "前端": "var(--primary)", "网络": "var(--warn)", "后端": "var(--accent)", "数据": "var(--danger)" };

    nodes.forEach(function (n, i) {
      var box = el("div", "vf-node");
      box.innerHTML = "<div class='vf-ico'>" + n.i + "</div><div class='vf-t'>" + n.t + "</div>" +
        "<div class='vf-layer' style='color:" + layerColor[n.l] + "'>" + n.l + "</div>";
      if (i < nodes.length - 1) {
        var arrow = el("div", "vf-arrow", "→");
        flow.appendChild(arrow);
      }
      flow.appendChild(box);
    });

    var detail = el("div", "vf-detail");
    c.appendChild(detail);

    var gen = 0;
    var current = -1;

    function paint(idx) {
      var boxes = flow.querySelectorAll(".vf-node");
      boxes.forEach(function (b, i) {
        b.classList.toggle("cur", i === idx);
        b.classList.toggle("done", i < idx && idx !== -1);
      });
      if (idx >= 0) {
        detail.innerHTML = "<div class='vf-d'><span class='vf-dn'>" + (idx + 1) + ".</span> " + esc(nodes[idx].d) + "</div>";
      }
    }
    function play() {
      var my = ++gen;
      if (current >= nodes.length - 1) current = -1;
      function advance(i) {
        if (my !== gen) return;
        if (i >= nodes.length) {
          paint(-1);
          detail.innerHTML = "<div class='vf-d done'>✅ 一次完整的请求：<b>前端发送 → 网络传输 → 后端处理 → 数据库查询 → 返回渲染</b>。这就是『一个 Web 产品跑起来』的骨架。下次出错，先问——它坏在第几层？</div>";
          return;
        }
        paint(i);
        setTimeout(function () { if (my === gen) advance(i + 1); }, 650);
      }
      current = 0;
      advance(0);
    }
    document.getElementById("vfPlay").addEventListener("click", play);
    document.getElementById("vfReset").addEventListener("click", function () {
      gen++; current = -1; paint(-1); detail.innerHTML = "";
    });
  }

  /* ---------- V2. HTTP 查看器：亲手发一个请求 ---------- */
  function httpViewer(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>选一个 HTTP 方法 + 一个预设接口（或自己填地址），点『发送』。它会展示这次请求带了什么、服务器返回什么状态码与 JSON。体会：同样的 URL，方法不同 = 动作不同；状态码 2xx/4xx/5xx 代表不同结果。</div>";
    c.appendChild(head);

    var ctrl = el("div", "hv-ctrl");
    var methods = ["GET", "POST", "PUT", "DELETE"];
    var selMethod = "GET";
    ctrl.innerHTML = "<div class='hv-methods'><span class='hv-lbl'>方法</span>" +
      methods.map(function (m) { return "<button class='viz-btn ghost hv-m' data-m='" + m + "'>" + m + "</button>"; }).join("") +
      "</div>";
    c.appendChild(ctrl);

    var urlRow = el("div", "hv-url");
    urlRow.innerHTML = "<span class='hv-lbl'>URL</span><input class='viz-input' id='hvUrl' value='https://api.example.com/users' style='flex:1'>" +
      "<button class='viz-btn' id='hvSend'>发送</button>";
    c.appendChild(urlRow);

    var presets = el("div", "hv-presets");
    presets.innerHTML = "<span class='viz-note'>预设接口：</span>" +
      "<button class='viz-btn ghost' data-url='https://api.example.com/users' data-m='GET'>GET /users（查列表）</button>" +
      "<button class='viz-btn ghost' data-url='https://api.example.com/users' data-m='POST'>POST /users（新建）</button>" +
      "<button class='viz-btn ghost' data-url='https://api.example.com/users/42' data-m='GET'>GET /users/42（查单个）</button>" +
      "<button class='viz-btn ghost' data-url='https://api.example.com/users/42' data-m='DELETE'>DELETE /users/42（删除）</button>" +
      "<button class='viz-btn ghost' data-url='https://api.example.com/login' data-m='POST'>POST /login（登录-错误密码）</button>";
    c.appendChild(presets);

    var out = el("div", "hv-out");
    c.appendChild(out);

    function selectMethod(m) {
      selMethod = m;
      ctrl.querySelectorAll(".hv-m").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-m") === m);
      });
    }
    selectMethod("GET");
    ctrl.querySelectorAll(".hv-m").forEach(function (b) {
      b.addEventListener("click", function () { selectMethod(b.getAttribute("data-m")); });
    });
    presets.querySelectorAll("button[data-url]").forEach(function (b) {
      b.addEventListener("click", function () {
        selectMethod(b.getAttribute("data-m"));
        document.getElementById("hvUrl").value = b.getAttribute("data-url");
      });
    });

    // 状态码→含义 & 模拟响应
    function simulate(m, url) {
      var u = url.replace(/\/+$/, "");
      // 校验地址
      if (!/^https?:\/\/.+/.test(url)) {
        return { status: 400, stxt: "客户端错误", body: { error: "URL 格式不正确（需要 http(s):// 开头）。" }, meaning: "还没发起请求就被浏览器拦下——网络层的前端校验。" };
      }
      if (/\/login$/.test(u) && m === "POST") {
        return { status: 401, stxt: "未授权", body: { ok: false, error: "密码错误，请重试" }, meaning: "401：服务器认出了你，但你没资格——密码不对。属于『身份认证』问题，出在后端。" };
      }
      if (/\/users\/\d+\/?$/.test(u) && m === "GET") {
        return { status: 200, stxt: "OK", body: { id: 42, nickname: "小林", vip: true }, meaning: "200：成功了。服务器返回了你要的单个用户 JSON。GET 只读不改变数据。" };
      }
      if (/\/users\/\d+\/?$/.test(u) && m === "DELETE") {
        return { status: 200, stxt: "OK", body: { ok: true, deleted: 1 }, meaning: "200：删除成功。DELETE 删除资源——同一 URL，方法和 GET 完全不同。" };
      }
      if (/\/users\/?\s*$/.test(u) && m === "GET") {
        return { status: 200, stxt: "OK", body: { users: [{ id: 1, nickname: "小林" }, { id: 2, nickname: "阿新" }] }, meaning: "200：GET 查列表，返回多个资源。服务器没被改动，可反复安全调用。" };
      }
      if (/\/users\/?\s*$/.test(u) && m === "POST") {
        return { status: 201, stxt: "Created", body: { ok: true, id: 43 }, meaning: "201：新建成功（Created）。POST 会在服务器上『新增』一条数据。注意 POST 可产生副作用，不可随意重复。" };
      }
      return { status: 404, stxt: "Not Found", body: { error: "资源不存在" }, meaning: "404：服务器找不到这个地址/资源。可能是 URL 写错，或这个资源本来就不存在。" };
    }

    function send() {
      var url = document.getElementById("hvUrl").value.trim() || "https://api.example.com/users";
      var r = simulate(selMethod, url);
      out.innerHTML =
        "<div class='hv-req'><div class='hv-cap'>📨 请求（你发出去的）</div><pre>" + esc(selMethod + " " + url + " HTTP/1.1") +
        "\nHost: " + esc(url.replace(/^https?:\/\//, "").split("/")[0]) +
        "\nContent-Type: application/json" + (selMethod === "POST" || selMethod === "PUT" ? "\n\n{\"name\":\"新用户\"}" : "") + "</pre></div>" +
        "<div class='hv-res'><div class='hv-cap'>📬 响应（服务器返回的）</div>" +
        "<div class='hv-code " + (r.status >= 500 ? "c5" : r.status >= 400 ? "c4" : "c2") + "'><b>" + r.status + "</b> " + esc(r.stxt) + "</div>" +
        "<pre>" + esc(JSON.stringify(r.body, null, 2)) + "</pre>" +
        "<div class='hv-mean'>🎯 含义：" + esc(r.meaning) + "</div></div>";
    }
    document.getElementById("hvSend").addEventListener("click", send);
    send();
  }

  /* ---------- V3. 数据库设计器：把业务拆成表 ---------- */
  function dbDesigner(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>把『用户能注册、能收藏文章』拆成数据库的表和字段。点击底部的角色按钮，把它设为主键/外键，SQL 和『这样设计的理由』会实时更新。体会：主键保证唯一、外键负责关联、多余的重复数据要靠外键消除。</div>";
    c.appendChild(head);

    // 预定义一张 users 表的可编辑字段
    var panel = el("div", "db-panel");
    panel.innerHTML =
      "<div class='db-title'>🗂️ 表：users（用户）</div>" +
      "<div class='db-cols' id='dbCols'></div>" +
      "<div class='viz-toolbar'><button class='viz-btn' id='dbAdd'>＋ 加一列</button>" +
      "<button class='viz-btn ghost' id='dbCheck'>🧐 验证设计</button></div>";
    c.appendChild(panel);

    var cols = [
      { name: "id", type: "INT", pk: true, fk: "" },
      { name: "nickname", type: "VARCHAR(50)", pk: false, fk: "" },
      { name: "email", type: "VARCHAR(120)", pk: false, fk: "" }
    ];

    function renderCols() {
      var box = document.getElementById("dbCols");
      box.innerHTML = "";
      cols.forEach(function (col, i) {
        var row = el("div", "db-row");
        var nm = el("div", "db-rowhead");
        nm.innerHTML = "<span class='db-name'>" + esc(col.name) + "</span><span class='db-type'>" + esc(col.type) + "</span>" +
          (col.pk ? "<span class='db-pk'>PK</span>" : "") +
          (col.fk ? "<span class='db-fk'>FK→" + esc(col.fk) + "</span>" : "");
        var btns = el("div", "db-actions");
        var pk = el("button", "viz-btn ghost", col.pk ? "✔ 主键" : "设为主键");
        pk.addEventListener("click", function () {
          cols.forEach(function (x) { x.pk = false; });
          col.pk = !col.pk; renderCols(); updateSql();
        });
        var fk = el("button", "viz-btn ghost", col.fk ? "✔ 外键(" + col.fk + ")" : "设为外键");
        fk.addEventListener("click", function () {
          col.fk = col.fk ? "" : "users.id"; col.pk = false; renderCols(); updateSql();
        });
        var del = el("button", "viz-btn ghost", "✕");
        del.addEventListener("click", function () { cols.splice(i, 1); renderCols(); updateSql(); });
        btns.appendChild(pk); btns.appendChild(fk); btns.appendChild(del);
        row.appendChild(nm); row.appendChild(btns);
        box.appendChild(row);
      });
    }

    var sql = el("div", "db-sql");
    sql.innerHTML = "<div class='db-sqlcap'>🧾 实时生成的 SQL</div><pre id='dbSql'></pre><div class='db-why' id='dbWhy'></div>";
    c.appendChild(sql);

    function updateSql() {
      var lines = ["CREATE TABLE users ("];
      cols.forEach(function (col, i) {
        var d = "  " + col.name + " " + col.type;
        d += " NOT NULL";
        if (col.pk) d += ", PRIMARY KEY (" + col.name + ")";
        if (col.fk) d += ", FOREIGN KEY (" + col.name + ") REFERENCES " + col.fk + "(" + col.name + ")";
        lines.push(d + (i < cols.length - 1 ? "," : ""));
      });
      lines.push(");");
      document.getElementById("dbSql").textContent = lines.join("\n") + "\n\n-- 说明：主键唯一标识一行；外键把本表与 users.id 关联，避免重复存用户资料。";

      var pkCols = cols.filter(function (x) { return x.pk; });
      var fkCols = cols.filter(function (x) { return x.fk; });
      var msg = "";
      if (!pkCols.length) msg += "⚠️ 没有主键：每张表都该有主键唯一标识一行，否则会出现重复/无法定位。";
      else msg += "✅ 有主键（" + pkCols[0].name + "），每行可被唯一找到。";
      if (fkCols.length) msg += " ✅ 有外键（" + fkCols.map(function (x) { return x.name; }).join("、") + "）→ 关联到 users.id，保证引用一致。";
      document.getElementById("dbWhy").textContent = msg;
    }

    document.getElementById("dbAdd").addEventListener("click", function () {
      var n = cols.length + 1;
      cols.push({ name: "col" + n, type: "VARCHAR(50)", pk: false, fk: "" });
      renderCols(); updateSql();
    });
    document.getElementById("dbCheck").addEventListener("click", function () {
      var pkCols = cols.filter(function (x) { return x.pk; });
      if (!pkCols.length) {
        document.getElementById("dbWhy").textContent = "❌ 设计要点：你还缺一个主键！主键保证每一行都能被唯一找到（关系数据库的核心）。把 id 设为主键试试。";
      } else {
        document.getElementById("dbWhy").textContent = "✅ 设计合理：有主键保证唯一性。若把收藏关系也做成表（user_id + article_id 两张外键），就能表达『收藏』这种多对多关系且不重复。";
      }
    });

    renderCols();
    updateSql();
  }

  /* ---------- V4. 认证方式对比：Session / JWT / OAuth ---------- */
  function authCompare(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>登录后网站怎么『记住你』？三种主流方案：Session（服务器记账）、JWT（客户端拿票）、OAuth（第三方代登录）。点按钮切换，看各自的凭证在哪、怎么验证、优缺点。</div>";
    c.appendChild(head);

    var cards = {
      session: { name: "🪪 Session（会话）", who: "凭证存在服务器端内存/数据库，客户端只留一个随机 session_id。", flow: "登录 → 服务器生成 session → 存服务端 + 发 id 给浏览器 → 每次请求带 id，服务端核对。", pros: "安全（凭证不暴露给客户端）、可强制踢下线。", cons: "服务器要存状态、多服务器要共享 session、占用内存。" },
      jwt: { name: "🎫 JWT（令牌）", who: "凭证是一串签名的 Token，存在客户端，服务端『无状态』验签。", flow: "登录 → 服务器签发带签名的 JWT → 客户端保存 → 每次请求带 Token，服务端验签名即认（不用存）。", pros: "无需服务器存状态、易横向扩展、适合前后端分离/App。", cons: "无法主动踢下线（到期前一直有效）、签错密钥=灾难、载荷别放敏感数据。" },
      oauth: { name: "🔑 OAuth / 第三方登录", who: "登录交给第三方（微信/Google），你的服务不接触密码。", flow: "点『微信登录』→ 跳微信授权 → 微信回传授权码 → 你的服务拿码换用户信息 → 建立本地会话。", pros: "用户免注册、不存密码、更安全省心。", cons: "依赖第三方、流程较复杂、有回调地址等配置。" }
    };

    var keys = ["session", "jwt", "oauth"];
    var sel = "jwt";

    var tabs = el("div", "au-tabs");
    tabs.innerHTML = keys.map(function (k) {
      return "<button class='viz-btn ghost au-tab' data-k='" + k + "'>" + cards[k].name + "</button>";
    }).join("");
    c.appendChild(tabs);

    var body = el("div", "au-body");
    c.appendChild(body);

    function render(k) {
      var d = cards[k];
      body.innerHTML =
        "<div class='au-grid'>" +
        "<div class='au-cell'><div class='au-cap'>凭证在哪</div><p>" + esc(d.who) + "</p></div>" +
        "<div class='au-cell'><div class='au-cap'>怎么走的</div><p>" + esc(d.flow) + "</p></div>" +
        "<div class='au-cell good'><div class='au-cap'>✅ 优点</div><p>" + esc(d.pros) + "</p></div>" +
        "<div class='au-cell warn'><div class='au-cap'>⚠️ 缺点</div><p>" + esc(d.cons) + "</p></div>" +
        "</div>" +
        "<div class='au-pick'>当前选择：<b>" + esc(cards[k].name) + "</b> × 适合「想省心 + 前后端分离 + 不怕短期过期」的场景；若需要『用户能主动登出/后台踢人』，更推荐 Session；若想免注册，用 OAuth。</div>";
      tabs.querySelectorAll(".au-tab").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-k") === k);
      });
    }
    tabs.querySelectorAll(".au-tab").forEach(function (b) {
      b.addEventListener("click", function () { sel = b.getAttribute("data-k"); render(sel); });
    });
    render(sel);
  }

  /* ---------- V5. 部署控制台：构建→迁移→健康检查→切流量---------- */
  function deployConsole(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>点『部署』，看一次真实上线要经过：构建 → 迁移 → 健康检查 → 切换流量。把『制造健康检查失败』打开再部署，你会看到系统<b>拒绝放量并自动回滚</b>——这就是为什么上线不至于『一键搞挂』。</div>";
    c.appendChild(head);

    var ctrl = el("div", "viz-toolbar");
    ctrl.innerHTML = "<button class='viz-btn' id='dpDeploy'>🚀 部署</button>" +
      "<label class='dp-toggle'><input type='checkbox' id='dpFail'> 制造健康检查失败（看回滚）</label>" +
      "<button class='viz-btn ghost' id='dpReset'>↺ 重置</button>" +
      "<span class='viz-note' id='dpState'></span>";
    c.appendChild(ctrl);

    var stages = [
      { i: "📦", t: "构建 build", s: "把源码打包成可发布产物" },
      { i: "📤", t: "迁移 migrate", s: "更新数据库表结构" },
      { i: "💓", t: "健康检查 /health", s: "探测新版本是否真的活着" },
      { i: "🔀", t: "切换流量", s: "把用户从旧版切到新版" }
    ];
    var flow = el("div", "dp-flow");
    stages.forEach(function (st, i) {
      var box = el("div", "dp-stage");
      box.innerHTML = "<div class='dp-ico'>" + st.i + "</div><div class='dp-t'>" + st.t + "</div>";
      if (i < stages.length - 1) { flow.appendChild(el("div", "vf-arrow", "→")); }
      flow.appendChild(box);
    });
    c.appendChild(flow);

    var term = el("div", "dp-term");
    term.innerHTML = "<div class='dp-termcap'>▶ 部署终端</div><div class='dp-log' id='dpLog'></div>";
    c.appendChild(term);

    var logEl = null;
    function log(html, cls) {
      logEl.appendChild(el("div", "dp-line " + (cls || ""), html));
      logEl.scrollTop = logEl.scrollHeight;
    }

    function deploy() {
      var fail = document.getElementById("dpFail").checked;
      var my = ++deployGen;
      logEl.innerHTML = "";
      var stagesEl = flow.querySelectorAll(".dp-stage");
      stagesEl.forEach(function (s) { s.className = "dp-stage"; });
      var state = document.getElementById("dpState");
      setTimeout(function () {
        if (my !== deployGen) return;
        log("$ git push origin main", "cmd");
        log("▶ 检测到推送，触发 CI（构建中……）", "info");
        stagesEl[0].classList.add("run");
        setTimeout(function () {
          if (my !== deployGen) return;
          log("✔ 构建完成：dist/ 产物已生成", "ok");
          stagesEl[0].classList.remove("run"); stagesEl[0].classList.add("ok");
          stagesEl[1].classList.add("run");
          setTimeout(function () {
            if (my !== deployGen) return;
            log("✔ 数据库迁移完成：ALTER TABLE users ADD vip TINYINT", "ok");
            stagesEl[1].classList.remove("run"); stagesEl[1].classList.add("ok");
            stagesEl[2].classList.add("run");
            setTimeout(function () {
              if (my !== deployGen) return;
              if (fail) {
                log("✘ 健康检查 /health → 503 Service Unavailable", "bad");
                stagesEl[2].classList.remove("run"); stagesEl[2].classList.add("bad");
                log("⚠ 新版本不健康！系统拒绝切换流量，自动回滚到上一个版本 v3.2.1", "warn");
                state.textContent = "↩ 已自动回滚，用户无感知";
                state.style.color = "var(--warn)";
              } else {
                log("✔ 健康检查 /health → 200 OK", "ok");
                stagesEl[2].classList.remove("run"); stagesEl[2].classList.add("ok");
                stagesEl[3].classList.add("run");
                setTimeout(function () {
                  if (my !== deployGen) return;
                  log("✔ 灰度 10% → 50% → 100%，流量已全量切换", "ok");
                  stagesEl[3].classList.remove("run"); stagesEl[3].classList.add("ok");
                  log("✅ 上线成功！v4.0.0 已在运行。", "ok");
                  state.textContent = "✅ 上线成功";
                  state.style.color = "var(--good)";
                }, 500);
              }
            }, 500);
          }, 500);
        }, 500);
      }, 400);
    }
    document.getElementById("dpDeploy").addEventListener("click", deploy);
    document.getElementById("dpReset").addEventListener("click", function () {
      deployGen++;
      logEl.innerHTML = "";
      flow.querySelectorAll(".dp-stage").forEach(function (s) { s.className = "dp-stage"; });
      document.getElementById("dpState").textContent = "";
    });
    var deployGen = 0;
    logEl = document.getElementById("dpLog");
  }

  /* ---------- V6. LLM 调用可靠性：超时→重试→降级 ---------- */
  function llmRetry(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>你的产品里调用了大模型（LLM）。模型偶尔会慢、会超时、会挂。看三种策略：直连、带超时+重试、重试仍失败后的『降级 Fallback』。体会：工程上永远要为『上游不可靠』做兜底。</div>";
    c.appendChild(head);

    var ctrl = el("div", "viz-toolbar");
    ctrl.innerHTML = "<button class='viz-btn' data-mode='ok'>😀 顺利</button>" +
      "<button class='viz-btn ghost' data-mode='timeout'>⏳ 超时一次后重试成功</button>" +
      "<button class='viz-btn ghost' data-mode='down'>💥 连续失败→降级</button>" +
      "<button class='viz-btn ghost' id='lrReset'>↺ 重置</button>";
    c.appendChild(ctrl);

    var term = el("div", "llm-term");
    term.innerHTML = "<div class='llm-log' id='llmLog'></div>";
    c.appendChild(term);

    var logEl = document.getElementById("llmLog");
    function log(html, cls) {
      logEl.appendChild(el("div", "llm-line " + (cls || ""), html));
      logEl.scrollTop = logEl.scrollHeight;
    }

    function call(mode) {
      var my = ++llmGen;
      logEl.innerHTML = "";
      setTimeout(function () {
        if (my !== llmGen) return;
        log("→ 调用 LLM API（附超时 10s、最多重试 2 次）", "info");
        if (mode === "ok") {
          log("✔ 0ms 内返回：正常拿到摘要 ✔", "ok");
          log("→ 直接使用生成结果。", "hint");
        } else if (mode === "timeout") {
          log("… 10s 超时，第 1 次重试……", "warn");
          setTimeout(function () {
            if (my !== llmGen) return;
            log("… 又 8s，第 2 次重试……（指数退避）", "warn");
            setTimeout(function () {
              if (my !== llmGen) return;
              log("✔ 第 2 次重试成功，拿到摘要 ✔", "ok");
              log("→ 重试兜住了瞬时抖动：用户几乎无感知。", "hint");
            }, 600);
          }, 600);
        } else {
          log("… 10s 超时，重试 1……", "warn");
          setTimeout(function () {
            if (my !== llmGen) return;
            log("… 重试 2……仍失败", "warn");
            setTimeout(function () {
              if (my !== llmGen) return;
              log("✘ 重试耗尽，LLM 不可用。", "bad");
              log("→ 触发【降级 Fallback】：返回本地缓存/预设文案，并对用户友好提示『生成服务暂时繁忙』，而不是白屏或报错。", "hint");
              logEl.appendChild(el("div", "llm-fallback", "🛟 降级结果：『（系统提示：摘要服务暂时不可用，已为你展示最近一次的缓存摘要。）』"));
            }, 600);
          }, 600);
        }
      }, 400);
    }
    ctrl.querySelectorAll("button[data-mode]").forEach(function (b) {
      b.addEventListener("click", function () { call(b.getAttribute("data-mode")); });
    });
    document.getElementById("lrReset").addEventListener("click", function () {
      llmGen++; logEl.innerHTML = "";
    });
    var llmGen = 0;
    call("ok");
  }

  /* ===================== 注册 ===================== */
  V.registry = {
    "ai-world-map": worldMap,
    "embedding-space": embeddingSpace,
    "attention-heatmap": attentionHeatmap,
    "transformer-flow": transformerFlow,
    "rag-pipeline": ragPipeline,
    "agent-loop": agentLoop,
    "request-flow": requestFlow,
    "http-viewer": httpViewer,
    "db-designer": dbDesigner,
    "auth-compare": authCompare,
    "deploy-console": deployConsole,
    "llm-retry": llmRetry
  };
  V.render = function (container, kind, opts) {
    if (!container) return;
    if (V.registry[kind]) {
      try { V.registry[kind](container, opts || {}); }
      catch (e) { container.innerHTML = "<p class='viz-error'>可视化加载失败：" + esc(e.message) + "</p>"; }
      return true;
    }
    container.innerHTML = "<p class='viz-error'>未知可视化类型：" + esc(kind) + "</p>";
    return false;
  };

  if (typeof window !== "undefined") window.Viz = V;
  if (typeof module !== "undefined" && module.exports) module.exports = V;
})();
