/* ============================================================
   AI 学堂 · 交互式可视化（第 1-7 课）
   每个 AIVIZ.xxx(el) 接收容器 DOM，绘制并绑定交互。
   所有函数重复调用前会清空容器，可安全重绘。
   ============================================================ */
window.AIVIZ = window.AIVIZ || {};

const COLORS = {
  primary: "#5b6cff", primaryD: "#4453e8",
  accent: "#00b8a9", warn: "#f2a33c", danger: "#ff5d73", good: "#23b26d",
  purple: "#7a5bff", blue: "#3d8bff"
};

function vizClear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
function vizSvg(tag, attrs, parent) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}
function vizHint(el, text) {
  const d = document.createElement("div");
  d.style.cssText = "margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);font-size:12.8px;color:var(--text-3);font-weight:600;line-height:1.7";
  d.textContent = text;
  el.appendChild(d);
}
function vizLegend(el, items) {
  const div = document.createElement("div");
  div.style.cssText = "display:flex;gap:18px;flex-wrap:wrap;margin-top:12px";
  items.forEach(it => {
    const l = document.createElement("span");
    l.style.cssText = "display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);font-weight:600";
    const sw = document.createElement("span");
    sw.style.cssText = `width:13px;height:13px;border-radius:4px;background:${it.color}`;
    l.appendChild(sw);
    l.appendChild(document.createTextNode(it.label));
    div.appendChild(l);
  });
  el.appendChild(div);
}
function vizCard(head, hintText) {
  // 返回一个完整的可视化卡片 DOM（head + body），由调用方填充 body
  const card = document.createElement("div");
  card.style.cssText = "border:1px solid var(--line);border-radius:16px;background:var(--bg-card);overflow:hidden";
  const hd = document.createElement("div");
  hd.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--line);flex-wrap:wrap";
  const title = document.createElement("div");
  title.style.cssText = "display:flex;align-items:center;gap:9px;font-weight:700;font-size:14px;color:var(--text)";
  const dot = document.createElement("span");
  dot.style.cssText = "width:9px;height:9px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px rgba(0,184,169,.14)";
  title.appendChild(dot);
  title.appendChild(document.createTextNode(head));
  hd.appendChild(title);
  if (hintText) {
    const ht = document.createElement("span");
    ht.textContent = hintText;
    ht.style.cssText = "font-size:12px;color:var(--text-3);font-weight:600";
    hd.appendChild(ht);
  }
  const body = document.createElement("div");
  body.style.cssText = "padding:18px";
  card.appendChild(hd);
  card.appendChild(body);
  body.__cardEl = card;
  return body;
}
// 生成可被点击的高亮词条（用于注意力演示）
function wordEl(text, weight, onClick) {
  const span = document.createElement("span");
  span.textContent = text;
  span.style.cssText = `display:inline-block;padding:3px 6px;margin:2px;border-radius:7px;cursor:pointer;transition:.2s;font-size:15px;font-weight:600;background:${weight > 0.5 ? "rgba(91,108,255,.3)" : "var(--bg-soft)"};color:var(--text)`;
  span.setAttribute("data-weight", weight);
  span.addEventListener("click", () => onClick && onClick(span));
  return span;
}

/* ============================================================
   第1课 · AI / ML / DL 嵌套关系
   ============================================================ */
AIVIZ.aiVenn = function (el) {
  vizClear(el);
  const W = 680, H = 330;
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, el);
  const cx = W / 2 - 18, cy = H / 2 + 8;
  vizSvg("circle", { cx, cy, r: 150, fill: "rgba(242,163,60,.12)", stroke: "#f2a33c", "stroke-width": 2, style: "animation:vFade .6s ease both" }, svg);
  vizSvg("circle", { cx, cy, r: 112, fill: "rgba(122,91,255,.13)", stroke: "#7a5bff", "stroke-width": 2, style: "animation:vFade .6s .2s ease both" }, svg);
  vizSvg("circle", { cx, cy, r: 55, fill: "rgba(91,108,255,.15)", stroke: "#5b6cff", "stroke-width": 2, style: "animation:vFade .6s .4s ease both" }, svg);
  const layers = [
    { t: "人工智能 AI", s: "一切让机器“显聪明”的技术", r: 150, dy: -70, fs: 17, sf: 11.5 },
    { t: "机器学习 ML", s: "让机器从数据里学规律", r: 112, dy: -22, fs: 15.5, sf: 11 },
    { t: "深度学习 DL", s: "用多层神经网络学习", r: 55, dy: 28, fs: 14, sf: 10 }
  ];
  layers.forEach((L, i) => {
    const g = vizSvg("g", { style: "animation:vFade .5s ease both;animation-delay:" + (i * .25 + .3) + "s" }, svg);
    const t = vizSvg("text", { x: cx, y: cy + L.dy, "text-anchor": "middle", "font-size": L.fs, "font-weight": "800", fill: "var(--text)" }, g);
    t.textContent = L.t;
    const s = vizSvg("text", { x: cx, y: cy + L.dy + 20, "text-anchor": "middle", "font-size": L.sf, fill: "var(--text-3)" }, g);
    s.textContent = L.s;
  });
  vizHint(el, "内圈属于外圈：深度学习 ⊂ 机器学习 ⊂ 人工智能。ChatGPT 属于最内圈的深度学习。");
};

/* ============================================================
   第1课 · AI 发展时间线
   ============================================================ */
AIVIZ.aiTimeline = function (el) {
  vizClear(el);
  const W = 680, H = 200;
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, el);
  vizSvg("line", { x1: 46, y1: 100, x2: 646, y2: 100, stroke: "var(--line-strong)", "stroke-width": 3, "stroke-linecap": "round" }, svg);
  const events = [
    { x: 80, top: 14, t: "1950s", d: "图灵测试 · 感知机", c: COLORS.purple, big: false },
    { x: 245, top: 118, t: "2012", d: "深度学习图像爆发", c: COLORS.blue, big: false },
    { x: 420, top: 14, t: "2017", d: "Transformer 论文", c: COLORS.primary, big: false },
    { x: 575, top: 118, t: "2022", d: "ChatGPT 发布", c: COLORS.accent, big: true }
  ];
  events.forEach((e, i) => {
    const g = vizSvg("g", { style: "animation:vFade .5s ease both;animation-delay:" + (i * .18 + .1) + "s" }, svg);
    vizSvg("circle", { cx: e.x, cy: 100, r: 10, fill: e.c, stroke: "var(--bg-card)", "stroke-width": 3 }, g);
    vizSvg("circle", { cx: e.x, cy: 100, r: 26, fill: e.c, opacity: 0.14 }, g);
    const t = vizSvg("text", { x: e.x, y: e.top, "text-anchor": "middle", "font-size": "15.5", "font-weight": "800", fill: "var(--text)" }, g);
    t.textContent = e.t;
    const d = vizSvg("text", { x: e.x, y: e.top + 21, "text-anchor": "middle", "font-size": "11.5", fill: "var(--text-2)" }, g);
    d.textContent = e.d;
  });
};

/* ============================================================
   第2课 · 机器学习流程
   ============================================================ */
AIVIZ.mlFlow = function (el) {
  vizClear(el);
  const W = 680, H = 210;
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, el);
  const steps = [
    { x: 30, t: "收集数据", d: "大量“照片+标签”", c: "#5b6cff" },
    { x: 205, t: "训练模型", d: "从数据里学规律", c: "#5b6cff" },
    { x: 380, t: "得到模型", d: "沉淀好的参数", c: COLORS.accent },
    { x: 555, t: "预测新数据", d: "对新输入给结果", c: COLORS.accent }
  ];
  const w = 118, h = 110, y = 48;
  steps.forEach((s, i) => {
    const g = vizSvg("g", { style: "animation:vFade .4s ease both;animation-delay:" + (i * .13) + "s" }, svg);
    vizSvg("rect", { x: s.x, y, width: w, height: h, rx: 15, fill: "var(--bg-card)", stroke: s.c, "stroke-width": 2 }, g);
    vizSvg("path", { d: `M${s.x + 6} ${y + 14} L${s.x + 26} ${y + 14}`, stroke: s.c, "stroke-width": 3, "stroke-linecap": "round", fill: "none" }, g);
    const t = vizSvg("text", { x: s.x + w / 2, y: y + 50, "text-anchor": "middle", "font-size": "15.5", "font-weight": "800", fill: "var(--text)" }, g);
    t.textContent = s.t;
    const d = vizSvg("text", { x: s.x + w / 2, y: y + 76, "text-anchor": "middle", "font-size": "11", fill: "var(--text-2)" }, g);
    d.textContent = s.d;
    if (i < 3) {
      vizSvg("path", { d: `M${s.x + w + 6} ${y + h / 2} h14`, stroke: "var(--line-strong)", "stroke-width": 2, "stroke-dasharray": "6 4", fill: "none" }, g);
      vizSvg("path", { d: `M${s.x + w + 18} ${y + h / 2 - 6} l6 6 -6 6`, stroke: "var(--line-strong)", "stroke-width": 2, fill: "none" }, g);
    }
  });
};

/* ============================================================
   第2课 · 三大学习方式
   ============================================================ */
AIVIZ.mlTypes = function (el) {
  vizClear(el);
  const data = [
    { ico: "🎯", t: "有监督学习", sub: "带答案的例题", d: "照片标好“猫/狗”，从这里学会分类", c: COLORS.primary, ex: "分类 · 预测房价" },
    { ico: "🧩", t: "无监督学习", sub: "没有答案的散料", d: "一堆无标签新闻，自动聚成主题簇", c: COLORS.accent, ex: "聚类 · 推荐系统" },
    { ico: "🍖", t: "强化学习", sub: "试错 + 奖惩", d: "下棋赢就加分，逐步学会策略", c: COLORS.warn, ex: "AlphaGo · 机器人" }
  ];
  const box = document.createElement("div");
  box.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px";
  data.forEach((it, i) => {
    const card = document.createElement("div");
    card.style.cssText = `border:1.5px solid var(--line);border-radius:14px;padding:16px;background:var(--bg-card);animation:vFade .4s ease both;animation-delay:${i * .12}s;cursor:pointer;transition:.2s`;
    card.onmouseenter = () => { card.style.borderColor = it.c; card.style.transform = "translateY(-3px)"; card.style.boxShadow = "var(--shadow-md)"; };
    card.onmouseleave = () => { card.style.borderColor = ""; card.style.transform = ""; card.style.boxShadow = ""; };
    card.innerHTML = `<div style="font-size:26px;margin-bottom:8px">${it.ico}
      </div><div style="font-weight:800;font-size:15px;color:var(--text)">${it.t}</div>
      <div style="font-size:11.5px;color:var(--text-3);font-weight:600;margin:2px 0 8px">${it.sub}</div>
      <div style="font-size:13px;color:var(--text-2);line-height:1.6">${it.d}</div>
      <div style="display:inline-block;margin-top:10px;font-size:11px;font-weight:700;color:${it.c};background:${it.c}22;padding:3px 9px;border-radius:20px">${it.ex}</div>`;
    box.appendChild(card);
  });
  el.appendChild(box);
  vizHint(el, "三大方式的核心区别：数据有没有“答案”、以及怎么反馈对错。");
};

/* ============================================================
   第3课 · 神经元计算（可拖动滑杆）
   ============================================================ */
AIVIZ.neuron = function (el) {
  vizClear(el);
  const data = [
    { label: "像素亮度", val: 0.8, w: 0.9 },
    { label: "边缘强度", val: 0.5, w: -0.4 },
    { label: "颜色偏红", val: 0.2, w: 0.6 }
  ];
  let bias = 0.1;
  function activate(v) { return Math.max(0, v); } // ReLU

  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid;grid-template-columns:1fr;gap:14px";
  const controls = document.createElement("div");
  // 输入滑杆
  const vals = data.map(d => d.val);
  const wts = data.map(d => d.w);

  // 画布（连接关系）
  const canvas = document.createElement("div");
  canvas.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap";
  const inCols = document.createElement("div");
  inCols.style.cssText = "display:flex;flex-direction:column;gap:10px;flex:1;min-width:200px";
  const infoRows = [];
  data.forEach((d, i) => {
    const row = document.createElement("div");
    row.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--bg-card)";
    row.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--text)">${d.label}</div>`;
    const bar = document.createElement("div");
    bar.style.cssText = "height:6px;border-radius:4px;background:var(--bg-soft);overflow:hidden;margin-top:5px";
    const barF = document.createElement("i");
    barF.style.cssText = "display:block;height:100%;width:100%;background:var(--primary);border-radius:4px;transition:width .2s";
    bar.appendChild(barF); row.appendChild(bar);
    const info = document.createElement("div");
    info.style.cssText = "display:flex;justify-content:space-between;font-size:11px;color:var(--text-2);font-family:var(--mono);margin-top:3px";
    row.appendChild(info);
    inCols.appendChild(row);
    infoRows.push(info);
    // 权重滑杆在这里管理，但先存
  });

  // 神经元节点
  const node = document.createElement("div");
  node.style.cssText = "flex:none;width:92px;height:92px;border-radius:50%;background:var(--primary-soft);border:2.5px solid var(--primary);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--primary)";
  node.innerHTML = `<div style="font-size:26px;font-weight:800;line-height:1">Σ</div><div style="font-size:9px;font-weight:700;color:var(--text-2)">激活函数</div>`;

  // 输出节点
  const out = document.createElement("div");
  out.style.cssText = "flex:none;width:110px;height:60px;border-radius:12px;background:var(--accent-soft);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:var(--accent)";
  out.textContent = "0.00";

  canvas.appendChild(inCols);
  canvas.appendChild(node);
  canvas.appendChild(out);
  wrap.appendChild(canvas);

  // 权重滑杆与偏置
  const wPanel = document.createElement("div");
  wPanel.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--text-2);margin-bottom:8px">拖动调整每个输入的“权重”（×系数）</div>`;
  data.forEach((d, i) => {
    const r = document.createElement("div");
    r.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:6px";
    r.innerHTML = `<span style="font-size:12px;color:var(--text-2);width:76px;flex:none">${d.label}</span>`;
    const inp = document.createElement("input");
    inp.type = "range"; inp.min = -1; inp.max = 1; inp.step = 0.1; inp.value = d.w;
    inp.style.cssText = "flex:1;accent-color:var(--primary)";
    const val = document.createElement("span");
    val.style.cssText = "font-family:var(--mono);font-size:12px;color:var(--text-2);width:40px;text-align:right";
    val.textContent = d.w.toFixed(1);
    inp.oninput = () => { d.w = parseFloat(inp.value); val.textContent = d.w.toFixed(1); compute(); };
    r.appendChild(inp); r.appendChild(val);
    wPanel.appendChild(r);
  });
  // 偏置
  const bRow = document.createElement("div");
  bRow.style.cssText = "display:flex;align-items:center;gap:10px";
  bRow.innerHTML = `<span style="font-size:12px;color:var(--text-2);width:76px;flex:none">偏置 b</span>`;
  const bInp = document.createElement("input");
  bInp.type = "range"; bInp.min = -1; bInp.max = 1; bInp.step = 0.1; bInp.value = bias;
  bInp.style.cssText = "flex:1;accent-color:var(--accent)";
  const bVal = document.createElement("span");
  bVal.style.cssText = "font-family:var(--mono);font-size:12px;color:var(--text-2);width:40px;text-align:right";
  bVal.textContent = bias.toFixed(1);
  bInp.oninput = () => { bias = parseFloat(bInp.value); bVal.textContent = bias.toFixed(1); compute(); };
  bRow.appendChild(bInp); bRow.appendChild(bVal);
  wPanel.appendChild(bRow);
  wrap.appendChild(wPanel);

  function compute() {
    let sum = bias;
    const lines = [];
    data.forEach((d, i) => {
      sum += d.val * d.w;
      const barF = inCols.children[i].querySelector("i");
      barF.style.width = (Math.max(0, Math.min(1, d.val)) * 100) + "%";
      infoRows[i].textContent = `x=${d.val.toFixed(1)}  ·  w=${d.w.toFixed(1)}`;
    });
    const a = activate(sum);
    out.textContent = a.toFixed(2);
    // 颜色反馈
    out.style.background = a > 0 ? "var(--accent-soft)" : "var(--danger-soft)";
    out.style.borderColor = a > 0 ? "var(--accent)" : "var(--danger)";
    out.style.color = a > 0 ? "var(--accent)" : "var(--danger)";
  }
  compute();
  el.appendChild(wrap);
  vizHint(el, "激活函数对“求和结果”做非线性加工（这里用 ReLU：负值归 0）。权重和偏置就是模型要学的参数。");
};

/* ============================================================
   第3课 · 多层网络图（悬停显示层级）
   ============================================================ */
AIVIZ.network = function (el) {
  vizClear(el);
  const W = 680, H = 340;
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, el);
  const layers = [
    { label: "输入层", n: 4, x: 70, c: COLORS.blue, note: "原始数据" },
    { label: "隐藏层\n提取特征", n: 5, x: 260, c: COLORS.purple, note: "边缘→形状→部件" },
    { label: "隐藏层\n更抽象", n: 5, x: 450, c: COLORS.purple, note: "组合出语义" },
    { label: "输出层", n: 3, x: 640, c: COLORS.accent, note: "猫/狗/其他" }
  ];
  const positions = layers.map(L => {
    const pos = [];
    for (let i = 0; i < L.n; i++) pos.push({ x: L.x, y: H / 2 - (L.n - 1) * 20 + i * 40 });
    return pos;
  });
  // 连线
  for (let l = 0; l < layers.length - 1; l++) {
    positions[l].forEach(p1 => positions[l + 1].forEach(p2 => {
      vizSvg("line", { x1: p1.x + 6, y1: p1.y, x2: p2.x - 6, y2: p2.y, stroke: "var(--line)", "stroke-width": 1.3 }, svg);
    }));
  }
  // 节点 + 层标签
  layers.forEach((L, li) => {
    positions[li].forEach((p, i) => {
      vizSvg("circle", { cx: p.x, cy: p.y, r: 9, fill: L.c, opacity: 0.18, style: "animation:vFade .4s ease both;animation-delay:" + (li * .1 + i * .03) + "s" }, svg);
      vizSvg("circle", { cx: p.x, cy: p.y, r: 4.5, fill: L.c }, svg);
    });
    const ty = li % 2 === 0 ? 26 : H - 24;
    const g = vizSvg("g", { style: "animation:vFade .4s ease both;animation-delay:" + (li * .15) + "s" }, svg);
    const t = vizSvg("text", { x: L.x, y: ty, "text-anchor": "middle", "font-size": "12.5", "font-weight": "800", fill: "var(--text)" }, g);
    const parts = L.label.split("\n");
    t.textContent = parts[0];
    if (parts[1]) { const t2 = vizSvg("text", { x: L.x, y: ty + 15, "text-anchor": "middle", "font-size": "10", fill: "var(--text-3)" }, g); t2.textContent = parts[1]; }
    const note = vizSvg("text", { x: L.x, y: ty + (li % 2 === 0 ? 30 : -30), "text-anchor": "middle", "font-size": "10.5", fill: "var(--text-2)", "font-style": "italic" }, g);
    note.textContent = L.note;
  });
  vizHint(el, "信息从输入层一层层“流动”到输出层；隐藏层越深，提取的特征越抽象。");
};

/* ============================================================
   第3课 · 反向传播循环
   ============================================================ */
AIVIZ.backprop = function (el) {
  vizClear(el);
  const W = 680, H = 250;
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, el);
  const steps = [
    { x: 50, t: "前向传播", d: "算出答案", c: COLORS.primary },
    { x: 235, t: "对比真值", d: "得出误差", c: COLORS.warn },
    { x: 420, t: "反向传播", d: "误差逐层传回", c: COLORS.danger },
    { x: 585, t: "更新权重", d: "往误差小的方向调", c: COLORS.good }
  ];
  const w2 = 130, h = 104, y = 40;
  steps.forEach((s, i) => {
    const g = vizSvg("g", { style: "animation:vFade .4s ease both;animation-delay:" + (i * .12) + "s" }, svg);
    vizSvg("rect", { x: s.x, y, width: w2, height: h, rx: 15, fill: "var(--bg-card)", stroke: s.c, "stroke-width": 2 }, g);
    const t = vizSvg("text", { x: s.x + w2 / 2, y: y + 46, "text-anchor": "middle", "font-size": "15", "font-weight": "800", fill: "var(--text)" }, g);
    t.textContent = s.t;
    const d = vizSvg("text", { x: s.x + w2 / 2, y: y + 72, "text-anchor": "middle", "font-size": "11", fill: "var(--text-2)" }, g);
    d.textContent = s.d;
    if (i < 3) {
      vizSvg("path", { d: `M${s.x + w2 + 6} ${y + h / 2} h14`, stroke: "var(--line-strong)", "stroke-width": 2, "stroke-dasharray": "6 4", fill: "none" }, g);
      vizSvg("path", { d: `M${s.x + w2 + 18} ${y + h / 2 - 6} l6 6 -6 6`, stroke: "var(--line-strong)", "stroke-width": 2, fill: "none" }, g);
    }
  });
  vizHint(el, "循环往复：前向出结果 → 反向传误差 → 更新权重，直到误差足够小（训练收敛）。");
};

/* ============================================================
   第4课 · Embedding 入门：文字变数字
   ============================================================ */
AIVIZ.embedIntro = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid;grid-template-columns:1fr;gap:10px";
  const term = ["apple", "苹果", "🚀", "猫"];

  const fromRow = document.createElement("div");
  fromRow.style.cssText = "display:flex;align-items:center;gap:12px;justify-content:center";
  const labelDiv = document.createElement("div");
  labelDiv.style.cssText = "font-size:13px;font-weight:700;color:var(--text-3);width:60px;text-align:center";
  labelDiv.textContent = "文字/词";
  const tbox = document.createElement("div");
  tbox.style.cssText = "flex:1;border:2px dashed var(--line);border-radius:12px;padding:14px;text-align:center;font-size:20px;color:var(--text);background:var(--bg-card)";
  tbox.innerHTML = `<b>苹果</b> <span style="color:var(--text-3);font-size:14px">(Apple)</span>`;
  fromRow.appendChild(labelDiv); fromRow.appendChild(tbox);

  const arrow = document.createElement("div");
  arrow.style.cssText = "text-align:center;font-size:20px;color:var(--primary);font-weight:800";
  arrow.textContent = "⬇ Embedding 映射 ⬇";

  const toRow = document.createElement("div");
  toRow.style.cssText = "display:flex;align-items:center;gap:12px;justify-content:center";
  const vlabel = document.createElement("div");
  vlabel.style.cssText = "font-size:13px;font-weight:700;color:var(--text-3);width:60px;text-align:center";
  vlabel.textContent = "向量";
  const vbox = document.createElement("div");
  vbox.style.cssText = "flex:1;border:2px solid var(--primary);border-radius:12px;padding:12px;text-align:center;font-family:var(--mono);font-size:14px;color:var(--primary-strong);background:var(--primary-soft);letter-spacing:1px";
  vbox.innerHTML = `<span style="color:var(--text-3)">[</span> 0.12, −0.34, 0.87, 0.05, −0.21, … 768 个数字 <span style="color:var(--text-3)">]</span>`;
  toRow.appendChild(vlabel); toRow.appendChild(vbox);

  wrap.appendChild(fromRow); wrap.appendChild(arrow); wrap.appendChild(toRow);
  el.appendChild(wrap);
  vizHint(el, "Embedding 把“词”映射成一长串数字（向量），机器就能用这些数字做计算、比较相似度。");
};

/* ============================================================
   第4课 · 词嵌入语义地图（点词看近邻）
   ============================================================ */
AIVIZ.embedMap = function (el) {
  vizClear(el);
  // 2D 投影的词点（简化示意）
  const words = [
    { t: "猫", x: 150, y: 120, c: "#5b6cff" }, { t: "猫咪", x: 185, y: 150, c: "#5b6cff" },
    { t: "狗", x: 260, y: 100, c: COLORS.accent }, { t: "宠物", x: 205, y: 180, c: "#5b6cff" },
    { t: "香蕉", x: 470, y: 200, c: "#f2a33c" }, { t: "苹果", x: 500, y: 150, c: "#f2a33c" },
    { t: "水果", x: 470, y: 250, c: "#f2a33c" }, { t: "汽车", x: 120, y: 250, c: COLORS.danger },
    { t: "驾驶", x: 185, y: 270, c: COLORS.danger }, { t: "机场", x: 540, y: 80, c: COLORS.purple },
    { t: "航班", x: 490, y: 60, c: COLORS.purple }, { t: "旅行", x: 570, y: 110, c: COLORS.purple }
  ];
  const svg = vizSvg("svg", { viewBox: "0 0 640 340", style: "width:100%;height:auto;display:block" }, el);
  vizSvg("rect", { x: 0, y: 0, width: 640, height: 330, rx: 14, fill: "var(--bg-soft)", stroke: "var(--line)" }, svg);
  // 网格线
  for (let i = 0; i <= 640; i += 80) vizSvg("line", { x1: i, y1: 0, x2: i, y2: 330, stroke: "var(--line)", "stroke-width": 1, opacity: 0.6 }, svg);
  for (let i = 0; i <= 330; i += 60) vizSvg("line", { x1: 0, y1: i, x2: 640, y2: i, stroke: "var(--line)", "stroke-width": 1, opacity: 0.6 }, svg);
  // 相似词连线（语义相近的用线连起示意聚类）
  const clusters = [["猫", "猫咪", "宠物", "狗"], ["香蕉", "苹果", "水果"], ["汽车", "驾驶"], ["机场", "航班", "旅行"]];
  clusters.forEach(cls => {
    cls.forEach((a, i) => cls.slice(i + 1).forEach(b => {
      const wa = words.find(w => w.t === a), wb = words.find(w => w.t === b);
      if (wa && wb) vizSvg("line", { x1: wa.x, y1: wa.y, x2: wb.x, y2: wb.y, stroke: "var(--line)", "stroke-width": 1.5, opacity: 0.5 }, svg);
    }));
  });
  const dots = [];
  words.forEach((w) => {
    const g = vizSvg("g", {}, svg);
    vizSvg("circle", { cx: w.x, cy: w.y, r: 18, fill: w.c, opacity: 0.16 }, g);
    vizSvg("circle", { cx: w.x, cy: w.y, r: 7, fill: w.c }, g);
    vizSvg("text", { x: w.x, y: w.y + 32, "text-anchor": "middle", "font-size": "12.5", "font-weight": "700", fill: "var(--text)" }, g).textContent = w.t;
    dots.push(g);
    g.style.cursor = "pointer";
    g.onmouseover = () => { g.firstChild.style.opacity = 0.4; };
    g.onmouseout = () => { g.firstChild.style.opacity = 0.16; };
  });
  vizHint(el, "同一类词（宠物、水果、交通、旅行）在向量空间里自然聚成一团——这就是“语义相近 → 坐标相近”。悬停任一词可体验。");
};

/* ============================================================
   第4课 · 余弦相似度交互（拖动角度改变夹角 → 看相似度变化）
   ============================================================ */
AIVIZ.cosineDemo = function (el) {
  vizClear(el);
  let angle = 30; // 两向量夹角（度）
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid;grid-template-columns:1fr;gap:12px";

  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:16px;flex-wrap:wrap";

  const canvas = document.createElement("div");
  canvas.style.cssText = "flex:1;min-width:220px;position:relative;height:210px;background:var(--bg-soft);border:1px solid var(--line);border-radius:12px;overflow:hidden";
  const svg = vizSvg("svg", { viewBox: "0 0 220 210", width: "100%", height: "100%", style: "display:block" }, canvas);
  vizSvg("line", { x1: 15, y1: 180, x2: 205, y2: 180, stroke: "var(--line-strong)", "stroke-width": 1.5 }, svg);
  vizSvg("line", { x1: 28, y1: 15, x2: 28, y2: 195, stroke: "var(--line-strong)", "stroke-width": 1.5 }, svg);
  vizSvg("text", { x: 198, y: 176, "font-size": 9, fill: "var(--text-3)" }, svg).textContent = "维2";
  vizSvg("text", { x: 30, y: 22, "font-size": 9, fill: "var(--text-3)" }, svg).textContent = "维1";

  const origin = { x: 28, y: 180 };
  const len = 118;
  // 向量 A 竖直向上
  const v1x = origin.x, v1y = origin.y - len;
  vizSvg("line", { x1: origin.x, y1: origin.y, x2: v1x, y2: v1y, stroke: COLORS.primary, "stroke-width": 3, "stroke-linecap": "round" }, svg);
  vizSvg("text", { x: v1x + 7, y: v1y - 4, "font-size": 12, "font-weight": "800", fill: COLORS.primary }, svg).textContent = "A";

  let vec2 = vizSvg("line", { x1: origin.x, y1: origin.y, x2: origin.x, y2: origin.y - len, stroke: COLORS.accent, "stroke-width": 3, "stroke-linecap": "round" }, svg);
  const arcPath = vizSvg("path", { d: "", stroke: "var(--warn)", "stroke-width": 2, fill: "none", "stroke-dasharray": "4 3" }, svg);
  const arcText = vizSvg("text", { x: 0, y: 0, "font-size": 11, "font-weight": "700", fill: "var(--warn)" }, svg);
  let v2Label = vizSvg("text", { x: 0, y: 0, "font-size": 12, "font-weight": "800", fill: COLORS.accent }, svg);

  // 右侧结果面板
  const res = document.createElement("div");
  res.style.cssText = "flex:none;width:190px;border:1px solid var(--line);border-radius:12px;padding:16px;background:var(--bg-card)";
  res.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--text-2);margin-bottom:8px">实时结果</div>
    <div style="display:flex;align-items:baseline;gap:6px"><span style="font-size:12px;color:var(--text-2)">夹角</span><b id="cAng" style="font-size:22px;color:var(--warn)">30°</b></div>
    <div style="display:flex;align-items:baseline;gap:6px;margin:6px 0"><span style="font-size:12px;color:var(--text-2)">余弦相似度</span><b id="cVal" style="font-size:24px;color:var(--primary)">0.87</b></div>
    <div id="cTxt" style="font-size:12.5px;line-height:1.6;color:var(--text-2)"></div>`;

  function update() {
    const rad = angle * Math.PI / 180;
    const v2x = origin.x + len * Math.sin(rad);
    const v2y = origin.y - len * Math.cos(rad);
    vec2.setAttribute("x2", v2x); vec2.setAttribute("y2", v2y);
    // 弧线
    const a = 15, r = 26;
    const ax0 = origin.x + r, ay0 = origin.y;
    const ax1 = origin.x + r * Math.sin(rad), ay1 = origin.y - r * Math.cos(rad);
    const large = angle > 90 ? 1 : 0;
    arcPath.setAttribute("d", `M${ax0} ${ay0} A${r} ${r} 0 ${large} 1 ${ax1} ${ay1}`);
    arcText.setAttribute("x", origin.x + r * Math.sin(rad / 2) * 1.2 + 4);
    arcText.setAttribute("y", origin.y - r * Math.cos(rad / 2) * 1.2);
    arcText.textContent = angle + "°";
    v2Label.setAttribute("x", v2x + 7); v2Label.setAttribute("y", v2y - 4);
    v2Label.textContent = "B";
    const cos = Math.cos(rad);
    res.querySelector("#cAng").textContent = angle + "°";
    res.querySelector("#cVal").textContent = cos.toFixed(2);
    const txt = res.querySelector("#cTxt");
    if (angle < 25) txt.textContent = "夹角很小 → 方向几乎一致 → 非常相似";
    else if (angle < 65) txt.textContent = "有一定夹角 → 部分相似";
    else if (angle < 90) txt.textContent = "夹角较大 → 相似度下降";
    else if (angle < 135) txt.textContent = "近垂直甚至反向 → 相关性弱";
    else txt.textContent = "夹角很大 → 方向几乎相反 → 语义对立";
    res.querySelector("#cTxt").textContent = txt.textContent;
  }

  row.appendChild(canvas);
  row.appendChild(res);
  wrap.appendChild(row);

  // 滑杆
  const slideRow = document.createElement("div");
  slideRow.style.cssText = "display:flex;align-items:center;gap:12px";
  slideRow.innerHTML = `<span style="font-size:13px;color:var(--text-2);font-weight:600;flex:none">调整夹角</span>`;
  const slider = document.createElement("input");
  slider.type = "range"; slider.min = 0; slider.max = 180; slider.step = 1; slider.value = angle;
  slider.style.cssText = "flex:1;accent-color:var(--warn)";
  const sval = document.createElement("span");
  sval.style.cssText = "font-family:var(--mono);font-size:12px;color:var(--text-2);width:44px;text-align:right";
  slider.addEventListener("input", () => {
    angle = parseFloat(slider.value);
    sval.textContent = angle + "°";
    update();
  });
  slideRow.appendChild(slider); slideRow.appendChild(sval);
  wrap.appendChild(slideRow);

  el.appendChild(wrap);
  update();
  vizHint(el, "拖动滑杆改变两向量夹角。夹角越小，余弦相似度越接近 1，表示两个词/对象越相似。");
};
