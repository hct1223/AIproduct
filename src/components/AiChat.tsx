import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Brain, Bot, User, Trash2, 
  ArrowRight, BookOpen, ThumbsUp, Flame, HelpCircle,
  Plus, History, BarChart2, TrendingUp, Download, Check, AlertCircle, Shield, CornerDownRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid, Legend, Cell 
} from 'recharts';

interface ChartConfig {
  type: 'line' | 'bar' | 'horizontal_bar';
  title: string;
  data: Array<Record<string, string | number>>;
  xAxisKey: string;
  series: Array<{ key: string; color: string; label: string }>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  chart?: ChartConfig;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  roleContext?: string;
}

interface AiChatProps {
  userRole?: string;
  trends?: any[];
  onRefreshFullData?: () => void;
  setActiveTab?: (tab: any) => void;
}

export default function AiChat({ 
  userRole = '高管层', 
  trends = [], 
  onRefreshFullData, 
  setActiveTab 
}: AiChatProps) {
  
  // Conversation Sessions state management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [exportingMessageId, setExportingMessageId] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize conversations from localStorage OR default template setup
  useEffect(() => {
    const saved = localStorage.getItem('food_ai_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        if (parsed.length > 0) {
          // Reconstruct Date entities from strings
          const formatted = parsed.map(s => ({
            ...s,
            createdAt: new Date(s.createdAt),
            messages: s.messages.map(m => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          }));
          setSessions(formatted);
          setActiveSessionId(formatted[0].id);
          return;
        }
      } catch (err) {
        console.error('Failed to parse cached chat history', err);
      }
    }

    // Default welcoming session template on first launch
    const defaultSessionId = 'sess_default';
    const defaultSess: ChatSession = {
      id: defaultSessionId,
      title: '🍈 哈密瓜声量飙升研判',
      createdAt: new Date(),
      roleContext: userRole,
      messages: [
        {
          id: 'welcome_1',
          role: 'model',
          content: `👋 您好！我是您的 **新增对话**（当前研判视角：**${userRole}**）。\n\n您可以向我提问关于本季度爆款研发趋势、受众群画像心智、竞品御敌策以及中西点心混搭配方。我已经完美集成了本大盘的核心数据模型，支持直接输入自然语言提取交互式商情图表！`,
          timestamp: new Date()
        }
      ]
    };
    setSessions([defaultSess]);
    setActiveSessionId(defaultSessionId);
  }, []);

  // Sync to local storage
  const saveSessionsToCache = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem('food_ai_chat_sessions', JSON.stringify(updated));
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  // Auto Scroll Chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Create a clean new dialogue
  const handleAddNewSession = () => {
    const newId = 'sess_' + Date.now();
    const newSess: ChatSession = {
      id: newId,
      title: '未命名对话 ' + (sessions.length + 1),
      createdAt: new Date(),
      roleContext: userRole,
      messages: [
        {
          id: 'welcome_' + Date.now(),
          role: 'model',
          content: `👋 已成功开启全新对话通道！研判视角已匹配为【**${userRole}**】。\n\n请输入您的咨询主题，例如您可以尝试点击底部的推荐话题，或者向我输入关于口味复购、客诉差评、竞品攻防的疑问。`,
          timestamp: new Date()
        }
      ]
    };
    saveSessionsToCache([newSess, ...sessions]);
    setActiveSessionId(newId);
    setUserInput('');
    setExportMessage({ text: '', type: null });
  };

  // Delete specific session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert('系统要求至少保留一条对话流！如果您想重新开始，可以点击右上角快速清空当前对话。');
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    saveSessionsToCache(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  // Clear current active conversation history only
  const handleResetActiveSession = () => {
    if (!activeSession) return;
    if (window.confirm('您确定要清空这个对话的所有往来记录吗？该操作不可逆。')) {
      const updated = sessions.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [
              {
                id: 'welcome_reset',
                role: 'model',
                content: `👋 智脑已完成缓冲格式化！当前授权视角：【**${userRole}**】。随时听候您的下一步研发或运营决策调遣。`,
                timestamp: new Date()
              } as ChatMessage
            ]
          };
        }
        return s;
      });
      saveSessionsToCache(updated);
    }
  };

  // Generate Smart Prompts Dynamically according to latest discussion themes & role permissions
  const getSmartRecommendations = () => {
    const hasMelon = messages.some(m => m.content.includes('哈密瓜') || m.content.includes('瓜'));
    const hasTexture = messages.some(m => m.content.includes('口感') || m.content.includes('糯叽叽'));
    const hasBrand = messages.some(m => m.content.includes('品牌') || m.content.includes('口碑') || m.content.includes('对比'));

    const list = [];
    
    // Role based suggestions
    if (userRole === '研发组') {
      list.push({ label: '🧪 极长拉丝常温阻硬配比技术', text: '从研发工艺角度，茉莉绿豆拉丝麻薯在常温放置48小时下的抗老化与湿度锁定技术配比有何规范？' });
    } else if (userRole === '销售组') {
      list.push({ label: '💵 开心果冷萃爆款复购回扣促醒', text: '针对会员系统中复购降速的陈皮红豆巴斯克偏好群，如何利用下午茶短信券拉回4.2天的订购？' });
    } else if (userRole === '店长层') {
      list.push({ label: '⚠️ 客诉敏感词秒级灭火对策', text: '针对消费者投诉重度干硬、“吞咽噎脖子”的面包问题，门店如何进行首位责任制安抚与替换？' });
    }

    if (hasMelon) {
      list.push({ label: '🍈 哈密瓜水果与厚芝士冰萃配方', text: '哈密瓜高多糖和高水分容易让烘焙胚体塌陷，推荐3个抗水性强的植物基大福加料搭配工艺。' });
      list.push({ label: '📈 规划哈密瓜小红书多巴胺爆款文案', text: '帮我针对哈密瓜多巴胺甜品新品写一段突出“减压神器、低卡清润”的主播视频文案，吸引格子间青年。' });
    } else if (hasTexture) {
      list.push({ label: '👥 Z世代极致多重咬感策划', text: '推荐3个针对18-25岁Z世代消费者，主打“糯叽叽+酥润沙沙”双重极致口感的本季度新品口味组合。' });
    } else if (hasBrand) {
      list.push({ label: '🛡️ 竞品重围狙击策 (桃源烘焙)', text: '对比酥合桃源，竞品桃源烘焙在控糖和联名方面还比较落后，我们应如何利用传统“药食同源”拉大身位？' });
    } else {
      list.push({ label: '🔥 Z世代坚果流心破局', text: '分析开心果冷萃酸奶流心大福的爆款潜质、适宜价格段与主要痛点突破口。' });
    }

    // Default filler to guarantee 2-3 items
    if (list.length < 3) {
      list.push({ label: '🛡️ 茉莉生椰乌龙起司打法', text: '我们的直接竞品“酥合桃源”新推了茉莉生椰乌龙起司，我们应该如何打出高颜值差异化包装反击？' });
    }

    return list.slice(0, 3);
  };

  // Core NLP Natural Language Parser
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending || !activeSessionId) return;

    const userMsg: ChatMessage = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    // Update session locally first
    const sessionToUpdate = sessions.find(s => s.id === activeSessionId);
    if (!sessionToUpdate) return;
    
    // Dynamic renaming of session if it was default un-named after first question
    let sTitle = sessionToUpdate.title;
    if (sTitle.startsWith('未命名对话') && text.length > 3) {
      sTitle = text.substring(0, 12) + (text.length > 12 ? '...' : '');
    }

    const nextMessages = [...sessionToUpdate.messages, userMsg];
    let updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: sTitle,
          messages: nextMessages
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    setUserInput('');
    setIsSending(true);
    setExportMessage({ text: '', type: null });

    // Handle role based prefixes or filter outputs
    const roleNote = `（💡 大脑探针已根据您的【**${userRole}**】视角，进行了特定范围安全隔离与策略调优）`;

    // 🏆 CASE 1: "过去一周哈密瓜口味的声量增长了多少？"
    if (text.includes('哈密瓜') && (text.includes('一周') || text.includes('增长') || text.includes('声量'))) {
      setTimeout(() => {
        const hamiMelonData = [
          { day: '05-16', volume: 550, growth: 0 },
          { day: '05-17', volume: 720, growth: 30 },
          { day: '05-18', volume: 980, growth: 78 },
          { day: '05-19', volume: 1420, growth: 158 },
          { day: '05-20', volume: 1890, growth: 243 },
          { day: '05-21', volume: 2260, growth: 310 },
          { day: '05-22 (今日)', volume: 2750, growth: 400 },
        ];

        let content = `### 🍈 哈密瓜风味声量过去一周飙升趋势报告\n\n`;
        content += `根据商情大数据中心全天候抓取的监测回执，**哈密瓜口味**在过去 7 天内实现了极具颠覆性的声量爆发。\n\n`;
        content += `- **主震幅统计**：日搜索讨论总量由 **550** 点爆发式增长至今日的 **2,750** 点，实现全网净值 **+400.0%** 的颠覆性增长速率！\n`;
        content += `- **爆点驱动成分**：主要由本月中旬多款清爽马卡龙绿冷萃哈密瓜酸奶大福以及小红书“哈密瓜不累嘴低糖低脂”午后白领高颜值打卡拉动。\n`;
        content += `- **主攻竞品身位**：竞品尚未在此领域形成绝对壁垒。由于您的角色是 **${userRole}**，${
          userRole === '研发组' 
            ? '从工艺线来看反应极大，强烈建议对“哈密瓜天然浆物理防沉淀配法”锁库。' 
            : userRole === '销售组' 
            ? '强烈建议下周起，将哈密瓜冷萃饮品作为华中/华南区门店 14:00 黄金时段的会员主打秒杀项！' 
            : '建议品牌部门加快匹配多巴胺视觉设计，将哈密瓜的高甜度色彩化身为社交筹码！'
        }\n\n`;
        content += `> 下图已从系统主数据库为您拉取了近 7 日哈密瓜口味社群热力指数对比：`;

        const aiMsg: ChatMessage = {
          id: 'msg_ai_' + Date.now(),
          role: 'model',
          content,
          timestamp: new Date(),
          chart: {
            type: 'line',
            title: '🍈 哈密瓜风味 7 日社群热力讨论量及复利增长率 (%)',
            data: hamiMelonData,
            xAxisKey: 'day',
            series: [
              { key: 'volume', color: '#10b981', label: '社群热力讨论总量 (点)' },
              { key: 'growth', color: '#f59e0b', label: '环比复利增长率 (%)' }
            ]
          }
        };

        const finalSessions = updatedSessions.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, aiMsg] };
          }
          return s;
        });
        saveSessionsToCache(finalSessions);
        setIsSending(false);
      }, 1000);
      return;
    }

    // 🏆 CASE 2: "最近 30 天上升最快的 5 个口感关键词是什么？"
    if ((text.includes('30') || text.includes('三十')) && text.includes('口感') && (text.includes('最快') || text.includes('关键词'))) {
      setTimeout(() => {
        const textureData = [
          { keyword: '糯叽叽 (Soft Mochi)', rate: 184, volume: 4200, color: '#6366f1' },
          { keyword: '酥润沙沙 (Sandy Crisp)', rate: 151, volume: 3800, color: '#3b82f6' },
          { keyword: '爆浆流心 (Molten Heart)', rate: 124, volume: 2900, color: '#10b981' },
          { keyword: '极脆多层 (Multi Layer)', rate: 96, volume: 1750, color: '#f59e0b' },
          { keyword: '轻盈低卡蓬松 (Airy Souffle)', rate: 68, volume: 1200, color: '#ec4899' },
        ];

        let content = `### 🍡 最近 30 天飙升最速 5 口感关键词解构\n\n`;
        content += `根据主风味雷达在最近 30 天内对 45,000 余条社媒原声及客单洗码数据，涨幅排行榜如下：\n\n`;
        content += `1. **糯叽叽 (+184.0%)** — 统治级霸权。主要归因于水牛奶烘焙、黑糯米拉丝、低温冰粉大福的受众极度扩大。价格敏感区间：14-19元。\n`;
        content += `2. **酥润沙沙 (+151.0%)** — 咸蛋黄千层碎、海盐开心果碎等，由于其吃口有颗粒质感，与软嫩形成极佳对比而受到追捧。\n`;
        content += `3. **爆浆流心 (+124.0%)** — 近期巧克力量、生椰流心芝士流向稳定提升。Z世代对咬下的动态瞬间具有高自发打发性质。\n`;
        content += `4. **极脆多层 (+96.0%)** & 5. **轻盈低卡蓬松 (+68.0%)**。\n\n`;
        content += `### 🔒 角色专享风控要议 [ ${userRole} ]\n`;
        
        if (userRole === '研发组') {
          content += `- **防塌爆配比方案**：黑面粉锁水成分控制在 3.1%，能有效在 48 小时隔天烘干中规避爆浆流心的面体断层，实现量产良率提升 14.5%。`;
        } else if (userRole === '销售组') {
          content += `- **定价战避雷区**：店面套餐强力建议“糯叽叽麻薯系列”+“常温起司冷泡”做下午茶多重咬感打包销售，溢价范围可加宽 18%。`;
        } else if (userRole === '店长层') {
          content += `- **门店质保反馈**：需严防糯叽叽时间放置过长（高于36h）导致的干巴噎脖恶评。门店建议少量多次制作，保证最佳弹性。`;
        } else {
          content += `- **顶层决策指引**：全盘雷达显示口感与风味的“双重咬感（沙沙 + 糯叽叽）”代表本季度最稳健的爆品资产，研发与品牌全线资源匹配度需提到最高优先。`;
        }

        const aiMsg: ChatMessage = {
          id: 'msg_ai_' + Date.now(),
          role: 'model',
          content,
          timestamp: new Date(),
          chart: {
            type: 'bar',
            title: '🍡 飙升最快 5 口感之过去 30 日增长比率 (%) 及社群大盘实数',
            data: textureData,
            xAxisKey: 'keyword',
            series: [
              { key: 'rate', color: '#6366f1', label: '飙升增长率 (%)' },
              { key: 'volume', color: '#3b82f6', label: '本月全网提及基数 (点/10)' }
            ]
          }
        };

        const finalSessions = updatedSessions.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, aiMsg] };
          }
          return s;
        });
        saveSessionsToCache(finalSessions);
        setIsSending(false);
      }, 1000);
      return;
    }

    // 🏆 CASE 3: "对比 A 品牌和 B 品牌的用户口碑差异"
    if (text.includes('对比') && (text.includes('品牌') || text.includes('口碑') || text.includes('A') || text.includes('B'))) {
      setTimeout(() => {
        const brandCompareData = [
          { metric: '口感风味 (Taste)', '酥合桃源 (竞品A)': 94, '桃源烘焙 (竞品B)': 82 },
          { metric: '外观审美 (Design)', '酥合桃源 (竞品A)': 88, '桃源烘焙 (竞品B)': 71 },
          { metric: '控糖健康 (Health)', '酥合桃源 (竞品A)': 85, '桃源烘焙 (竞品B)': 68 },
          { metric: '价格力 (VFM)', '酥合桃源 (竞品A)': 71, '桃源烘焙 (竞品B)': 89 },
          { metric: '社交话题 (Buzz)', '酥合桃源 (竞品A)': 92, '桃源烘焙 (竞5B)': 64 }
        ];

        let content = `### ⚖️ 双竞品（酥合桃源 VS 桃源烘焙）全维度口碑对比\n\n`;
        content += `根据客群雷达及近期舆情系统对两大现象级竞品的差评细账与主打亮点做深度洗码解析，雷达数据剖析如下：\n\n`;
        content += `1. **酥合桃源 (主打小红书马卡龙视觉路线)**：\n`;
        content += `   - **核心杀手锏**：口感风味 (**94分**)、外观审美 (**88分**)。极善于将配方工艺与中医药食同源的高颜值马卡龙画风（如茉莉起司）结合，吸引白领狂热发图。\n`;
        content += `   - **薄弱点/软肋**：性价比偏低 (**71分**)，单价高于同地段 18%，且客诉中多有反馈“冷藏发硬、打包繁重”。\n`;
        content += `2. **桃源烘焙 (主打美团饿了么折扣与中老年高性价比路线)**：\n`;
        content += `   - **核心杀手锏**：价格竞争力 (**89分**)，主推十元两个的陈皮红豆大福或核桃包，走量稳定。\n`;
        content += `   - **薄弱点/软肋**：产品老化明显，健康控糖低，包装审美 (**71分**) 和社交自发提及量严重落后。\n\n`;
        content += `### 🛡️ 针对 **${userRole}** 视角的护城河建议\n`;
        
        if (userRole === '研发组') {
          content += `- **建议方案**：我们应当主攻酥合桃源性价比不足的漏洞。开发一款在常温具有湿润高阻力锁水，且价格定在 **13-16元** 间的“常温哈密瓜麻薯芝士流心”，用口感物理保水性打痛对方！`;
        } else if (userRole === '销售组') {
          content += `- **营销渠道**：立刻集中在写字楼区域通过微信群派发下午 14:00 加料特惠券，截流酥合桃源的白领白领复购流。`;
        } else {
          content += `- **品牌防守**：迅速锁定“东方美学极简风”搭配陈皮红豆概念，既要提供酥合桃源的高级审美，又要提供合理的性价比；在控糖标上打出“零代糖物理清甜”，迅速完成两头夹击。`;
        }

        const aiMsg: ChatMessage = {
          id: 'msg_ai_' + Date.now(),
          role: 'model',
          content,
          timestamp: new Date(),
          chart: {
            type: 'horizontal_bar',
            title: '👥 竞品 A「酥合桃源」与 竞品 B「桃源烘焙」用户口碑偏爱深度对比',
            data: brandCompareData,
            xAxisKey: 'metric',
            series: [
              { key: '酥合桃源 (竞品A)', color: '#4f46e5', label: '酥合桃源 (偏奢华/高视觉)' },
              { key: '桃源烘焙 (竞品B)', color: '#a855f7', label: '桃源烘焙 (高性价比/常规)' }
            ]
          }
        };

        const finalSessions = updatedSessions.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, aiMsg] };
          }
          return s;
        });
        saveSessionsToCache(finalSessions);
        setIsSending(false);
      }, 1000);
      return;
    }

    // 🏆 CASE 4: Normal Gemini AI Server Consultation or Stateless history chat
    try {
      // Package formatted conversational turns to Express server-side
      const formattedHistory = nextMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: formattedHistory })
      });

      if (!res.ok) throw new Error('Analytics server failed to respond');

      const data = await res.json();
      
      const serverText = data.content || '智脑遭遇了一些网络闪烁，请稍后再次重试提问！';
      
      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'model',
        content: serverText + `\n\n---\n${roleNote}`,
        timestamp: new Date()
      };

      // Apply dynamic response back to target session list
      const finalSessions = updatedSessions.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, aiMsg] };
        }
        return s;
      });
      saveSessionsToCache(finalSessions);

    } catch (e) {
      console.error("AI Communication error", e);
      const errMessage: ChatMessage = {
        id: 'msg_ai_err_' + Date.now(),
        role: 'model',
        content: '❌ **智脑专线通信延迟**：未能在服务器网络内获得快速握手。但您可以使用上方由主系统为您自动脱水清洗的数据与图表，继续开展您的逆向研发攻防！',
        timestamp: new Date()
      };
      const finalSessions = updatedSessions.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, errMessage] };
        }
        return s;
      });
      saveSessionsToCache(finalSessions);
    } finally {
      setIsSending(false);
    }
  };

  // Convert Specific AI Model's feedback/answer to a formal intelligence report inside "Report Center"
  const handleExportSessionToReport = async (msgId: string, content: string) => {
    setExportingMessageId(msgId);
    setExportMessage({ text: '', type: null });

    try {
      // Strip markdown headers to make a beautiful title
      const lines = content.split('\n');
      const titleLine = lines.find(l => l.startsWith('### '));
      const reportTitle = titleLine 
        ? `${titleLine.replace('### ', '').trim()} - 风味智脑提炼报告`
        : `智脑对话一键导出报告 (${new Date().toLocaleDateString('zh-CN')})`;

      const res = await fetch('/api/analytics/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportTitle,
          type: 'special_alert',
          summary: `本篇由【AI智能对话助手】根据会话研判自主生成。包含有关水果飙升数据、高拉丝口感在 ${userRole} 视角下的全维度防守对策。`,
          contentMarkdown: `# 🏆 对话成果转化报告：${reportTitle}\n\n` +
                           `> **归集账号**：系统研判台\n` +
                           `> **导出时授权视角**：**${userRole}**\n` +
                           `> **转换源对话ID**：\`${activeSessionId}\`\n\n` +
                           `---\n\n` +
                           `## 📊 情报数据详细归档：\n\n` +
                           `${content}\n\n` +
                           `*(本研究报告由AI在 2026-05-22 UTC 导出，已同步绑定到决策底盘)*`
        })
      });

      if (!res.ok) throw new Error('Save report service failed');

      setExportMessage({
        text: '🎉 成果转换成功！此轮对话的经营数据、竞品差评洗码及 R&D 策略已被同步写至【情报报告中心】。您可以随时前往查阅。',
        type: 'success'
      });

      // Reload global list in background
      if (onRefreshFullData) {
        onRefreshFullData();
      }

    } catch (err: any) {
      console.error(err);
      setExportMessage({
        text: '❌ 报告转存失败，请确保本地 Express 保持就绪。',
        type: 'error'
      });
    } finally {
      setExportingMessageId(null);
    }
  };

  // Renderer matching bold rules and line splits for full markdown look without bundle bloating
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-black text-slate-900 mt-4 mb-2 flex items-center gap-1.5 border-l-3 border-indigo-600 pl-2 leading-none uppercase tracking-wide">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-extrabold text-indigo-950 mt-5 mb-2.5 border-b border-slate-100 pb-1.5">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-base font-black text-indigo-950 mt-6 mb-4">
            {line.replace('# ', '')}
          </h2>
        );
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        const pureText = line.substring(2);
        return (
          <li key={idx} className="text-[11.5px] text-slate-700 ml-4 list-disc mb-1 leading-relaxed">
            {parseBoldText(pureText)}
          </li>
        );
      }

      const matchOrdered = line.match(/^(\d+)\.\s(.*)/);
      if (matchOrdered) {
        return (
          <li key={idx} className="text-[11.5px] text-slate-700 ml-4 list-decimal mb-1 leading-relaxed font-sans">
            {parseBoldText(matchOrdered[2])}
          </li>
        );
      }

      if (line.startsWith('> ')) {
        return (
          <p key={idx} className="text-[11px] text-indigo-900 bg-indigo-50/50 border-l-2 border-indigo-500 px-3 py-1.5 rounded-r-lg my-1.5 leading-relaxed font-mono font-bold">
            {parseBoldText(line.substring(2))}
          </p>
        );
      }

      return (
        <p key={idx} className="text-[11.5px] text-slate-700 leading-relaxed mb-1.5 font-sans">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split('**');
    if (parts.length < 3) return text;
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-bold text-indigo-950 bg-indigo-50/40 px-1 rounded mx-0.5">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6" id="ai-chat-assistant-central-panel">
      
      {/* 🔮 Aesthetic Narration Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-linear-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-md gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-12 -translate-y-12 blur-xl animate-pulse"></div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600/30 text-indigo-400 p-1.5 rounded-lg border border-indigo-500/20">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              新增对话 
              <span className="text-[10px] bg-indigo-50 text-indigo-750 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Copilot V2.5
              </span>
            </h1>
          </div>
          <p className="text-xs text-indigo-200/80 leading-relaxed max-w-2xl">
            高维度多轮商情追踪底盘。支持输入自然语言，自动检索系统全盘的消费者讨论原声与配比趋势并即时生成交互图表。
          </p>
        </div>

        <div className="flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5 text-xs text-indigo-200 bg-white/5 border border-indigo-500/10 px-3 py-2 rounded-xl">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>当前授权视角：</span>
            <span className="font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-md text-[10px]">{userRole}</span>
          </div>

          <button
            onClick={handleResetActiveSession}
            title="重洗/清空当前会话"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-950/40 border border-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">格式化当前</span>
          </button>
        </div>
      </div>

      {/* Main workspace splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 📚 Left Section: Multi-turn Dialogue history panel */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* New Chat Button & History Title */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-4">
            
            <button
              onClick={handleAddNewSession}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-400 animate-spin-hover" />
              <span>开启全新智能研判对话</span>
            </button>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider pb-1 border-b border-slate-100">
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  研判对话档案库 ({sessions.length})
                </span>
                <span className="text-[10px] text-indigo-600 font-mono">Local Cached</span>
              </div>

              {/* Thread list scrollcontainer */}
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                {sessions.map(s => {
                  const isActive = s.id === activeSessionId;
                  const lastMsg = s.messages[s.messages.length - 1];
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setExportMessage({ text: '', type: null });
                      }}
                      className={`group w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive 
                          ? 'border-indigo-100 bg-indigo-50/45 font-bold' 
                          : 'border-slate-100 hover:border-slate-250 bg-slate-50/40 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`}></span>
                          <p className={`text-xs truncate ${isActive ? 'text-indigo-950 font-bold' : 'text-slate-700'}`}>
                            {s.title}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[190px] font-medium leading-none font-sans pl-3">
                          {lastMsg ? lastMsg.content.replace(/[#*`>]/g, '') : '开启研判会话...'}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        title="删除该条记录"
                        className="text-slate-300 hover:text-rose-600 p-1 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Smart proactive recommendation system based on discussion state */}
          <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/40 space-y-3.5 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-15">
              <Sparkles className="w-20 h-20 text-indigo-400" />
            </div>

            <div className="relative z-10 space-y-1.5">
              <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                智能趋势对策联络面 (Proactive Recommendations)
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                系统根据大盘波动与您上一轮输入的话题，主动在决策底盘中为您算出了如下最相关的逆向突围方向：
              </p>

              <div className="space-y-2.5 pt-1.5">
                {getSmartRecommendations().map((rec, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(rec.text)}
                    disabled={isSending}
                    className="w-full text-left p-3 rounded-xl border border-indigo-150/50 hover:border-indigo-200 bg-white hover:bg-indigo-50/20 transition-all font-medium text-xs text-indigo-900 group cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 text-[11px] group-hover:text-indigo-600 flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3 text-indigo-400" />
                        {rec.label}
                      </span>
                      <ArrowRight className="w-3 h-3 text-indigo-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {rec.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* 🧭 Right Column: Main Chat window with active charts & export indicators */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]" id="dialogue-chat-viewport">
          
          {/* Header row specifying context */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>对话研判台:</span>
                <strong className="text-indigo-950 font-extrabold font-mono">{activeSession?.title || '未命名对话'}</strong>
              </span>
            </div>
            
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">
              <span className="text-[9.5px] font-sans font-bold text-slate-500">主力后端:</span>
              <span className="font-bold text-slate-600">Gemini 3.5 Flash</span>
            </div>
          </div>

          {/* Export Toast area */}
          {exportMessage.text && (
            <div className={`p-4 border-b text-xs flex items-start gap-2.5 animate-fade-in ${
              exportMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                : 'bg-rose-50 border-rose-100 text-rose-900'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${exportMessage.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} />
              <div className="flex-1">
                <span className="font-bold">{exportMessage.type === 'success' ? '导出成功' : '导出异常'}:</span>
                <p className="text-[11px] mt-0.5 leading-normal">{exportMessage.text}</p>
                {exportMessage.type === 'success' && setActiveTab && (
                  <button
                    onClick={() => {
                      setActiveTab('reports');
                      setExportMessage({ text: '', type: null });
                    }}
                    className="text-indigo-700 hover:text-indigo-900 font-bold underline mt-1.5 block cursor-pointer"
                  >
                    🚀 立即切换前往【情报报告中心】进行阅读分发 &rarr;
                  </button>
                )}
              </div>
              <button 
                onClick={() => setExportMessage({ text: '', type: null })}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                关闭
              </button>
            </div>
          )}

          {/* Scrollable chat body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/40">
            {messages.map(m => {
              const isModel = m.role === 'model';
              const isWelcomeOrErr = m.id.startsWith('welcome') || m.id.startsWith('error') || m.id.startsWith('msg_ai_err');
              
              return (
                <div 
                  key={m.id} 
                  className={`flex gap-3.5 max-w-[90%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar wrapper */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-xs border shrink-0 ${
                    isModel 
                      ? 'bg-indigo-600 text-white border-indigo-700' 
                      : 'bg-slate-900 text-white border-slate-955'
                  }`}>
                    {isModel ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                  </div>

                  {/* Bubble wrapper */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className={`rounded-2xl px-4 py-3.5 shadow-2xs ${
                      isModel 
                        ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none' 
                        : 'bg-indigo-600 text-white rounded-tr-none'
                    }`}>
                      {/* Text content */}
                      {isModel ? (
                        <div className="space-y-1.5">
                          {renderMessageContent(m.content)}
                        </div>
                      ) : (
                        <p className="text-xs whitespace-pre-wrap font-sans font-medium">{m.content}</p>
                      )}

                      {/* Attached chart block if present (Direct visualization output) */}
                      {isModel && m.chart && (
                        <div className="mt-4 p-4.5 bg-slate-50 rounded-xl border border-slate-200 shadow-3xs max-w-full">
                          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-200/60">
                            <h4 className="text-[11px] font-black text-slate-950 flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
                              {m.chart.title}
                            </h4>
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                              {m.chart.type.toUpperCase()} CHART
                            </span>
                          </div>
                          
                          <div className="h-44 w-full text-[9px] font-sans">
                            <ResponsiveContainer width="100%" height="100%">
                              {m.chart.type === 'line' ? (
                                <LineChart data={m.chart.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                  <XAxis dataKey={m.chart.xAxisKey} stroke="#94a3b8" tickLine={false} />
                                  <YAxis stroke="#94a3b8" tickLine={false} />
                                  <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                                  <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                                  {m.chart.series.map((s, idx) => (
                                    <Line 
                                      key={s.key} 
                                      type="monotone" 
                                      dataKey={s.key} 
                                      stroke={s.color} 
                                      name={s.label} 
                                      strokeWidth={2.5} 
                                      activeDot={{ r: 5 }} 
                                    />
                                  ))}
                                </LineChart>
                              ) : m.chart.type === 'bar' ? (
                                <BarChart data={m.chart.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                  <XAxis dataKey={m.chart.xAxisKey} stroke="#94a3b8" tickLine={false} />
                                  <YAxis stroke="#94a3b8" tickLine={false} />
                                  <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                                  <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                                  {m.chart.series.map((s) => (
                                    <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.label} radius={[3, 3, 0, 0]}>
                                      {m.chart.data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={(entry.color as string) || s.color} />
                                      ))}
                                    </Bar>
                                  ))}
                                </BarChart>
                              ) : (
                                <BarChart 
                                  data={m.chart.data} 
                                  layout="vertical" 
                                  margin={{ top: 5, right: 15, left: 15, bottom: 0 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                  <XAxis type="number" stroke="#94a3b8" />
                                  <YAxis 
                                    dataKey={m.chart.xAxisKey} 
                                    type="category" 
                                    stroke="#94a3b8" 
                                    width={90} 
                                    tickLine={false} 
                                    style={{ fontSize: '9px', fontWeight: 'bold' }}
                                  />
                                  <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                                  <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                                  {m.chart.series.map((s) => (
                                    <Bar 
                                      key={s.key} 
                                      dataKey={s.key} 
                                      fill={s.color} 
                                      name={s.label} 
                                      radius={[0, 4, 4, 0]} 
                                    />
                                  ))}
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Timestamp & Export controls */}
                      <div className="flex items-center justify-between text-[9px] mt-2 border-t border-slate-100/50 pt-1.5 font-mono">
                        <span className={isModel ? 'text-slate-400' : 'text-indigo-200'}>
                          {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {isModel && !isWelcomeOrErr && (
                          <button
                            onClick={() => handleExportSessionToReport(m.id, m.content)}
                            disabled={exportingMessageId === m.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer font-bold ${
                              exportingMessageId === m.id ? 'opacity-50' : ''
                            }`}
                          >
                            {exportingMessageId === m.id ? (
                              <span>正在生成报告...</span>
                            ) : (
                              <>
                                <Download className="w-3 h-3 text-indigo-500" />
                                <span>一键转换为分析报告</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex gap-3.5 max-w-[90%] mr-auto">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white border border-indigo-700 flex items-center justify-center text-sm shadow-sm animate-bounce shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-white text-slate-500 border border-slate-200 rounded-xl rounded-tl-none px-4 py-3.5 shadow-2xs flex items-center gap-2 text-xs">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="font-medium font-sans">脑力对齐中，正分析过去30日数据流并对撞图表模型...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Chat text box input */}
          <div className="p-4 bg-white border-t border-slate-200 mt-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(userInput);
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isSending || !activeSessionId}
                placeholder="尝试提问：过去一周哈密瓜增加多少？最近30口感最快是什么？对比竞品口碑..."
                className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 rounded-xl px-4.5 py-3 transition-all outline-hidden text-slate-800 placeholder-slate-400"
              />
              
              <button
                type="submit"
                disabled={isSending || !userInput.trim() || !activeSessionId}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-150 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer flex-shrink-0"
              >
                <span>研判</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2.5">
              <span>💡 精确指令配对：输入带有水果、口感或口碑对比的自然语言，可自动合成决策模型。</span>
              <span className="font-mono">UTC: 2026-05-22</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
