/* ============================================================
   进阶学习路线 · 数据
   8 个开源学习项目 → 5 个阶段编排
   与本站 13 节课衔接：学完本站入门课之后，按此路线进阶
   ============================================================ */
(function () {
  "use strict";

  /* 阶段编排说明：
     0 → 拓宽与地图（整条路线参考）
     1 → 生成式 AI 应用入门（微软 21 课）
     2 → LLM 应用实战：RAG（Datawhale）
     3 → Agent 深度（手搓 + 框架课程）
     4 → 模型原理选修（从零实现）
  */
  var ROADMAP = [
    {
      id: "s0",
      stage: "第 0 阶段",
      title: "整条路线的地图与底色",
      color: "#7c6ff0",
      icon: "🧭",
      desc: "先把「地图」和「底色」打好：一份不断更新的中文 Agent 学习地图，一套和本站互补的 30 节可视化通识课。这两份不用逐页啃，当作随时翻阅的参照与补充。",
      items: [
        {
          proj: "WenyuChiou/awesome-agentic-ai-zh",
          courseId: "agentic-map",
          url: "https://github.com/WenyuChiou/awesome-agentic-ai-zh",
          icon: "🗺️",
          name: "awesome-agentic-ai-zh",
          alias: "Agent 中文学习地图",
          tag: "路线地图",
          level: "全程参照",
          levelCls: "mid",
          iconBg: "var(--accent-soft)",
          use: "三语（简中/繁中/英）的 Agent 学习路线图：8 个主题阶段 + 阶段0准备 + 收尾项目，附带 240+ 精选资源与阶段练习。",
          topics: ["LLM 基础", "提示词工程", "RAG", "Agent 框架", "多智能体", "评测与落地"],
          pre: "无特殊前置，和本站课程并行翻阅即可",
          gain: "清楚知道 Agent 学习全貌、每阶段该学什么、该读哪些资源",
          linkNote: "推荐理由：把碎片资源串成一条结构化路线，本站「进阶路线」的整体框架也参考了它的分层思路。"
        },
        {
          proj: "buynao/aipath",
          courseId: "aipath",
          url: "https://github.com/buynao/aipath",
          icon: "🎓",
          name: "aipath",
          alias: "AI 通识课 · 30 课",
          tag: "通识课程",
          level: "可并行",
          levelCls: "alt",
          iconBg: "var(--warn-soft)",
          use: "面向绝对零基础的互动式 AI 通识课：6 个阶段 30 节课，不堆公式、不讲黑话，用可视化与交互演示从神经网络讲到 GPT。",
          topics: ["神经网络", "反向传播", "语言模型", "Transformer", "GPT"],
          pre: "无前置，与「AI 学堂」课程互为补充",
          gain: "用另一种讲法把同批概念再学一遍，理解更牢；也是本站交互演示设计语言的参考来源",
          linkNote: "与本站关系：同属「可视化通识」路线，风格互补，可交叉学习。"
        }
      ]
    },
    {
      id: "s1",
      stage: "第 1 阶段",
      title: "生成式 AI 应用入门",
      color: "#ff7a59",
      icon: "🚀",
      desc: "学完本站四个模块后，你已经有概念地图。这一阶段用微软官方 21 课，把概念变成「能动手调 API 构建的应用」：提示词 → 文本 → 聊天 → 搜索 → Function Calling。",
      items: [
        {
          proj: "microsoft/generative-ai-for-beginners",
          courseId: "microsoft-genai",
          url: "https://github.com/microsoft/generative-ai-for-beginners",
          icon: "🟦",
          name: "generative-ai-for-beginners",
          alias: "生成式 AI 入门 · 微软 21 课",
          tag: "体系课程",
          level: "必学主线",
          levelCls: "core",
          iconBg: "var(--primary-soft)",
          use: "微软云顾问团队出品的生成式 AI 入门课程（Python / TypeScript 双语、含 50+ 语言翻译）。从 LLM 原理讲到动手构建应用，课程分「概念 Learn」和「动手 Build」两类。",
          topics: [
            "提示词工程（04-05）",
            "文本/聊天应用（06-07）",
            "Embedding 搜索（08）",
            "Function Calling（11）",
            "RAG 与向量库（15）",
            "AI Agent（17）"
          ],
          pre: "建议先学完本站全部 4 模块 13 节课",
          gain: "能从零调用 API 搭出文本生成、聊天、向量搜索等真实应用",
          linkNote: "衔接：本站第 10-11 课讲了提示词与 Agent 基础，这里用真实代码把它落地。"
        }
      ]
    },
    {
      id: "s2",
      stage: "第 2 阶段",
      title: "LLM 应用实战：知识库与 RAG",
      color: "#34a853",
      icon: "📚",
      desc: "本站第 4、11 课讲过 Embedding 向量和 RAG 概念。这一阶段进入实战：用 Datawhale 的教程亲手搭一个「个人知识库助手」，把文档处理 → 向量化 → 向量数据库 → 检索问答 → 评测优化整条链路做一遍。",
      items: [
        {
          proj: "datawhalechina/llm-universe",
          courseId: "llm-universe",
          url: "https://github.com/datawhalechina/llm-universe",
          icon: "🐋",
          name: "llm-universe",
          alias: "动手学大模型应用开发 · Datawhale",
          tag: "实战教程",
          level: "必学主线",
          levelCls: "core",
          iconBg: "var(--good-soft)",
          use: "面向小白开发者的大模型应用开发教程：基于「个人知识库助手」项目，通过一个完整实战掌握 LLM 开发核心技能。支持国产大模型 API 统一封装。",
          topics: [
            "LLM API 调用",
            "文档读取/清洗/切片",
            "Embedding API",
            "向量数据库搭建",
            "RAG 检索问答链",
            "Streamlit 部署",
            "检索/生成评测优化"
          ],
          pre: "基础 Python 语法 + 本站 Embedding/RAG 概念",
          gain: "独立搭出带知识库的问答应用，并会评测、优化检索与生成效果",
          linkNote: "衔接：本站第 4 课（Embedding）、第 11 课（RAG）在这里变成能跑的代码。"
        }
      ]
    },
    {
      id: "s3",
      stage: "第 3 阶段",
      title: "Agent 深度：从手搓到框架",
      color: "#1a73e8",
      icon: "🤖",
      desc: "这是最「硬核也最上头」的一阶。先用 shareAI-lab 从 0 到 1 手搓一个迷你 Claude Code，把 Agent Loop、工具、权限、记忆、上下文压缩这些内功练扎实；再用 Hugging Face 官方课程学主流框架、评测与可观测性，最后做认证项目。",
      items: [
        {
          proj: "shareAI-lab/learn-claude-code",
          courseId: "claude-code",
          url: "https://github.com/shareAI-lab/learn-claude-code",
          icon: "⚙️",
          name: "learn-claude-code",
          alias: "手搓 Agent Harness · 17 章",
          tag: "源码实战",
          level: "必学主线",
          levelCls: "core",
          iconBg: "var(--danger-soft)",
          use: "从 0 到 1 手搓一个 nano Claude Code（Agent Harness），核心观点「Agent = 模型 + 外壳」。一个机制一章、增量构建，每章附可运行 Python 代码与中文注释。",
          topics: [
            "Agent Loop（s01）",
            "Tool Use（s02）",
            "Permission 权限（s03）",
            "Hooks 钩子（s04）",
            "Todo 计划（s05）",
            "Context Compact（s08）",
            "Memory 记忆（s09）",
            "MCP / 团队 / 调度（s14/13/12）"
          ],
          pre: "Python 基础 + 理解 LLM 对话接口",
          gain: "亲手写出一个能跑的最小 Agent，彻底搞懂 Agent 产品的内部机制",
          linkNote: "衔接：本站第 11 课讲过 Agent 循环，这里把它变成 200 行真实代码。"
        },
        {
          proj: "huggingface/agents-course",
          courseId: "hf-agents",
          url: "https://github.com/huggingface/agents-course",
          icon: "🤗",
          name: "agents-course",
          alias: "Hugging Face Agents 课程",
          tag: "框架课程",
          level: "进阶主线",
          levelCls: "mid",
          iconBg: "var(--warn-soft)",
          use: "Hugging Face 官方 Agent 课程：从 Agent 定义到三大框架（smolagents / LangGraph / LlamaIndex），覆盖 Agentic RAG，主打可观测性（追踪）与评测（Evaluation），Unit 4 有最终认证项目。",
          topics: [
            "Agent 与 LLM 基础（U1）",
            "三大框架（U2）",
            "可观测性与评测（U2附加）",
            "Agentic RAG（U3）",
            "最终项目：创建/测试/认证（U4）"
          ],
          pre: "Python 基础 + LLM 知识（可衔接第 1-2 阶段）",
          gain: "会用主流 Agent 框架开发、追踪调试、评估 Agent，并完成认证项目",
          linkNote: "衔接：在 learn-claude-code 懂原理后，这里学工程化框架与评测，正好补足本站课程没有的「评测与可观测」视角。"
        }
      ]
    },
    {
      id: "s4",
      stage: "第 4 阶段 · 选修",
      title: "模型原理选修：从零实现",
      color: "#e0565d",
      icon: "🔬",
      desc: "这条支线给「想知道模型内部究竟怎么算」的人。Karpathy 的经典教程用 8 讲从零手写神经网络，一路做到 GPT：零基础 Python + 高中微积分即可上车，也是全文唯一真正「啃硬核」的阶段。",
      items: [
        {
          proj: "karpathy/nn-zero-to-hero",
          courseId: "nn-zero-to-hero",
          url: "https://github.com/karpathy/nn-zero-to-hero",
          icon: "🎬",
          name: "nn-zero-to-hero",
          alias: "神经网络：从零到英雄 · Karpathy",
          tag: "原理选修",
          level: "选修支线",
          levelCls: "elec",
          iconBg: "var(--danger-soft)",
          use: "Karpathy 的经典教程（YouTube 视频 + Jupyter 代码随堂）。从手写 micrograd 讲反向传播，经 makemore 系列做字符级语言模型，最后从零实现 GPT 与其 Tokenizer。",
          topics: [
            "micrograd：反向传播（L1）",
            "makemore：语言模型（L2-3）",
            "激活/梯度/BatchNorm（L4）",
            "Backprop Ninja（L5）",
            "从零构建 GPT（L7）",
            "GPT Tokenizer / BPE（L8）"
          ],
          pre: "懂 Python 基础；本站第 3、5-7 课的概念可大幅降低理解成本",
          gain: "真正理解神经网络与 GPT 的内部计算，不再把 AI 当黑盒",
          linkNote: "衔接：本站第 3 课（神经网络）、第 4 课（Embedding）、第 6 课（Transformer）提供了概念铺垫；本站 BPE 分词演示与 L8 呼应。"
        }
      ]
    }
  ];

  /* 工具型项目：不作为主线阶段，放在底部「实战工具箱」 */
  var TOOLKIT = [
    {
      proj: "JCodesMore/ai-website-cloner-template",
      courseId: "ai-cloner",
      url: "https://github.com/JCodesMore/ai-website-cloner-template",
      icon: "🧩",
      name: "ai-website-cloner-template",
      alias: "AI 网站克隆模板",
      tag: "AI 编程实战",
      level: "边学边用",
      levelCls: "alt",
      iconBg: "var(--accent-soft)",
      use: "配合 AI 编码代理（Claude Code / Cursor / Copilot），输入目标 URL 即可自动逆向工程网站：提取设计令牌、下载资源、生成高保真克隆。",
      topics: ["AI 辅助编程", "设计系统反求", "像素级克隆", "工作流模板"],
      pre: "会用 AI 编码助手即可",
      gain: "把 AI 编程从「写几行」提升到「完成整个任务」；本站的设计语言来源与构建方法论正源于此",
      linkNote: "和本站的关系：本站开发时参考了它的设计系统反求方法论（对 aipath 站点做 CSS 反求）。"
    }
  ];

  window.ROADMAP = ROADMAP;
  window.TOOLKIT = TOOLKIT;
})();
