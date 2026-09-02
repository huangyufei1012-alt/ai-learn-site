/* ============================================================
   AI 学堂 · 交互式可视化（第 5-7 课）
   依赖 visuals.js 中定义的 vizClear / vizSvg / vizHint 等辅助函数
   ============================================================ */
window.AIVIZ = window.AIVIZ || {};
const AVC = {
  primary: "#5b6cff", accent: "#00b8a9", warn: "#f2a33c",
  danger: "#ff5d73", good: "#23b26d", purple: "#7a5bff", blue: "#3d8bff"
};

/* ============================================================
   第5课 · Token 分词演示
   ============================================================ */
AIVIZ.tokenDemo = function (el) {
  vizClear(el);
  const presets = [
    { label: "英文短句", text: "I love learning AI" },
    { label: "中文短句", text: "我爱学习人工智能" },
    { label: "完整段落", text: "大胆地向前走，不要回头！" }
  ];
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px";

  // 预设按钮
  const pres = document.createElement("div");
  pres.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  presets.forEach(p => {
    const b = document.createElement("button");
    b.textContent = p.label;
    b.style.cssText = "padding:6px 14px;border-radius:20px;border:1.5px solid var(--line);background:var(--bg-card);font-size:13px;font-weight:600;color:var(--text-2);transition:.15s;cursor:pointer";
    b.onmouseenter = () => { b.style.borderColor = "var(--primary)"; b.style.color = "var(--primary)"; };
    b.onmouseleave = () => { b.style.borderColor = ""; b.style.color = ""; };
    b.onclick = () => render(p.text);
    pres.appendChild(b);
  });
  wrap.appendChild(pres);

  // 输入
  const inBox = document.createElement("div");
  inBox.style.cssText = "display:flex;gap:10px;align-items:center;flex-wrap:wrap";
  const input = document.createElement("input");
  input.placeholder = "输入文字，实时分词…";
  input.value = presets[0].text;
  input.style.cssText = "flex:1;min-width:200px;padding:11px 14px;border-radius:11px;border:1.5px solid var(--line);background:var(--bg-card);font-size:14.5px;color:var(--text);font-family:inherit";
  input.addEventListener("input", () => render(input.value));
  inBox.appendChild(input);
  wrap.appendChild(inBox);

  // 输出区域
  const outBlock = document.createElement("div");
  outBlock.style.cssText = "border:1.5px dashed var(--line);border-radius:12px;padding:14px 16px;min-height:70px;background:var(--bg-card);display:flex;align-items:center;justify-content:center;flex-wrap:wrap";
  wrap.appendChild(outBlock);
  const countLine = document.createElement("div");
  countLine.style.cssText = "font-size:12.5px;color:var(--text-2);font-weight:600;text-align:right";
  wrap.appendChild(countLine);

  // Token 配色
  const palette = [AVC.primary, AVC.accent, AVC.warn, AVC.purple, AVC.blue, "#e0565d"];
  function render(text) {
    outBlock.innerHTML = "";
    const tokens = tokenize(text);
    tokens.forEach((t, i) => {
      const c = palette[i % palette.length];
      const span = document.createElement("span");
      span.textContent = t || " ";
      span.style.cssText = `display:inline-block;margin:3px;padding:4px 7px;border-radius:7px;font-size:15px;background:${c}22;border-bottom:2.5px solid ${c};color:var(--text);font-weight:600`;
      span.title = "token";
      outBlock.appendChild(span);
    });
    if (tokens.length === 1 && !tokens[0]) { outBlock.textContent = "（空）"; }
    countLine.textContent = "共切出 " + tokens.length + " 个 token" + (text.includes(" ") ? "" : "");
  }

  function tokenize(text) {
    // 简化模拟：中文逐字/词，英文按空白与标点切
    if (!text) return [];
    const isCJK = /[\u4e00-\u9fa5]/.test(text);
    if (isCJK) {
      // 把常见词优先合并，其余按字
      return text.split(/([，。！？、；：""''（）\s])/).filter(Boolean);
    }
    return text.split(/([,.!?;:()\s])/).filter(Boolean);
  }

  render(presets[0].text);
  vizHint(el, "花色的每一块就是一个 Token。中文常按“字/词/标点”切，英文按“单词/标点”切。真实模型用更精细的 BPE 分词（见下）。");
};

/* ============================================================
   第5课 · BPE 分词原理
   ============================================================ */
AIVIZ.bpeDemo = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:10px";

  // 逐步说明
  const steps = [
    { head: "① 初始：按字母拆", code: "l \u2001 o \u2001 w \u2001 | \u2001 h \u2001 i \u2001 | \u2001 l \u2001 o \u2001 w" },
    { head: "② 统计高频对，合并 | w 与 lo 出现很多次 → 合并成“ | w”“ lo”", code: "lo \u2001 |w \u2001 | \u2001 hi" },
    { head: "③ 继续合并“|w”成为独立词根，最终得到常用 token", code: "|w \u2001 lo \u2001 hi" }
  ];
  steps.forEach((s, i) => {
    const block = document.createElement("div");
    block.style.cssText = "border:1px solid var(--line);border-radius:11px;padding:12px 14px;background:var(--bg-card);animation:vFade .4s ease both;animation-delay:" + (i * .2) + "s";
    block.innerHTML = `<div style="font-size:12px;font-weight:800;color:var(--primary);margin-bottom:7px">${s.head}</div>
      <div style="font-family:var(--mono);font-size:15px;color:var(--text);background:var(--bg-soft);border-radius:8px;padding:8px 10px;letter-spacing:1px">${s.code}</div>`;
    wrap.appendChild(block);
  });
  el.appendChild(wrap);
  vizHint(el, "BPE 统计高频的“字符/片段组合”并逐步合并，形成词典。高频词成为单个 token，生僻词才拆成片段。");
};

/* ============================================================
   第6课 · 注意力演示（点击词看关注度）
   ============================================================ */
AIVIZ.attentionDemo = function (el) {
  vizClear(el);
  let focus = 5; // 默认关注 "递给" 索引
  const words = ["小明", "把", "苹果", "递给", "了", "小红"];
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:14px";

  // 关注词选择
  const pick = document.createElement("div");
  pick.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap";
  pick.innerHTML = `<span style="font-size:12.5px;color:var(--text-2);font-weight:700">当前理解对“？”：</span>`;
  words.forEach((w, i) => {
    const b = document.createElement("button");
    b.textContent = w;
    b.style.cssText = "padding:5px 12px;border-radius:16px;border:1.5px solid var(--line);background:var(--bg-card);font-size:13px;font-weight:600;transition:.15s;cursor:pointer;color:var(--text)";
    b.onclick = () => { focus = i; render(); };
    b.setAttribute("data-i", i);
    pick.appendChild(b);
  });
  // 高亮当前
  function refreshPick() {
    pick.querySelectorAll("button").forEach(b => {
      const active = parseInt(b.getAttribute("data-i")) === focus;
      b.style.background = active ? "var(--primary)" : "";
      b.style.color = active ? "#fff" : "";
      b.style.borderColor = active ? "var(--primary)" : "";
    });
  }
  wrap.appendChild(pick);

  // 词条行（点击也可切换）
  const row = document.createElement("div");
  row.style.cssText = "display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap";
  const weightBar = document.createElement("div");
  weightBar.style.cssText = "height:9px;border-radius:5px;background:var(--bg-soft);margin-top:2px;display:flex;overflow:hidden";
  wrap.appendChild(row);

  function render() {
    row.innerHTML = "";
    // 简单的相关度权重（示意）
    const rel = words.map((w, i) => {
      if (i === focus) return 0; // 自身看自身很低，忽略
      if (focus === 5 && (w === "小明" || w === "苹果" || w === "递给")) return 1;
      if (focus === 3 && (w === "小明" || w === "苹果" || w === "小红")) return 1;
      if (focus === 0 && (w === "递给" || w === "苹果")) return 1;
      if (focus === 2 && w === "递给") return 1;
      if (focus === 1) return 0.2;
      return 0.5;
    });
    const max = Math.max.apply(null, rel.concat([1]));
    words.forEach((w, i) => {
      const sc = rel[i] / max;
      const alpha = 0.12 + sc * 0.85;
      const span = document.createElement("span");
      span.textContent = w;
      span.style.cssText = `display:inline-block;padding:7px 10px;margin:2px;border-radius:10px;font-size:16px;font-weight:700;background:rgba(91,108,255,${alpha.toFixed(2)});color:var(--text);cursor:pointer;transition:.2s;border:2px solid ${i === focus ? "var(--primary)" : "transparent"}`;
      span.onclick = () => { focus = i; refreshPick(); render(); };
      row.appendChild(span);
    });
    refreshPick();
  }
  render();
  wrap.appendChild(row);
  el.appendChild(wrap);
  vizHint(el, "点击不同词，看模型对句中各词的“关注度”（颜色越深=权重越高）。理解“递给”时最关注谁给了谁。");
};

/* ============================================================
   第6课 · 长句子对比（压缩 vs 注意力）
   ============================================================ */
AIVIZ.attentionLong = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:12px";
  const old = card("老方法：整句压缩", "把整句话压成一个向量，再读这个向量。", AVC.danger, "❌ 句子一长，中间信息就丢，细节回忆不准。");
  const neu = card("注意力：随时回看", "每步都能回到原文任意位置，按需取词。", AVC.good, "✅ 长句也照顾周全，需要哪个词就“看”哪个词。");
  wrap.appendChild(old); wrap.appendChild(neu);
  el.appendChild(wrap);
  function card(t, d, c, note) {
    const box = document.createElement("div");
    box.style.cssText = "border:1.5px solid var(--line);border-radius:13px;padding:16px;background:var(--bg-card)";
    box.innerHTML = `<div style="font-weight:800;font-size:14.5px;color:${c};margin-bottom:6px">${t}</div>
      <div style="font-size:13px;color:var(--text-2);line-height:1.7;margin-bottom:10px">${d}</div>
      <div style="font-size:12.5px;color:var(--text-2);background:var(--bg-soft);border-radius:9px;padding:9px 11px;line-height:1.6">${note}</div>`;
    return box;
  }
};

/* ============================================================
   第7课 · QKV 自注意力流程
   ============================================================ */
AIVIZ.qkvFlow = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:14px";

  // 流程图：词 → Q/K/V → 打分 → 加权 → 输出
  const words = ["I", "love", "AI"];
  const W = 700, H = 300;
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, wrap);

  // 输入词
  const inX = 30, inW = 90;
  words.forEach((w, i) => {
    const y = 40 + i * 80;
    vizSvg("rect", { x: inX, y, width: inW, height: 46, rx: 10, fill: "var(--bg-card)", stroke: "var(--line-strong)", "stroke-width": 1.5 }, svg);
    vizSvg("text", { x: inX + inW / 2, y: y + 29, "text-anchor": "middle", "font-size": "15", "font-weight": "800", fill: "var(--text)" }, svg).textContent = '"' + w + '"';
  });

  // Q / K / V 列
  const colQX = 170, colKX = 290, colVX = 410;
  labels(svg, colQX, "Q", AVC.blue);
  labels(svg, colKX, "K", AVC.warn);
  labels(svg, colVX, "V", AVC.good);

  function labels(svg, x, t, c) {
    vizSvg("text", { x: x + 30, y: 18, "font-size": "17", "font-weight": "900", fill: c }, svg).textContent = t;
    words.forEach((w, i) => {
      const y = 40 + i * 80;
      vizSvg("rect", { x, y, width: 60, height: 40, rx: 9, fill: c + "1c", stroke: c, "stroke-width": 1.5 }, svg);
      vizSvg("circle", { cx: x + 30, cy: y + 20, r: 8, fill: c, opacity: 0.25 }, svg);
      vizSvg("circle", { cx: x + 30, cy: y + 20, r: 3.5, fill: c }, svg);
    });
  }

  // 打出注意力矩阵（简化示例：出每个词的权重）
  const scoreX = 540, outX = 640;
  vizSvg("text", { x: scoreX + 50, y: 18, "font-size": "14", "font-weight": "800", fill: "var(--text)" }, svg).textContent = "注意力权重";
  vizSvg("text", { x: outX + 30, y: 18, "font-size": "14", "font-weight": "800", fill: "var(--text)" }, svg).textContent = "加权后输出";
  const mat = [
    [0.9, 0.05, 0.05],
    [0.3, 0.6, 0.1],
    [0.15, 0.15, 0.7]
  ];
  words.forEach((w, i) => {
    const y = 40 + i * 80;
    // 从 V 列到打分框
    vizSvg("rect", { x: scoreX, y: y, width: 100, height: 40, rx: 9, fill: "var(--bg-card)", stroke: "var(--line-strong)", "stroke-width": 1.5 }, svg);
    const txt = vizSvg("text", { x: scoreX + 50, y: y + 25, "text-anchor": "middle", "font-size": "11.5", "font-family": "var(--mono)", fill: "var(--text)" }, svg);
    txt.textContent = "[" + mat[i].map(v => v.toFixed(2)).join(" ") + "]";
    // 输出
    vizSvg("rect", { x: outX, y: y, width: 56, height: 40, rx: 10, fill: AVC.primary + "1c", stroke: AVC.primary, "stroke-width": 1.7 }, svg);
    vizSvg("circle", { cx: outX + 28, cy: y + 20, r: 8, fill: AVC.primary, opacity: 0.3 }, svg);
    vizSvg("circle", { cx: outX + 28, cy: y + 20, r: 3, fill: AVC.primary }, svg);
  });
  el.appendChild(wrap);
  vizHint(el, "每个词都生成 Q（查询）、K（键）、V（值）。用“当前词的 Q”去和所有词的 K 比相关度打分，再按权重“加权提取 V”，得到融合重点的输出。");
};

/* ============================================================
   第7课 · 多头注意力
   ============================================================ */
AIVIZ.multiHead = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px";
  const heads = [
    { t: "头 1：语法指代", d: "关注“它”指向谁", c: AVC.primary },
    { t: "头 2：语义相似", d: "关注相近含义的词", c: AVC.accent },
    { t: "头 3：位置远近", d: "关注距离关系", c: AVC.warn }
  ];
  const row = document.createElement("div");
  row.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px";
  heads.forEach((h, i) => {
    const box = document.createElement("div");
    box.style.cssText = `border:1.5px solid ${h.c};border-radius:12px;padding:13px;background:var(--bg-card);animation:vFade .4s ease both;animation-delay:${i * .15}s`;
    box.innerHTML = `<div style="font-weight:800;font-size:13px;color:${h.c};margin-bottom:5px">${h.t}</div>
      <div style="font-size:12px;color:var(--text-2);line-height:1.6">${h.d}</div>`;
    row.appendChild(box);
  });
  wrap.appendChild(row);
  // 合并箭头
  const merge = document.createElement("div");
  merge.style.cssText = "text-align:center;padding:8px;font-size:13px;color:var(--text-2);font-weight:600;background:var(--bg-soft);border-radius:10px";
  merge.textContent = "⊕ 多个头的关注结果拼接合并 → 得到更丰富的表示";
  wrap.appendChild(merge);
  el.appendChild(wrap);
};

/* ============================================================
   第7课 · 位置编码
   ============================================================ */
AIVIZ.position = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:10px";
  const row = document.createElement("div");
  row.style.cssText = "display:flex;justify-content:center;gap:8px;flex-wrap:wrap";
  const seq = ["猫", "咬", "狗"];
  seq.forEach((w, i) => {
    const b = document.createElement("div");
    b.style.cssText = "border:1.5px solid var(--line);border-radius:10px;padding:8px 14px;background:var(--bg-card);text-align:center";
    b.innerHTML = `<div style="font-size:16px;font-weight:800;color:var(--text)">${w}</div>
      <div style="font-size:10.5px;color:var(--primary);font-family:var(--mono);margin-top:3px">pos#${i}</div>`;
    row.appendChild(b);
  });
  wrap.appendChild(row);
  const note = document.createElement("div");
  note.style.cssText = "padding:11px 13px;border-radius:10px;background:var(--primary-soft);font-size:13px;color:var(--text-2);line-height:1.7;border:1px solid var(--primary-soft)";
  note.innerHTML = "<b style='color:var(--text)'>为什么需要？</b> 注意力本身不在乎顺序——“猫咬狗”和“狗咬猫”在它眼里是同一堆词。位置编码给每个位置加上标记，让模型知道<b>谁先谁后</b>。";
  wrap.appendChild(note);
  el.appendChild(wrap);
  vizHint(el, "把“位置编号(pos#0,1,2)”编码进向量后，模型既能看词义、又能知道顺序。");
};

/* ============================================================
   第7课 · Transformer 单层模块
   ============================================================ */
AIVIZ.transformerBlock = function (el) {
  vizClear(el);
  const W = 700, H = 340;
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, el);
  const box = (x, y, w, h, t, sub, c) => {
    vizSvg("rect", { x, y, width: w, height: h, rx: 12, fill: "var(--bg-card)", stroke: c, "stroke-width": 2 }, svg);
    vizSvg("text", { x: x + w / 2, y: y + h / 2 - 2, "text-anchor": "middle", "font-size": "14", "font-weight": "800", fill: "var(--text)" }, svg).textContent = t;
    if (sub) vizSvg("text", { x: x + w / 2, y: y + h / 2 + 16, "text-anchor": "middle", "font-size": "10.5", fill: "var(--text-3)" }, svg).textContent = sub;
  };
  const cx = 350;
  box(cx - 120, 30, 240, 54, "多头自注意力", "每个词看全句", AVC.primary);
  box(cx - 120, 112, 240, 54, "残差 + 归一化", "稳定数值", AVC.warn);
  box(cx - 120, 194, 240, 54, "前馈网络", "逐词复杂变换", AVC.good);
  box(cx - 120, 276, 240, 44, "归一化", "", AVC.warn);
  // 箭头
  const arr = (y1, y2, label) => {
    vizSvg("line", { x1: cx, y1: y1, x2: cx, y2: y2, stroke: "var(--line-strong)", "stroke-width": 2, "marker-end": "url(#arw)" }, svg);
  };
  const defs = vizSvg("defs", {}, svg);
  const mk = vizSvg("marker", { id: "arw", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
  vizSvg("path", { d: "M0 0L10 5L0 10z", fill: "var(--line-strong)" }, mk);
  // 重画箭头（在 marker 定义之后才有效，这里追加新的带箭头线）
  // 由于 marker 已定义，重新画箭头
  vizSvg("line", { x1: cx, y1: 84, x2: cx, y2: 110, stroke: "var(--line-strong)", "stroke-width": 2, "marker-end": "url(#arw)" }, svg);
  vizSvg("line", { x1: cx, y1: 166, x2: cx, y2: 192, stroke: "var(--line-strong)", "stroke-width": 2, "marker-end": "url(#arw)" }, svg);
  vizSvg("line", { x1: cx, y1: 248, x2: cx, y2: 274, stroke: "var(--line-strong)", "stroke-width": 2, "marker-end": "url(#arw)" }, svg);
  vizSvg("text", { x: cx + 8, y: 100, "font-size": "10.5", fill: "var(--text-3)", "transform": "rotate(90 0 0)" }, svg);
  // 输入/输出流
  vizSvg("text", { x: cx, y: 16, "text-anchor": "middle", "font-size": "12", "fill": "var(--text-3)", "font-weight": "700" }, svg).textContent = "输入向量(每个词)";
  vizSvg("text", { x: cx, y: 338, "text-anchor": "middle", "font-size": "12", "fill": "var(--text-2)", "font-weight": "700" }, svg).textContent = "输出 → 进入下一层";
  el.appendChild(svg);
  vizHint(el, "这就是“一层 Transformer”。大模型把这种层堆叠几十上百层，逐层提取更高级的语义（结合第 3 课的“分层”思路）。");
};
