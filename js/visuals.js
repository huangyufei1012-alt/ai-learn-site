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
    head.innerHTML = "<div class='viz-hint'>坐标代表两种语义：「动物 ↔ 食物」＋「具体物 ↔ 抽象概念」。输入一个词，它会根据『意思』被放到一个位置——位置越近 = 语义越近。这就是 Embedding：给词找坐标。</div>";
    c.appendChild(head);

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
    head.innerHTML = "<div class='viz-hint'>点句中任意一个词，看它把「注意力」分给了其它词（颜色越深越关注）。模型在理解某词时会临时对全句加权——这就是 Attention。</div>";
    c.appendChild(head);

    var toolbar = el("div", "viz-toolbar");
    toolbar.innerHTML = "<input class='viz-input' id='attSent' style='flex:1' value='那棵大树下有一株开满花的玫瑰'>" +
      "<button class='viz-btn' id='attGo'>换一句</button>";
    c.appendChild(toolbar);

    var wrap = el("div", "viz-canvas");
    c.appendChild(wrap);
    var board = el("div", "att-board");
    wrap.appendChild(board);

    // 语义相关启发：非规则，用"词对相似度"近似（字符重合 + 相邻衰减）
    var STOP = ["的", "了", "下", "有", "一", "是", "在", "和", "与", "个", "只", "里面", "上", "中", "都", "就", "很"];
    function sim(a, b) {
      if (a === b) return 1.2;
      var base = 0;
      var commons = 0;
      for (var i = 0; i < Math.min(a.length, 4); i++) {
        if (b.indexOf(a[i]) !== -1) commons++;
      }
      base += commons * 0.55;
      if (Math.abs(a.length - b.length) <= 1) base += 0.25;
      return base;
    }
    function tokenize(s) {
      return s.split(/[\s，。、,.；;！!？?]/).filter(function (x) { return x; });
    }
    function run() {
      var sent = document.getElementById("attSent").value || "那棵大树下有一株开满花的玫瑰";
      var tokens = tokenize(sent);
      var scoreMap = {};
      function sink() { return 1e-9; }
      tokens.forEach(function (t) {
        var scores = tokens.map(function (o) {
          var sc = sim(t, o);
          if (STOP.indexOf(o) !== -1) sc *= 0.35;
          if (STOP.indexOf(t) !== -1) sc *= 0.2;
          return sc;
        });
        var sum = scores.reduce(function (a, b) { return a + b; }, 0) || sink();
        scoreMap[t] = scores.map(function (s) { return s / sum; });
      });
      renderRow(tokens, scoreMap);
    }

    function renderRow(tokens, scores, selToken) {
      board.innerHTML = "";
      var row = el("div", "att-row");
      var selName = selToken; 
      tokens.forEach(function (t, ti) {
        var cell = el("button", "att-cell" + (t === selToken ? " sel" : ""));
        cell.textContent = t;
        cell.title = "点我看它的注意力";
        cell.addEventListener("click", function () { renderRow(tokens, scores, t); });
        row.appendChild(cell);
      });
      board.appendChild(row);

      if (selToken) {
        var w = scores[selToken] || [];
        var heat = el("div", "att-heat");
        var lab = el("div", "att-lab", "「" + esc(selToken) + "」的注意力：");
        heat.appendChild(lab);
        var bar = el("div", "att-barbox");
        tokens.forEach(function (t, ti) {
          var cellW = (w[ti] || 0) * 100;
          cellW = Math.max(1.4, Math.min(96, cellW));
          var b = el("div", "att-bar");
          b.innerHTML = "<div class='att-bartrack'><i class='att-barfill' style='width:" + cellW + "%'></i></div><span>" + esc(t) + "</span>";
          bar.appendChild(b);
        });
        heat.appendChild(bar);
        board.appendChild(heat);
      } else {
        var hint = el("div", "att-hint", "↑ 点上面任意一个词，看它的注意力权重分配。");
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
      { n: "输入", t: "Token + Embedding", d: "把词「模型」变成向量；再叠加位置编码，让它知道自己是第几个。" },
      { n: "嵌入", t: "位置编码", d: "每个词的位置被编码进向量：没有它，「狗追猫」和「猫追狗」无法区分。" },
      { n: "注意力", t: "多头注意力", d: "Q/K/V 让每个词结合全局上下文；多组头并行，不同视角同时观察。" },
      { n: "残差", t: "残差 + 归一化", d: "把上一步的输入加回来（残差），再做归一化——信息低损耗跨层直达，能堆得很深。" },
      { n: "前馈", t: "前馈网络 FFN", d: "对每个词独立再做非线性变换，增强表达能力。" },
      { n: "堆叠", t: "重复 N 层", d: "把 内部三件套 复制叠很多层，表示一层比一层抽象。" },
      { n: "输出", t: "预测下一个词", d: "线性层 + Softmax 得到词典概率，取最可能的词，拼回输入继续预测。" }
    ];
    var idx = -1, timer = null;

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
    detailBox.innerHTML = "<div class='vd-name' id='tfTitle'>准备就绪</div><div class='vd-sub' id='tfDesc'>点击「下一步」，看一个词走完整条流水线。</div>";
    wrap.appendChild(detailBox);

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
      if (idx < 0) {
        t.textContent = "准备就绪"; d.textContent = "点击「下一步」，看一个词走完整条流水线。";
        p.textContent = "0 / " + stages.length;
      } else {
        var s = stages[Math.min(idx, stages.length - 1)];
        t.textContent = "第 " + (idx + 1) + " 步 · " + s.t;
        d.textContent = s.d;
        p.textContent = (idx + 1) + " / " + stages.length;
      }
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
    head.innerHTML = "<div class='viz-hint'>输入你自己的「文档」和「问题」，点击运行，看 RAG 如何把它 切块 → 向量化 → 检索 Top-K → 重排 → 组装上下文 → 生成答案。</div>";
    c.appendChild(head);

    // 输入区
    var panel = el("div", "rag-input");
    panel.innerHTML =
      "<div class='rag-fld'><label>你的文档（几行资料，按句子切块）</label>" +
      "<textarea id='ragDoc' rows='4'>年假制度：入职满一年享每年 5 天带薪年假，工龄三年以上每年 8 天。报销流程：金额低于 1000 元走 OA 报销，超过 1000 元需部门经理审批。年假需提前 3 个工作日申请。</textarea></div>" +
      "<div class='rag-fld'><label>你的问题</label>" +
      "<input class='viz-input' id='ragQ' value='入职两年，我有几天年假？' style='flex:1'>" +
      "<button class='viz-btn' id='ragRun'>▶ 运行 RAG</button></div>";
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

    function run() {
      var doc = document.getElementById("ragDoc").value || "";
      var q = document.getElementById("ragQ").value.trim() || "入职两年，我有几天年假？";
      // 1) 切块（按句子、标点）
      var chunks = doc.split(/[。；\n]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
      if (chunks.length === 0) chunks = doc ? [doc] : ["（文档为空）"];
      out.innerHTML = "<div class='rag-step'><b class='rs-t'>① 切块 Chunking</b> 文档按句子切成 <b>" + chunks.length + "</b> 块，保持信息完整。</div>";
      chunks.forEach(function (c, i) { out.appendChild(el("div", "chunk-chip", "块" + (i + 1) + "：「" + esc(c.slice(0, 26)) + (c.length > 26 ? "…" : "") + "」")); });
      nodeOn(0);
      setTimeout(function () {
        // 2) 向量化
        out.appendChild(el("div", "rag-step", "<b class='rs-t'>② 向量化 Embedding</b> 把每块文字变成一个向量（语义相近 → 向量相近）。"));
        chunks.forEach(function (c, i) {
          var id = "vec" + i; out.appendChild(el("div", "chunk-chip", "vec" + i + " ← 块" + (i + 1)));
        });
        nodeOn(1);
        setTimeout(function () {
          // 3) 存库 + 4) 检索
          out.appendChild(el("div", "rag-step", "<b class='rs-t'>③④ 存库 → 检索</b> 向量存入 VectorDB，再把问题「" + esc(q) + "」向量化，在库里找最像的 Top-K。"));
          var scored = chunks.map(function (c, i) { return { c: c, s: scoreChunk(c, q), i: i }; });
          scored.sort(function (a, b) { return b.s - a.s; });
          var top = scored.filter(function (x) { return x.s > 0; }).slice(0, 3);
          if (!top.length) top = scored.slice(0, 2);
          top.forEach(function (t) { out.appendChild(el("div", "chunk-chip hit", "命中 块" + (t.i + 1) + " (相似度 " + (t.s + 1.0).toFixed(2) + ")「" + esc(t.c.slice(0, 22)) + "…」")); });
          nodeOn(3);
          setTimeout(function () {
            // 5) 重排
            var reranked = top.slice().sort(function (a, b) { return b.s - a.s; });
            out.appendChild(el("div", "rag-step", "<b class='rs-t'>⑤ 重排序 Rerank</b> 用更精细的模型把命中块按相关度重排，把真正相关的提到前。" + (reranked.length > 1 ? " → 优先块" + (reranked[0].i + 1) : "")));
            nodeOn(4);
            setTimeout(function () {
              // 6) 组装
              var ctx = reranked.map(function (t) { return t.c; }).join(" ").slice(0, 200);
              out.appendChild(el("div", "rag-step", "<b class='rs-t'>⑥ 组装上下文</b> 把命中的资料拼进 Prompt：<div class='ctx-box'>「以下是参考资料：<i>" + esc(ctx) + "…</i> 请只依据资料回答并注明出处。」</div>"));
              nodeOn(5);
              setTimeout(function () {
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
      // 从命中块里找"年假"线索
      for (var i = 0; i < ranked.length; i++) {
        var c = ranked[i].c, ci = ranked[i].i;
        if (c.indexOf("年假") !== -1) { txt = c; cites.push(ci + 1); break; }
      }
      if (!txt) { txt = "根据你提供的资料，未能找到与问题直接相关的信息。建议补充文档后再查询。"; }
      else { txt = "「" + txt + "」（依据你提供的资料回答）"; }
      return { text: txt, cites: cites };
    }
    document.getElementById("ragRun").addEventListener("click", run);
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
          { label: "read register.js（读代码）", ok: true, verb: "read_file(register.js)", out: "读到 register.js：提交按钮『只在页面加载时绑过一次事件，且写错了选择器』。" },
          { label: "直接 edit（不先读就改）", ok: false, verb: "edit_file(register.js)", out: "⚠ 报错：你还没读文件，不知道改哪里。请先 read。" },
          { label: "run bundle.js（乱跑命令）", ok: false, verb: "run(bundle.js)", out: "⚠ 报错：命令不存在。请先读代码定位。" }
        ]},
        { clue: "现在你知道原因了：按钮事件绑错了。你决定？", tools: [
          { label: "edit_file 修正选择器并绑定 click", ok: true, verb: "edit_file(register.js)", out: "已将提交按钮绑定到正确的 click → submit()。" },
          { label: "再 read 一次（读两遍）", ok: false, verb: "read_file", out: "你重复读了，没有新信息。请直接改。" },
          { label: "直接删掉文件", ok: false, verb: "rm(register.js)", out: "⚠ 危险操作：删除文件需要你（用户）授权。请求被拦截。" }
        ]},
        { clue: "改完了，接下来验证。你决定？", tools: [
          { label: "run npm test（跑测试）", ok: true, verb: "run(npm test)", out: "✅ 2 个测试全部通过。" },
          { label: "不测试直接交付", ok: false, verb: "report()", out: "⚠ 你还没验证改动是否正确，建议先跑测试。" },
          { label: "read 自己刚写的代码", ok: false, verb: "read_file", out: "没问题，但还没验证功能。先跑测试更稳。" }
        ]},
        { clue: "测试通过。最后一步？", tools: [
          { label: "report() 总结改动并汇报", ok: true, verb: "report()", out: "完成：修复了注册按钮无响应的 bug，测试通过。" },
          { label: "继续无限改下去", ok: false, verb: "edit_file(...)", out: "没有目标了，继续改会造成无意义循环（这正是 Agent 要避免的失控）。" }
        ]}
      ]
    };

    var phase = 0, active = null;

    var goalBar = el("div", "ag-goal", "目标：<b>" + esc(scenario.goal) + "</b><span class='ag-scene'>" + esc(scenario.name) + "</span>");
    c.appendChild(goalBar);

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
      var whose = (phase % 2 === 0) ? "你（Agent）" : "你（Agent）";
      card.innerHTML = "<div class='ag-clue'>🔎 " + esc(st.clue) + "</div>";
      var btns = el("div", "ag-tools");
      st.tools.forEach(function (t, ti) {
        var b = el("button", "ag-tool-btn", t.label);
        b.addEventListener("click", function () { choose(t, b, btns); });
        btns.appendChild(b);
      });
      card.appendChild(btns);
      log.appendChild(card);
    }
    function choose(t, btn, btns) {
      if (active === phase) return;
      active = phase;
      // 禁用所有按钮
      btns.querySelectorAll(".ag-tool-btn").forEach(function (x) { x.disabled = true; });
      paintActive("act");
      var thoughtLine = "💡 想：我选择调用 <code>" + esc(t.verb) + "</code>";
      addLine(thoughtLine, "alt");
      setTimeout(function () {
        paintActive("observe");
        addLine("👀 看：" + esc(t.out), t.ok ? "good" : "bad");
        if (t.ok) {
          setTimeout(function () {
            phase++;
            active = null;
            paintActive("think");
            if (phase < scenario.steps.length) { renderClue(); }
            else {
              addLine("<div class='ag-done'>✅ 任务完成！你自己走完了一个 Agent 循环：<b>想→做→看→再想</b>，直到目标达成。注意错误选项演示了【失败→反馈→修正】和【危险操作需授权】。</div>", "");
              paintActive(null);
            }
          }, 600);
        } else {
          // 错误：回到"想"，可重选
          setTimeout(function () {
            active = -1;
            paintActive("think");
            addLine("↩ 反馈提示你重新决策（Agent 的『看』→『再想』）……", "hint");
            setTimeout(function () {
              btns.querySelectorAll(".ag-tool-btn").forEach(function (x) { x.disabled = false; });
              active = null;
            }, 200);
          }, 700);
        }
      }, 500);
    }
    renderClue();
  }

  /* ===================== 注册 ===================== */
  V.registry = {
    "ai-world-map": worldMap,
    "embedding-space": embeddingSpace,
    "attention-heatmap": attentionHeatmap,
    "transformer-flow": transformerFlow,
    "rag-pipeline": ragPipeline,
    "agent-loop": agentLoop
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
