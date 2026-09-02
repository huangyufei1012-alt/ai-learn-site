/* ============================================================
   AI 学堂 · 交互式可视化（第 4 组 · 名词动画演示）
   每个 AIVIZ.xxx(el) 接收容器 DOM，绘制并绑定交互。
   用于「动画实验室」与课程中难懂名词的直观演示。
   依赖 visuals.js 的 vizClear / vizSvg / vizHint / COLORS。
   ============================================================ */
window.AIVIZ = window.AIVIZ || {};
var V4 = {
  primary: "#5b6cff", accent: "#00b8a9", warn: "#f2a33c",
  danger: "#ff5d73", good: "#23b26d", purple: "#7a5bff", blue: "#3d8bff"
};

/* ============================================================
   过拟合 vs 欠拟合（多项式拟合交互）
   ============================================================ */
AIVIZ.overfitDemo = function (el) {
  vizClear(el);
  var W = 520, H = 260;
  var padL = 12, padB = 26, padT = 12, padR = 12;
  var innerW = W - padL - padR, innerH = H - padT - padB;
  var svg = vizSvg("svg", { viewBox: "0 0 " + W + " " + H, style: "width:100%;height:auto;display:block" }, el);
  function X(x) { return padL + x * innerW; }
  function Y(y) { return padT + (1 - y) * innerH; }

  vizSvg("rect", { x: 0, y: 0, width: W, height: H, rx: 12, fill: "var(--bg-soft)" }, svg);

  function trueFn(x) { return 0.6 + 0.3 * Math.sin(Math.PI * (x * 2 - 1) * 0.75); }
  var pts = [];
  var seed = 7;
  function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  for (var i = 0; i < 14; i++) {
    var x = i / 13;
    pts.push({ x: x, y: Math.max(0.06, Math.min(0.94, trueFn(x) + (rand() - 0.5) * 0.26)) });
  }

  function fitPoly(deg) {
    var n = pts.length, d = deg + 1;
    var AtA = [], Atb = [];
    for (var r = 0; r < d; r++) { AtA.push(new Array(d).fill(0)); Atb.push(0); }
    for (var p = 0; p < n; p++) {
      var xp = pts[p].x, yp = pts[p].y;
      for (var r2 = 0; r2 < d; r2++) {
        var xr = Math.pow(xp, r2);
        Atb[r2] += xr * yp;
        for (var c = 0; c < d; c++) AtA[r2][c] += xr * Math.pow(xp, c);
      }
    }
    var M = AtA.map(function (row, ri) { return row.concat([Atb[ri]]); });
    for (var col = 0; col < d; col++) {
      var piv = col;
      for (var r3 = col + 1; r3 < d; r3++) if (Math.abs(M[r3][col]) > Math.abs(M[piv][col])) piv = r3;
      var tmp = M[col]; M[col] = M[piv]; M[piv] = tmp;
      var pv = M[col][col];
      if (Math.abs(pv) < 1e-12) continue;
      for (var c2 = 0; c2 <= d; c2++) M[col][c2] /= pv;
      for (var r4 = 0; r4 < d; r4++) {
        if (r4 === col) continue;
        var f = M[r4][col];
        for (var c3 = 0; c3 <= d; c3++) M[r4][c3] -= f * M[col][c3];
      }
    }
    var coef = M.map(function (row) { return row[d]; });
    return function (x) { var s = 0; for (var k = coef.length - 1; k >= 0; k--) s = s * x + coef[k]; return s; };
  }

  var truePath = "";
  for (var xi = 0; xi <= 100; xi++) { var xv = xi / 100; truePath += (xi ? "L" : "M") + X(xv).toFixed(1) + " " + Y(trueFn(xv)).toFixed(1); }
  vizSvg("path", { d: truePath, stroke: V4.good, "stroke-width": 2.4, fill: "none", "stroke-dasharray": "7 4", opacity: 0.85 }, svg);
  vizSvg("text", { x: W - 12, y: 22, "font-size": 10.5, "font-weight": "700", fill: V4.good, "text-anchor": "end" }, svg).textContent = "理想规律";

  pts.forEach(function (p) {
    vizSvg("circle", { cx: X(p.x), cy: Y(p.y), r: 5, fill: V4.primary, stroke: "var(--bg-card)", "stroke-width": 1.4 }, svg);
  });
  vizSvg("text", { x: 14, y: 22, "font-size": 10.5, "font-weight": "700", fill: V4.primary }, svg).textContent = "训练样本";

  var fitLine = vizSvg("path", { d: "", stroke: V4.warn, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, svg);

  var status = document.createElement("div");
  status.style.cssText = "margin-top:12px;padding:11px 14px;border-radius:11px;font-size:13px;line-height:1.7;color:var(--text-2);display:flex;align-items:center;gap:9px;background:var(--bg-card);border:1px solid var(--line)";
  var badge = document.createElement("span");
  badge.style.cssText = "flex:none;font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:20px;color:#fff";
  status.appendChild(badge);
  var txt = document.createElement("span");
  status.appendChild(txt);

  var sliderRow = document.createElement("div");
  sliderRow.style.cssText = "display:flex;align-items:center;gap:12px;margin-top:12px";
  sliderRow.innerHTML = '<span style="font-size:13px;color:var(--text-2);font-weight:600;flex:none">模型复杂度</span>';
  var slider = document.createElement("input");
  slider.type = "range"; slider.min = 1; slider.max = 11; slider.step = 1; slider.value = 6; slider.style.cssText = "flex:1;accent-color:var(--warn)";
  var sval = document.createElement("span");
  sval.style.cssText = "font-family:var(--mono);font-size:12px;color:var(--text-2);width:60px;text-align:right";
  sliderRow.appendChild(slider); sliderRow.appendChild(sval);
  el.appendChild(sliderRow);

  function redraw() {
    var deg = parseInt(slider.value, 10);
    var fn = fitPoly(deg);
    var path = "";
    for (var xi = 0; xi <= 160; xi++) { var xv = xi / 160; var yy = Math.max(-0.3, Math.min(1.3, fn(xv))); path += (xi ? "L" : "M") + X(xv).toFixed(1) + " " + Y(yy).toFixed(1); }
    fitLine.setAttribute("d", path);
    sval.textContent = "阶数 " + deg;
    var trainMSE = 0;
    pts.forEach(function (p) { var e = fn(p.x) - p.y; trainMSE += e * e; });
    trainMSE = Math.sqrt(trainMSE / pts.length);
    var label, cls;
    if (deg <= 2) { label = "欠拟合"; cls = "曲线太简单，没抓住数据的主要规律"; badge.style.background = V4.blue; }
    else if (deg >= 9) { label = "过拟合"; cls = "曲线把每个样本都“背”下来、剧烈抖动，把噪声也学进去了，遇到新数据会失准"; badge.style.background = V4.danger; }
    else { label = "恰到好处"; cls = "曲线贴合数据又不乱抖，接近理想规律，新数据表现好"; badge.style.background = V4.good; }
    badge.textContent = label;
    txt.textContent = cls + " ｜ 对训练样本的平均偏离 " + trainMSE.toFixed(3);
  }
  redraw();
  slider.addEventListener("input", redraw);
  el.appendChild(status);
  vizHint(el, "把“模型复杂度”拉到很低是欠拟合（学不会规律），拉到很高是过拟合（连噪声都背下来）。中间恰到好处才是目标。");
};

/* ============================================================
   梯度下降（小球滚下山坡，动画 + 学习率滑杆）
   ============================================================ */
AIVIZ.gradDescent = function (el) {
  vizClear(el);
  var W = 520, H = 240;
  var svg = vizSvg("svg", { viewBox: "0 0 " + W + " " + H, style: "width:100%;height:auto;display:block" }, el);
  vizSvg("rect", { x: 0, y: 0, width: W, height: H, rx: 12, fill: "var(--bg-soft)" }, svg);
  function loss(x) { var z = (x - 0.05) / 0.9; return Math.pow(z, 2) * 0.92 + 0.1; }
  function X(x) { return 20 + x * (W - 40); }
  function YL(x) { return H - 22 - loss(x) * (H - 52); }
  var path = "";
  for (var i = 0; i <= 200; i++) { var x = i / 200; path += (i ? "L" : "M") + X(x).toFixed(1) + " " + YL(x).toFixed(1); }
  vizSvg("path", { d: path, stroke: V4.good, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, svg);
  vizSvg("text", { x: W - 8, y: 26, "font-size": 11, fill: V4.good, "font-weight": "700", "text-anchor": "end" }, svg).textContent = "损失(误差)";
  vizSvg("text", { x: W - 8, y: H - 4, "font-size": 10.5, fill: "var(--text-3)", "text-anchor": "end" }, svg).textContent = "参数 →";

  var ball = vizSvg("circle", { cx: 0, cy: 0, r: 11, fill: V4.primary, stroke: "var(--bg-card)", "stroke-width": 2 }, svg);
  var trail = vizSvg("path", { d: "", fill: "none", stroke: V4.primary, "stroke-width": 2, opacity: 0.5, "stroke-dasharray": "3 3" }, svg);

  var state = document.createElement("div");
  state.style.cssText = "margin-top:12px;display:flex;gap:20px;flex-wrap:wrap;font-size:12.5px;color:var(--text-2)";
  var stepEl = document.createElement("span");
  var posEl = document.createElement("span");
  var lrEl = document.createElement("span");
  state.appendChild(stepEl); state.appendChild(posEl); state.appendChild(lrEl);
  el.appendChild(state);

  var sliderRow = document.createElement("div");
  sliderRow.style.cssText = "display:flex;align-items:center;gap:12px;margin-top:12px";
  sliderRow.innerHTML = '<span style="font-size:13px;color:var(--text-2);font-weight:600;flex:none">学习率(步长)</span>';
  var slider = document.createElement("input");
  slider.type = "range"; slider.min = 1; slider.max = 100; slider.step = 1; slider.value = 12; slider.style.cssText = "flex:1;accent-color:var(--primary)";
  var sval = document.createElement("span");
  sval.style.cssText = "font-family:var(--mono);font-size:12px;color:var(--text-2);width:70px;text-align:right";
  sliderRow.appendChild(slider); sliderRow.appendChild(sval);
  el.appendChild(sliderRow);

  var btn = document.createElement("button");
  btn.textContent = "▶ 重新下落";
  btn.style.cssText = "margin-top:10px;padding:7px 16px;border:none;border-radius:9px;background:var(--primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer";
  el.appendChild(btn);

  var pos = 0.92, step = 0, trailStr = "", raf = null, alive = false;
  function updateBall() { ball.setAttribute("cx", X(pos)); ball.setAttribute("cy", YL(pos)); }
  function stepAnim() {
    if (!alive) return;
    var h = 0.0005;
    var lr = parseFloat(slider.value) / 10000;
    var c1 = Math.max(0, Math.min(1, pos + h)), c2 = Math.max(0, Math.min(1, pos - h));
    var grad = (loss(c1) - loss(c2)) / (2 * h);
    var np = pos - lr * grad * (W - 40) / 2.5;
    np = Math.max(0.02, Math.min(0.98, np));
    trailStr += " " + X(pos).toFixed(1) + " " + YL(pos).toFixed(1);
    trail.setAttribute("d", "M" + trailStr.trim());
    pos = np; step++;
    updateBall();
    stepEl.textContent = "步数 " + step;
    posEl.textContent = "损失 " + loss(pos).toFixed(3);
    lrEl.textContent = "学习率 " + Math.round(lr * 10000) + "‰";
    if (pos > 0.03) raf = requestAnimationFrame(stepAnim); else alive = false;
  }
  function start() {
    if (raf) cancelAnimationFrame(raf);
    alive = true; pos = 0.92; step = 0; trailStr = "";
    trail.setAttribute("d", "");
    updateBall();
    raf = requestAnimationFrame(stepAnim);
  }
  btn.addEventListener("click", start);
  slider.addEventListener("input", function () {
    var lr = parseFloat(slider.value);
    sval.textContent = lr + "‰";
    lrEl.textContent = "学习率 " + lr + "‰";
    sval.style.color = lr > 22 ? "var(--danger)" : "var(--text-2)";
  });
  slider.value = 12; sval.textContent = "12‰";
  start();
  vizHint(el, "小球=参数，曲线=损失。学习率太小走得慢，太大可能“冲过头”在谷底来回弹。调大调小试试，再点重新下落。");
};

/* ============================================================
   温度参数 Temperature（分布形状随温度变化）
   ============================================================ */
AIVIZ.temperatureDemo = function (el) {
  vizClear(el);
  var W = 520, H = 250;
  var svg = vizSvg("svg", { viewBox: "0 0 " + W + " " + H, style: "width:100%;height:auto;display:block" }, el);
  vizSvg("rect", { x: 0, y: 0, width: W, height: H, rx: 12, fill: "var(--bg-soft)" }, svg);
  var baseLogits = [3.2, 2.6, 2.1, 1.6, 1.1, 0.6, 0.1, -0.4, -0.9, -1.4];
  var labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  var chartW = W - 40, chartH = H - 115, baseY = H - 28;
  var barW = chartW / baseLogits.length;
  vizSvg("line", { x1: 16, y1: baseY, x2: W - 12, y2: baseY, stroke: "var(--line-strong)", "stroke-width": 1.4 }, svg);
  var bars = baseLogits.map(function (_, i) {
    vizSvg("rect", { x: 20 + i * barW + barW * 0.15, y: baseY, width: barW * 0.7, height: 0, rx: 4, fill: V4.primary }, svg);
    vizSvg("text", { x: 20 + i * barW + barW / 2, y: H - 8, "font-size": 9.5, fill: "var(--text-3)", "text-anchor": "middle" }, svg).textContent = labels[i];
    return vizSvg("rect", { x: 20 + i * barW + barW * 0.15, y: baseY, width: barW * 0.7, height: 0, rx: 4, fill: V4.primary }, svg);
  });
  var title = vizSvg("text", { x: W / 2, y: 22, "font-size": 13.5, "font-weight": "800", fill: "var(--text)", "text-anchor": "middle" }, svg);
  var topSel = vizSvg("text", { x: W / 2, y: H - 6, "font-size": 12, "font-weight": "700", fill: V4.accent, "text-anchor": "middle" }, svg);

  function softmaxWithT(logits, T) {
    var scaled = logits.map(function (l) { return l / T; });
    var mx = Math.max.apply(null, scaled);
    var ex = scaled.map(function (v) { return Math.exp(v - mx); });
    var sum = ex.reduce(function (a, b) { return a + b; }, 0);
    return ex.map(function (v) { return v / sum; });
  }

  function redraw() {
    var T = parseFloat(slider.value) / 10;
    var p = softmaxWithT(baseLogits, T);
    var maxP = Math.max.apply(null, p);
    var topIdx = 0;
    p.forEach(function (v, i) {
      var hG = (v / maxP * (chartH - 24)).toFixed(1);
      bars[i].setAttribute("height", hG);
      bars[i].setAttribute("y", (baseY - hG).toFixed(1));
      if (v > p[topIdx]) topIdx = i;
    });
    title.textContent = "温度 T = " + T.toFixed(1);
    topSel.textContent = "最可能的词：" + labels[topIdx] + "（概率 " + (p[topIdx] * 100).toFixed(1) + "%）";
  }
  var sliderRow = document.createElement("div");
  sliderRow.style.cssText = "display:flex;align-items:center;gap:12px;margin-top:12px";
  sliderRow.innerHTML = '<span style="font-size:13px;color:var(--text-2);font-weight:600;flex:none">温度</span>';
  var slider = document.createElement("input");
  slider.type = "range"; slider.min = 2; slider.max = 30; slider.step = 1; slider.value = 10; slider.style.cssText = "flex:1;accent-color:var(--warn)";
  var sval = document.createElement("span");
  sval.style.cssText = "font-family:var(--mono);font-size:12px;color:var(--text-2);width:44px;text-align:right";
  sliderRow.appendChild(slider); sliderRow.appendChild(sval);
  el.appendChild(sliderRow);
  slider.addEventListener("input", function () { sval.textContent = (parseFloat(slider.value) / 10).toFixed(1); redraw(); });
  sval.textContent = "1.0"; slider.value = 10;
  redraw();
  vizHint(el, "温度低→概率集中，几乎总选最可能的词（稳、保守）；温度高→概率摊平，容易选到冷门词（多样、发散）。0.2 严谨，1.0 正常，1.5+ 天马行空。");
};

/* ============================================================
   Top-p（核采样）：只从累计概率达到 p 的最可能词里挑
   ============================================================ */
AIVIZ.topPDemo = function (el) {
  vizClear(el);
  var W = 520, H = 250;
  var padB = 28, padT = 18;
  var baseLogits = [3.2, 2.6, 2.1, 1.6, 1.1, 0.5, -0.2, -0.9];
  var labels = ["很好", "不错", "还行", "一般", "凑合", "可以", "还行吧", "行"];
  var svg = vizSvg("svg", { viewBox: "0 0 " + W + " " + H, style: "width:100%;height:auto;display:block" }, el);
  vizSvg("rect", { x: 0, y: 0, width: W, height: H, rx: 12, fill: "var(--bg-soft)" }, svg);

  function softmax(logits, T) {
    var max = Math.max.apply(null, logits);
    var e = logits.map(function (l) { return Math.exp((l - max) / T); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (v) { return v / s; });
  }
  var inTop = {}, cum = {}, probs = [];
  function redraw(pth) {
    // 清空可重绘区域（用一层分组处理）
    while (svg.__g) { svg.removeChild(svg.__g); svg.__g = null; }
    var g = vizSvg("g", {}, svg); svg.__g = g;
    probs = softmax(baseLogits, 1.0);
    var order = probs.map(function (v, i) { return i; }).sort(function (a, b) { return probs[b] - probs[a]; });
    var c = 0; inTop = {};
    for (var k = 0; k < order.length; k++) {
      c += probs[order[k]];
      inTop[order[k]] = true;
      if (c >= pth) break;
    }
    // 累计概率条
    var barW = (W - 30) / baseLogits.length;
    var cur = 0;
    for (var i = 0; i < baseLogits.length; i++) {
      var x = 15 + i * barW, y = padT + 8;
      vizSvg("rect", { x: x, y: y, width: barW - 4, height: 26, rx: 6, fill: i === 0 ? "var(--bg-card)" : "var(--bg)" }, g);
      var seg = vizSvg("rect", { x: x, y: y, width: barW - 4, height: 26, rx: 6, fill: i === 0 ? "var(--bg)" : "var(--bg)" }, g);
      var bw = probs[i] * (barW - 4) * 6; // 拉伸便于观察
      var col = inTop[i] ? V4.primary : "var(--line)";
      if (inTop[i]) {
        cur += probs[i];
        vizSvg("rect", { x: x, y: y, width: Math.min(bw, barW - 4), height: 26, rx: 6, fill: col, opacity: 0.85 }, g);
        vizSvg("text", { x: x + (barW - 4) / 2, y: y + 17, "font-size": 10.5, fill: "#fff", "text-anchor": "middle", "font-weight": 700 }, g).textContent = Math.round(probs[i] * 100) + "%";
      } else {
        vizSvg("rect", { x: x, y: y, width: barW - 4, height: 26, rx: 6, fill: "transparent", stroke: "var(--line)", "stroke-dasharray": "3 3" }, g);
      }
      vizSvg("text", { x: x + (barW - 4) / 2, y: y + 26 + 14, "font-size": 10, fill: "var(--text-3)", "text-anchor": "middle" }, g).textContent = labels[i];
    }
    // 选中的词汇
    var cho = null;
    for (var j = 0; j < order.length; j++) if (inTop[order[j]]) { if (!cho || probs[order[j]] > probs[cho]) cho = order[j]; }
    vizSvg("text", { x: W / 2, y: H - 6, "font-size": 13, fill: "var(--text)", "text-anchor": "middle", "font-weight": 700 }, g).textContent = "Top-" + pth.toFixed(2) + " 保留词：" + order.filter(function (o) { return inTop[o]; }).map(function (o) { return labels[o]; }).join("、");
    vizLegend(el, [{ color: V4.primary, label: "被采纳（累计概率 p 内）" }, { color: "var(--line)", label: "被丢弃（尾部冷门词）" }]);
  }
  // 清掉旧图例（重绘时会重复添加）
  var oldLegend = el.querySelector(".toggle-legend");
  var sliderWrap = document.createElement("div");
  sliderWrap.style.cssText = "display:flex;align-items:center;gap:12px;margin-top:14px";
  sliderWrap.innerHTML = '<span style="font-size:13px;color:var(--text-2);font-weight:600;flex:none">Top-p</span>';
  var slider = document.createElement("input");
  slider.type = "range"; slider.min = 10; slider.max = 100; slider.step = 5; slider.value = 90;
  slider.style.cssText = "flex:1;accent-color:var(--primary)";
  var sval = document.createElement("span");
  sval.style.cssText = "font-family:var(--mono);font-size:12px;color:var(--text-2);width:44px;text-align:right";
  sliderWrap.appendChild(slider); sliderWrap.appendChild(sval);
  el.appendChild(sliderWrap);
  slider.addEventListener("input", function () {
    redraw(parseFloat(slider.value) / 100);
    sval.textContent = (parseFloat(slider.value) / 100).toFixed(2);
  });
  redraw(0.9); sval.textContent = "0.90";
  vizHint(el, "p 越小→越只挑头部几个高概率词（保守、可控）；p 越大→几乎全词都算（接近普通采样的随机）。Top-p 让采样更稳定，是温度之外的常用采样开关。");
};

/* ============================================================
   思维链（Chain-of-Thought）：一步步推理 vs 直接作答
   ============================================================ */
AIVIZ.cotDemo = function (el) {
  vizClear(el);
  var W = 520;
  // 左侧：直接作答
  var left = document.createElement("div");
  left.style.cssText = "border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--bg-card)";
  left.innerHTML = '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">❌ 直接作答</div>';
  var q = document.createElement("div");
  q.style.cssText = "font-size:14px;color:var(--text);line-height:1.6;margin-bottom:12px;background:var(--bg-soft);padding:10px;border-radius:8px";
  q.textContent = "问：小明有 3 个苹果，又买了 2 箱（每箱 5 个），现在有几个？";
  left.appendChild(q);
  var wrong = document.createElement("div");
  wrong.style.cssText = "font-size:13.5px;color:var(--danger);font-weight:700;background:rgba(255,93,115,.1);padding:8px 10px;border-radius:8px";
  wrong.textContent = "答：3 个。🙃（跳过细节，瞎猜）";
  left.appendChild(wrong);
  // 右侧：思维链
  var right = document.createElement("div");
  right.style.cssText = "border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--bg-card)";
  right.innerHTML = '<div style="font-size:13px;font-weight:700;color:var(--good);margin-bottom:10px">✅ 思维链（一步步来）</div>';
  var steps = ["先把 2 箱的苹果算出来：2 × 5 = 10 个", "再加上原有的 3 个：3 + 10 = 13", "所以答案是 13 个"];
  steps.forEach(function (s, i) {
    var st = document.createElement("div");
    st.style.cssText = "opacity:0;transition:.5s;font-size:13.5px;color:var(--text);background:var(--bg-soft);margin-bottom:8px;padding:8px 10px;border-radius:8px;border-left:3px solid var(--good)";
    st.textContent = (i === steps.length - 1 ? "✔ " : "→ ") + s;
    right.appendChild(st);
    st.__box = st;
  });
  var final = right.lastChild;
  var wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;gap:14px;flex-wrap:wrap;margin-top:4px";
  wrap.appendChild(left); wrap.style.flexGrow = "";
  left.style.cssText += ";flex:1;min-width:190px";
  right.style.cssText += ";flex:1;min-width:190px";
  wrap.appendChild(right);
  el.appendChild(wrap);
  // 按钮驱动逐步展示
  var btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap";
  var btn = document.createElement("button");
  btn.textContent = "▶ 逐步播放";
  btn.style.cssText = "cursor:pointer;background:var(--primary);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:700";
  var stepBox = Array.prototype.slice.call(right.children);
  var idx = 0; var playing = false;
  btnRow.appendChild(btn);
  btn.addEventListener("click", function () {
    if (playing) return; playing = true;
    btn.disabled = true;
    var timer = setInterval(function () {
      if (idx < stepBox.length) { stepBox[idx].style.opacity = 1; idx++; }
      else { clearInterval(timer); playing = false; btn.disabled = false; btn.textContent = "↻ 重播"; }
    }, 900);
  });
  el.appendChild(btnRow);
  vizHint(el, "越复杂的推理，直接『一步到位』越容易算错。把推理过程分成小步写出来（Chain-of-Thought），每一步都建立在前面步骤之上，准确率大幅提升——这也是让大模型‘会做题’的关键技巧。");
};

/* ============================================================
   少样本 / 零样本 / 单样本：给不给例子，差别有多大
   ============================================================ */
AIVIZ.fewShotDemo = function (el) {
  vizClear(el);
  var W = 520;
  function card(title, color, prompt, response) {
    var c = document.createElement("div");
    c.style.cssText = "border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--bg-card);flex:1;min-width:200px";
    c.innerHTML = '<div style="font-size:13px;font-weight:700;color:' + color + ';margin-bottom:8px">' + title + '</div>';
    var p = document.createElement("div");
    p.style.cssText = "font-size:12.5px;color:var(--text-2);background:var(--bg-soft);padding:8px 10px;border-radius:8px;line-height:1.6;margin-bottom:8px";
    p.textContent = "提示：\n" + prompt;
    p.style.whiteSpace = "pre-line";
    c.appendChild(p);
    var r = document.createElement("div");
    r.style.cssText = "font-size:13px;color:var(--text);font-weight:700;padding:8px 10px;border-radius:8px;background:" + (response.indexOf("歪") >= 0 ? "rgba(255,93,115,.12)" : "rgba(35,178,109,.12)");
    r.textContent = "回答：\n" + response;
    r.style.whiteSpace = "pre-line";
    c.appendChild(r);
    return c;
  }
  var wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;gap:14px;flex-wrap:wrap";
  wrap.appendChild(card("零样本 · 0 个例子", V4.blue,
    "把下面的英文翻译成中文：Apple",
    "苹果（可能矫枉过正，无从参考）\n→ 有时会把任务理解歪 🙃"));
  wrap.appendChild(card("少样本 · 2 个例子", V4.good,
    "cat → 猫\ndog → 狗\n请翻译：apple",
    "苹果 ✔\n（参考了两个例子，格式与语义都稳了）"));
  wrap.appendChild(card("单样本 · 1 个例子", V4.warn,
    "cat → 猫\n请翻译：apple",
    "苹果 ✔\n（只有一个例子，多数场景够用）"));
  el.appendChild(wrap);
  vizHint(el, "给模型看几个『输入→输出』的例子（few-shot），它就能学会你想要的格式和风格；一个例子叫 one-shot，一个不给叫 zero-shot。例子越多越稳，但也会占更多输入长度。");
};

/* ============================================================
   幻觉（Hallucination）：模型一本正经地编造答案
   ============================================================ */
AIVIZ.hallucinationDemo = function (el) {
  vizClear(el);
  var W = 520, H = 210;
  var svg = vizSvg("svg", { viewBox: "0 0 " + W + " " + H, style: "width:100%;height:auto;display:block" }, el);
  vizSvg("rect", { x: 0, y: 0, width: W, height: H, rx: 12, fill: "var(--bg-soft)" }, svg);
  var facts = [
    { q: "《史记》的作者是谁？", a: "司马迁", ok: true },
    { q: "太阳从哪边升起？", a: "东边", ok: true },
    { q: "2 + 2 = ?", a: "4", ok: true },
    { q: "李白活了 500 岁？", a: "是的，李白活了 500 岁", ok: false },
    { q: "法国的首都是北京？", a: "不是，法国首都是巴黎", ok: true },
    { q: "一种叫『幻日龙』的恐龙？", a: "确实存在，生活在侏罗纪", ok: false }
  ];
  var idx = 0, box = null, status = null;
  function render() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    vizSvg("rect", { x: 0, y: 0, width: W, height: H, rx: 12, fill: "var(--bg-soft)" }, svg);
    var f = facts[idx % facts.length];
    if (f.ok) {
      vizSvg("text", { x: W / 2, y: 40, "font-size": 14, fill: "var(--text)", "text-anchor": "middle", "font-weight": 700 }, svg).textContent = "你：" + f.q;
      vizSvg("text", { x: W / 2, y: 100, "font-size": 14, fill: "var(--good)", "text-anchor": "middle", "font-weight": 700 }, svg).textContent = "模型：" + f.a + " ✔";
      vizSvg("text", { x: W / 2, y: 150, "font-size": 12.5, fill: "var(--text-3)", "text-anchor": "middle" }, svg).textContent = "有依据 → 回答靠谱";
    } else {
      vizSvg("text", { x: W / 2, y: 40, "font-size": 14, fill: "var(--text)", "text-anchor": "middle", "font-weight": 700 }, svg).textContent = "你：" + f.q;
      vizSvg("text", { x: W / 2, y: 100, "font-size": 14, fill: "var(--danger)", "text-anchor": "middle", "font-weight": 700 }, svg).textContent = "模型：" + f.a + " ❌";
      vizSvg("text", { x: W / 2, y: 150, "font-size": 12.5, fill: "var(--danger)", "text-anchor": "middle", "font-weight": 700 }, svg).textContent = "它在编造！这就是『幻觉』";
    }
  }
  render();
  var row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:12px;margin-top:14px";
  var nxt = document.createElement("button");
  nxt.textContent = "下一条问答 ▶";
  nxt.style.cssText = "cursor:pointer;background:var(--primary);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:700";
  nxt.addEventListener("click", function () { idx++; render(); });
  var count = document.createElement("span");
  count.style.cssText = "font-size:12.5px;color:var(--text-3)";
  count.textContent = "答对的概率 ≈ " + facts.filter(function (f) { return f.ok; }).length + "/" + facts.length;
  row.appendChild(nxt); row.appendChild(count);
  el.appendChild(row);
  vizHint(el, "幻觉 = 模型一本正经、语气笃定地编造不存在的事实——因为它本质是『预测下一个词』，不是查数据库。遇到重要决策（医疗、法律、数字），务必用可靠资料交叉核对，别轻信它的‘自信’。");
};

/* ============================================================
   Epoch（训练轮次）：同一批数据反复学多少遍
   ============================================================ */
AIVIZ.epochDemo = function (el) {
  vizClear(el);
  var W = 520, H = 250;
  var padB = 30, padL = 40, padT = 16, padR = 16;
  var svg = vizSvg("svg", { viewBox: "0 0 " + W + " " + H, style: "width:100%;height:auto;display:block" }, el);
  vizSvg("rect", { x: 0, y: 0, width: W, height: H, rx: 12, fill: "var(--bg-soft)" }, svg);
  var epochs = [5, 10, 20, 40, 80, 160];
  var acc = [0.35, 0.55, 0.72, 0.86, 0.94, 0.96];
  var valAcc = [0.33, 0.5, 0.66, 0.8, 0.85, 0.82];
  var max = 100;
  function X(i) { return padL + (i / (epochs.length - 1)) * (W - padL - padR); }
  function Y(v) { return padT + (1 - v / max) * (H - padT - padB); }
  // 网格
  for (var g = 0; g <= 5; g++) {
    var gy = padT + (g / 5) * (H - padT - padB);
    vizSvg("line", { x1: padL, y1: gy, x2: W - padR, y2: gy, stroke: "var(--line)", "stroke-width": 1, opacity: 0.5 }, svg);
    vizSvg("text", { x: padL - 6, y: gy + 4, "font-size": 9.5, fill: "var(--text-3)", "text-anchor": "end" }, svg).textContent = (100 - g * 20) + "%";
  }
  // 曲线
  function line(ys, col) {
    var pts = ys.map(function (v, i) { return X(i) + "," + Y(v * 100); }).join(" ");
    vizSvg("polyline", { points: pts, fill: "none", stroke: col, "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    ys.forEach(function (v, i) {
      vizSvg("circle", { cx: X(i), cy: Y(v * 100), r: 4, fill: col }, svg);
    });
  }
  line(acc, V4.good);
  line(valAcc, V4.warn);
  // 标注
  vizSvg("text", { x: W / 2, y: padT - 4, "font-size": 12, fill: "var(--text)", "text-anchor": "middle", "font-weight": 700 }, svg).textContent = "训练轮次越多 → 训练准确率↑，但验证准确率可能回落（过拟合）";
  // 图例
  vizLegend(el, [{ color: V4.good, label: "训练准确率" }, { color: V4.warn, label: "验证准确率" }]);
  vizHint(el, "1 个 Epoch = 把所有训练数据完整学一遍。学太少（欠拟合）→ 没学会；学太多（过拟合）→ 死记硬背、换新数据就错。看验证准确率拐点，通常那附近就是最合适的轮数。");
};
