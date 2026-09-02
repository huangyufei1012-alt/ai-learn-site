/* ============================================================
   AI 学堂 · 复习测验模块
   按模块出题，支持即时判分、错题解析与成绩记录(localStorage)。
   依赖全局：COURSE（数据）、window.Store（进度与成绩存储，见 app.js）
   ============================================================ */

window.Quiz = (function () {

  /* ---------- 模块补充题库（在课程自带 miniquiz 之外再加几道） ---------- */
  var EXTRA = {
    m1: [
      { q: "传统编程与机器学习的本质区别是什么？",
        options: ["传统编程也从数据中总结规律", "机器学习从数据里自己总结规律，而非人工写死规则", "两者完全一样", "机器学习永远不需要数据"],
        answer: 1, explain: "传统编程是“人写规则”，机器学习是“机器看例子自己总结规则”——这是两者最本质的区别。" },
      { q: "深度学习最核心的技术特征是什么？",
        options: ["使用多层神经网络", "只能处理纯文本", "不需要大量数据", "必须人工设计所有特征"],
        answer: 0, explain: "深度学习用“多层神经网络”逐层提取特征，这是它区别于更早期机器学习方法的关键。" },
      { q: "下面哪个最能体现“过拟合”的现象？",
        options: ["模型背熟了训练样本，面对新数据表现反而变差", "模型在测试集上表现很好", "模型训练时间太长", "模型参数量太少"],
        answer: 0, explain: "过拟合 = 把训练数据“背死”，导致连其中的噪声也记住，换新数据就失灵。" },
      { q: "有监督学习里，训练数据最重要的特点是？",
        options: ["完全没有标注", "每条数据带“标准答案”标签", "只有图片没有文字", "数量越少越好"],
        answer: 1, explain: "有监督学习的样本都带标签（标准答案），机器以“纠错”方式学习。" }
    ],
    m2: [
      { q: "Embedding 向量让“语义相近”的词在向量空间中处于什么关系？",
        options: ["彼此距离更远", "彼此非常靠近", "完全随机关联", "长度变为 0"],
        answer: 1, explain: "Embedding 的核心目标正是：语义相近的对象在向量空间里彼此靠近，距离越近越相似。" },
      { q: "“苹果”和“水果”的词向量，通常是什么关系？",
        options: ["完全重合", "互为相反数", "非常接近", "毫无关系"],
        answer: 2, explain: "因为语义相近，“苹果”与“水果”的向量在向量空间中距离很近。" },
      { q: "模型里的 Token（词元）是什么？",
        options: ["一种神经网络层", "一种损失函数", "模型处理文字的最小单位", "模型训练的次数"],
        answer: 2, explain: "Token 是模型处理文本的最小单位（词、词根、字或符号），计费与上下文窗口都按它算。" },
      { q: "注意力机制主要解决了什么问题？",
        options: ["让模型处理当前词时能参考句中相关的词", "让模型读得更快", "让模型不再需要参数", "直接去掉上下文"],
        answer: 0, explain: "注意力机制按权重“关注”句中其他相关词，是理解长文本、抓重点的核心手段。" }
    ],
    m3: [
      { q: "Transformer 架构中真正的核心机制是什么？",
        options: ["循环结构", "注意力机制", "卷积核", "决策树"],
        answer: 1, explain: "Transformer 靠“注意力机制”处理序列，这是它取代 RNN 成为大模型地基的关键。" },
      { q: "“预训练”阶段主要是在做什么？",
        options: ["让模型学会画图", "在超大规模文本上预测下一个词，吸收知识", "缩小模型体积", "只用几段对话"],
        answer: 1, explain: "预训练用海量文本做“预测下一个词”的任务，让模型在这个过程中吸收语言规律与世界知识。" },
      { q: "上下文窗口（Context Window）指的是什么？",
        options: ["模型一次能同时“看到”的 token 上限", "屏幕的显示区域", "训练数据文件的大小", "模型响应的速度"],
        answer: 0, explain: "上下文窗口限定模型一次能处理的 token 数量，超出部分模型根本看不到（也就记不住）。" },
      { q: "RLHF 主要用来解决什么问题？",
        options: ["加速分词", "让模型回答更符合人类偏好", "减少模型参数量", "完全去除人工参与"],
        answer: 1, explain: "RLHF 用人类对回答的偏好排序训练奖励模型，再强化学习调优，让模型“说人话、合人意”。" }
    ],
    m4: [
      { q: "提示词工程里的“Few-shot（少样本）”指的是什么？",
        options: ["不给任何示例", "给几万个示例", "在提示里给几个示例，让模型照着做", "把提示写得很长"],
        answer: 2, explain: "Few-shot 指在提示里放几个输入-输出样例，让模型模仿其风格与结构来生成。" },
      { q: "RAG（检索增强生成）最主要的价值是？",
        options: ["让模型跑得更快", "压缩模型体积", "生成图片", "检索外部资料拼进提示再回答，减少幻觉"],
        answer: 3, explain: "RAG 先检索、后生成，让模型基于最新/特定资料回答，从而显著减少编造与过时信息。" },
      { q: "AI Agent（智能体）最核心的特征是？",
        options: ["只能回答选择题", "能自主拆解目标、调用工具、观察结果并迭代完成", "必须联网才能运行", "完全不能使用工具"],
        answer: 1, explain: "智能体具备“目标拆解 + 工具调用 + 结果观察 + 迭代”的自主闭环，能独立完成复杂任务。" },
      { q: "Temperature 参数调得越高，模型输出通常越？",
        options: ["越稳定、越保守", "越多样、越发散", "越快", "完全不变"],
        answer: 1, explain: "Temperature 越高，生成随机性越大、越多样发散；越低则越稳定保守。" }
    ]
  };

  /* ---------- 工具 ---------- */
  function shuffleArr(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // 打乱单题选项，返回 {options, answer}（answer 为打乱后的正确下标）
  function shuffleOptions(opts, correctIdx) {
    var idxMap = opts.map(function (_, i) { return i; });
    shuffleArr(idxMap);
    var shuffled = idxMap.map(function (i) { return opts[i]; });
    var newCorrect = idxMap.indexOf(correctIdx);
    return { options: shuffled, answer: newCorrect };
  }

  /* ---------- 生成某模块的完整题目 ---------- */
  function moduleQuiz(mid) {
    var mod = COURSE.modules.find(function (m) { return m.id === mid; });
    if (!mod) return [];
    var qs = [];
    mod.lessons.forEach(function (lid) {
      var L = COURSE.lessons[lid];
      if (!L) return;
      (L.blocks || []).forEach(function (b) {
        if (b.type === "miniquiz") {
          qs.push({ q: b.q, options: b.options, answer: b.answer, explain: b.explain, lesson: L.title });
        }
      });
    });
    (EXTRA[mid] || []).forEach(function (e) {
      qs.push({ q: e.q, options: e.options, answer: e.answer, explain: e.explain, lesson: mod.title });
    });
    // 打乱题目顺序 + 每题的选项顺序
    shuffleArr(qs);
    qs.forEach(function (item) {
      var so = shuffleOptions(item.options, item.answer);
      item.options = so.options;
      item.answer = so.answer;
    });
    return qs;
  }

  var LETTERS = ["A", "B", "C", "D", "E", "F"];

  /* ---------- 模块选择页 ---------- */
  function renderPicker(root) {
    var bestTotal = COURSE.modules.filter(function (m) {
      return !!(window.Store && Store.best(m.id));
    }).length;
    var html = [
      '<div class="quiz-hero">',
      '<h1>📝 复习测验</h1>',
      '<p>按模块检测掌握程度，答完即时判分，错题有解析。全部模块成绩会记录下来，方便你回头查漏补缺。</p>',
      '</div>',
      '<div class="quiz-modules">'
    ].join("");
    COURSE.modules.forEach(function (m) {
      var n = moduleQuiz(m.id).length;
      var best = window.Store ? Store.best(m.id) : null;
      var bestHtml = best != null
        ? '<span style="font-size:11.5px;color:var(--text-3);">最高 ' + best + ' 分</span>'
        : '<span style="font-size:11.5px;color:var(--good);">未作答</span>';
      html += '<button class="quiz-mod" data-mid="' + m.id + '">'
        + '<div class="qm-ico" style="background:' + m.color + '">' + m.icon + '</div>'
        + '<h4>' + m.title + '</h4>'
        + '<p>' + m.shorts + '</p>'
        + '<span class="qm-btn">' + n + ' 题 · 开始 →</span><br>'
        + bestHtml
        + '</button>';
    });
    html += '</div>';
    html += bestTotal ? '<p style="text-align:center;margin-top:20px;font-size:13px;color:var(--text-3)">已完成 ' + bestTotal + '/' + COURSE.modules.length + ' 个模块的测验</p>' : "";
    root.innerHTML = html;
    Array.prototype.forEach.call(root.querySelectorAll(".quiz-mod"), function (btn) {
      btn.addEventListener("click", function () {
        location.hash = "#/quiz/" + btn.getAttribute("data-mid");
      });
    });
  }

  /* ---------- 单题渲染 ---------- */
  function renderQuestion(root, state) {
    var mod = state.mod;
    var item = state.qs[state.i];
    var total = state.qs.length;
    var pct = Math.round(((state.i) / total) * 100); // 进度条按“已完成”计，第一题为 0%
    root.innerHTML = [
      '<div class="q-session">',
      '<div class="q-progressbar"><i style="width:' + pct + '%"></i></div>',
      '<div class="q-head">',
      '<span class="q-count">第 ' + (state.i + 1) + ' / ' + total + ' 题</span>',
      '<span class="q-module">' + mod.title + '</span>',
      '<button class="icon-btn q-exit" title="退出测验">✕</button>',
      '</div>',
      '<div class="q-body">',
      '<div class="q-question">' + item.q + '</div>',
      '<div class="q-options" id="qOpts"></div>',
      '<div class="q-feedback" id="qFb"></div>',
      '<button class="q-next" id="qNext" style="display:none">下一题 →</button>',
      '</div>',
      '</div>'
    ].join("");

    var optsEl = root.querySelector("#qOpts");
    var fbEl = root.querySelector("#qFb");
    var nextEl = root.querySelector("#qNext");

    var answered = false;
    item.options.forEach(function (opt, i) {
      var btn = document.createElement("button");
      btn.className = "q-option";
      btn.innerHTML = '<span class="q-letter">' + LETTERS[i] + '</span><span>' + opt + '</span>';
      btn.addEventListener("click", function () {
        if (answered) return;
        answered = true;
        var ok = (i === item.answer);
        if (ok) state.score++;
        Array.prototype.forEach.call(optsEl.children, function (c, j) {
          c.style.pointerEvents = "none";
          if (j === item.answer) c.classList.add("correct");
          if (j === i && !ok) c.classList.add("wrong");
        });
        fbEl.classList.add("show", ok ? "ok" : "bad");
        fbEl.innerHTML = (ok
          ? '<div class="qf-title">✅ 回答正确！</div>'
          : '<div class="qf-title">❌ 回答错误</div>')
          + '<span style="color:var(--text-2)">' + (item.explain || "") + '</span>';
        nextEl.style.display = "inline-flex";
        if (!ok) {
          state.wrongs.push({ item: item, chosen: item.options[i] });
        }
      });
      optsEl.appendChild(btn);
    });

    nextEl.addEventListener("click", function () {
      state.i++;
      if (state.i >= total) renderResult(root, state);
      else renderQuestion(root, state);
    });

    // 退出按钮
    var exitBtn = root.querySelector(".q-exit");
    exitBtn.addEventListener("click", function () {
      location.hash = "#/quiz";
    });
  }

  /* ---------- 结果页 ---------- */
  function renderResult(root, state) {
    var mod = state.mod;
    var total = state.qs.length;
    var score = state.score;
    var pct = Math.round((score / total) * 100);
    // 记录最高分
    if (window.Store) Store.setBest(mod.id, pct);
    var C = 2 * Math.PI * 62; // 圆环周长(r=62)
    var off = C * (1 - pct / 100);
    var msg, emoji;
    if (pct === 100) { msg = "满分！你就是 AI 学霸 🏆"; emoji = "🏆"; }
    else if (pct >= 80) { msg = "掌握得很棒，继续保持！"; emoji = "🌟"; }
    else if (pct >= 60) { msg = "基础不错，再复习下薄弱点～"; emoji = "👍"; }
    else { msg = "别灰心，回去把这一模块的课再学一遍吧！"; emoji = "💪"; }

    var html = [
      '<div class="q-session"><div class="q-result">',
      '<div class="q-score-ring">',
      '<svg width="150" height="150" viewBox="0 0 150 150">',
      '<circle cx="75" cy="75" r="62" fill="none" stroke="var(--bg-soft)" stroke-width="13"/>',
      '<circle cx="75" cy="75" r="62" fill="none" stroke="var(--primary)" stroke-width="13" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '" transform="rotate(-90 75 75)"/>',
      '</svg>',
      '<div class="q-score-txt"><b>' + pct + '</b><span>正确率</span></div>',
      '</div>',
      '<h2>' + emoji + ' ' + msg + '</h2>',
      '<div class="qr-sub">' + mod.title + ' · 答对 ' + score + ' / ' + total + ' 题</div>',
      '<div class="q-actions">',
      '<button class="btn btn-primary" id="retry">↻ 再测一次</button>',
      '<button class="btn btn-ghost" id="backQuiz">全部测验</button>',
      '</div>'
    ].join("");

    if (state.wrongs.length) {
      html += '<div class="q-review-list"><h3>错题回顾</h3>';
      state.wrongs.forEach(function (w) {
        html += '<div class="qr-item">'
          + '<div class="qri-q">' + w.item.q + '</div>'
          + '<div class="qri-ans bad">你的答案：<b>' + w.chosen + '</b></div>'
          + '<div class="qri-ans ok">正确答案：<b>' + w.item.options[w.item.answer] + '</b></div>'
          + '<div class="qri-expl">💡 ' + (w.item.explain || "") + '</div>'
          + '</div>';
      });
      html += '</div>';
    }
    html += '</div></div>';
    root.innerHTML = html;

    root.querySelector("#retry").addEventListener("click", function () {
      state.i = 0; state.score = 0; state.wrongs = [];
      state.qs = moduleQuiz(state.mod.id);
      renderQuestion(root, state);
    });
    root.querySelector("#backQuiz").addEventListener("click", function () {
      location.hash = "#/quiz";
    });
  }

  /* ---------- 启动某个模块的测验 ---------- */
  function start(root, mid) {
    var mod = COURSE.modules.find(function (m) { return m.id === mid; });
    if (!mod) { renderPicker(root); return; }
    var state = {
      mod: mod,
      qs: moduleQuiz(mid),
      i: 0,
      score: 0,
      wrongs: []
    };
    if (!state.qs.length) { renderPicker(root); return; }
    renderQuestion(root, state);
  }

  return {
    renderPicker: renderPicker,
    start: start,
    moduleQuiz: moduleQuiz
  };
})();
