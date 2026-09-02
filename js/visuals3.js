/* ============================================================
   AI 学堂 · 交互式可视化（第 8-13 课）
   依赖 visuals.js 中定义的 vizClear / vizSvg / vizHint
   ============================================================ */
window.AIVIZ = window.AIVIZ || {};
const VD = {
  primary: "#5b6cff", accent: "#00b8a9", warn: "#f2a33c",
  danger: "#ff5d73", good: "#23b26d", purple: "#7a5bff", blue: "#3d8bff"
};

/* === 通用：水平流程步骤条（SVG） === */
function flowSteps(el, steps, W, H) {
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, el);
  const boxW = 128, boxH = 104, y = 32;
  const n = steps.length;
  const gap = (W - 40 - n * boxW) / (n - 1);
  steps.forEach((s, i) => {
    const x = 20 + i * (boxW + gap);
    const g = vizSvg("g", { style: "animation:vFade .4s ease both;animation-delay:" + (i * .13) + "s" }, svg);
    vizSvg("rect", { x, y, width: boxW, height: boxH, rx: 14, fill: "var(--bg-card)", stroke: s.c, "stroke-width": 2 }, g);
    vizSvg("text", { x: x + boxW / 2, y: y + 24, "text-anchor": "middle", "font-size": "20" }, g).textContent = s.ico;
    vizSvg("text", { x: x + boxW / 2, y: y + 52, "text-anchor": "middle", "font-size": "13.5", "font-weight": "800", fill: "var(--text)" }, g).textContent = s.t;
    vizSvg("text", { x: x + boxW / 2, y: y + 74, "text-anchor": "middle", "font-size": "10", fill: "var(--text-2)", "text-anchor": "middle" }, g).textContent = s.d;
    if (i < n - 1) {
      const cx = x + boxW + gap / 2;
      vizSvg("path", { d: `M${x + boxW + 6} ${y + boxH / 2} h${gap - 12}`, stroke: "var(--line-strong)", "stroke-width": 2, "stroke-dasharray": "6 4", fill: "none" }, g);
      vizSvg("path", { d: `M${x + boxW + gap - 8} ${y + boxH / 2 - 6} l6 6 -6 6`, stroke: "var(--line-strong)", "stroke-width": 2, fill: "none" }, g);
    }
  });
  return svg;
}

/* ============================================================
   第8课 · 训练流水线
   ============================================================ */
AIVIZ.trainingPipeline = function (el) {
  vizClear(el);
  flowSteps(el, [
    { ico: "🌐", t: "预训练", d: "海量文本·预测下一个词", c: VD.primary },
    { ico: "✍️", t: "监督微调 SFT", d: "人工问答样本", c: VD.accent },
    { ico: "💼", t: "RLHF", d: "人类偏好排序", c: VD.warn }
  ], 700, 150);
  vizHint(el, "三阶段：先“学知识”（预训练），再“学会对话”（SFT），最后“学得像人、安全有用”（RLHF）。");
};

/* ============================================================
   第8课 · SFT 演示
   ============================================================ */
AIVIZ.sftDemo = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:10px";
  const pairs = [
    { q: "什么是梯度下降？", a: "梯度下降是一种优化方法：沿着“误差下降最快的方向”逐步调整参数，直到误差最小。" },
    { q: "帮我把这段话翻译成英文", a: "Sure! Please provide the text you'd like translated." }
  ];
  pairs.forEach((p, i) => {
    const box = document.createElement("div");
    box.style.cssText = "border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--bg-card);animation:vFade .4s ease both;animation-delay:" + (i * .15) + "s";
    box.innerHTML = `<div style="font-size:12px;font-weight:800;color:var(--primary);margin-bottom:5px">📥 用户提问</div>
      <div style="font-size:13.5px;color:var(--text);background:var(--bg-soft);border-radius:8px;padding:8px 11px;margin-bottom:8px">${p.q}</div>
      <div style="font-size:12px;font-weight:800;color:var(--accent);margin-bottom:5px">📤 期望回答</div>
      <div style="font-size:13.5px;color:var(--text);background:var(--accent-soft);border-radius:8px;padding:8px 11px">${p.a}</div>`;
    wrap.appendChild(box);
  });
  el.appendChild(wrap);
  vizHint(el, "监督微调用大量“问题→理想回答”样本训练，让只会“接龙”的基础模型学会“有问有答”。");
};

/* ============================================================
   第8课 · RLHF 流程
   ============================================================ */
AIVIZ.rlhfDemo = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px";
  const row1 = document.createElement("div");
  row1.style.cssText = "display:flex;gap:10px;align-items:center";
  row1.innerHTML = `<div style="font-size:12.5px;font-weight:800;color:var(--text-2);flex:none">提问：</div>`;
  const q = document.createElement("div");
  q.textContent = "如何委婉地拒绝同事的加班邀请？";
  q.style.cssText = "flex:1;background:var(--bg-soft);border-radius:9px;padding:9px 12px;font-size:13px;color:var(--text)";
  row1.appendChild(q);
  wrap.appendChild(row1);

  const row2 = document.createElement("div");
  row2.style.cssText = "display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px";
  const ans = [
    { t: "回答A", a: "礼貌说明安排，建议改期。", score: "👍 最受欢迎", c: VD.good },
    { t: "回答B", a: "直接说“不行”。", score: "👎 太生硬", c: VD.danger },
    { t: "回答C", a: "怼回去“你自己加吧”。", score: "👎 不礼貌", c: VD.danger }
  ];
  ans.forEach((a, i) => {
    const b = document.createElement("div");
    b.style.cssText = "border:1.5px solid var(--line);border-radius:11px;padding:11px;background:var(--bg-card);animation:vFade .3s ease both;animation-delay:" + (i * .15) + "s";
    b.innerHTML = `<div style="font-size:11.5px;font-weight:800;color:var(--text-3);margin-bottom:5px">${a.t}</div>
      <div style="font-size:12.5px;color:var(--text);line-height:1.6;margin-bottom:7px">${a.a}</div>
      <div style="font-size:11.5px;font-weight:800;color:${a.c}">${a.score}</div>`;
    row2.appendChild(b);
  });
  wrap.appendChild(row2);
  const note = document.createElement("div");
  note.style.cssText = "padding:11px 13px;border-radius:10px;background:var(--warn-soft);border:1px solid var(--warn-soft);font-size:13px;color:var(--text-2);line-height:1.7";
  note.innerHTML = "<b style='color:var(--text)'>做法：</b>人类给多个回答<b style='color:var(--text)'>排序打分</b> → 训练一个“奖励模型”模拟人类偏好 → 用<b style='color:var(--text)'>强化学习</b>把模型回答推向“更像是被喜欢的那一个”。";
  wrap.appendChild(note);
  el.appendChild(wrap);
};

/* ============================================================
   第9课 · 上下文窗口（工作台）
   ============================================================ */
AIVIZ.contextWindow = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px";
  // 窗口
  const win = document.createElement("div");
  win.style.cssText = "border:3px solid var(--primary);border-radius:14px;background:var(--bg-card);padding:12px;position:relative;overflow:hidden";
  win.innerHTML = `<div style="position:absolute;top:8px;right:12px;font-size:12px;font-weight:800;color:var(--primary)">上下文窗口</div>`;
  const items = ["系统提示", "对话历史…", "用户提问", "模型回答"];
  const tags = [];
  items.forEach((it, i) => {
    const t = document.createElement("span");
    t.textContent = it;
    t.style.cssText = "display:inline-block;margin:18px 6px 6px 0;padding:7px 12px;border-radius:9px;font-size:13px;font-weight:600;background:var(--primary-soft);border:1px solid var(--primary);color:var(--text);flex:none";
    win.appendChild(t);
    tags.push(t);
  });
  wrap.appendChild(win);

  const outside = document.createElement("div");
  outside.style.cssText = "border:2px dashed var(--danger);border-radius:11px;padding:10px 13px;font-size:12.5px;color:var(--danger);background:var(--danger-soft);text-align:center;font-weight:700";
  outside.textContent = "窗口之外 → 模型看不到（超出部分被裁掉/忽略）";
  wrap.appendChild(outside);

  el.appendChild(wrap);
  vizHint(el, "窗口内的内容（系统提示+历史+输入+回答）模型都能“看到”。往左滑入新内容时，最左侧的旧内容会逐步被挤出窗口。");
};

/* ============================================================
   第9课 · 窗口溢出（最旧被挤掉）
   ============================================================ */
AIVIZ.windowOverflow = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:10px";
  const row1 = row("第1轮对话", "还在窗口内 ✓", VD.good, false);
  const row2 = row("第2轮对话", "还在窗口内 ✓", VD.good, false);
  const row3 = row("第3轮对话", "还在窗口内 ✓", VD.good, false);
  const row4 = row("……第100轮……", "💨 超出窗口，被挤出 ✗", VD.danger, true);
  [row1, row2, row3, row4].forEach(r => wrap.appendChild(r));
  el.appendChild(wrap);
  function row(t, status, c, isOut) {
    const d = document.createElement("div");
    d.style.cssText = "display:flex;align-items:center;gap:10px;border:1.5px solid " + (isOut ? "var(--danger)" : "var(--line)") + ";border-radius:10px;padding:10px 12px;background:" + (isOut ? "var(--danger-soft)" : "var(--bg-card)") + ";animation:vFade .35s ease both";
    d.innerHTML = `<span style="font-weight:700;font-size:13.5px;color:var(--text)">${t}</span>
      <span style="margin-left:auto;font-size:12px;font-weight:700;color:${c}">${status}</span>`;
    return d;
  }
  vizHint(el, "对话来回累积，一旦总 token 数量超过窗口上限，最“旧”的对话最先被丢弃。所以聊得越久，越早的内容越容易“失忆”。");
};

/* ============================================================
   第9课 · 大海捞针
   ============================================================ */
AIVIZ.needleHaystack = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:10px";
  // 长文档条带
  const strip = document.createElement("div");
  strip.style.cssText = "position:relative;border:1.5px solid var(--line);border-radius:10px;padding:14px 12px;background:var(--bg-card);overflow:hidden";
  const caption = document.createElement("div");
  caption.style.cssText = "font-size:11px;color:var(--text-3);font-weight:700;margin-bottom:8px";
  caption.textContent = "超长文档 / 对话（如 10 万 token）";
  strip.appendChild(caption);
  // 填色块
  for (let i = 0; i < 60; i++) {
    const c = Math.random() * 255 | 0;
    const bar = document.createElement("span");
    bar.style.cssText = `display:inline-block;width:1.4%;height:26px;margin-right:0.2%;border-radius:3px;background:hsla(${200 + Math.random()*60},60%,60%,.45)`;
    strip.appendChild(bar);
  }
  // 针
  const needle = document.createElement("div");
  needle.style.cssText = "position:absolute;left:47%;top:34px;width:3px;height:60px;background:var(--danger);border-radius:2px;box-shadow:0 0 8px var(--danger)";
  needle.title = "关键信息（针）";
  strip.appendChild(needle);
  wrap.appendChild(strip);
  const note = document.createElement("div");
  note.style.cssText = "padding:10px 13px;border-radius:10px;background:var(--warn-soft);font-size:13px;color:var(--text-2);border:1px solid var(--warn-soft);line-height:1.7";
  note.innerHTML = "<b style='color:var(--text)'>“大海捞针”问题：</b>即使窗口能装下整份长文档，中间的<b style='color:var(--text)'>关键信息（红色竖线）</b>也容易被模型“漏看”或记不准。重要信息请放在开头或结尾。";
  wrap.appendChild(note);
  el.appendChild(wrap);
};

/* ============================================================
   第10课 · 提示词效果对比
   ============================================================ */
AIVIZ.promptIntro = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:12px";
  wrap.appendChild(promptCard("😕 模糊提问", "帮我把这个改一下", "模型难以确定改什么、怎么改？", VD.danger));
  wrap.appendChild(promptCard("😄 清晰提问", "帮我把这段文案改成更口语、更活泼的风格，控制在 80 字内，并加一个可爱的结尾。", "模型目标明确，结果贴合需求", VD.good));
  el.appendChild(wrap);
  function promptCard(t, p, note, c) {
    const b = document.createElement("div");
    b.style.cssText = "border:1.5px solid var(--line);border-radius:12px;padding:14px;background:var(--bg-card)";
    b.innerHTML = `<div style="font-weight:800;font-size:13.5px;color:var(--text);margin-bottom:7px">${t}</div>
      <div style="font-size:12.5px;color:var(--text-2);background:var(--bg-soft);border-radius:9px;padding:9px 11px;line-height:1.7;margin-bottom:9px">${p}</div>
      <div style="font-size:12px;font-weight:700;color:${c}">→ ${note}</div>`;
    return b;
  }
  vizHint(el, "提示越具体，AI 越知道自己该做什么、做到什么程度。");
};

/* ============================================================
   第10课 · 万能公式五要素
   ============================================================ */
AIVIZ.promptFormula = function (el) {
  vizClear(el);
  const items = [
    { k: "角色", v: "你是一名资深营养师", c: VD.primary },
    { k: "任务", v: "为 1500 千卡减脂期做 3 天食谱", c: VD.accent },
    { k: "细节", v: "不吃猪肉、少油、适合上班族", c: VD.warn },
    { k: "示例", v: "给 1 个样例：“早餐：2 个鸡蛋+燕麦”", c: VD.purple },
    { k: "格式", v: "用表格输出，含早/午/晚餐与热量", c: VD.good }
  ];
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:9px";
  items.forEach((it, i) => {
    const r = document.createElement("div");
    r.style.cssText = "display:flex;align-items:center;gap:12px;border:1.5px solid var(--line);border-radius:11px;padding:10px 13px;background:var(--bg-card);animation:vFade .3s ease both;animation-delay:" + (i * .1) + "s";
    const chip = document.createElement("span");
    chip.textContent = it.k;
    chip.style.cssText = `flex:none;width:56px;text-align:center;padding:5px 8px;border-radius:9px;background:${it.c}22;color:${it.c};font-weight:800;font-size:13px`;
    const txt = document.createElement("span");
    txt.textContent = it.v;
    txt.style.cssText = "font-size:13.5px;color:var(--text)";
    r.appendChild(chip); r.appendChild(txt);
    wrap.appendChild(r);
  });
  el.appendChild(wrap);
};

/* ============================================================
   第10课 · 对比 demo（拖动？）简化：展示好/坏提示
   ============================================================ */
AIVIZ.promptCompare = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid;grid-template-columns:1fr;gap:12px";
  const rows = [
    { bad: "帮我想个标题", good: "为一篇讲“AI 如何改变教育”的文章想 5 个吸引人的标题，语气活泼，15 字以内" },
    { bad: "写代码", good: "写一个 Python 函数：输入列表，返回去除重复并保持顺序的新列表，并加注释" }
  ];
  rows.forEach(r => {
    const box = document.createElement("div");
    box.style.cssText = "border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--bg-card)";
    box.innerHTML = `<div style="display:flex;gap:10px;padding:11px 13px;border-bottom:1px solid var(--line)">
        <div style="flex:1;background:var(--danger-soft);border-radius:9px;padding:9px 11px;font-size:12.5px;color:var(--text);border-left:3px solid var(--danger)"><b style="color:var(--danger)">差提示：</b>${r.bad}</div>
      </div>
      <div style="padding:11px 13px;background:var(--good-soft)"><b style="color:var(--good);font-size:12px">好提示：</b><div style="font-size:13px;color:var(--text);margin-top:4px">${r.good}</div></div>`;
    wrap.appendChild(box);
  });
  el.appendChild(wrap);
  vizHint(el, "好提示通常包含：具体目标 + 约束条件 + 期望格式。差提示则过于笼统。");
};

/* ============================================================
   第11课 · RAG：为什么要检索（幻觉痛点）
   ============================================================ */
AIVIZ.ragPain = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:12px";
  const left = document.createElement("div");
  left.style.cssText = "border:1.5px solid var(--danger);border-radius:12px;padding:14px;background:var(--danger-soft)";
  left.innerHTML = `<div style="font-weight:800;font-size:13.5px;color:var(--danger);margin-bottom:6px">❌ 直接问大模型</div>
    <div style="font-size:12.5px;color:var(--text);line-height:1.7">“本公司最新的季度营收是多少？”<br><br>
    <span style="color:var(--danger);font-weight:700">不知道 → 只能“编”一个数字（幻觉）</span></div>`;
  const right = document.createElement("div");
  right.style.cssText = "border:1.5px solid var(--good);border-radius:12px;padding:14px;background:var(--good-soft)";
  right.innerHTML = `<div style="font-weight:800;font-size:13.5px;color:var(--good);margin-bottom:6px">✅ RAG：先查再答</div>
    <div style="font-size:12.5px;color:var(--text);line-height:1.7">先从资料库检索到相关财报片段 →<br>基于该片段回答<br><br>
    <span style="color:var(--good);font-weight:700">准确、且能注明来源</span></div>`;
  wrap.appendChild(left); wrap.appendChild(right);
  el.appendChild(wrap);
  vizHint(el, "模型只会“闭卷考试”时难免瞎编；RAG 让它“开卷考试”，先把资料翻出来再作答。");
};

/* ============================================================
   第11课 · RAG 流水线
   ============================================================ */
AIVIZ.ragPipeline = function (el) {
  vizClear(el);
  flowSteps(el, [
    { ico: "📄", t: "切块+向量化", d: "文档→多个向量片段", c: VD.primary },
    { ico: "🗂️", t: "存向量库", d: "离线建索引", c: VD.blue },
    { ico: "🔍", t: "检索 Top-K", d: "问题向量相近片段", c: VD.warn },
    { ico: "🧠", t: "拼接+生成", d: "资料塞进提示给模型", c: VD.accent }
  ], 720, 170);
  vizHint(el, "整体思路：先“离线”把资料向量化存好；“在线”时先把问题转向量检索出相关资料，再把“资料+问题”一起交给模型生成回答。");
};

/* ============================================================
   第11课 · 向量检索示意
   ============================================================ */
AIVIZ.ragVector = function (el) {
  vizClear(el);
  const W = 680, H = 260;
  const svg = vizSvg("svg", { viewBox: `0 0 ${W} ${H}`, style: "width:100%;height:auto;display:block" }, el);
  vizSvg("rect", { x: 0, y: 0, width: W, height: H - 30, rx: 12, fill: "var(--bg-soft)", stroke: "var(--line)" }, svg);
  // 资料点
  const pts = [];
  for (let i = 0; i < 34; i++) {
    const x = 30 + Math.random() * (W - 60), y = 26 + Math.random() * (H - 100);
    pts.push({ x, y });
    vizSvg("circle", { cx: x, cy: y, r: 5, fill: "var(--line-strong)", opacity: 0.7 }, svg);
  }
  // 查询点中心
  const qx = W / 2, qy = H / 2 - 20;
  vizSvg("circle", { cx: qx, cy: qy, r: 9, fill: VD.primary }, svg);
  vizSvg("text", { x: qx, y: qy + 30, "text-anchor": "middle", "font-size": "12", "font-weight": "800", fill: VD.primary }, svg).textContent = "你的问题向量";
  // 最近的几个（按与查询点距离近似选）
  const nearby = pts.slice(0, 4);
  const chosen = [pts[3], pts[7], pts[12], pts[21], pts[28]];
  chosen.forEach(p => {
    vizSvg("line", { x1: qx, y1: qy, x2: p.x, y2: p.y, stroke: VD.accent, "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
    vizSvg("circle", { cx: p.x, cy: p.y, r: 8, fill: VD.accent, stroke: "var(--bg-card)", "stroke-width": 2 }, svg);
  });
  vizSvg("text", { x: 0, y: H - 6, "font-size": "11.5", fill: "var(--text-3)" }, svg).textContent = "● 资料向量        ● 检索命中的最相似片段（Top-K）";
  el.appendChild(svg);
  vizHint(el, "把你的问题也变成向量，放在同一空间里，用余弦相似度找最接近的几段资料——这就是“向量检索”。");
};

/* ============================================================
   第12课 · Agent 循环
   ============================================================ */
AIVIZ.agentLoop = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:10px";
  const row = document.createElement("div");
  row.style.cssText = "display:flex;justify-content:space-between;gap:8px;align-items:stretch;flex-wrap:wrap";
  const steps = [
    { ico: "🎯", t: "目标/感知", d: "拆解任务、定计划", c: VD.primary },
    { ico: "🧠", t: "思考", d: "决定下一步做什么", c: VD.purple },
    { ico: "🔧", t: "行动", d: "调工具/API/发邮件", c: VD.accent },
    { ico: "👁️", t: "观察", d: "看结果对不对", c: VD.warn }
  ];
  steps.forEach((s, i) => {
    const b = document.createElement("div");
    b.style.cssText = "flex:1;min-width:130px;border:1.5px solid " + s.c + ";border-radius:12px;padding:12px;background:var(--bg-card);text-align:center;animation:vFade .35s ease both;animation-delay:" + (i * .12) + "s";
    b.innerHTML = `<div style="font-size:22px">${s.ico}</div>
      <div style="font-weight:800;font-size:13.5px;color:var(--text);margin:4px 0 3px">${s.t}</div>
      <div style="font-size:11.5px;color:var(--text-2);line-height:1.5">${s.d}</div>`;
    row.appendChild(b);
  });
  wrap.appendChild(row);
  const loop = document.createElement("div");
  loop.style.cssText = "text-align:center;padding:8px;border-radius:10px;background:var(--bg-soft);font-size:12.5px;color:var(--text-2);font-weight:600";
  loop.textContent = "⇄ 循环：观察结果 → 调整 → 再行动，直到任务完成";
  wrap.appendChild(loop);
  el.appendChild(wrap);
  vizHint(el, "Agent 不是“一问一答”，而是自己进入“目标→思考→行动→观察”的循环，迭代推进直到完成。");
};

/* ============================================================
   第12课 · 工具调用
   ============================================================ */
AIVIZ.toolUse = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:10px";
  const tools = ["🔍 联网搜索", "🗄️ 数据库查询", "📧 发送邮件", "🐍 运行代码", "📅 日历日程", "🌐 调用 API"];
  const chips = document.createElement("div");
  chips.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
  tools.forEach(t => {
    const c = document.createElement("span");
    c.textContent = t;
    c.style.cssText = "padding:8px 13px;border-radius:10px;background:var(--accent-soft);border:1px solid var(--accent);color:var(--text);font-size:13px;font-weight:600";
    chips.appendChild(c);
  });
  wrap.appendChild(chips);
  const note = document.createElement("div");
  note.style.cssText = "padding:11px 13px;border-radius:10px;background:var(--bg-soft);border:1px solid var(--line);font-size:13px;color:var(--text-2);line-height:1.7";
  note.innerHTML = "模型是<b style='color:var(--text)'>大脑</b>（思考调哪个工具、传什么参数），工具是<b style='color:var(--text)'>手脚</b>（实际执行）。平台执行后把结果回传给模型继续推理。";
  wrap.appendChild(note);
  el.appendChild(wrap);
};

/* ============================================================
   第13课 · 多媒体形态
   ============================================================ */
AIVIZ.multimodal = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap";
  const mods = [
    { ico: "🔤", t: "文字" }, { ico: "🖼️", t: "图片" }, { ico: "🎵", t: "音频" },
    { ico: "🎬", t: "视频" }, { ico: "💻", t: "代码" }
  ];
  mods.forEach((m, i) => {
    const b = document.createElement("div");
    b.style.cssText = `width:92px;height:92px;border-radius:16px;border:2px solid var(--line);background:var(--bg-card);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;animation:vFade .4s ease both;animation-delay:${i * .1}s;transition:.2s;cursor:pointer`;
    b.onmouseenter = () => { b.style.borderColor = "var(--primary)"; b.style.transform = "translateY(-3px)"; };
    b.onmouseleave = () => { b.style.borderColor = ""; b.style.transform = ""; };
    b.innerHTML = `<div style="font-size:30px">${m.ico}</div><div style="font-size:12.5px;font-weight:700;color:var(--text-2)">${m.t}</div>`;
    wrap.appendChild(b);
  });
  el.appendChild(wrap);
  vizHint(el, "模态 = 信息的呈现形式。能同时理解和生成多种模态的模型，就是“多模态模型”。");
};

/* ============================================================
   第13课 · 多模态流程（统一成向量）
   ============================================================ */
AIVIZ.multimodalFlow = function (el) {
  vizClear(el);
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap";
  const srcs = [
    { ico: "🖼️", t: "图片", p: "切patch→向量" },
    { ico: "🎵", t: "音频", p: "转特征向量" },
    { ico: "🔤", t: "文字", p: "token→向量" }
  ];
  srcs.forEach(s => {
    const b = document.createElement("div");
    b.style.cssText = "border:1.5px solid var(--line);border-radius:11px;padding:10px 13px;background:var(--bg-card);text-align:center;min-width:110px";
    b.innerHTML = `<div style="font-size:20px">${s.ico}</div>
      <div style="font-weight:700;font-size:12px;color:var(--text);margin:3px 0">${s.t}</div>
      <div style="font-size:10.5px;color:var(--text-3)">${s.p}</div>`;
    wrap.appendChild(b);
  });
  const arr = document.createElement("div");
  arr.textContent = "➜ 统一成向量";
  arr.style.cssText = "font-size:13px;color:var(--primary);font-weight:800;padding:6px";
  wrap.appendChild(arr);
  const core = document.createElement("div");
  core.style.cssText = "border:2px solid var(--primary);border-radius:12px;padding:12px 16px;background:var(--primary-soft);text-align:center";
  core.innerHTML = `<div style="font-size:22px">🧠</div><div style="font-weight:800;font-size:13px;color:var(--primary)">同一个 Transformer</div><div style="font-size:10.5px;color:var(--text-2)">同一套注意力机制，跨模态理解</div>`;
  wrap.appendChild(core);
  el.appendChild(wrap);
  vizHint(el, "关键思想：把所有模态都“翻译”成向量，喂给同一个 Transformer——这就是多模态模型能“看图说话、听声写字”的原因。");
};

/* ============================================================
   第13课 · 多模态应用场景
   ============================================================ */
AIVIZ.multimodalUse = function (el) {
  vizClear(el);
  const uses = [
    { ico: "🩺", t: "医学影像", d: "看 CT/报告辅助诊断" },
    { ico: "📸", t: "视觉问答", d: "问“图里有几个人”" },
    { ico: "🎬", t: "文生视频", d: "一句话生成短片" },
    { ico: "🎨", t: "设计/创作", d: "文字描述生成图稿" }
  ];
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px";
  uses.forEach((u, i) => {
    const b = document.createElement("div");
    b.style.cssText = "border:1.5px solid var(--line);border-radius:12px;padding:13px;background:var(--bg-card);animation:vFade .35s ease both;animation-delay:" + (i * .1) + "s";
    b.innerHTML = `<div style="font-size:24px">${u.ico}</div>
      <div style="font-weight:800;font-size:13.5px;color:var(--text);margin:6px 0 3px">${u.t}</div>
      <div style="font-size:12px;color:var(--text-2);line-height:1.5">${u.d}</div>`;
    wrap.appendChild(b);
  });
  el.appendChild(wrap);
};
