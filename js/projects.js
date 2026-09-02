/* ============================================================
   项目实战 · 站内学习内容
   把 8 个开源学习项目的核心知识「搬进」本站，
   不用跳去 GitHub，直接在网页里逐章学习。
   复用本站 blockHTML 的块类型：h2 / p / ul / callout /
   analogy / visual（交互演示）/ review / miniquiz / code
   ============================================================ */
(function () {
  "use strict";

  /* 通关顺序：按路线阶段排列，用于页内上/下项目导航 */
  var PROJECT_ORDER = [
    "agentic-map",
    "aipath",
    "microsoft-genai",
    "llm-universe",
    "claude-code",
    "hf-agents",
    "nn-zero-to-hero",
    "ai-cloner"
  ];

  var PROJECT_COURSES = {
    /* ============ s0 · Agent 核心原理（源自 awesome-agentic-ai-zh 路线主干） ============ */
    "agentic-map": {
      stage: "s0", stageNo: "第 0 阶段 · 入门",
      repoName: "awesome-agentic-ai-zh",
      repoUrl: "https://github.com/WenyuChiou/awesome-agentic-ai-zh",
      icon: "🤖", color: "#7c6ff0",
      tag: "Agent 入门", level: "全程参照",
      title: "Agent 本质与核心机制",
      subtitle: "把「Agent = 模型 + 工具 + 循环」讲到底，附带能跑的代码",
      intro: "awesome-agentic-ai-zh 为你标好了学 Agent 的路线；本页则把你<b>路线上的必备知识直接讲给你</b>：Agent 到底是什么、ReAct 循环怎么转、为什么需要工具、规划和记忆如何让 Agent 越用越强。学完这一页，再看任何 Agent 项目都能一眼看懂它的套路。",
      prereq: "会一点 Python；理解「模型只会预测下一个词」（本站第 7 课）。",
      chapters: ["Agent 是什么：模型 + 工具 + 循环", "ReAct 循环：思考 → 行动 → 观察", "Tool Use：工具协议与 Function Calling", "规划 Planning：把大任务拆成步骤", "记忆 Memory：短期与长期", "评估 Evaluation：Agent 好不好用"],
      blocks: [
        { type: "h2", text: "1 · Agent 是什么：模型 + 工具 + 循环" },
        { type: "p", text: "一个普通的 LLM 只能在对话里「说」。Agent 给模型加了三样东西，让它能「做事」：" },
        { type: "ul", items: [
          "<b>工具（Tools）</b>：能读文件、查库、跑代码、调 API 的外部能力",
          "<b>循环（Loop）</b>：一个 while 循环，让模型思考 → 行动 → 观察 → 再思考",
          "<b>目标（Goal）</b>：给模型一个要完成的任务，而不是一段要接的话"
        ] },
        { type: "callout", t: "analogy", title: "一句话类比", body: "LLM 像一个<b>只会出主意的军师</b>；Agent 是这个军师 + 一批<b>手下（工具）</b> + 一套<b>指挥流程（循环）</b>。军师还是那个军师，但配上流程和手下，就能真正把事办成。" },
        { type: "p", text: "所以请记住最核心的一句话：<b>Agent = 模型 + 工具 + 循环</b>。这句话是 awesome-agentic-ai-zh 路线的地基，下面所有章节都在为它加肉。" },

        { type: "h2", text: "2 · ReAct 循环：思考 → 行动 → 观察" },
        { type: "p", text: "ReAct（Reasoning + Acting）是绝大多数 Agent 的灵魂：模型每轮先<b>思考</b>该怎么下手，再<b>行动</b>（调用工具或直接回答），然后把工具结果<b>观察</b>回来继续想。如此循环直到能回答。" },
        { type: "visual", id: "agentLoop" },
        { type: "code", label: "Python · 一个闭环的 ReAct Agent（伪代码同构于你会在论文/项目里看到的）", code: "def run_agent(goal, tools):\n    history = [{\"role\": \"user\", \"content\":\n                \"你是一个能调用工具完成任务的助手。\\n\"\n                \"可用工具：\\n\" + describe(tools) + \"\\n任务：\" + goal}]\n\n    MAX_STEPS = 10\n    for _ in range(MAX_STEPS):\n        msg = llm(history)                # ① 思考：模型输出文本或 tool_call\n        history.append(msg)\n\n        if not msg.get(\"tool_calls\"):     # ② 不再调用工具 → 输出最终答案\n            return msg[\"content\"]\n\n        for call in msg[\"tool_calls\"]:    # ③ 行动：逐个执行请求的工具\n            result = execute(tools, call) #    真正去读文件/查库/跑代码\n            history.append({\"role\": \"tool\", \"tool_call_id\": call[\"id\"],\n                            \"content\": result})  # ④ 观察：把结果喂回去\n    return \"达到步数上限，未完成\"\n\n# 关键点：模型从不出循环，是代码在驱动循环。" },
        { type: "callout", t: "warn", title: "最容易误解的地方", body: "Agent 不是「模型自己一直跑」，而是<b>你写的 Python 代码在循环</b>：每次把模型输出、执行的工具结果拼回上下文历史里，再次交给模型。模型只是循环的一部分。" },

        { type: "h2", text: "3 · Tool Use：工具协议与 Function Calling" },
        { type: "p", text: "想让 Agent 用工具，你先要把工具<b>描述给模型</b>：名字、功能、参数类型。这就是 Function Calling——模型在需要时返回一个「请调用某某工具，参数是……」的结构化请求，真正的执行由你的代码完成。" },
        { type: "visual", id: "toolUse" },
        { type: "code", label: "Python · 定义两个工具并让模型选择调用", code: "TOOLS = [\n    {\"type\": \"function\", \"function\": {\n        \"name\": \"get_weather\",\n        \"description\": \"查询某城市当前天气\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\"city\": {\"type\": \"string\"}},\n            \"required\": [\"city\"]}}},\n    {\"type\": \"function\", \"function\": {\n        \"name\": \"calc\",\n        \"description\": \"四则运算计算器\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\"expr\": {\"type\": \"string\"}},\n            \"required\": [\"expr\"]}}},\n]\n\nmsg = client.chat.completions.create(\n    model=\"gpt-4o-mini\",\n    messages=[{\"role\": \"user\", \"content\": \"杭州今天多少度？\"}],\n    tools=TOOLS)\n\n# 模型输出：要调用 get_weather(city=\"杭州\")\nprint(msg.choices[0].message.tool_calls)\n\n# 然后你执行 dispatch: result = get_weather(\"杭州\")，再喂回去" },
        { type: "ul", items: [
          "<b>工具描述要具体</b>：名字、功能、参数类型越清楚，模型选得越准",
          "<b>执行权在代码</b>：模型只「提议」，你的代码决定「批准后才执行」——这是安全关键",
          "<b>观察要回填</b>：工具返回结果后，务必作为 tool 消息塞回历史，否则模型不知道发生了什么"
        ] },

        { type: "h2", text: "4 · 规划 Planning：把大任务拆成步骤" },
        { type: "p", text: "复杂任务（例如「帮我整理这个文件夹并写摘要」）一步做不完。Agent 需要<b>规划</b>：把大目标拆成有序子任务。常见两种思路：" },
        { type: "ul", items: [
          "<b>一次性规划（Plan-then-execute）</b>：先让模型列出完整步骤，再逐步执行",
          "<b>动态规划（Re-plan）</b>：边做边看结果，每步都重新决定下一步（更灵活，也是主流）"
        ] },
        { type: "callout", t: "analogy", title: "规划类比", body: "做一顿饭：你可以先写好整份菜单再去买菜（一次性规划），也可以<b>做着看</b>——发现没葱了临时去买（动态规划）。真实 Agent 大多采用后者，因为环境总在变。" },
        { type: "visual", id: "agentLoop" },

        { type: "h2", text: "5 · 记忆 Memory：短期与长期" },
        { type: "p", text: "Agent 光会「这一轮」是不够的，它需要记忆才能接续工作、越用越懂你。记忆分两层：" },
        { type: "ul", items: [
          "<b>短期记忆</b>：装在上下文历史里，本轮对话发生的事；受上下文窗口限制",
          "<b>长期记忆</b>：关键信息持久化到外部（向量数据库 / 文件 / 数据库），下次启动还能用",
          "<b>记忆管理</b>：上下文快满时压缩（把旧内容浓缩成摘要）或剪枝（丢掉不重要的）"
        ] },
        { type: "visual", id: "contextWindow" },
        { type: "p", text: "RAG 本质上就是一种「从外部长期记忆里检索相关知识再用」的技术——你把文档变成记忆库存着，Agent 用时现查。" },

        { type: "h2", text: "6 · 评估 Evaluation：Agent 好不好用" },
        { type: "p", text: "Agent 会自主多步行动，一旦出错难排查，所以<b>评测</b>不能省。awesome-agentic-ai-zh 路线把它列为工程化重点。至少盯三个维度：" },
        { type: "ul", items: [
          "<b>任务成功率</b>：给定一组测试任务，Agent 完成/达成目标的比例",
          "<b>工具调用正确率</b>：它选对工具、填对参数的比例（错误定位到「选错工具还是填错参数」）",
          "<b>成本与步数</b>：完成一件任务平均消耗多少个 Token、多少步——直接关系到钱和速度"
        ] },
        { type: "review", items: [
          { t: "Agent = 模型 + 工具 + 循环", d: "军师 + 手下 + 指挥流程，模型本身没变" },
          { t: "ReAct 三拍子", d: "思考 → 行动 → 观察，循环直到能回答" },
          { t: "工具协议要写清楚", d: "描述得越具体，模型选得越准；执行权留在自己代码" },
          { t: "规划 + 记忆 = 能干大事", d: "拆步骤 + 记上下文，Agent 才能完成长任务" },
          { t: "评测是底线", d: "成功率 / 工具正确率 / 成本步数，三件套" }
        ] },
        { type: "miniquiz", q: "在 ReAct 循环中，工具执行后返回的结果应该做什么？",
          options: ["直接丢弃，节省上下文", "作为 tool 消息回填到历史里，让模型“观察”到结果", "只在控制台打印", "当成最终答案直接返回给用户"],
          answer: 1, explain: "工具结果是「观察」环节的关键输入，必须作为 tool 消息塞回上下文历史，模型才能在下一轮基于结果继续思考和行动。" }
      ]
    },

    /* ============ s0 · 通识课程 ============ */
    "aipath": {
      stage: "s0", stageNo: "第 0 阶段 · 底色",
      repoName: "aipath",
      repoUrl: "https://github.com/buynao/aipath",
      icon: "🎓", color: "#f59e0b",
      tag: "通识课程", level: "可并行",
      title: "AI 通识课 · 30 课",
      subtitle: "绝对零基础：6 个阶段 30 节课，不堆公式不讲黑话",
      intro: "aipath 是一套面向绝对零基础的互动式 AI 通识课。它最大的特点是「不堆公式、不讲黑话」——用可视化和交互演示，从神经网络一步步讲到 GPT。和本站风格互补，非常适合做第二遍「用另一种讲法再学一遍」。",
      prereq: "无前置，与「AI 学堂」课程互为补充。",
      chapters: ["从零写一个神经元：能跑的代码", "神经网络：一个细胞怎么学会判断", "反向传播与梯度下降：参数怎么调", "从语言模型到 GPT", "怎么和这门课搭配学习"],
      blocks: [
        { type: "h2", text: "1 · 从零写一个神经元（你正在学的 AI 的“一个细胞”）" },
        { type: "p", text: "aipath 交给你的第一件真本事：用几十行 numpy 写一个神经元，亲手体会到「学习」就是调整权重。公式只有一行：<b>输出 = Σ(输入×权重) + 偏置</b>，再过激活函数。下面这段代码可以直接跑，看看权重是怎么被训练拟合出来的。" },
        { type: "code", label: "Python · numpy 实现一个神经元并“学习”参数", code: "import numpy as np\n\nclass Neuron:\n    def __init__(self, n_in):\n        self.w = np.random.randn(n_in) * 0.1   # 初始权重（随机）\n        self.b = 0.0                            # 偏置\n    def forward(self, x):\n        z = np.dot(self.w, x) + self.b          # 加权求和\n        return 1 / (1 + np.exp(-z))             # sigmoid 激活 -> (0,1)\n\nu = Neuron(2)\nX = np.array([[0,0],[0,1],[1,0],[1,1]])        # 想学会 OR 逻辑\nY = np.array([0, 1, 1, 1])\n\nlr = 0.5\nfor step in range(200):\n    loss = 0\n    for x, y in zip(X, Y):\n        p = u.forward(x)\n        # 梯度下降：误差 (p-y) * 输入 (很简化的梯度)\n        u.w += lr * (y - p) * x\n        u.b += lr * (y - p)\n        loss += (y - p) ** 2\n    if step % 50 == 0:\n        print(f\"step {step} loss={loss:.4f}\")"}, 
        { type: "h2", text: "2 · 神经网络：一个细胞怎么学会判断" },
        { type: "p", text: "神经网络的基本单元叫「神经元」：它把多个输入分别乘以一个权重，再加起来，最后过一道「激活函数」决定是否被激活。所谓「学习」，就是不断调整这些权重。" },
        { type: "analogy", src: "想象打分选餐厅：好不好吃 = 味道权重×味道分 + 价格权重×价格分 + 距离权重×距离分", dst: "神经元输出 = Σ(输入 × 权重) + 偏置，再过激活函数（决定“开”还是“关”）" },
        { type: "visual", id: "neuron" },
        { type: "visual", id: "network" },

        { type: "h2", text: "3 · 反向传播与梯度下降：参数怎么调" },
        { type: "p", text: "当模型的预测和正确答案差得远，误差会「从后往前」逐层分摊到每个权重上：哪个权重对误差「贡献大」，就修正它多一点。这个过程叫反向传播（Backpropagation）；而「顺着梯度把参数往损失更低的方向挪一小步」就是梯度下降（Gradient Descent）。两者配合，就是全部训练的引擎。" },
        { type: "visual", id: "backprop" },
        { type: "visual", id: "gradDescent" },
        { type: "p", text: "重点是理解<b>学习率 lr</b>：步子太大（lr 大）会来回震荡甚至发散；太小（lr 小）则收敛太慢。上面你写的神经元代码里就是简单地在做这件事——<code>u.w += lr * (y - p) * x</code> 每一行其实都是「反向传播算梯度 + 梯度下降更新」的雏形。" },
        { type: "review", items: [
          { t: "损失函数", d: "衡量“猜得有多离谱”的一把尺子" },
          { t: "梯度", d: "告诉每个权重“该往哪边调、调多少”的方向箭头" },
          { t: "链式法则", d: "反向传播背后的数学，误差沿着计算图一路传回" }
        ] },

        { type: "h2", text: "4 · 从语言模型到 GPT" },
        { type: "p", text: "语言模型的核心任务只有一个：<b>预测下一个词</b>。GPT 就是把这个任务用巨大的 Transformer 网络反复训练出来的。aipath 用大量可视化帮你建立直觉：Token 切分、上下文、注意力。" },
        { type: "visual", id: "tokenDemo" },
        { type: "visual", id: "transformerBlock" },
        { type: "callout", t: "analogy", title: "一句话理解 GPT", body: "GPT 像一位「读过海量书、很会接话」的续写大师——你给它开头，它按概率补出最合理的后续，本质上仍是<b>预测下一个词</b>。" },

        { type: "h2", text: "5 · 怎么和这门课搭配学习" },
        { type: "p", text: "这套课与本站高度互补：它在具体主题上更「广」、交互更多；本站更「系统」、带测验和进度。建议主线走本站 13 课，遇到某个概念想再看一种讲法时，翻到对应阶段补一遍。" },
        { type: "miniquiz", q: "反向传播（Backpropagation）主要解决什么问题？",
          options: ["把输入图片变大", "让误差从后往前传播，从而修正每个权重", "给模型加速 100 倍", "把文字翻译成向量"],
          answer: 1, explain: "反向传播把输出端的误差沿着计算图逐层传回，量化每个权重对误差的“贡献”，据此更新权重。" }
      ]
    },

    /* ============ s1 · 微软生成式 AI ============ */
    "microsoft-genai": {
      stage: "s1", stageNo: "第 1 阶段 · 必学主线",
      repoName: "generative-ai-for-beginners",
      repoUrl: "https://github.com/microsoft/generative-ai-for-beginners",
      icon: "🟦", color: "#ff7a59",
      tag: "体系课程", level: "必学主线",
      title: "生成式 AI 入门 · 微软 21 课",
      subtitle: "把概念变成能动手调 API 构建的真实应用",
      intro: "这是微软云顾问团队出品的生成式 AI 入门课程，Python / TypeScript 双语，含 50+ 语言翻译。课程分「概念 Learn」和「动手 Build」两类：每一课讲清楚原理后，立刻带你写真实代码调用 LLM API 构建应用。学完你能从零搭出文本生成、聊天机器人、向量搜索等应用。",
      prereq: "建议先学完本站全部 4 模块 13 节课，掌握概念后再来落地。",
      chapters: ["课程结构：概念课 × 动手课", "提示词工程（04-05）", "文本与聊天应用（06-07）", "Embedding 搜索（08）", "Function Calling（11）", "RAG 与 AI Agent（15/17）"],
      blocks: [
        { type: "h2", text: "1 · 课程结构：概念课 × 动手课" },
        { type: "p", text: "21 课被刻意分成两类，这是它区别于普通教程的最大特点：" },
        { type: "ul", items: [
          "<b>概念课（Learn）</b>：讲明白原理——什么是 LLM、Embedding、RAG、Agent",
          "<b>动手课（Build）</b>：在概念课基础上，用真实 API 写出能跑的代码",
          "每课都有 <b>代码示例 + 课后作业</b>，完成度做得相当完整"
        ] },

        { type: "h2", text: "2 · 提示词工程（04-05）" },
        { type: "p", text: "提示词工程是「和模型高效沟通」的技巧。核心不是背模板，而是理解：<b>模型只看得到你给的内容</b>——指令要明确、角色要设定、示例要给足、输出格式要指定。本站有多个相关演示，配合这一课食用效果最佳：" },
        { type: "visual", id: "promptFormula" },
        { type: "visual", id: "promptCompare" },
        { type: "visual", id: "fewShotDemo" },
        { type: "code", label: "Python · 一个最小对话调用（Azure OpenAI）", code: "from openai import AzureOpenAI\n\nclient = AzureOpenAI(\n    azure_endpoint=os.environ[\"AZURE_OPENAI_ENDPOINT\"],\n    api_key=os.environ[\"AZURE_OPENAI_KEY\"],\n    api_version=\"2024-02-01\")\n\nresp = client.chat.completions.create(\n    model=\"gpt-4o-mini\",\n    messages=[\n        {\"role\": \"system\", \"content\": \"你是一位耐心的老师，用一句话作答。\"},\n        {\"role\": \"user\", \"content\": \"解释什么是大语言模型\"}\n    ])\nprint(resp.choices[0].message.content)" },

        { type: "h2", text: "3 · 文本与聊天应用（06-07）" },
        { type: "p", text: "从单次生成到「有来有回」的聊天：聊天 API 把消息按角色（system / user / assistant）组成对话历史。这里有两个关键概念——<b>温度（temperature）</b>和<b>采样（top-p）</b>，直接决定回答是「保守稳定」还是「发散有创意」：" },
        { type: "visual", id: "temperatureDemo" },
        { type: "visual", id: "topPDemo" },
        { type: "p", text: "另外还有两个提升回答质量的技巧：<b>思维链</b>（让模型一步步推理）和<b>少样本</b>（给几个例子再提问）：" },
        { type: "visual", id: "cotDemo" },

        { type: "h2", text: "4 · Embedding 搜索（08）" },
        { type: "p", text: "这一课教你把文本变成向量，然后用「向量相似度」做语义搜索——按「意思」而不是按「关键词」找内容。这是后面 RAG 的地基。" },
        { type: "visual", id: "embedIntro" },
        { type: "visual", id: "cosineDemo" },
        { type: "code", label: "Python · 用向量搜索找到“最相似”的一句话", code: "from openai import AzureOpenAI\nfrom numpy import dot\n\nclient = AzureOpenAI(...)\n\ndef embed(t: str):\n    r = client.embeddings.create(model=\"text-embedding-3-small\", input=t)\n    return r.data[0].embedding\n\nquery = embed(\"怎么修漏水的水龙头\")\ndocs  = [\"疏通马桶的步骤\", \"更换水龙头的教程\", \"今天天气不错\"]\n\nbest = max(docs, key=lambda d: dot(embed(d), query))\nprint(\"最相关文档:\", best)" },

        { type: "h2", text: "5 · Function Calling（11）" },
        { type: "p", text: "Function Calling 让模型「看得到工具、会主动要求调用」：你描述有哪些函数可用，模型在需要时返回一段结构化调用指令，你的代码负责真正执行。这是把模型从「只会说」变成「会做事」的关键一步。" },
        { type: "code", label: "Python · 让模型自己决定是否查天气", code: "tools = [{\n    \"type\": \"function\",\n    \"function\": {\n        \"name\": \"get_weather\",\n        \"description\": \"查询某城市天气\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\"city\": {\"type\": \"string\"}},\n            \"required\": [\"city\"]\n        }\n    }\n}]\n\nresp = client.chat.completions.create(\n    model=\"gpt-4o-mini\",\n    messages=[{\"role\": \"user\", \"content\": \"上海明天下雨吗？\"}],\n    tools=tools)\n\n# 若模型想调用，返回里会出现 tool_calls\nprint(resp.choices[0].message.tool_calls)" },

        { type: "h2", text: "6 · RAG 与 AI Agent（15/17）" },
        { type: "p", text: "最后两课把能力叠加：用 RAG 让模型「查私有资料再回答」，用 Agent 让模型「自主规划 + 调用工具完成多步任务」。至此你已经有能力构建一个像样的生产级应用。" },
        { type: "visual", id: "ragPipeline" },
        { type: "visual", id: "agentLoop" },
        { type: "review", items: [
          { t: "提示词四要素", d: "指令 + 角色 + 示例 + 输出格式，讲清楚需求是第一生产力" },
          { t: "温度与 Top-p", d: "控制生成「稳 or 野」的旋钮，业务场景默认保守" },
          { t: "Embedding 是万能胶", d: "文字、图片、代码都能向量化，按意思搜索/匹配" },
          { t: "Function Calling + RAG = Agent 雏形", d: "会查资料、会动手，是 Agent 的两条腿" }
        ] },
        { type: "miniquiz", q: "温度（temperature）调低会让模型输出变得……",
          options: ["更有创意、更发散", "更保守、更稳定、更可复现", "速度更快", "完全不能工作"],
          answer: 1, explain: "温度越低，模型越倾向于选概率最高的词，输出更稳定保守；调高则更发散，但更容易跑偏甚至胡编。" }
      ]
    },

    /* ============ s2 · RAG 实战 ============ */
    "llm-universe": {
      stage: "s2", stageNo: "第 2 阶段 · 必学主线",
      repoName: "llm-universe",
      repoUrl: "https://github.com/datawhalechina/llm-universe",
      icon: "🐋", color: "#34a853",
      tag: "实战教程", level: "必学主线",
      title: "动手学大模型应用开发 · Datawhale",
      subtitle: "用「个人知识库助手」这个完整实战，把 RAG 全链路做一遍",
      intro: "Datawhale 面向小白开发者的实战教程。整个课程围绕一个目标项目展开：<b>个人知识库助手</b>。你会亲手走完：文档读取/清洗/切片 → Embedding → 向量数据库 → 检索问答链 → Streamlit 部署 → 评测优化。学完你能独立搭出带私有知识库的问答应用。",
      prereq: "基础 Python 语法 + 本站 Embedding / RAG 概念（第 4、11 课）。",
      chapters: ["一个贯穿始终的目标项目", "LLM API 调用", "文档处理：读入 / 清洗 / 切片", "Embedding 与向量数据库", "检索问答链：RAG 全流程", "评测与优化 + 部署"],
      blocks: [
        { type: "h2", text: "1 · 一个贯穿始终的目标项目" },
        { type: "p", text: "许多教程讲完概念你仍不知如何拼装。llm-universe 反其道而行：<b>先给你一个完整目标</b>——「让 AI 基于你自己的文档回答问题」。所有知识都为这个目标服务，学完即有一份完整作品。整条链路如下：" },
        { type: "visual", id: "ragPipeline" },
        { type: "ul", items: [
          "<b>输入</b>：你的 PDF / Markdown / 网页文档",
          "<b>处理</b>：读入 → 清洗 → 按语义切片",
          "<b>索引</b>：每片转成向量，存入向量数据库",
          "<b>检索</b>：用户问题转向量，找出最相关的几片",
          "<b>生成</b>：把“问题 + 检索片段”喂给 LLM 合成答案",
          "<b>展示与优化</b>：Streamlit 网页 + 效果评测调优"
        ] },

        { type: "h2", text: "2 · LLM API 调用" },
        { type: "code", label: "Python · 基础对话（可替换为任一国产大模型 API）", code: "from openai import OpenAI\n\n# llm-universe 会教你封装，兼容多家国产模型\nclient = OpenAI(\n    base_url=\"https://api.deepseek.com/v1\",\n    api_key=os.environ[\"DEEPSEEK_API_KEY\"])\n\nresp = client.chat.completions.create(\n    model=\"deepseek-chat\",\n    messages=[{\"role\": \"user\", \"content\": \"用两句话介绍你自己\"}],\n    temperature=0.7)\nprint(resp.choices[0].message.content)" },
        { type: "callout", t: "warn", title: "动手建议", body: "先别跳 3-6 章，务必把「怎么稳定地调通一个 API」跑熟——包括处理超时、报错、Token 计数。这是后面所有步骤的地基。" },

        { type: "h2", text: "3 · 文档处理：读入 / 清洗 / 切片" },
        { type: "p", text: "文档不是直接丢给模型：先去掉无意义字符（清洗），再切成适合检索的小块（切片）。切片大小很讲究——太大检索不准，太小丢失上下文。" },
        { type: "code", label: "Python · 加载 PDF 并按字符切片", code: "from langchain_community.document_loaders import PyPDFLoader\nfrom langchain.text_splitter import RecursiveCharacterTextSplitter\n\nloader = PyPDFLoader(\"我的笔记.pdf\")\ndocs   = loader.load()\n\nsplitter = RecursiveCharacterTextSplitter(\n    chunk_size=500,      # 每片约 500 字符\n    chunk_overlap=50)    # 相邻重疊 50，保住上下文\nchunks = splitter.split_documents(docs)\n\nprint(f\"切成了 {len(chunks)} 片\")" },

        { type: "h2", text: "4 · Embedding 与向量数据库" },
        { type: "p", text: "把每一片文档转成向量，存进向量数据库。为什么「按意思检索」比「按关键词检索」强？因为向量空间里「意思相近的文本距离近」——用户问「怎么修漏水」，能命中「更换水龙头的教程」。" },
        { type: "visual", id: "embedMap" },
        { type: "visual", id: "ragVector" },

        { type: "h2", text: "5 · 检索问答链：RAG 全流程" },
        { type: "code", label: "Python · 检索 + 组装的问答链", code: "from langchain_chroma import Chroma\nfrom langchain_core.prompts import ChatPromptTemplate\n\nvectorstore = Chroma.from_documents(chunks, embedding_model)\nretriever = vectorstore.as_retriever(search_kwargs={\"k\": 4})\n\nq = \"我的笔记里提到过 Transformer 吗？\"\nhits = retriever.invoke(q)\ncontext = \"\\n\\n\".join(d.page_content for d in hits)\n\nprompt = f\"\"\"仅根据以下资料回答，找不到就说不知道。\n\n资料：\n{context}\n\n问题：{q}\"\"\"\nprint(chat(prompt))" },

        { type: "h2", text: "6 · 评测与优化 + 部署" },
        { type: "p", text: "RAG 做出来后，最关键的一步是<b>评测</b>：检索到的内容对不对、生成的答案是否忠于资料。llm-universe 会教你怎么设计评测集、量化解耦测试检索与生成，再用 Streamlit 部署成网页。小心这个坑：" },
        { type: "visual", id: "hallucinationDemo" },
        { type: "review", items: [
          { t: "切片质量决定检索质量", d: "大小、重叠、按标题切分都值得反复调" },
          { t: "检索与生成分开评测", d: "先看 Top-k 命中率，再看生成忠实度" },
          { t: "克制幻觉", d: "限定“用资料回答、查不到就直说”" }
        ] },
        { type: "miniquiz", q: "在 RAG 链路中，Embedding 的作用是什么？",
          options: ["把文档压缩成更小的文件", "把文本变成向量，使“意思相近”的文本在向量空间里距离近", "给文档加密", "把文档翻译成英文"],
          answer: 1, explain: "Embedding 把文本映射到高维向量空间，语义相近的文本向量距离更近，从而支持「按意思检索」。" }
      ]
    },

    /* ============ s3 · 手搓 Agent ============ */
    "claude-code": {
      stage: "s3", stageNo: "第 3 阶段 · 必学主线",
      repoName: "learn-claude-code",
      repoUrl: "https://github.com/shareAI-lab/learn-claude-code",
      icon: "⚙️", color: "#1a73e8",
      tag: "源码实战", level: "必学主线",
      title: "手搓 Agent Harness · 17 章",
      subtitle: "Agent = 模型 + 外壳：一个机制一章，从 0 造出迷你 Claude Code",
      intro: "这门课是「最硬核也最上头」的一阶：用一个贯通观点 <b>Agent = 模型 + 外壳</b>，从 0 到 1 手搓一个能跑的迷你 Agent。每章只讲一个机制（Agent Loop、工具、权限、记忆、上下文压缩……），增量构建，附可运行 Python 代码与中文注释。",
      prereq: "Python 基础 + 理解 LLM 对话接口（本站第 11 课）。",
      chapters: ["核心观点：Agent = 模型 + 外壳", "Agent Loop：思考 → 行动 → 观察", "Tool Use：让模型真的会做事", "权限 Permission：安全的第一道闸", "上下文压缩与记忆"],
      blocks: [
        { type: "h2", text: "1 · 核心观点：Agent = 模型 + 外壳" },
        { type: "p", text: "这门课最重要的一句话：<b>Agent 不是模型本身，而是「模型 + 一套外壳」</b>。模型负责「思考」，外壳负责让思考变成行动——循环调度、调用工具、管理权限、记录上下文。理解了这一点，你就看穿了市面上 80% 的 Agent 产品。" },
        { type: "callout", t: "analogy", title: "一句话类比", body: "模型像一位<b>聪明的军师</b>，只负责出主意；外壳像<b>总督府</b>——帮军师打听消息（工具）、把关命令（权限）、安排工作顺序（计划）、善后交接（上下文管理）。" },
        { type: "ul", items: [
          "<b>s01 Agent Loop</b>：主循环怎么跑起来",
          "<b>s02 Tool Use</b>：模型怎么调用外部能力",
          "<b>s03 Permission</b>：危险操作谁来批准",
          "<b>s04 Hooks</b>：在关键节点挂上自己的逻辑",
          "<b>s05 Todo</b>：让 Agent 自己列计划",
          "<b>s08/s09</b>：上下文压缩与长期记忆"
        ] },

        { type: "h2", text: "2 · Agent Loop：思考 → 行动 → 观察" },
        { type: "p", text: "Agent 的主循环就三步：把当前状态交给模型（思考）→ 执行模型要求的动作（行动）→ 把结果反馈给模型（观察），然后循环。这个循环跑起来，模型就像个「越做越有数」的 executor。" },
        { type: "visual", id: "agentLoop" },
        { type: "code", label: "Python · 一个 30 行的最小 Agent Loop", code: "def main():\n    history = [{\"role\": \"user\", \"content\": sys_goal}]\n    while True:\n        msg = llm(history)              # ① 思考\n        history.append(msg)\n        if not msg.tool_calls:          # ② 没有想调工具 → 回答完毕\n            print(msg.content)\n            return\n        for call in msg.tool_calls:     # ③ 行动\n            result = dispatch(call)     #    执行工具\n            history.append({\n                \"role\": \"tool\",\n                \"tool_call_id\": call.id,\n                \"content\": result})    # ④ 观察，回到循环" },

        { type: "h2", text: "3 · Tool Use：让模型真的会做事" },
        { type: "p", text: "模型本身只会「说」，工具让它能「做」：读文件、跑命令、查网络。关键是把每个工具描述清楚（做什么、参数是什么），模型才能正确选用。" },
        { type: "visual", id: "toolUse" },
        { type: "code", label: "Python · 定义并派发一个 read_file 工具", code: "TOOLS = [{\n    \"name\": \"read_file\",\n    \"description\": \"读取文件内容\",\n    \"parameters\": {\"path\": {\"type\": \"string\"}}\n}]\n\ndef dispatch(name, args):\n    if name == \"read_file\":\n        with open(args[\"path\"], encoding=\"utf-8\") as f:\n            return f.read()[:2000]\n    raise ValueError(f\"unknown tool: {name}\")" },

        { type: "h2", text: "4 · 权限 Permission：安全的第一道闸" },
        { type: "p", text: "Agent 一旦能「做什么」，风险随之而来——删库、覆盖文件、泄露密钥。所以外壳必须加一道闸：每个危险动作先经过用户确认，或遵循预设策略自动放行/拒绝。" },
        { type: "ul", items: [
          "<b>白名单命令</b>：只允许安全命令自动执行",
          "<b>危险操作拦截</b>：覆盖、删除、执行脚本等需人工批准",
          "<b>审计日志</b>：Agent 干的每一件事都可回溯"
        ] },

        { type: "h2", text: "5 · 上下文压缩与记忆" },
        { type: "p", text: "对话越来越长，上下文窗口装不下怎么办？这门课教你压缩（把中间过程浓缩成摘要）和记忆（把关键信息持久化，下次继续用）。这是 Agent 能「长时间工作」的工程秘诀。" },
        { type: "visual", id: "contextWindow" },
        { type: "review", items: [
          { t: "Agent = 模型 + 外壳", d: "模型思考，外壳调度、工具、权限、记忆" },
          { t: "主循环三步", d: "思考 → 行动 → 观察，循环直到回答完成" },
          { t: "安全优先", d: "权限是 Agent 能上生产的前提" }
        ] },
        { type: "miniquiz", q: "Agent 的外壳（Harness）主要负责什么？",
          options: ["提升模型的数学能力", "负责循环调度、工具调用、权限与上下文管理，让模型思考落地成行动", "压缩模型的参数", "给模型换更大显存"],
          answer: 1, explain: "外壳是 Agent 与模型之间的“操作系统”：调度循环、调用工具、把关权限、压缩上下文，让模型的思考真正变成行动。" }
      ]
    },

    /* ============ s3 · HF 框架 ============ */
    "hf-agents": {
      stage: "s3", stageNo: "第 3 阶段 · 进阶主线",
      repoName: "agents-course",
      repoUrl: "https://github.com/huggingface/agents-course",
      icon: "🤗", color: "#f59e0b",
      tag: "框架课程", level: "进阶主线",
      title: "Hugging Face Agents 课程",
      subtitle: "从原理到三大框架，主打可观测性与评测",
      intro: "在学会「手搓原理」之后，这门官方课程带你进入工程化：从 Agent 定义讲起，到三大主流框架（smolagents / LangGraph / LlamaIndex），覆盖 Agentic RAG，特别强调两件很多教程忽略的事——<b>可观测性（追踪）</b>和<b>评测</b>。Unit 4 有最终认证项目。",
      prereq: "Python 基础 + LLM 知识（推荐先完成前几个阶段）。",
      chapters: ["U1 · Agent 与 LLM 基础", "U2 · 三大框架怎么选", "可观测性：Agent 在干什么，看得见", "U3 · Agentic RAG", "U4 · 最终项目与评测认证"],
      blocks: [
        { type: "h2", text: "1 · U1 · Agent 与 LLM 基础" },
        { type: "p", text: "先建立框架：Agent = LLM + 规划 + 工具 + 记忆。课程会用代码演示最朴素的 Agent 怎么让 LLM 选择工具、填充参数、观察结果。" },
        { type: "visual", id: "agentLoop" },
        { type: "callout", t: "analogy", title: "和上一门课呼应", body: "如果你学过 learn-claude-code 的“手搓版”，这里就是“框架版”——同一个循环，用现成框架写起来只需十几行。" },

        { type: "h2", text: "2 · U2 · 三大框架怎么选" },
        { type: "ul", items: [
          "<b>smolagents</b>：极简、代码优先，适合快速原型与教学",
          "<b>LangGraph</b>：把 Agent 画成状态图，适合复杂、可控的多步流程",
          "<b>LlamaIndex</b>：数据 / RAG 见长，适合文档密集型 Agent"
        ] },
        { type: "code", label: "Python · smolagents 几行造一个工具型 Agent", code: "from smolagents import CodeAgent, tool\nfrom transformers import HfApiModel\n\n@tool\ndef get_weather(city: str) -> str:\n    \"\"\"查询城市天气。\"\"\"\n    return f\"{city}: 晴，24°C\"\n\nagent = CodeAgent(\n    tools=[get_weather],\n    model=HfApiModel())\nprint(agent.run(\"北京天气怎么样？\"))" },

        { type: "h2", text: "3 · 可观测性：Agent 在干什么，看得见" },
        { type: "p", text: "Agent 会多步自主行动，一旦出错很难排查。这一块教你把每一步「追踪」下来：模型想了什么、调了哪个工具、返回了什么、花了多少个 Token——这就是 <b>Tracing（追踪）</b>，生产环境必备。" },
        { type: "ul", items: [
          "用追踪面板回放 Agent 的每一步思考与动作",
          "量化每次调用的 Token 成本与耗时",
          "在失败环节精确定位问题（是规划错、工具错还是参数错）"
        ] },

        { type: "h2", text: "4 · U3 · Agentic RAG" },
        { type: "p", text: "普通 RAG 是「先检索、再回答」的直线；Agentic RAG 让 Agent 自己决定<b>何时检索、检索几次、要不要改写问题、要不要换来源</b>——更聪明，也更需要评测约束。" },
        { type: "visual", id: "ragPipeline" },

        { type: "h2", text: "5 · U4 · 最终项目与评测认证" },
        { type: "p", text: "最后一个单元是认证项目：你要构建并<b>评测</b>一个完整的 Agent。评测不是可选项——没有评测的 Agent 就像没有考试的课程：你不知道它到底行不行。课程会教你设定评测集、用指标量化（任务成功率、工具调用正确率、Token 成本等），通过后获得认证。" },
        { type: "review", items: [
          { t: "框架是手段不是目的", d: "先懂原理（上一门课），再选框架提效" },
          { t: "可观测性 = 说话能力", d: "追踪让 Agent 的行为可回放、可解释、可定位" },
          { t: "评测 = 兜底", d: "Agent 越自主，越需要明确的验收标准" }
        ] },
        { type: "miniquiz", q: "Tracing（追踪）对 Agent 开发最重要的价值是？",
          options: ["让模型跑得更快", "回放每一步思考与工具调用，便于调试与排查", "让模型不产生幻觉", "压缩模型参数"],
          answer: 1, explain: "追踪把 Agent 的每一步（模型思考、工具调用、参数、返回、Token）记录下来，出了问题能精确定位在哪一环，是生产级 Agent 的必备能力。" }
      ]
    },

    /* ============ s4 · 从零实现 ============ */
    "nn-zero-to-hero": {
      stage: "s4", stageNo: "第 4 阶段 · 选修支线",
      repoName: "nn-zero-to-hero",
      repoUrl: "https://github.com/karpathy/nn-zero-to-hero",
      icon: "🎬", color: "#e0565d",
      tag: "原理选修", level: "选修支线",
      title: "神经网络：从零到英雄 · Karpathy",
      subtitle: "8 讲从手写 micrograd 一路做到 GPT，看懂模型内部究竟怎么算",
      intro: "Karpathy 的经典教程：YouTube 视频 + Jupyter 代码随堂。它把神经网络和 GPT 的「内脏」一层层翻给你看——先手写一个轻量自动微分（micrograd），再做字符级语言模型（makemore），最后从零实现 GPT 与它的 Tokenizer。零基础 Python + 高中微积分即可上车。",
      prereq: "懂 Python 基础；本站第 3、5-7 课的概念可大幅降低理解成本。",
      chapters: ["L1 · micrograd：反向传播的内脏", "L2-3 · makemore：字符级语言模型", "L4 · 激活函数 / 梯度 / BatchNorm", "L7 · 从零构建 GPT", "L8 · Tokenizer 与 BPE"],
      blocks: [
        { type: "h2", text: "1 · L1 · micrograd：反向传播的内脏" },
        { type: "p", text: "micrograd 是一个只有 ~150 行的迷你框架，核心是一个 <b>Value</b> 类：它既存数值，也记录这个数是怎么通过运算算出来的（形成一个计算图）。有了这张图，就能自动求出每个参数的梯度——反向传播的「内脏」就这么点东西。" },
        { type: "visual", id: "backprop" },
        { type: "code", label: "Python · micrograd 的核心：Value 与反向传播", code: "class Value:\n    def __init__(self, data, _children=(), _op=''):\n        self.data = data\n        self.grad = 0.0\n        self._prev = set(_children)\n        self._backward = lambda: None\n\n    def __add__(self, other):\n        out = Value(self.data + other.data, (self, other), '+')\n        def _bw():\n            self.grad += out.grad          # d(a+b)/da = 1\n            other.grad += out.grad         # d(a+b)/db = 1\n        out._backward = _bw\n        return out\n\n    def tanh(self):                        # 激活函数\n        x = self.data\n        t = (math.exp(2*x) - 1) / (math.exp(2*x) + 1)\n        out = Value(t, (self,), 'tanh')\n        out._backward = lambda: (self.grad += (1 - t**2) * out.grad)\n        return out\n\n    def backward(self):                    # 反向传播：沿图倒推\n        topo = []\n        visited = set()\n        def build(v):\n            if v not in visited:\n                visited.add(v)\n                for c in v._prev:\n                    build(c)\n                topo.append(v)\n        build(self)\n        self.grad = 1.0\n        for v in reversed(topo):\n            v._backward()" },
        { type: "callout", t: "analogy", title: "一句话理解自动微分", body: "每个数学算式都像一根<b>水管</b>，梯度就是水流。反向传播就是从出水口（损失）往回走，看每个阀门（参数）对水流贡献了多少、该拧多少——micrograd 就是这套「水管」的骨架。" },

        { type: "h2", text: "2 · L2-3 · makemore：字符级语言模型" },
        { type: "p", text: "makemore 系列用「预测下一个字符」这个小任务，把神经网络训练的全流程过一遍：构建数据集 → 构造网络 → 计算损失 → 反向传播 → 梯度下降更新。你亲手训练出的模型，能「编」出像模像样的英文单词。" },
        { type: "visual", id: "epochDemo" },
        { type: "visual", id: "overfitDemo" },

        { type: "h2", text: "3 · L4 · 激活函数 / 梯度 / BatchNorm" },
        { type: "p", text: "这一讲深入工程细节，回答三个灵魂拷问：" },
        { type: "ul", items: [
          "<b>为什么需要激活函数</b>：没有它，多层网络叠起来还是线性函数，等于白叠",
          "<b>梯度消失/爆炸</b>：深层网络梯度要么趋零要么爆炸，网络学不动",
          "<b>BatchNorm 在干嘛</b>：把每层输入「标准化」，让梯度稳定、训练更快"
        ] },
        { type: "visual", id: "network" },

        { type: "h2", text: "4 · L7 · 从零构建 GPT" },
        { type: "p", text: "前面所有铺垫在这里汇合：用 PyTorch 从零实现一个 GPT——Tokenizer → Embedding → 多头注意力 → Transformer Block → 输出层。当你亲手写出 <b>attention(q, k, v)</b> 那几行代码时，Transformer 的神秘感就彻底消失了。" },
        { type: "visual", id: "attentionDemo" },
        { type: "visual", id: "multiHead" },
        { type: "visual", id: "transformerBlock" },

        { type: "h2", text: "5 · L8 · Tokenizer 与 BPE" },
        { type: "p", text: "GPT 吃进去的不是字符，而是 Token。Karpathy 这讲手把手实现 BPE（字节对编码）——从「最常见的字符对」开始不断合并，生成一张子词表。这是理解「上下文窗口 = 多少 Token」的关键。" },
        { type: "visual", id: "tokenDemo" },
        { type: "visual", id: "bpeDemo" },
        { type: "review", items: [
          { t: "micrograd 揭开了反向传播", d: "150 行代码讲透梯度从何而来" },
          { t: "makemore 练手训练全流程", d: "把「预测下一个字符」跑成真模型" },
          { t: "从零 GPT 消灭黑盒", d: "亲手写出 attention，Transformer 不再神秘" },
          { t: "BPE 关乎上下文", d: "Tokenizer 决定你能喂进多少个 Token" }
        ] },
        { type: "miniquiz", q: "BPE（字节对编码）算法在做什么？",
          options: ["给图片压缩", "把文本拆成可复用的子词单元，不断合并最常见的相邻字符对", "给模型加密", "把 Token 变回向量"],
          answer: 1, explain: "BPE 从字符开始，反复把「出现最多的相邻字符对」合并成一个新单元，最终得到一张子词表——GPT 用它把任意文本切成 Token。" }
      ]
    },

    /* ============ 工具箱 ============ */
    "ai-cloner": {
      stage: "toolkit", stageNo: "实战工具箱",
      repoName: "ai-website-cloner-template",
      repoUrl: "https://github.com/JCodesMore/ai-website-cloner-template",
      icon: "🧩", color: "#666",
      tag: "AI 编程实战", level: "边学边用",
      title: "AI 网站克隆模板",
      subtitle: "配合 AI 编码代理，输入 URL 自动逆向工程网页",
      intro: "这不是一门「脑补知识」课，而是一套能立刻用在生产上的工作流模板：配合 Claude Code / Cursor / Copilot 等 AI 编码代理，输入一个目标 URL，AI 自动提取设计令牌、下载资源、生成高保真克隆。本站的设计语言，正源于这套「设计系统反求」方法论。",
      prereq: "会用 AI 编码助手（Claude Code / Cursor / Copilot 任一）即可。",
      chapters: ["工作流：从 URL 到克隆的最小闭环", "抓取页面：拿到原始 HTML", "提取设计令牌：把配色抽成变量", "提示词模板：驱动 AI 精修高保真"],
      blocks: [
        { type: "h2", text: "1 · 工作流：从 URL 到克隆的最小闭环" },
        { type: "p", text: "整套模板的核心是一个三步闭环，下面三章分别给你能直接跑的代码。先记住整体地图：" },
        { type: "ul", items: [
          "<b>① 抓取</b>：把目标网页的 HTML（含内联样式）下载到本地，作为 AI 的“参照物”",
          "<b>② 提取</b>：自动扫出颜色、字体、间距、圆角，生成设计令牌 CSS",
          "<b>③ 生成</b>：把「HTML + 令牌」喂给 Claude Code / Cursor，让它重建高保真页面"
        ] },
        { type: "callout", t: "warn", title: "为什么先抓后做", body: "AI 直接写出来的页面往往“神似而形不似”。先让 AI 看到<b>真实的 HTML 和设计令牌</b>，它才能复刻出像素级一致的效果——这也是本模板和“直接让 AI 凭空画”的区别。" },

        { type: "h2", text: "2 · 抓取页面：拿到原始 HTML" },
        { type: "p", text: "第一步是把目标网页保存成本地文件。用 Playwright 能连 JS 渲染后的完整 DOM 一起抓下来（很多现代网站纯靠 <code>curl</code> 抓不到内容）。" },
        { type: "code", label: "Node.js · 用 Playwright 抓完整页面（含样式）", code: "const { chromium } = require('playwright');\n\n(async () => {\n  const browser = await chromium.launch();\n  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });\n  await page.goto('https://example.com', { waitUntil: 'networkidle' });\n\n  // 把渲染后的完整 HTML 存下来（含内联样式/脚本）\n  const html = await page.content();\n  require('fs').writeFileSync('snapshot.html', html);\n\n  // 顺便把用到的 CSS 文件也拉下来，后面提取令牌用\n  const css = await page.evaluate(async () => {\n    const res = await Promise.all(\n      Array.from(document.querySelectorAll('link[rel=stylesheet]'))\n        .map(l => fetch(l.href).then(r => r.text())));\n    return res.join('\\n');\n  });\n  require('fs').writeFileSync('styles.css', css);\n\n  await browser.close();\n})();\n// 产物：snapshot.html + styles.css —— AI 重建的全部素材" },

        { type: "h2", text: "3 · 提取设计令牌：把配色抽成变量" },
        { type: "p", text: "拿到 CSS 后，用正则把颜色、字号、间距等<b>散落的值</b>统计出来，去重、归类，生成一份 CSS 变量表——这就是「设计系统反求」的自动化版本。下面给一个 python 脚本，跑完直接输出 <code>:root</code> 令牌块。" },
        { type: "code", label: "Python · 从 CSS 自动提取颜色并生成令牌", code: "import re, collections\n\ncss = open('styles.css', encoding='utf-8').read()\n\n# 三种常见颜色写法都抓出来\nhexes = re.findall(r'#[0-9a-fA-F]{3,8}\\b', css)\nrgb   = re.findall(r'rgba?\\([^)]+\\)', css)\ncolors = hexes + rgb\n\n# 统计出现频率，取 Top 8 当主色板\ncounter = collections.Counter(c.lower() for c in colors)\ntop = counter.most_common(8)\n\nprint(':root {')\nfor i, (color, n) in enumerate(top):\n    print(f'  --c{i}: {color};   /* 出现 {n} 次 */')\nprint('}')\n\n# 同理可提取 font-family / border-radius / box-shadow\nfor m in re.findall(r'font-family:\\s*[^;}]+', css)[:10]:\n    print(m)" },
        { type: "callout", t: "analogy", title: "一句话类比", body: "把网站当成<b>积木成品</b>，这份脚本把它拆回一箱<b>标准积木</b>——每种颜色一块、每种圆角一块，下次要用哪种拼法（哪一套配色）都能信手拈来。" },

        { type: "h2", text: "4 · 提示词模板：驱动 AI 精修高保真" },
        { type: "p", text: "素材备齐后，最关键的是「怎么对 AI 说」。模板自带的提示词模板长这样——把变量填入括号即可复用：" },
        { type: "code", label: "提示词模板 · 给 Claude Code / Cursor 的工作指令", code: "任务：克隆目标页面 {URL} 为高保真静态页。\n\n输入素材：\n- 抓取的快照：snapshot.html\n- 设计令牌：tokens.css（颜色/字体/间距/圆角见 :root）\n\n要求：\n1. 严格使用 tokens.css 里的变量，禁止硬编码颜色。\n2. 布局、间距、字号与快照逐像素对齐。\n3. 桌面/平板/手机三档响应式都完整。\n4. hover / 聚焦 / 点击等交互状态齐全。\n5. 图片与字体资源全部本地化，不引用原站。\n\n验收：对照快照截图逐项检查，输出 diff 说明偏差。" },
        { type: "review", items: [
          { t: "先抓后做", d: "让 AI 看到真实 HTML + 令牌，才能形神兼备" },
          { t: "令牌 = 积木箱", d: "颜色/字体/间距抽成变量，克隆才可复用可对齐" },
          { t: "提示词 = 契约", d: "把验收标准写进提示词，AI 才知道“高保真”到多细" },
          { t: "资源本地化", d: "不依赖原站，克隆才真正属于你" }
        ] },
        { type: "miniquiz", q: "模板流程中“提取设计令牌”这一步的作用是？",
          options: ["加密原网站的图片", "把散落页面里的颜色、字体、间距抽成统一 CSS 变量，供克隆复用和对齐", "加快浏览器下载速度", "自动生成网页文案"],
          answer: 1, explain: "提取脚本把设计值（颜色、字体、间距、圆角）统计去重成 :root 变量，AI 用同一套令牌重建页面，就能实现像素级对齐与批量复用。" }
      ]
    }
  };

  window.PROJECT_COURSES = PROJECT_COURSES;
  window.PROJECT_ORDER = PROJECT_ORDER;
})();