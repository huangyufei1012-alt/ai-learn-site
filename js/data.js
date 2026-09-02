/* ============================================================
   AI 学堂 · 数据汇总
   合并各模块课程数据与术语表，暴露 window.COURSE
   ============================================================ */

window.COURSE = {
  meta: {
    name: "AI 学堂",
    sub: "从小白到入门",
    desc: "零基础学会 AI 核心概念"
  },
  modules: [
    { id: "m1", title: "AI 入门", icon: "🎓", color: "#7b5bff", shorts: "认识人工智能与机器学习", lessons: ["l1", "l2", "l3"] },
    { id: "m2", title: "让机器理解文字", icon: "🔤", color: "#3d8bff", shorts: "文字如何变成机器能懂的数字", lessons: ["l4", "l5", "l6"] },
    { id: "m3", title: "大语言模型", icon: "🧠", color: "#5b6cff", shorts: "ChatGPT 背后的核心架构", lessons: ["l7", "l8", "l9"] },
    { id: "m4", title: "动手用好 AI", icon: "🚀", color: "#00b8a9", shorts: "把 AI 用起来的实用技能", lessons: ["l10", "l11", "l12", "l13"] }
  ],
  lessons: {},
  glossary: window.__GLOSSARY || []
};

// 合并各模块课程
COURSE.lessons = Object.assign(
  {},
  window.__L1 || {},
  window.__L2 || {},
  window.__L3 || {},
  window.__L4 || {}
);

// 派生辅助
COURSE.lessonOfModule = {};
COURSE.modules.forEach(function (m) {
  m.lessons.forEach(function (lid) {
    COURSE.lessonOfModule[lid] = m;
  });
});
