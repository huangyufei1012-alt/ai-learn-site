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
    head.innerHTML = "<div class='viz-hint'>坐标代表两种语义：「动物 ↔ 食物」。点图上任意位置投放一个新词（例如输入「狮子」），看它被拉向哪一簇——位置越近 = 语义越近。</div>";
    c.appendChild(head);

    var toolbar = el("div", "viz-toolbar");
    toolbar.innerHTML = "<input class='viz-input' id='embWord' placeholder='输入一个词，回车投放' value='狮子'>" +
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
    ax.textContent = "← 更像动物    更像食物 →";
    svg.appendChild(ax);

    // 已知词簇：(x%, y%) 归一化
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
      { t: "门", x: 0.6, y: 0.6, c: "#888" }
    ];
    var placed = [];
    function drawAll(nearTarget) {
      svg.querySelectorAll("circle.emb-dot, text.emb-lbl, line.emb-line").forEach(function (n) { n.remove(); });
      var all = known.concat(placed);
      all.forEach(function (w) {
        var px = w.x * W, py = w.y * H;
        var line = svgEl("line", { x1: px, y1: py - 0.1, x2: px, y2: py + 40, stroke: "#eef1f7", "stroke-width": 9, class: "emb-line" });
        svg.appendChild(line);
      });
      all.forEach(function (w) {
        var px = w.x * W, py = w.y * H;
        var near = nearTarget && w.t !== nearTarget.t;
        var dot = svgEl("circle", { cx: px, cy: py, r: near ? 1.2 : 10, fill: near ? "transparent" : w.c, class: "emb-dot", style: "cursor:default" });
        svg.appendChild(dot);
        var lbl = svgEl("text", { x: px, y: py - 13, "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: isDark() ? "#fff" : "#334", class: "emb-lbl" });
        lbl.textContent = w.t;
        svg.appendChild(lbl);
      });
      // nearest neighbor
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
      placed.push({ t: text, x: 0.43, y: 0.62, c: "#5b6cff" });
      drawAll(placed[placed.length - 1]);
    }
    var go = document.getElementById("embGo") || toolbar.querySelector("#embGo");
    var input = document.getElementById("embWord") || toolbar.querySelector("#embWord");
    function onGo() {
      var v = input.value.trim();
      if (!v) return;
      placed = placed.filter(function (w) { return w.t !== v; });
      placeWord(v);
    }
    go.addEventListener("click", onGo);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") onGo(); });

    // 点击画布投放
    svg.addEventListener("click", function (e) {
      var r = svg.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      var v = (input.value || "").trim() || "新词";
      placed = placed.filter(function (w) { return w.t !== v; });
      placed.push({ t: v, x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.08, Math.min(0.85, y)), c: "#5b6cff" });
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

  /* ===================== 5. RAG 全流程 ===================== */
  function ragPipeline(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>逐步播放 RAG 的一生：文档被切成块 → 每块向量化 → 存入向量库 → 用户提问 → 检索最近 K 块 → 重排 → 组装上下文 → 生成带引用的回答。</div>";
    c.appendChild(head);

    var stages = [
      { k: "doc", t: "原始文档", d: "你的私有资料：PDF / 网页 / 内部手册……模型没学过。" },
      { k: "chunk", t: "切块 Chunk", d: "长文档切成几百~一千字的小块，块大小决定检索质量。" },
      { k: "emb", t: "向量化", d: "Embedding 模型把每块文字变成一个向量——语义相近的块向量相近。" },
      { k: "db", t: "存入向量库", d: "向量 + 原文 + 元信息存进 VectorDB，建好索引，毫秒级可搜。" },
      { k: "q", t: "用户提问", d: "「年假有几天？」——问题也被向量化。" },
      { k: "ret", t: "检索 Top-K", d: "在向量库找和问题最像的多个 chunk（余弦相似度）。" },
      { k: "rerank", t: "重排序", d: "用更精细的模型把候选重排，把真正相关的提到最前。" },
      { k: "gen", t: "生成答案", d: "把「资料片段 + 问题」拼进 Prompt，让模型照资料回答并标注引用。" }
    ];
    var idx = -1, timer = null;

    var wrap = el("div", "viz-canvas");
    c.appendChild(wrap);
    var flow = el("div", "rag-flow");
    wrap.appendChild(flow);
    stages.forEach(function (s, i) {
      var node = el("div", "rag-node");
      node.innerHTML = "<div class='rag-ico'>" + s.k + "</div><div class='rag-name'>" + s.t + "</div>";
      if (i < stages.length - 1) node.appendChild(el("span", "rag-arrow", "→"));
      node.dataset.i = i;
      flow.appendChild(node);
    });
    var detailBox = el("div", "tf-detail");
    detailBox.innerHTML = "<div class='vd-name' id='rgTitle'>准备就绪</div><div class='vd-sub' id='rgDesc'>点击「下一步」，走一遍 RAG 全流程。</div>";
    wrap.appendChild(detailBox);

    var ctrl = el("div", "viz-toolbar");
    ctrl.innerHTML = "<button class='viz-btn' id='rgNext'>下一步 ▶</button>" +
      "<button class='viz-btn ghost' id='rgReset'>重置</button>" +
      "<button class='viz-btn ghost' id='rgAuto'>自动播放</button>" +
      " <span class='viz-note' id='rgProg'>0 / " + stages.length + "</span>";
    c.appendChild(ctrl);

    function paint() {
      var nodes = flow.querySelectorAll(".rag-node");
      nodes.forEach(function (n, i) {
        n.classList.toggle("on", i <= idx);
        n.classList.toggle("cur", i === idx);
      });
      var t = document.getElementById("rgTitle"), d = document.getElementById("rgDesc"), p = document.getElementById("rgProg");
      if (idx < 0) { t.textContent = "准备就绪"; d.textContent = "点击「下一步」，走一遍 RAG 全流程。"; p.textContent = "0 / " + stages.length; }
      else { var s = stages[Math.min(idx, stages.length - 1)]; t.textContent = s.t; d.textContent = s.d; p.textContent = (idx + 1) + " / " + stages.length; }
    }
    function next() { idx = Math.min(idx + 1, stages.length - 1); paint(); }
    function reset() { idx = -1; paint(); }
    document.getElementById("rgNext").addEventListener("click", next);
    document.getElementById("rgReset").addEventListener("click", function () { clearTimeout(timer); reset(); });
    document.getElementById("rgAuto").addEventListener("click", function () {
      clearTimeout(timer); reset();
      var tick = function () { if (idx >= stages.length - 1) { reset(); return; } next(); timer = setTimeout(tick, 900); };
      tick();
    });
    paint();
  }

  /* ===================== 6. Agent 循环 ===================== */
  function agentLoop(c) {
    c.innerHTML = "";
    var head = el("div", "viz-head");
    head.innerHTML = "<div class='viz-hint'>选一个任务，点「运行一轮」看 Agent 想什么、调哪个工具、看到什么结果，循环往复直到完成或需要你授权。</div>";
    c.appendChild(head);

    var scenarios = {
      bug: {
        name: "修注册页 Bug",
        initial: "用户点击「注册」后没有任何反应。",
        rounds: [
          { think: "先定位问题：注册逻辑在哪个文件？", tool: "read(register.js)", result: "读到 register.js：提交按钮没有绑定点击事件。" },
          { think: "找到了：按钮缺一个 click 监听。现在修复它。", tool: "edit(register.js)", result: "已为提交按钮加上 click → submit() 调用。" },
          { think: "改完了，跑测试验证一下。", tool: "run(npm test)", result: "✅ 全部通过。" },
          { think: "测试通过，交付：总结改动并汇报。", tool: "report()", result: "完成：修复了注册按钮无响应的问题。" }
        ]
      },
      email: {
        name: "给团队发周报邮件",
        initial: "收集本周进展，发给负责人。",
        rounds: [
          { think: "先查一下本周有哪些已完成事项。", tool: "search(本周完成)", result: "找到 3 条：登录页重构、支付联调、文档更新。" },
          { think: "整理成简报草稿。", tool: "write(draft.md)", result: "草稿已生成，包含 3 个条目。" },
          { think: "把草稿发给负责人。", tool: "send(负责人)", result: "⚠ 需要授权：向「负责人」发送邮件。" },
          { think: "等待你确认后发送，先汇报草稿内容。", tool: "stop()", result: "已暂停，等你批准发送。" }
        ]
      }
    };
    var cur = "bug", round = 0, sel = -1, timer = null;

    var toolbar = el("div", "viz-toolbar");
    toolbar.innerHTML = "<label class='viz-note'>任务：</label><select class='viz-select' id='agTask'>" +
      "<option value='bug'>修注册页 Bug</option><option value='email'>发周报邮件</option></select>";
    toolbar.appendChild(el("span", "viz-note", " &nbsp; 「想→做→看→再想」每点一次运行一轮。"));
    c.appendChild(toolbar);

    var wrap = el("div", "viz-canvas");
    c.appendChild(wrap);

    // 循环图（固定四步）
    var loop = el("div", "ag-loop");
    loop.innerHTML =
      "<div class='ag-node' data-step='think'><b>想</b><span>推理下一步</span></div>" +
      "<div class='ag-node' data-step='act'><b>做</b><span>调用工具</span></div>" +
      "<div class='ag-node' data-step='observe'><b>看</b><span>观察结果</span></div>";
    wrap.appendChild(loop);

    var log = el("div", "ag-log");
    log.innerHTML = "<div class='ag-goal'>目标：<b>" + scenarios[cur].initial + "</b></div>";
    wrap.appendChild(log);

    var ctrl = el("div", "viz-toolbar");
    ctrl.innerHTML = "<button class='viz-btn' id='agRun'>运行一轮 ▶</button>" +
      "<button class='viz-btn ghost' id='agReset'>重置</button>" +
      " <span class='viz-note' id='agProg'>已运行 0 轮 / 共 " + scenarios[cur].rounds.length + " 轮</span>";
    c.appendChild(ctrl);

    function paintActive(stepSel) {
      var nodes = loop.querySelectorAll(".ag-node");
      nodes.forEach(function (n, i) {
        n.classList.remove("cur");
        if (n.dataset.step === stepSel) n.classList.add("cur");
      });
    }
    function renderState() {
      var s = scenarios[cur];
      document.querySelector("#agProg").textContent = "已运行 " + round + " 轮 / 共 " + s.rounds.length + " 轮";
      log.innerHTML = "<div class='ag-goal'>目标：<b>" + s.initial + "</b></div>";
      for (var i = 0; i < Math.min(round, s.rounds.length); i++) {
        var r = s.rounds[i];
        var item = el("div", "ag-round" + (i % 2 === 0 ? " alt" : ""));
        item.innerHTML =
          "<div class='ag-think'>💡 想：<span>" + esc(r.think) + "</span></div>" +
          "<div class='ag-do'>🔧 做：<code>" + esc(r.tool) + "</code></div>" +
          "<div class='ag-ob'>👀 看：" + esc(r.result) + "</div>";
        log.appendChild(item);
      }
      if (round >= s.rounds.length) {
        log.appendChild(el("div", "ag-done", "✅ 任务完成！"));
      }
    }
    function runOne() {
      var s = scenarios[cur];
      if (round >= s.rounds.length) return;
      var stepSeq = [["think", 650], ["act", 450], ["observe", 500]];
      var i = 0;
      function tick() {
        if (i < stepSeq.length) {
          paintActive(stepSeq[i][0]);
          i++;
          setTimeout(tick, stepSeq[i - 1][1]);
        } else {
          round++;
          paintActive(null);
          renderState();
          if (round < s.rounds.length) runOneSoon();
        }
      }
      tick();
    }
    function runOneSoon() { /* 连播不自动；每轮手动点 */ }
    document.getElementById("agRun").addEventListener("click", function () {
      if (round < scenarios[cur].rounds.length) runOne();
    });
    document.getElementById("agReset").addEventListener("click", function () {
      clearTimeout(timer); round = 0; sel = -1; paintActive(null); renderState();
    });
    document.getElementById("agTask").addEventListener("change", function (e) {
      cur = e.target.value; round = 0; paintActive(null); renderState("");
      document.querySelector("#agProg").textContent = "已运行 0 轮 / 共 " + scenarios[cur].rounds.length + " 轮";
    });
    renderState();
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
