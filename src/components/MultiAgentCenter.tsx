import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Users, Database, ShieldAlert, Sparkles, Send, 
  Settings, ChevronRight, Play, CheckCircle2, AlertCircle, RefreshCw, 
  Terminal, Globe, Zap, ArrowRight, BookOpen, Layers, Save, Copy,
  Plus, Trash2, Edit3, Sliders, RotateCcw, Check
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  prompt: string;
  tools: string[];
  temperature: number;
  status: 'idle' | 'working' | 'done' | 'error';
}

interface BusinessSystem {
  id: string;
  name: string;
  endpoint: string;
  latency: number;
  status: 'connected' | 'disconnected';
  incomingData: string;
  outgoingData: string;
}

interface Workflow {
  id: string;
  title: string;
  desc: string;
  agentIds: string[];
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent_opinion',
    name: '舆情捕手 (Media Insight Agent)',
    role: '负责从小红书、抖音、美团等社媒渠道高频抓取最新爆款食品风味、主打配料、客群痛点等原声数据。',
    icon: <Globe className="w-5 h-5 text-sky-500" />,
    prompt: '你扮演高级食品舆情分析师。聚焦在提炼高热度小红书/抖音食品风味标签，找出近期快速成长的潜力词、消费者痛点，并向【配方研发大师】同步原料和口感期望。',
    tools: ['FetchTrendingKeywords', 'CleanSocialFeeds', 'ExtractUserSentiment'],
    temperature: 0.6,
    status: 'idle'
  },
  {
    id: 'agent_formula',
    name: '配方研发大师 (Formulation R&D Agent)',
    role: '根据舆情输入设计具有商业竞争力的新品底层配方与工艺参数，并对接国家添加剂及广告法违禁机制。',
    icon: <Database className="w-5 h-5 text-emerald-500" />,
    prompt: '你扮演资深食品研发科学家。根据舆情热词输出标准烘焙配方比（精确到克）、操作温度与防添加剂超标审计。确保配方符合《国家食品添加剂合规标准（GB2760）》，计算工艺损耗并提交给【运营企划师】。',
    tools: ['SearchEnterpriseRecipeKB', 'VerifyAdditiveCompliance', 'CalculateRawCostRate'],
    temperature: 0.2,
    status: 'idle'
  },
  {
    id: 'agent_plan',
    name: '运营企划师 (Product Planner Agent)',
    role: '执行核心商业定价、目标客户分群、竞争对手护城河建立、估算整份方案毛利率（Gross Margin）并进行包装。',
    icon: <Cpu className="w-5 h-5 text-indigo-500" />,
    prompt: '你扮演新式烘焙与点心运营专家。负责将配方转换成富有吸引力的新品卖点，制定零售定价方案、估算食品成本率并预测首月销售爆发系数。完成后将定位推文骨架告知【自媒体宣发官】。',
    tools: ['GetCompetitorPricing', 'CalculateTargetRevenue', 'PredictSentimentMultiplier'],
    temperature: 0.7,
    status: 'idle'
  },
  {
    id: 'agent_publish',
    name: '自媒体宣发官 (Campaign Agent)',
    role: '撰写具有高转化率与吸睛噱头的小红书/抖音等种草文案、视频分镜模板，并通过社交发布系统自动推流。',
    icon: <Sparkles className="w-5 h-5 text-rose-500" />,
    prompt: '你扮演资深爆款小红书博主与营销专家。针对产品定位，设计容易引发二次裂变与种草狂潮的推文排版，含有高点击率主副标题。检查《消费者广告法避坑白皮书》，自动打包推流至内容运营系统。',
    tools: ['DraftREDVirals', 'FilterAdIllegalWords', 'SyncToSocialScheduler'],
    temperature: 0.8,
    status: 'idle'
  }
];

const INITIAL_SYSTEMS: BusinessSystem[] = [
  {
    id: 'sys_erp',
    name: 'ERP 进销存配料库 API',
    endpoint: 'https://api.bakery-erp.internal/v2/inventory',
    latency: 18,
    status: 'connected',
    incomingData: '查询原材料生鲜库存，配比校验',
    outgoingData: '返回余量充足 & 黄金配方配料锁定'
  },
  {
    id: 'sys_scraper',
    name: '社媒高频爬虫网关 Webhook',
    endpoint: 'https://api.scraper-gw.internal/feeds',
    latency: 124,
    status: 'connected',
    incomingData: '推送包含指定烘焙/茶饮标签的前50条互动帖子分析',
    outgoingData: '获取正负向情感高频原声文本'
  },
  {
    id: 'sys_legal',
    name: '广告合规与国家添加剂 API',
    endpoint: 'https://api.legal-compliance.internal/v1/compliance',
    latency: 35,
    status: 'connected',
    incomingData: '验证食品添加剂配比 & 小红书文案词汇过滤',
    outgoingData: '未检测到违禁词，符合合规标准（GB2760）'
  },
  {
    id: 'sys_social',
    name: '多渠道社交自动宣发系统 SDK',
    endpoint: 'https://push-channel.corporate/v3/publish',
    latency: 145,
    status: 'connected',
    incomingData: '推送最终排版种草推文到小红书内容管理后台草稿箱',
    outgoingData: '草稿创建成功, 队列 ID: #RED-AUTO-2026'
  }
];

interface MultiAgentCenterProps {
  userRole?: string;
}

export default function MultiAgentCenter({ userRole = '高管层' }: MultiAgentCenterProps) {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [systems, setSystems] = useState<BusinessSystem[]>(INITIAL_SYSTEMS);

  // Active configurations
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(INITIAL_AGENTS[0]);
  const [customKeyword, setCustomKeyword] = useState<string>('开心果抹茶提拉米苏');
  const [workflowMode, setWorkflowMode] = useState<string>('all');

  const INITIAL_WORKFLOWS: Workflow[] = [
    {
      id: 'all',
      title: 'A. 爆款新品全链自驱自动研发流程',
      desc: '舆情筛查 -> 工艺研发与GB2760审核 -> 商业定价核算 -> 自媒体种草文文案部署。',
      agentIds: ['agent_opinion', 'agent_formula', 'agent_plan', 'agent_publish']
    },
    {
      id: 'compliance',
      title: 'B. 消费者痛点提取与工艺合规整改',
      desc: '直接针对原料添加剂与小红书广告违禁词进行敏感筛查与安全修复。',
      agentIds: ['agent_opinion', 'agent_formula', 'agent_publish']
    },
    {
      id: 'competitor',
      title: 'C. 竞品动态敏捷自驱对攻企划',
      desc: '直接抓取竞品价格参数，做价格差异化防守，然后一键发布社交渠道。',
      agentIds: ['agent_opinion', 'agent_plan', 'agent_publish']
    }
  ];

  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [isAddingWorkflow, setIsAddingWorkflow] = useState<boolean>(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  // Form states for custom workflows
  const [newWorkflow, setNewWorkflow] = useState({
    title: '',
    desc: '',
    agentIds: [] as string[]
  });

  // Multi-agent runtime state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Final structured outputs state
  const [generatedRecipe, setGeneratedRecipe] = useState<any | null>(null);
  const [generatedStrategy, setGeneratedStrategy] = useState<any | null>(null);
  const [generatedCampaign, setGeneratedCampaign] = useState<any | null>(null);
  const [apiReceipt, setApiReceipt] = useState<any | null>(null);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Available Tools list for Agents
  const AVAILABLE_TOOLS = [
    'FetchTrendingKeywords',
    'CleanSocialFeeds',
    'ExtractUserSentiment',
    'SearchEnterpriseRecipeKB',
    'VerifyAdditiveCompliance',
    'CalculateRawCostRate',
    'GetCompetitorPricing',
    'CalculateTargetRevenue',
    'PredictSentimentMultiplier',
    'DraftREDVirals',
    'FilterAdIllegalWords',
    'SyncToSocialScheduler'
  ];

  // Business Systems Configuration State
  const [isAddingSystem, setIsAddingSystem] = useState<boolean>(false);
  const [newSystem, setNewSystem] = useState({
    name: '',
    endpoint: '',
    incomingData: '',
    outgoingData: ''
  });
  const [editingSystem, setEditingSystem] = useState<BusinessSystem | null>(null);

  // Agent Swarm Force Configuration State
  const [isAddingAgent, setIsAddingAgent] = useState<boolean>(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: '',
    prompt: '',
    tools: ['FetchTrendingKeywords'] as string[],
    temperature: 0.6
  });

  // Copy and clipboard handlers
  const handleCopyText = (text: string, indexKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(indexKey);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Systems Status Toggle helper
  const toggleSystem = (id: string) => {
    setSystems(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'connected' ? 'disconnected' : 'connected' } : s));
  };

  // Select Active Agent helper
  const handleSelectAgent = (ag: Agent) => {
    setSelectedAgent(ag);
    setIsAddingAgent(false);
  };

  // Update specific Agent configuration in lines edit/updates
  const updateAgentField = (id: string, field: keyof Agent, value: any) => {
    setAgents(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, [field]: value };
        if (selectedAgent && selectedAgent.id === id) {
          setSelectedAgent(updated);
        }
        return updated;
      }
      return a;
    }));
  };

  // Workflow builder toggle agent sequential handlers
  const handleToggleAgentForAddWorkflow = (agentId: string) => {
    setNewWorkflow(prev => {
      const exists = prev.agentIds.includes(agentId);
      if (exists) {
        return { ...prev, agentIds: prev.agentIds.filter(id => id !== agentId) };
      } else {
        return { ...prev, agentIds: [...prev.agentIds, agentId] };
      }
    });
  };

  const handleToggleAgentForEditWorkflow = (agentId: string) => {
    if (!editingWorkflow) return;
    setEditingWorkflow(prev => {
      if (!prev) return null;
      const exists = prev.agentIds.includes(agentId);
      const nextIds = exists ? prev.agentIds.filter(id => id !== agentId) : [...prev.agentIds, agentId];
      return { ...prev, agentIds: nextIds };
    });
  };

  // Action: Reset defaults
  const handleResetSystems = () => {
    setSystems(INITIAL_SYSTEMS);
    setEditingSystem(null);
    setIsAddingSystem(false);
  };

  const handleResetAgents = () => {
    setAgents(INITIAL_AGENTS);
    setSelectedAgent(INITIAL_AGENTS[0]);
    setIsAddingAgent(false);
  };

  // Action: Save new Business API system
  const handleSaveNewSystem = () => {
    if (!newSystem.name.trim() || !newSystem.endpoint.trim()) {
      alert('请填入完整的“系统/接口名称”和“网关 API 端点”！');
      return;
    }
    const created: BusinessSystem = {
      id: `sys_custom_${Date.now()}`,
      name: newSystem.name.trim(),
      endpoint: newSystem.endpoint.trim(),
      latency: Math.floor(Math.random() * 80) + 15,
      status: 'connected',
      incomingData: newSystem.incomingData.trim() || '任意自定义请求输入',
      outgoingData: newSystem.outgoingData.trim() || '返回成功处理后的自定义数据结构'
    };
    setSystems(prev => [...prev, created]);
    setNewSystem({ name: '', endpoint: '', incomingData: '', outgoingData: '' });
    setIsAddingSystem(false);
  };

  // Action: Save edited system
  const handleUpdateSystem = () => {
    if (!editingSystem) return;
    if (!editingSystem.name.trim() || !editingSystem.endpoint.trim()) {
      alert('系统名称和网关端点不能为空！');
      return;
    }
    setSystems(prev => prev.map(s => s.id === editingSystem.id ? editingSystem : s));
    setEditingSystem(null);
  };

  // Action: Delete system
  const handleDeleteSystem = (id: string) => {
    setSystems(prev => prev.filter(s => s.id !== id));
    if (editingSystem?.id === id) {
      setEditingSystem(null);
    }
  };

  // Action: Save custom Agent
  const handleSaveNewAgent = () => {
    if (!newAgent.name.trim() || !newAgent.role.trim() || !newAgent.prompt.trim()) {
      alert('请填入完整的“智能体名称”、“核心职能”和“指令 Prompt”！');
      return;
    }
    const created: Agent = {
      id: `agent_custom_${Date.now()}`,
      name: newAgent.name.trim(),
      role: newAgent.role.trim(),
      prompt: newAgent.prompt.trim(),
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      tools: newAgent.tools,
      temperature: newAgent.temperature,
      status: 'idle'
    };
    setAgents(prev => [...prev, created]);
    setSelectedAgent(created);
    setNewAgent({
      name: '',
      role: '',
      prompt: '',
      tools: ['FetchTrendingKeywords'],
      temperature: 0.6
    });
    setIsAddingAgent(false);
  };

  // Action: Delete custom Agent
  const handleDeleteAgent = (id: string) => {
    if (agents.length <= 1) {
      alert('系统中至少需要保留 1 个活跃智能体专家以支持自驱协作流运转！');
      return;
    }
    const remaining = agents.filter(a => a.id !== id);
    setAgents(remaining);
    if (selectedAgent?.id === id) {
      setSelectedAgent(remaining[0] || null);
    }
  };

  // Action: Toggle tools of agent we are editing (in line or on add)
  const handleToggleToolForAddAgent = (tool: string) => {
    setNewAgent(prev => {
      const exists = prev.tools.includes(tool);
      if (exists) {
        return { ...prev, tools: prev.tools.filter(t => t !== tool) };
      } else {
        return { ...prev, tools: [...prev.tools, tool] };
      }
    });
  };

  const handleToggleToolForSelectedAgent = (tool: string) => {
    if (!selectedAgent) return;
    setAgents(prev => prev.map(ag => {
      if (ag.id === selectedAgent.id) {
        const exists = ag.tools.includes(tool);
        const nextTools = exists ? ag.tools.filter(t => t !== tool) : [...ag.tools, tool];
        return { ...ag, tools: nextTools };
      }
      return ag;
    }));
    setSelectedAgent(prev => {
      if (!prev) return null;
      const exists = prev.tools.includes(tool);
      const nextTools = exists ? prev.tools.filter(t => t !== tool) : [...prev.tools, tool];
      return { ...prev, tools: nextTools };
    });
  };

  // Action: Reset Workflows to initial value
  const handleResetWorkflows = () => {
    setWorkflows(INITIAL_WORKFLOWS);
    setWorkflowMode('all');
    setIsAddingWorkflow(false);
    setEditingWorkflow(null);
  };

  // Action: Save new custom workflow
  const handleSaveNewWorkflow = () => {
    if (!newWorkflow.title.trim() || !newWorkflow.desc.trim()) {
      alert('请填入完整的“工作流标题”及“任务流向描述”！');
      return;
    }
    if (newWorkflow.agentIds.length < 1) {
      alert('协同工作流中必须选择至少 1 个参与分析的智能体专家！');
      return;
    }
    const created: Workflow = {
      id: `wflow_custom_${Date.now()}`,
      title: newWorkflow.title.trim(),
      desc: newWorkflow.desc.trim(),
      agentIds: newWorkflow.agentIds
    };
    setWorkflows(prev => [...prev, created]);
    setWorkflowMode(created.id);
    setNewWorkflow({ title: '', desc: '', agentIds: [] });
    setIsAddingWorkflow(false);
  };

  // Action: Save edited workflow
  const handleUpdateWorkflow = () => {
    if (!editingWorkflow) return;
    if (!editingWorkflow.title.trim() || !editingWorkflow.desc.trim()) {
      alert('工作流标题与描述不能为空！');
      return;
    }
    if (editingWorkflow.agentIds.length < 1) {
      alert('工作流必须包含至少 1 个参与协作的智能体！');
      return;
    }
    setWorkflows(prev => prev.map(w => w.id === editingWorkflow.id ? editingWorkflow : w));
    setEditingWorkflow(null);
  };

  // Action: Delete custom workflow
  const handleDeleteWorkflow = (id: string) => {
    if (workflows.length <= 1) {
      alert('系统中至少需要保留 1 个活跃自动化协同工作流以供运作！');
      return;
    }
    const remaining = workflows.filter(w => w.id !== id);
    setWorkflows(remaining);
    if (workflowMode === id) {
      setWorkflowMode(remaining[0]?.id || 'all');
    }
  };

  // Run Collaborative Simulation
  const runCollaboration = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStep(0);
    setLogs([]);
    setGeneratedRecipe(null);
    setGeneratedStrategy(null);
    setGeneratedCampaign(null);
    setApiReceipt(null);

    // Dynamic generation outputs based on input keyword
    const kw = customKeyword.trim() || '开心果抹茶提提拉米苏';

    const mockOutputRecipe = {
      productName: `${kw}`,
      servingSize: '10寸模具 / 或单杯成品 6 份',
      rawCost: '单杯约 ¥7.80',
      difficulty: '★★★☆☆ 商业成熟配方',
      ingredients: [
        { name: '伊朗一级A级开心果酱', amount: '45g', function: '底层风味基石与天然绿韵色泽' },
        { name: '日本宇治五十铃纯抹茶粉', amount: '8g', function: '微苦醇香，中和甜腻' },
        { name: '意大利马斯卡彭干酪 (Mascarpone)', amount: '220g', function: '醇厚奶油奶酪主体' },
        { name: '爱乐薇动物性淡奶油 (35%脂)', amount: '180g', function: '云朵般轻盈乳脂慕斯体' },
        { name: '手指饼干 (Savoiardi) / 冷水萃冷冽萃取液', amount: '12根 / 60ml', function: '吸水底托与清脆咖啡果酸感' },
        { name: '零卡罗汉果甜菊糖 (复合复配)', amount: '28g', function: '在控制热量的前提下满足甜度感官' },
        { name: '食品级明胶片', amount: '5.5g', function: '质地定型支撑（12小时低温成型）' }
      ],
      steps: [
        '【乳酪体调配】将马斯卡彭干酪置于室温软化，加入开心果酱及罗汉果糖，手动打蛋器慢速搅打至细腻淡绿色乳霜状，避免充气过度。',
        '【抹茶淡奶油】淡奶油隔冰水打发至5分发，筛入宇治抹茶粉，改中速继续打发至6-7分发（有清晰纹路但仍具流平性）。',
        '【合拢均质】分次将抹茶奶油加入开心果乳酪中，采用烘焙刮刀由下至上翻拌均质。加入提前融化的明胶溶液拌匀。',
        '【浸润浸透】手指饼干双面浸渍咖啡冷萃液1.5秒（避免久泡软烂塌陷），码放在杯底作为风味夹层。',
        '【灌模冷藏】将均质好的开心果乳酪灌入模具或单杯，震出气泡，4℃冷藏冷冻网格密闭保存至少6小时。',
        '【合规检测】配料表中开心果酱用量4.5%，符合烘焙安全用量，无阿斯巴甜、防腐剂成分添加。符合预制零售通合规。'
      ]
    };

    const mockOutputStrategy = {
      productName: `${kw}`,
      targetAudience: '城市白领、减脂抗糖主义者、轻奢中产、下午茶体验控',
      positioning: '“冷热碰撞，双重风味对垒”的治愈系健康轻烘焙',
      pricePlan: {
        rawCost: '¥7.80',
        packaging: '¥1.20',
        logistics: '¥1.50 (冷链保障)',
        retailPrice: '¥29.00 - ¥34.00 (单杯独立装)',
        grossMargin: '约 67.2% ~ 72.4%',
        suggestedDiscount: '二人同行分享套餐价 ¥54.00 激活社群裂变'
      },
      keySellingPoints: [
        '天然开心果酱的坚果油脂香与微涩抹茶底的戏剧性味觉起伏',
        '罗汉果甜菊替代传统白砂糖，单份热量降低 35%，控糖友好',
        '全进口马斯卡彭干酪加持，极高乳脂比例，拒绝反式脂肪酸',
        '“冰川绿 + 森林绿”的高颜值自然分层，极佳的社交网络视觉传播(Insta-worthy)'
      ],
      competitorCounter: '对标主要竞品 O* Bread 在售的开心果爆浆海盐蛋糕（价格 ¥42，热量高达 540 Kcal）。我们的优势是单杯包装易携带、降糖减脂少负罪感、单杯控温极速锁鲜，核心价格下探 25%。'
    };

    const mockOutputCampaign = {
      title: '🥑 救命！这口开心果配抹茶，直接香到了我的心坎里！',
      tags: '#下午茶好去处 #高颜值甜品 #开心果控 #抹茶控 #低卡降糖甜品 #魔都面包房',
      body: `【小红书种草顶流密码 💡】\n\n终于被我找到了！😭 懂咖啡、懂焙烤的友友绝对不能错过的「${kw}」！\n\n本来以为抹茶 and 开心果会各夺风采，直到第一勺挖下去——\n抹茶的清冷微涩，瞬间就被细腻如海泥的伊朗纯开心果酱的浓醇裹住了！\n再加上马斯卡彭奶酪和海冰般的轻云奶油，入口即融，浓郁在舌尖爆炸 💥！\n\n⭐ 为什么敢说它是今年的「神作」？\n1️⃣ 天然原酱好配料：0色素0反式脂肪，使用原产地黄金坚果与进口五十铃抹茶。\n2️⃣ 控热轻盈不长胖：使用罗汉果代糖！减肥星人有救了，放手炫，毫无负担！\n3️⃣ 森林呼吸感外观：高颜值的绿白渐变层，下午茶拍照直接刷爆朋友圈 📱。\n\n🎉 线下门店首发特惠中，跟闺蜜组队，直接省下十几块！\n\n📍 烘焙大本营限定供应 · 抢先尝鲜！`,
      adLegalStatus: '法务合规自检通过。已清除“最香”、“第一”、“降脂燃脂”等可能引发争议的极端绝对词。符合《国家广告法》和《互联网广告管理办法》。'
    };

    const mockApiReceipt = {
      timestamp: new Date().toISOString(),
      transactionId: `TX-AGENT-CO-${Math.floor(Math.random() * 900000 + 100000)}`,
      status: 'SUCCESS',
      actionsPerformed: [
        { system: 'ERP 进销存配料库', outcome: '配料清单原料数据库成功核冻。自动将伊朗开心果酱 5kg、五十铃抹茶 1kg 从虚拟备货库存调拨到研发实验室实验室试剂。成本率核对回传完成。' },
        { system: '广告合规与国家添加剂 API', outcome: '经法务大模型扫描：配料明细中各防腐剂含量均为0，配方与文案白名单比对100%合规，符合 GB2760 法规。已发放合规Token: ACC-77A9E-2026' },
        { system: '多渠道社交自动宣发系统', outcome: '小红书草稿库自动注入。已推送生成配图、生成种草文案、生成人群标签，等待运营负责人在小红书协作后台一键定点群发。' }
      ]
    };

    // Timeline steps delay simulation for vivid live feedback
    const addLog = (text: string, delay: number, onComplete?: () => void) => {
      setTimeout(() => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
        if (onComplete) onComplete();
      }, delay);
    };

    const activeWorkflow = workflows.find(w => w.id === workflowMode) || workflows[0];
    const stepsLength = activeWorkflow.agentIds.length;

    // 1. Init
    let currentTime = 100;
    addLog(`🚀 启动自驱自动化工作管线 [模式: ${activeWorkflow.title}]`, currentTime);
    addLog(`🎯 核心目标定位：对新品「${kw}」依照编队节点链路执行情报推演...`, currentTime + 500);
    
    // Check system status
    addLog(`🔍 正在检查各业务连接系统 APIs 连接网关...`, currentTime + 1000);

    const isErpConnected = systems.find(s => s.id === 'sys_erp')?.status === 'connected';
    const isScraperConnected = systems.find(s => s.id === 'sys_scraper')?.status === 'connected';
    const isLegalConnected = systems.find(s => s.id === 'sys_legal')?.status === 'connected';
    const isSocialConnected = systems.find(s => s.id === 'sys_social')?.status === 'connected';

    setTimeout(() => {
      setLogs(prev => [...prev, 
        `📡 [网关自检] ERP: ${isErpConnected ? '✅ CONNECTED' : '❌ OFFLINE'}, 舆情爬虫: ${isScraperConnected ? '✅ CONNECTED' : '❌ OFFLINE'}, 合规校验: ${isLegalConnected ? '✅ CONNECTED' : '❌ OFFLINE'}, 宣发系统: ${isSocialConnected ? '✅ CONNECTED' : '❌ OFFLINE'}`
      ]);
    }, currentTime + 1400);

    currentTime += 2000;

    // Run each agent dynamically sequentially
    activeWorkflow.agentIds.forEach((agentId, index) => {
      const stepNum = index + 1;
      const currentAgent = agents.find(a => a.id === agentId);
      if (!currentAgent) return;

      // Start current agent state
      setTimeout(() => {
        setActiveStep(stepNum);
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'working' } : a));
      }, currentTime);

      addLog(`🧑‍💻 [${currentAgent.name}] 奉命开始介入协作推演... (模型创造力 Temp: ${currentAgent.temperature})`, currentTime);
      addLog(`📋 系统指令 Prompt Override: "${currentAgent.prompt.slice(0, 36)}..."`, currentTime + 400);

      if (agentId === 'agent_opinion') {
        if (isScraperConnected) {
          addLog(`🕵️‍♂️ 正在调用高频舆情爬虫 Webhook 抓取关于 "${kw}" 的小红书互动...`, currentTime + 800);
          addLog(`📊 探针锁定 1,480 条相关舆音：其中健康轻卡代糖提及率达到 76.5%，对苦甜多层口感呼声高。`, currentTime + 1400);
          addLog(`📥 舆情向量特征打包传输成功。推送输入至后续工艺链...`, currentTime + 2000);
        } else {
          addLog(`⚠️ [网关离线] 舆情网络爬虫未开启，系统启动自带商情预装决策树。`, currentTime + 800);
          addLog(`📊 装载历史类似烘焙热词“健康不齁、抹茶、多重油脂香系数”。`, currentTime + 1400);
          addLog(`📥 特征向量包离线合并。`, currentTime + 2000);
        }
      } else if (agentId === 'agent_formula') {
        addLog(`🧪 智能配方工程师运行，对比知识库内黄金乳脂融合系数及18组相似抹茶提拉米苏凝固阈值...`, currentTime + 600);
        addLog(`🧮 自动调配均质黄金参数：马斯卡彭(220g) : 宇治抹茶粉(8s) : Iranian A级开心果酱。`, currentTime + 1300);
        if (isLegalConnected) {
          addLog(`🛡️ 触发广告合规及 GB2760 添加剂审查 API 端口校验...`, currentTime + 2000);
          addLog(`✅ 审核通过：确认完全规避人工合成色素与抗氧化剂。健康零蔗糖等级 OK。`, currentTime + 2600);
        } else {
          addLog(`⚠️ 国家添加剂合规网关不可达，执行单机静态合规预估，提醒进行手工定检。`, currentTime + 2000);
        }
        setTimeout(() => {
          setGeneratedRecipe(mockOutputRecipe);
        }, currentTime + 2900);
      } else if (agentId === 'agent_plan') {
        addLog(`📊 精确锁定周边在售同类型开心果甜点定价，并测算烘焙物料供应链加权均值...`, currentTime + 600);
        addLog(`💸 算得原材料成本 ¥7.80。建议中高下午茶单杯策略价格范围设立为 ¥29.00 - ¥34.00。`, currentTime + 1300);
        addLog(`📈 预估产品首月毛利率直达约 ${mockOutputStrategy.pricePlan.grossMargin}。竞争性毛利防守卡片创建就绪。`, currentTime + 2000);
        setTimeout(() => {
          setGeneratedStrategy(mockOutputStrategy);
        }, currentTime + 2500);
      } else if (agentId === 'agent_publish') {
        addLog(`📝 合成前面多段专家研判的数据指纹，输出极具种草高转化的小红书文案...`, currentTime + 600);
        addLog(`🛡️ 开启敏感词排雷：成功对“最高级”、“纯脂瘦身”等绝对化法律规避，替换为“罗汉果轻盈”、“五十铃优雅微苦”。`, currentTime + 1300);
        if (isSocialConnected) {
          addLog(`📡 通过宣发系统 Webhook 自动向企业官方社交自媒体管理草稿中心导入内容...`, currentTime + 2000);
          addLog(`🚀 [云对接反馈] 图文草案 draftId #RED-AUTO-2026 创建并导入就绪，等待总审宣发。`, currentTime + 2600);
        } else {
          addLog(`⚠️ [SDK离线] 推送网关关闭，仅输出本地文案与标签集，支持手动复制提取。`, currentTime + 2000);
        }
        setTimeout(() => {
          setGeneratedCampaign(mockOutputCampaign);
          setApiReceipt(mockApiReceipt);
        }, currentTime + 2800);
      } else {
        // Dynamic fallback step for customized agents!
        const mockedToolsLog = currentAgent.tools && currentAgent.tools.length > 0
          ? `⚙️ 联动触发该专家赋能的系统外置工具: [${currentAgent.tools.join(', ')}]()，进行逻辑对齐。`
          : `📔 专家依靠纯指令型 Prompt 自驱做综合评定。`;
        addLog(`🔮 自定义专家组 [${currentAgent.name}] 正在评估流内的全部数据缓存与角色诉求...`, currentTime + 600);
        addLog(mockedToolsLog, currentTime + 1300);
        addLog(`✅ 处理完成：专家回执已被舰队核心工作流管理器成功序列化存储。`, currentTime + 2000);
      }

      // Terminate working state of current agent
      const endDelay = currentTime + 3000;
      setTimeout(() => {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'done' } : a));
      }, endDelay);

      currentTime += 3200;
    });

    // Complete whole loops
    setTimeout(() => {
      setActiveStep(stepsLength + 1);
      setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
      setIsRunning(false);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🎊 贺喜！多智能体配置工作流 [${activeWorkflow.title}] 已全部圆满协同运行完毕！累计跨智能体推测耗时：${(stepsLength * 3.2).toFixed(1)} 秒。各项 API 会执存入大盘。`]);
    }, currentTime);
  };




  return (
    <div className="space-y-6" id="multi_agent_center_viewport">
      
      {/* Top Welcome Title */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl" id="agent_header_hero">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Cpu className="w-64 h-64 text-indigo-400 rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Autonomous Multi-Agent Swarm Platform</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display text-white">
            多智能体自驱协作中心 <span className="text-indigo-400">Agentic Sandbox</span>
          </h1>
          
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            通过由 4 位垂直职能 AI 专家组成的“智能体舰队”，打通社交媒体抓取层、ERP配方管理网关、国家食品法合规法典、多渠道营销终端。
            只需给出您的创意或选题，智能体将自主进行<strong>情报共商、配方精研、毛利测算与一键宣发</strong>，实现企业全链自动化协助。
          </p>
          
          <div className="pt-2 flex items-center gap-6 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>协作机制：基于角色自律互调</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>数据互通：ERP / Legal / Scraper API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Agents & Business Systems Gateways (lg:span-5) */}
        <div className="lg:col-span-5 space-y-6" id="agent_and_system_gated">
          
          {/* Section: Business Systems Connecting Dials */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">对接的生产与业务系统 (APIs)</h2>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setIsAddingSystem(!isAddingSystem);
                    setEditingSystem(null);
                  }}
                  className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>添加系统</span>
                </button>
                <button
                  onClick={handleResetSystems}
                  className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold px-1.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition"
                  title="恢复出厂重置"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              智能体在工作时会自动查询或写入以下业务系统。您可以通过开关随时将它们“联机”或“离线”来调整智能体的信息抓取模式：
            </p>

            {/* Form: Add New System */}
            {isAddingSystem && (
              <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/80 space-y-3 text-xs text-slate-700 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-amber-900 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>注册新系统 API 网关</span>
                  </h3>
                  <button 
                    onClick={() => setIsAddingSystem(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">系统与接口名称 *</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      placeholder="例: 会员权益积分 CRM"
                      value={newSystem.name}
                      onChange={e => setNewSystem(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">API Endpoint 网关地址 *</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      placeholder="例: https://api.crm.internal/v2/user"
                      value={newSystem.endpoint}
                      onChange={e => setNewSystem(prev => ({ ...prev, endpoint: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">输入 (入参期望)</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                        placeholder="例: 用户手机号、首发积分"
                        value={newSystem.incomingData}
                        onChange={e => setNewSystem(prev => ({ ...prev, incomingData: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">输出 (返回特征)</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                        placeholder="例: 积分余额比、等级折扣"
                        value={newSystem.outgoingData}
                        onChange={e => setNewSystem(prev => ({ ...prev, outgoingData: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveNewSystem}
                    className="w-full bg-amber-600 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition-all shadow-sm"
                  >
                    保存并上线该 API 节点
                  </button>
                </div>
              </div>
            )}

            {/* Form: Edit Existing System */}
            {editingSystem && (
              <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200 space-y-3 text-xs text-slate-700 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>编辑系统配置</span>
                  </h3>
                  <button 
                    onClick={() => setEditingSystem(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-indigo-600 block mb-0.5">生产系统名 *</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      value={editingSystem.name}
                      onChange={e => setEditingSystem(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-indigo-600 block mb-0.5">API 网关 Endpoint *</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      value={editingSystem.endpoint}
                      onChange={e => setEditingSystem(prev => prev ? { ...prev, endpoint: e.target.value } : null)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-indigo-600 block mb-0.5">输入(智能体推送内容)</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                        value={editingSystem.incomingData}
                        onChange={e => setEditingSystem(prev => prev ? { ...prev, incomingData: e.target.value } : null)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-indigo-600 block mb-0.5">输出(返回数据结构)</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                        value={editingSystem.outgoingData}
                        onChange={e => setEditingSystem(prev => prev ? { ...prev, outgoingData: e.target.value } : null)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateSystem}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition"
                    >
                      提交保存
                    </button>
                    <button
                      onClick={() => handleDeleteSystem(editingSystem.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2 px-3 rounded-lg text-xs cursor-pointer transition flex items-center gap-1"
                      title="注销此系统外设"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>卸载系统</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              {systems.map(sys => {
                const isOnline = sys.status === 'connected';
                return (
                  <div key={sys.id} className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 flex items-start justify-between gap-3 transition hover:bg-slate-50 relative group">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        <strong className="text-xs text-slate-800 font-bold block truncate">{sys.name}</strong>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{sys.endpoint}</p>
                      
                      <div className="text-[10px] bg-white p-1.5 rounded border border-slate-150 text-slate-600 font-sans mt-2 space-y-0.5">
                        <p><span className="text-indigo-600">输入:</span> {sys.incomingData}</p>
                        <p><span className="text-emerald-600">输出:</span> {sys.outgoingData}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 justify-between h-full min-h-[70px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingSystem(sys);
                            setIsAddingSystem(false);
                          }}
                          className="opacity-60 hover:opacity-100 text-slate-500 hover:text-indigo-600 p-1 rounded-md hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
                          title="修改/删除系统"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => toggleSystem(sys.id)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                            isOnline 
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' 
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                          }`}
                        >
                          {isOnline ? '连线中' : '离线'}
                        </button>
                      </div>
                      
                      {isOnline ? (
                        <span className="text-[9px] text-emerald-600 font-mono bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100">
                          延时: {sys.latency}ms
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100">
                          OFFLINE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {systems.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>没有任何对接的生产与业务系统。</p>
                  <p className="text-[10px] text-slate-400 mt-1">请点击右上角「添加系统」注册新 API 口。</p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Agent Swarm Fleet config */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4" id="agent_fleet_settings">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">智能体编队专家库 ({agents.length})</h2>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setIsAddingAgent(!isAddingAgent);
                  }}
                  className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>新增智能体</span>
                </button>
                <button
                  onClick={handleResetAgents}
                  className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold px-1.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition"
                  title="恢复初始智能体"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              点击可查看、修改或增删各个智能体的岗位与系统 Prompt 指令，重塑您自驱型团队的角色分布与大语言模型算力参数。
            </p>

            {/* Form: Add New Agent */}
            {isAddingAgent && (
              <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200 space-y-3 text-xs text-slate-700 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-emerald-900 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>配置并征募全新智能体 (Custom AI Agent)</span>
                  </h3>
                  <button 
                    onClick={() => setIsAddingAgent(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">智能体专家角色名 *</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                        placeholder="例如: 财务审计大师"
                        value={newAgent.name}
                        onChange={e => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">一句话岗位职责描述 *</label>
                      <input 
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                        placeholder="例如: 测算材料折旧费及综合人力回本期"
                        value={newAgent.role}
                        onChange={e => setNewAgent(prev => ({ ...prev, role: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">大模型系统指令 (System Prompt Override) *</label>
                    <textarea 
                      className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      rows={3}
                      placeholder="作为财务精兵。核算研发配方与包装的最终售价扣除耗损的真正利润，并向多系统登记..."
                      value={newAgent.prompt}
                      onChange={e => setNewAgent(prev => ({ ...prev, prompt: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-500 block mb-0.5">创造力参数 Temperature (越低越严谨稳定)</label>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-white px-1.5 rounded">{newAgent.temperature}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      className="w-full accent-emerald-500"
                      value={newAgent.temperature}
                      onChange={e => setNewAgent(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 block">系统赋能工具库 (点击配置赋能该 Agent)：</label>
                    <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto bg-white p-2 rounded-lg border border-slate-150 scrollbar-thin">
                      {AVAILABLE_TOOLS.map(tl => {
                        const active = newAgent.tools.includes(tl);
                        return (
                          <button
                            type="button"
                            key={tl}
                            onClick={() => handleToggleToolForAddAgent(tl)}
                            className={`text-[9px] font-mono p-1 rounded-sm text-left truncate flex items-center justify-between cursor-pointer ${
                              active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold' : 'bg-slate-50 hover:bg-slate-100/60 text-slate-500 border border-slate-200/50'
                            }`}
                          >
                            <span>🛠️ {tl}()</span>
                            {active && <span className="text-[9px]">✔</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNewAgent}
                    className="w-full bg-emerald-600 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition-all shadow-sm"
                  >
                    保存并编入智能体舰队
                  </button>
                </div>
              </div>
            )}

            {/* List horizontal/vertical agent cards */}
            <div className="grid grid-cols-2 gap-2">
              {agents.map(ag => {
                const isSelected = selectedAgent?.id === ag.id;
                return (
                  <button
                    key={ag.id}
                    onClick={() => handleSelectAgent(ag)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 h-28 relative ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/20' 
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/70 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10 text-indigo-400' : 'bg-white text-indigo-600'}`}>
                        {ag.icon}
                      </div>
                      <span className="text-[11px] font-bold tracking-tight block truncate w-24">
                        {ag.name.includes(' ') ? ag.name.split(' ')[0] : ag.name}
                      </span>
                    </div>

                    <p className={`text-[10px] line-clamp-2 leading-extra-tight ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {ag.role}
                    </p>

                    <div className="flex items-center justify-between mt-1 pt-1 border-t w-full border-slate-150/10">
                      <span className="text-[8px] font-mono opacity-80">Tools: {ag.tools ? ag.tools.length : 0}个</span>
                      <span className="text-[8px] font-mono opacity-80">Temp: {ag.temperature}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail configuration editing card */}
            {selectedAgent && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-800 font-bold">
                    <Settings className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                    <span>属性驯化：{selectedAgent.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">Agent-ID: {selectedAgent.id}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">修改专家名字</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      value={selectedAgent.name}
                      onChange={e => updateAgentField(selectedAgent.id, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">一句话核心职能</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      value={selectedAgent.role}
                      onChange={e => updateAgentField(selectedAgent.id, 'role', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">系统岗位指令 (System Prompt Override)</label>
                  <textarea
                    value={selectedAgent.prompt}
                    onChange={(e) => updateAgentField(selectedAgent.id, 'prompt', e.target.value)}
                    rows={4}
                    className="w-full text-xs font-sans bg-white p-2 border border-slate-200 rounded-lg text-slate-700 shadow-2xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-[10px] text-slate-500 font-bold block">模型创造力 (Temperature)</label>
                    <span className="text-[10px] font-mono text-indigo-600 bg-white border border-slate-150 px-1.5 rounded font-bold">{selectedAgent.temperature}</span>
                  </div>
                  <input 
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    className="w-full accent-indigo-600"
                    value={selectedAgent.temperature}
                    onChange={e => updateAgentField(selectedAgent.id, 'temperature', parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold block">智能体拥应的系统权限及工具包：</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1 bg-white p-2 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                    {AVAILABLE_TOOLS.map(tool => {
                      const enabled = selectedAgent.tools ? selectedAgent.tools.includes(tool) : false;
                      return (
                        <button
                          key={tool}
                          onClick={() => handleToggleToolForSelectedAgent(tool)}
                          className={`text-[9px] font-mono p-1 rounded-sm text-left truncate flex items-center justify-between cursor-pointer border ${
                            enabled 
                              ? 'bg-indigo-50/70 text-indigo-700 border-indigo-200 font-bold' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/50'
                          }`}
                        >
                          <span>⚙️ {tool}</span>
                          {enabled && <span className="text-[9px]">✔</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {agents.length > 1 && (
                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => {
                        handleDeleteAgent(selectedAgent.id);
                      }}
                      className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-1 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition"
                      title="从编队中解雇并注销专家"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>销毁此专家岗位</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Interactive Orchestration Workspace (lg:span-7) */}
        <div className="lg:col-span-7 space-y-6" id="agent_collaboration_workbench">
          
          {/* Section: Start Sandbox Trigger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">协同工作流调度台 (Orchestration Console)</h2>
              </div>
              <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">AUTO-PILOT READY</span>
            </div>

            {/* Quick Presets and input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 block font-bold">设定智能体大盘工作选题 (Trend Topic or Product)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    placeholder="请输入想要研发的新品或选题词..."
                    className="w-full text-xs text-slate-800 bg-slate-50 font-bold pr-10 pl-3 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="absolute right-3 top-2.5">
                    <Sparkles className="w-4 h-4 text-slate-400 animate-pulse" />
                  </div>
                </div>
                
                <div className="pt-1.5">
                  <span className="text-[10px] text-slate-400 block mb-1">💡 推荐热点题材选题 (点击快速载入)：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['咸蛋黄流心芋泥可颂', '无糖开心果巴斯克', '生椰冷萃麻薯大福', '桂花酒酿冰芝士提拉米苏'].map(tpl => (
                      <button 
                        key={tpl}
                        onClick={() => setCustomKeyword(tpl)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all cursor-pointer ${
                          customKeyword === tpl 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workflow policy options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <label className="text-xs text-slate-700 block font-bold">选择自驱工作流 (Collaboration Mode)</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsAddingWorkflow(!isAddingWorkflow);
                        setEditingWorkflow(null);
                      }}
                      className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-0.5"
                      title="配置生成一条全新的大语言模型协作链"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>新增自定义</span>
                    </button>
                    <button
                      onClick={handleResetWorkflows}
                      className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded cursor-pointer transition"
                      title="重置为官方预置工作流"
                    >
                      重置
                    </button>
                  </div>
                </div>

                {/* Create Workflow Form */}
                {isAddingWorkflow && (
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-200/80 space-y-2.5 text-xs animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-indigo-950 flex items-center gap-1 text-[11px]">
                        <Plus className="w-3.5 h-3.5" />
                        <span>定制自动化工作流编队模式</span>
                      </h4>
                      <button onClick={() => setIsAddingWorkflow(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">自驱流标题 *</label>
                        <input 
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          placeholder="例如: D. 新品小语种出海跨境宣发流"
                          value={newWorkflow.title}
                          onChange={e => setNewWorkflow(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">任务流向描述 / 系统目标说明 *</label>
                        <textarea 
                          rows={2}
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                          placeholder="例: 通过舆情、配方与出海宣发，一键连带完成多语言外销文案部署。"
                          value={newWorkflow.desc}
                          onChange={e => setNewWorkflow(prev => ({ ...prev, desc: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold block">配置本工作流智能体成员 (依次点选勾选)：</label>
                        <div className="grid grid-cols-2 gap-1.5 bg-white p-2 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                          {agents.map(ag => {
                            const isChecked = newWorkflow.agentIds.includes(ag.id);
                            const orderIndex = newWorkflow.agentIds.indexOf(ag.id);
                            return (
                              <button
                                type="button"
                                key={ag.id}
                                onClick={() => handleToggleAgentForAddWorkflow(ag.id)}
                                className={`text-[10px] p-1.5 rounded-md text-left truncate flex items-center justify-between cursor-pointer border transition-all ${
                                  isChecked 
                                    ? 'bg-indigo-50/80 text-indigo-800 border-indigo-300 font-bold' 
                                    : 'bg-slate-50 hover:bg-slate-100/60 text-slate-600 border-slate-200/50'
                                }`}
                              >
                                <span className="truncate">{ag.name.split(' ')[0]}</span>
                                {isChecked && (
                                  <span className="text-[9px] bg-indigo-600 text-white font-mono rounded-full w-4 h-4 flex items-center justify-center">
                                    {orderIndex + 1}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {newWorkflow.agentIds.length > 0 && (
                          <p className="text-[9px] text-indigo-600 font-mono mt-1">
                            路线: {newWorkflow.agentIds.map(id => agents.find(a => a.id === id)?.name.split(' ')[0]).join(' ➡️ ')}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handleSaveNewWorkflow}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded-md text-xs cursor-pointer shadow-sm mt-1 transition"
                      >
                        确认保存工作路线
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Existing Workflow Form */}
                {editingWorkflow && (
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/80 space-y-2.5 text-xs animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-amber-950 flex items-center gap-1 text-[11px]">
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>微调路线：{editingWorkflow.title}</span>
                      </h4>
                      <button onClick={() => setEditingWorkflow(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-amber-800 block mb-0.5">任务流标题 *</label>
                        <input 
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-amber-500 outline-hidden"
                          value={editingWorkflow.title}
                          onChange={e => setEditingWorkflow(prev => prev ? { ...prev, title: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-800 block mb-0.5">意图描述 / 参与职责 *</label>
                        <textarea 
                          rows={2}
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-amber-500 outline-hidden resize-none"
                          value={editingWorkflow.desc}
                          onChange={e => setEditingWorkflow(prev => prev ? { ...prev, desc: e.target.value } : null)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-amber-800 font-bold block">重新安排协作链成员 (依次点选)：</label>
                        <div className="grid grid-cols-2 gap-1.5 bg-white p-2 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                          {agents.map(ag => {
                            const isChecked = editingWorkflow.agentIds.includes(ag.id);
                            const orderIndex = editingWorkflow.agentIds.indexOf(ag.id);
                            return (
                              <button
                                type="button"
                                key={ag.id}
                                onClick={() => handleToggleAgentForEditWorkflow(ag.id)}
                                className={`text-[10px] p-1.5 rounded-md text-left truncate flex items-center justify-between cursor-pointer border transition-all ${
                                  isChecked 
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' 
                                    : 'bg-slate-50 hover:bg-slate-100/60 text-slate-600 border-slate-200/50'
                                }`}
                              >
                                <span className="truncate">{ag.name.split(' ')[0]}</span>
                                {isChecked && (
                                  <span className="text-[9px] bg-amber-600 text-white font-mono rounded-full w-4 h-4 flex items-center justify-center">
                                    {orderIndex + 1}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {editingWorkflow.agentIds.length > 0 && (
                          <p className="text-[9px] text-amber-700 font-mono mt-1">
                            路线: {editingWorkflow.agentIds.map(id => agents.find(a => a.id === id)?.name.split(' ')[0]).join(' ➡️ ')}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateWorkflow}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 rounded-md text-xs cursor-pointer shadow-sm transition"
                        >
                          确认修改
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(editingWorkflow.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-1.5 px-3 rounded-md text-xs cursor-pointer transition flex items-center gap-1"
                          title="注销本路由流"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>注销</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Workflow select list */}
                <div className="space-y-1.5 max-h-[310px] overflow-y-auto scrollbar-thin pr-0.5">
                  {workflows.map(flow => {
                    const isActive = workflowMode === flow.id;
                    return (
                      <div
                        key={flow.id}
                        className={`w-full p-2.5 rounded-xl border transition-all flex items-start justify-between gap-3 relative group ${
                          isActive
                            ? 'bg-indigo-50/100 border-indigo-500 text-indigo-950 shadow-2xs'
                            : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/80 text-slate-700'
                        }`}
                      >
                        <button
                          onClick={() => setWorkflowMode(flow.id)}
                          className="flex items-start gap-2.5 flex-1 text-left cursor-pointer min-w-0"
                        >
                          <input 
                            type="radio" 
                            checked={isActive} 
                            onChange={() => {}}
                            className="mt-1 text-indigo-600 focus:ring-0 cursor-pointer pointer-events-none" 
                          />
                          <div className="min-w-0 flex-1">
                            <strong className="text-[11px] block text-slate-900 font-bold leading-extra-tight">{flow.title}</strong>
                            <p className="text-[9px] text-slate-400 mt-1 leading-normal line-clamp-2">{flow.desc}</p>
                            
                            {/* Display Executing Agent List sequence beautifully */}
                            <div className="flex flex-wrap items-center mt-2 gap-1 text-[8px] font-mono text-slate-500 mr-12 bg-white/50 p-1 rounded-md border border-slate-200/40 w-fit">
                              <span className="text-slate-400">流水线:</span>
                              {flow.agentIds.map((agId, i) => {
                                const ag = agents.find(a => a.id === agId);
                                const name = ag ? ag.name.split(' ')[0] : '已删智能体';
                                return (
                                  <React.Fragment key={agId}>
                                    <span className={`px-1 rounded-sm ${isActive ? 'bg-indigo-100/80 text-indigo-800 font-bold' : 'bg-slate-200/50 text-slate-650'}`}>
                                      {name}
                                    </span>
                                    {i < flow.agentIds.length - 1 && <span className="opacity-40 font-bold">➔</span>}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setEditingWorkflow(flow);
                            setIsAddingWorkflow(false);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 absolute right-2.5 top-2.5 px-1 py-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
                          title="配置工作流流程"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-2 flex justify-between items-center bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
              <div className="text-[10px] text-indigo-950/70 space-y-0.5">
                <p>⚡ 运行智能体预计耗时：约 3~5 秒</p>
                <p>🎯 打通生产：该操作将连带写入 ERP 配方锁、法律法核准白名单、自媒体发布 SDK</p>
              </div>

              <button
                onClick={runCollaboration}
                disabled={isRunning}
                className={`px-5 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition shadow-md ${
                  isRunning 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-slate-900'
                }`}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>协作研判中...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>启动智能体多端协同</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Agent Process Swarm Flow Visualization */}
          {(isRunning || logs.length > 0) && (
            <div className="bg-slate-950 text-slate-200 rounded-3xl p-5 shadow-2xl relative overflow-hidden font-mono border border-slate-900 space-y-6">
              
              {/* Floating tech ambient bars */}
              <div className="absolute top-0 right-0 p-4 text-[9px] text-slate-600 select-none">
                SWARM CONSOLE V2.8
              </div>

              {/* Node graph flow map */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">▲ 智能体实时状态拓扑 (Live Swarm Topology)</span>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 relative">
                  
                  {/* Step 1 node */}
                  <div className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all w-28 border ${
                    activeStep === 1 
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse' 
                      : activeStep > 1 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                        : 'bg-slate-950/40 text-slate-500 border-slate-800'
                  }`}>
                    <Globe className="w-5 h-5" />
                    <span className="text-[10px] font-bold">舆情捕手</span>
                    <span className="text-[8px] opacity-75">{activeStep === 1 ? '🔍 提取热词' : activeStep > 1 ? '已合并' : '空闲'}</span>
                  </div>

                  <ArrowRight className={`hidden sm:block w-4 h-4 ${activeStep >= 1 ? 'text-indigo-400 animate-pulse' : 'text-slate-700'}`} />

                  {/* Step 2 node */}
                  <div className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all w-28 border ${
                    activeStep === 2 
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse' 
                      : activeStep > 2 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                        : 'bg-slate-950/40 text-slate-500 border-slate-800'
                  }`}>
                    <Database className="w-5 h-5" />
                    <span className="text-[10px] font-bold">配方研发</span>
                    <span className="text-[8px] opacity-75">{activeStep === 2 ? '🧪 配料GB2760' : activeStep > 2 ? '配方锁死' : '等待中'}</span>
                  </div>

                  <ArrowRight className={`hidden sm:block w-4 h-4 ${activeStep >= 2 ? 'text-indigo-400 animate-pulse' : 'text-slate-700'}`} />

                  {/* Step 3 node */}
                  <div className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all w-28 border ${
                    activeStep === 3 
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse' 
                      : activeStep > 3 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                        : 'bg-slate-950/40 text-slate-500 border-slate-800'
                  }`}>
                    <Cpu className="w-5 h-5" />
                    <span className="text-[10px] font-bold">运营企划</span>
                    <span className="text-[8px] opacity-75">{activeStep === 3 ? '📊 毛利率测算' : activeStep > 3 ? '已出方案' : '等待中'}</span>
                  </div>

                  <ArrowRight className={`hidden sm:block w-4 h-4 ${activeStep >= 3 ? 'text-indigo-400 animate-pulse' : 'text-slate-700'}`} />

                  {/* Step 4 node */}
                  <div className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all w-28 border ${
                    activeStep === 4 
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse' 
                      : activeStep > 4 || (!isRunning && logs.length > 0)
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                        : 'bg-slate-950/40 text-slate-500 border-slate-800'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                    <span className="text-[10px] font-bold">自媒体宣发</span>
                    <span className="text-[8px] opacity-75">{activeStep === 4 ? '📝 种草生成推送' : (!isRunning && logs.length > 0) ? '宣发SDK入库' : '等待中'}</span>
                  </div>
                </div>
              </div>

              {/* Streaming Logs Terminal window */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <span>实时联机协作日志 (Streaming Swarm Console Outputs)</span>
                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                    <span>ONLINE STREAMING</span>
                  </div>
                </div>

                <div className="h-64 overflow-y-auto bg-slate-900 rounded-2xl border border-slate-800 p-4 text-[11px] font-mono leading-relaxed space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                  {logs.map((log, idx) => {
                    const isSystem = log.includes('[网关自检]') || log.includes('📡');
                    const isWarning = log.includes('[警告]') || log.includes('⚠️');
                    const isSuccess = log.includes('✅') || log.includes('🎨') || log.includes('🛡️') || log.includes('🛒') || log.includes('🎊') || log.includes('SUCCESS');
                    
                    let textColor = 'text-slate-300';
                    if (isSystem) textColor = 'text-sky-400 font-bold';
                    else if (isWarning) textColor = 'text-amber-400';
                    else if (isSuccess) textColor = 'text-emerald-400 font-semibold';
                    else if (log.includes('🧑‍💻')) textColor = 'text-indigo-300 font-bold border-b border-indigo-950 pb-1 mt-2 block';

                    return (
                      <div key={idx} className={`${textColor} animate-fade-in`}>
                        {log}
                      </div>
                    );
                  })}
                  {isRunning && (
                    <div className="flex items-center gap-2 text-indigo-400 text-[11px] font-bold animate-pulse mt-2">
                      <Terminal className="w-3.5 h-3.5 animate-spin" />
                      <span>正在调用智能体专家组件思考中...</span>
                    </div>
                  )}
                  <div ref={terminalEndRef}></div>
                </div>
              </div>
            </div>
          )}

          {/* Outputs Panel once available */}
          {!isRunning && logs.length > 0 && (generatedRecipe || generatedStrategy || generatedCampaign) && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-6 animate-fade-in" id="swarm_output_view">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600" />
                    <span>智能体协同联合产出物 (Merged Deliverables)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    系统根据选题「{customKeyword}」已成功输出工艺、定价与营销全链路产品档案。
                  </p>
                </div>
                
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-full border border-emerald-100 uppercase self-start">
                  All Checked & Dispatched
                </span>
              </div>

              {/* Grid of Deliverables */}
              <div className="space-y-6">
                
                {/* 1. Recipe Card */}
                {generatedRecipe && (
                  <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 border-b border-slate-150 px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-600" />
                      <strong className="text-xs text-slate-900 font-bold">配方研制工艺卡 (R&D Recipe Specification)</strong>
                    </div>
                    <button
                      onClick={() => handleCopyText(JSON.stringify(generatedRecipe, null, 2), 'recipe')}
                      className="text-xs text-indigo-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedIndex === 'recipe' ? '已复制' : '复制工艺卡'}</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-4 text-xs text-slate-700 bg-white leading-normal">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] block">建议品名</span>
                        <strong className="text-slate-800 text-xs font-bold block mt-0.5">{generatedRecipe.productName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">设计基准</span>
                        <strong className="text-slate-800 text-xs font-bold block mt-0.5">{generatedRecipe.servingSize}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">预估原料成本 (单杯)</span>
                        <strong className="text-slate-800 text-xs font-bold block mt-0.5">{generatedRecipe.rawCost}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">工艺操作难度</span>
                        <strong className="text-slate-800 text-xs font-bold block mt-0.5 text-amber-600">{generatedRecipe.difficulty}</strong>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <strong className="text-xs text-slate-800 font-bold block">1. 黄金配料清单 (GB2760 添加剂审查白名单)：</strong>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-150">
                              <th className="p-1 px-3">原材料名称</th>
                              <th className="p-1 px-3">参考配比量</th>
                              <th className="p-1 px-3">主要研制风味效用</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedRecipe.ingredients.map((ing: any, i: number) => (
                              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/40">
                                <td className="p-2 px-3 font-semibold text-slate-800">{ing.name}</td>
                                <td className="p-2 px-3 font-mono font-bold text-indigo-600">{ing.amount}</td>
                                <td className="p-2 px-3 text-slate-400 text-[11px]">{ing.function}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <strong className="text-xs text-slate-800 font-bold block">2. 实验室均质投料核心工艺：</strong>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px] leading-relaxed">
                        {generatedRecipe.steps.map((st: string, idx: number) => (
                          <li key={idx} className="marker:text-slate-400">{st}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
                )}

                {/* 2. Commercial Pricing Strategy Card */}
                {generatedStrategy && (
                  <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 border-b border-slate-150 px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <strong className="text-xs text-slate-900 font-bold">新品定位策划与运营毛利率方案 (Commercial Proposal)</strong>
                    </div>
                    <button
                      onClick={() => handleCopyText(JSON.stringify(generatedStrategy, null, 2), 'strategy')}
                      className="text-xs text-indigo-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedIndex === 'strategy' ? '已复制' : '复制定位企划'}</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-4 text-xs text-slate-700 bg-white leading-normal">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p><span className="text-slate-400">建议新品定位：</span> <strong className="text-slate-800 font-bold">{generatedStrategy.positioning}</strong></p>
                        <p><span className="text-slate-400">核心目标人群：</span> <strong className="text-slate-800 font-bold">{generatedStrategy.targetAudience}</strong></p>
                        <p className="text-slate-500 leading-relaxed text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <strong>竞品防御御敌策：</strong> {generatedStrategy.competitorCounter}
                        </p>
                      </div>

                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-1.5">
                        <strong className="text-xs text-indigo-950 font-bold block border-b border-indigo-100 pb-1">经营毛利测算试算表：</strong>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-indigo-900">
                          <div>原料物料成本: <strong className="font-mono text-xs">{generatedStrategy.pricePlan.rawCost}</strong></div>
                          <div>包材及物流: <strong className="font-mono text-xs">{parseFloat(generatedStrategy.pricePlan.packaging.replace('¥','')) + parseFloat(generatedStrategy.pricePlan.logistics.replace('¥',''))} ¥</strong></div>
                          <div>建议单杯零售: <strong className="font-mono text-xs">{generatedStrategy.pricePlan.retailPrice}</strong></div>
                          <div>预测毛利率: <strong className="font-mono text-xs text-emerald-600 font-bold">{generatedStrategy.pricePlan.grossMargin}</strong></div>
                        </div>
                        <p className="text-[10px] text-indigo-600 border-t border-indigo-100 pt-1 mt-1 leading-normal">
                          <strong>社群裂变运营价：</strong> {generatedStrategy.pricePlan.suggestedDiscount}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-xs text-slate-800 font-bold block">🔥 核心爆款三大购买心智锚点：</strong>
                      <div className="space-y-1 pl-1">
                        {generatedStrategy.keySellingPoints.map((pt: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px]">
                            <span className="text-indigo-600 font-mono mt-0.5">0{idx+1}.</span>
                            <span className="text-slate-600">{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* 3. Campaign Copywriting Card */}
                {generatedCampaign && (
                  <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 border-b border-slate-150 px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      <strong className="text-xs text-slate-900 font-bold">小红书极速爆款图文草案 (RED Social Campaign Draft)</strong>
                    </div>
                    <button
                      onClick={() => handleCopyText(`${generatedCampaign.title}\n\n${generatedCampaign.body}`, 'campaign')}
                      className="text-xs text-indigo-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedIndex === 'campaign' ? '已复制' : '复制推文文案'}</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-3 text-xs text-slate-700 bg-white leading-normal">
                    <div className="border-l-3 border-rose-500 pl-3 py-1 space-y-1">
                      <span className="text-rose-600 text-[10px] font-bold uppercase tracking-wider block">✍️ 种草爆款主标题（高Engagement率）：</span>
                      <strong className="text-slate-800 text-xs font-bold block">{generatedCampaign.title}</strong>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150 font-mono whitespace-pre-wrap text-[11px] text-slate-600 leading-relaxed max-h-64 overflow-y-auto">
                      {generatedCampaign.body}
                    </div>

                    <div className="pt-2 text-[11px] flex justify-between items-center bg-rose-50/40 p-2.5 rounded-lg border border-rose-100">
                      <span className="text-slate-500 font-mono text-[10px]">{generatedCampaign.tags}</span>
                      <span className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-100">
                        屏蔽极端词合规 OK
                      </span>
                    </div>
                  </div>
                </div>
                )}

                {/* 4. Real-time API Docking Status Card */}
                {apiReceipt && (
                  <div className="bg-indigo-50/30 border border-indigo-150 rounded-2xl p-4.5 space-y-3.5" id="api_docking_receipt">
                    <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-4.5 h-4.5 text-indigo-600" />
                        <strong className="text-xs text-slate-900 font-bold">API 自动化对接出库回执清单 (Enterprise API Receipts)</strong>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-600 bg-white border border-indigo-150 px-2 py-0.5 rounded font-bold">
                        {apiReceipt.transactionId}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-normal">
                      除本地生成界面文本外，智能体舰队已按照各网关协议，将本次协作生产的内容安全外发外发至后台业务：
                    </p>

                    <div className="space-y-2">
                      {apiReceipt.actionsPerformed.map((act: any, i: number) => (
                        <div key={i} className="bg-white p-2.5 rounded-xl border border-indigo-100/60 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[11px] font-bold text-slate-800">{act.system}</span>
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 py-0.2 rounded font-mono font-bold">AUTOMATED SYNCED</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">{act.outcome}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1.5 flex justify-end gap-2 text-xs">
                      <button 
                        onClick={() => alert(`🎉 已触发第二次API全网核对！本次协作结果已成功锁定在企业ERP和内容矩阵发布流。`)}
                        className="bg-indigo-600 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg transition-all cursor-pointer shadow-2xs text-[11px]"
                      >
                        再次确认分发
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
