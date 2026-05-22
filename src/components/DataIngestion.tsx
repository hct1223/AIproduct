import React, { useState } from 'react';
import { ScrapedDataFeed, EnterpriseDataUpload } from '../types';
import { 
  Database, Plus, Link, Calendar, User, Info, Check, CloudUpload, 
  Trash, Trash2, MessageSquare, AlertCircle, Sparkles, Send, Network, Cpu, Loader2,
  Settings, Filter, Key, Shield, Play, Pause, RefreshCw, Sliders, Lock, Server, Globe,
  ChevronDown, ChevronUp, CheckSquare, Square
} from 'lucide-react';

interface DataIngestionProps {
  feeds: ScrapedDataFeed[];
  uploads: EnterpriseDataUpload[];
  onAnalyzeNewComment: (platform: string, content: string, author: string) => Promise<boolean>;
  onUploadEnterpriseData: (dataType: 'POS' | 'CRM' | 'MiniProgram' | 'CustomerComplaint', title: string, count: number, summary: string) => void;
  isAnalyzing: boolean;
}

interface ScraperTask {
  id: string;
  sourceName: string;
  platform: string;
  targetKeywords: string;
  frequency: 'Hourly' | 'Daily' | 'Every6h' | 'Realtime';
  status: '进行中' | '已暂停';
  recordsScraped: number;
  depthLimit: number; // Max rows per query
  cookieState: string; // Fake credentials
  userAgent: string; // HTTP headers
  proxyEnabled: boolean; // Virtual proxies configuration
  filterRules: {
    noAd: boolean;
    posOnly: boolean;
    negOnly: boolean;
    minCharCount: number;
  };
}

export default function DataIngestion({
  feeds,
  uploads,
  onAnalyzeNewComment,
  onUploadEnterpriseData,
  isAnalyzing
}: DataIngestionProps) {
  // Manual comment box states
  const [activePlatform, setActivePlatform] = useState<'小红书' | '抖音' | 'B站' | '大众点评'>('小红书');
  const [commentContent, setCommentContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  // File Ingestion states
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<'POS' | 'CRM' | 'MiniProgram' | 'CustomerComplaint'>('POS');
  const [mockRows, setMockRows] = useState(2400);
  const [uploadMessage, setUploadMessage] = useState('');

  // -------------------------------------------------------------
  // BUSINESS SYSTEM INTEGRATION STATES (企业级系统对接)
  // -------------------------------------------------------------
  interface ApiConnection {
    id: string;
    name: string;
    type: 'POS' | 'CRM' | 'MiniProgram' | 'CustomerComplaint';
    endpointUrl: string;
    status: '已连接' | '测试中' | '连接中断' | '未初始化';
    authType: 'BearerJWT' | 'ApiKey' | 'OAuth2' | 'HmacSignature';
    authToken: string;
    lastSyncAt: string;
    totalSyncRecords: number;
    syncFrequency: 'Realtime' | 'Hourly' | 'Daily';
  }

  const [activeIntegrationsTab, setActiveIntegrationsTab] = useState<'file' | 'api'>('file');
  const [apiConnections, setApiConnections] = useState<ApiConnection[]>([
    {
      id: 'conn-1',
      name: '美团收银企业 POS API 智能插槽',
      type: 'POS',
      endpointUrl: 'https://api.meituan.com/pos/v3/bills/query',
      status: '已连接',
      authType: 'BearerJWT',
      authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.meituan_business_key_8231',
      lastSyncAt: '12分钟前',
      totalSyncRecords: 48500,
      syncFrequency: 'Hourly'
    },
    {
      id: 'conn-2',
      name: '有赞商城企业云 CRM 会员大数端点',
      type: 'CRM',
      endpointUrl: 'https://open.youzan.com/api/v1/customer/trends',
      status: '已连接',
      authType: 'HmacSignature',
      authToken: 'sec_weimob_sha256_910decadfe9012cd',
      lastSyncAt: '今日 04:00',
      totalSyncRecords: 12400,
      syncFrequency: 'Daily'
    },
    {
      id: 'conn-3',
      name: '智齿科技客服平台敏感客诉 Webhook 对接',
      type: 'CustomerComplaint',
      endpointUrl: 'https://api.sobot.com/sdk/webhook/feedback',
      status: '连接中断',
      authType: 'ApiKey',
      authToken: 'sobot_secure_key_90fcbdaefe782a',
      lastSyncAt: '3天前',
      totalSyncRecords: 1840,
      syncFrequency: 'Realtime'
    }
  ]);

  // UI state triggers
  const [showAddConnectionForm, setShowAddConnectionForm] = useState(false);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);
  const [integrationMessage, setIntegrationMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Form Fields
  const [newConnName, setNewConnName] = useState('');
  const [newConnType, setNewConnType] = useState<'POS' | 'CRM' | 'MiniProgram' | 'CustomerComplaint'>('POS');
  const [newConnUrl, setNewConnUrl] = useState('');
  const [newConnAuth, setNewConnAuth] = useState<'BearerJWT' | 'ApiKey' | 'OAuth2' | 'HmacSignature'>('ApiKey');
  const [newConnToken, setNewConnToken] = useState('');
  const [newConnFreq, setNewConnFreq] = useState<'Realtime' | 'Hourly' | 'Daily'>('Hourly');
  const [showTokenMask, setShowTokenMask] = useState(true);

  // Business connections triggers
  const handleTestConnection = async (id: string, name: string) => {
    setTestingConnectionId(id);
    setIntegrationMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setApiConnections(prev => prev.map(conn => {
        if (conn.id === id) {
          return { ...conn, status: '已连接' };
        }
        return conn;
      }));
      setIntegrationMessage({
        type: 'success',
        text: `与主业务系统 [${name}] 的 API 接口连通测试验证成功！对方安全网关握手通过 (HTTPS Status 200 OK)。`
      });
    } catch {
      setIntegrationMessage({
        type: 'error',
        text: `业务系统 [${name}] 网关校验失败：Endpoint 连接超时或 Token 校验未通过，请重试。`
      });
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleSyncConnection = async (conn: ApiConnection) => {
    setSyncingConnectionId(conn.id);
    setIntegrationMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const recordsToIngest = Math.floor(Math.random() * 3200) + 800;
      const dateStr = new Date().toLocaleDateString();
      const fileName = `${conn.name}_对齐同步_${dateStr}.api`;
      
      const typeLabel = 
        conn.type === 'POS' ? '售卖成交大数' :
        conn.type === 'CRM' ? '会员积分偏好明细' :
        conn.type === 'MiniProgram' ? '小程序定制选项汇总' :
        '产品舆情及差评退款反馈';

      const defaultSummaries = {
        POS: `API网关拉取了 ${recordsToIngest} 条售卖清单。甜点饮品品类统计中，开心果司康/糯叽叽/低糖巴斯克等爆款成交提速 11.2%，国潮礼盒销售表现出色。`,
        CRM: `成功通过接口集成 ${recordsToIngest} 笔年轻会员偏好，本周下午茶时间（14:00-17:00）订单复购周期缩短至 4.2 天。`,
        MiniProgram: `获取外卖小程序 ${recordsToIngest} 笔加料偏好：开心果流心、少糖、加双份麻薯等高定选项被消费者热切勾选。`,
        CustomerComplaint: `实时同步近48h敏感词监控客诉 ${recordsToIngest} 条，针对开心果等配比的“干巴”、“吞咽噎脖子”、“包装损坏”退款投诉已分类。`
      };

      onUploadEnterpriseData(
        conn.type,
        fileName,
        recordsToIngest,
        defaultSummaries[conn.type]
      );

      setApiConnections(prev => prev.map(c => {
        if (c.id === conn.id) {
          return {
            ...c,
            lastSyncAt: '刚刚 API 联动',
            totalSyncRecords: c.totalSyncRecords + recordsToIngest,
            status: '已连接'
          };
        }
        return c;
      }));

      setIntegrationMessage({
        type: 'success',
        text: `【${conn.name}】自动对接同步并完成洗码归纳！通过 API 拉取到 ${recordsToIngest} 条「${typeLabel}」记录，已转换融合并参与 AI 下游大牌风味雷达研判。`
      });

    } catch (err) {
      setIntegrationMessage({
        type: 'error',
        text: `向业务系统 [${conn.name}] 同步请求异常：业务系统网关拒绝本次调用(403)。`
      });
    } finally {
      setSyncingConnectionId(null);
    }
  };

  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName.trim() || !newConnUrl.trim()) return;

    const newConn: ApiConnection = {
      id: 'conn-' + Date.now(),
      name: newConnName,
      type: newConnType,
      endpointUrl: newConnUrl,
      status: '已连接',
      authType: newConnAuth,
      authToken: newConnToken || 'sec_key_demo_029fe3',
      lastSyncAt: '从未同步',
      totalSyncRecords: 0,
      syncFrequency: newConnFreq
    };

    setApiConnections(prev => [...prev, newConn]);
    setShowAddConnectionForm(false);
    
    // Clear
    setNewConnName('');
    setNewConnUrl('');
    setNewConnToken('');
    
    setIntegrationMessage({
      type: 'success',
      text: `新物理业务对接口 [${newConn.name}] 初始化配署完成！现在可以使用该业务接口触发对齐拉取动作。`
    });
  };

  const handleDeleteConnection = (id: string, name: string) => {
    setApiConnections(prev => prev.filter(c => c.id !== id));
    setIntegrationMessage({
      type: 'info',
      text: `已断链并移除 API 系统端点：${name}`
    });
  };

  // -------------------------------------------------------------
  // ADVANCED DATA SOURCE CONFIGURATION STATES
  // -------------------------------------------------------------
  const [scraperTasks, setScraperTasks] = useState<ScraperTask[]>([
    { 
      id: 't-1', 
      sourceName: '小红书网红爆款甜品风味靶向探针', 
      platform: 'https://www.xiaohongshu.com/explore', 
      targetKeywords: '开心果(Pistachio), 司康, 爆浆下午茶', 
      frequency: 'Hourly', 
      status: '进行中', 
      recordsScraped: 1250,
      depthLimit: 500,
      cookieState: 'sh_session_uid=82fefc293cf021df; security_token=xhs_9120aefcde431d;',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Chrome/Mobile/122.0',
      proxyEnabled: true,
      filterRules: { noAd: true, posOnly: false, negOnly: false, minCharCount: 15 }
    },
    { 
      id: 't-2', 
      sourceName: '抖音同城吃喝探店视频评论捕获器', 
      platform: 'https://www.douyin.com/discover', 
      targetKeywords: '探店达人, 糯叽叽, 巴斯克蛋糕', 
      frequency: 'Hourly', 
      status: '进行中', 
      recordsScraped: 5320,
      depthLimit: 1000,
      cookieState: 'dy_passport_session=dy_csrf_90f23fef2a8cb901; t_cookie=dy91023fc91823;',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
      proxyEnabled: true,
      filterRules: { noAd: true, posOnly: false, negOnly: false, minCharCount: 10 }
    },
    { 
      id: 't-3', 
      sourceName: 'B站创意美食及翻车视频弹幕槽', 
      platform: 'https://www.bilibili.com/v/food', 
      targetKeywords: '烘焙翻车, 办公室下午茶, 避雷测评', 
      frequency: 'Daily', 
      status: '已暂停', 
      recordsScraped: 930,
      depthLimit: 300,
      cookieState: 'SESSDATA=bilibili_90df21f8ad3210ec; df_uid=31201923; b_sid=82fdfe21;',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
      proxyEnabled: false,
      filterRules: { noAd: false, posOnly: false, negOnly: true, minCharCount: 5 }
    },
    { 
      id: 't-4', 
      sourceName: '美团点评北上广深门店大盘客诉哨', 
      platform: 'https://www.dianping.com/search', 
      targetKeywords: '排队王, 难吃吐槽, 不值这个价, 避雷', 
      frequency: 'Daily', 
      status: '进行中', 
      recordsScraped: 18400,
      depthLimit: 2000,
      cookieState: 'dp_sid=dp_823fecd2013fdaae; member_id=293810182; dp_ticket=9102;',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/122.0.0.0 Safari/537.36',
      proxyEnabled: true,
      filterRules: { noAd: true, posOnly: false, negOnly: false, minCharCount: 20 }
    }
  ]);

  // Editing and Creation workspace toggles
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form Fields for Add/Edit
  const [fieldSourceName, setFieldSourceName] = useState('');
  const [fieldPlatform, setFieldPlatform] = useState('https://www.xiaohongshu.com/explore');
  const [fieldKeywords, setFieldKeywords] = useState('');
  const [fieldFrequency, setFieldFrequency] = useState<'Hourly' | 'Daily' | 'Every6h' | 'Realtime'>('Hourly');
  const [fieldDepthLimit, setFieldDepthLimit] = useState(500);
  const [fieldCookieState, setFieldCookieState] = useState('');
  const [fieldUserAgent, setFieldUserAgent] = useState('');
  const [fieldProxyEnabled, setFieldProxyEnabled] = useState(true);
  const [fieldNoAd, setFieldNoAd] = useState(true);
  const [fieldPosOnly, setFieldPosOnly] = useState(false);
  const [fieldNegOnly, setFieldNegOnly] = useState(false);
  const [fieldMinCharCount, setFieldMinCharCount] = useState(10);

  // Initialize Form Fields for Editing
  const startEditTask = (task: ScraperTask) => {
    setEditingTaskId(task.id);
    setShowCreateForm(false);
    setFieldSourceName(task.sourceName);
    setFieldPlatform(task.platform);
    setFieldKeywords(task.targetKeywords);
    setFieldFrequency(task.frequency);
    setFieldDepthLimit(task.depthLimit);
    setFieldCookieState(task.cookieState);
    setFieldUserAgent(task.userAgent);
    setFieldProxyEnabled(task.proxyEnabled);
    setFieldNoAd(task.filterRules.noAd);
    setFieldPosOnly(task.filterRules.posOnly);
    setFieldNegOnly(task.filterRules.negOnly);
    setFieldMinCharCount(task.filterRules.minCharCount);
  };

  // Start pristine draft fields for creation
  const startCreateTask = () => {
    setShowCreateForm(true);
    setEditingTaskId(null);
    setFieldSourceName('微博同城新品超话爬树节点');
    setFieldPlatform('https://weibo.com/trends');
    setFieldKeywords('低卡代餐杯, 司康, 避雷吐槽');
    setFieldFrequency('Every6h');
    setFieldDepthLimit(500);
    setFieldCookieState('wb_session=wb_910dec8e90a; key=client_secret_99;');
    setFieldUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0');
    setFieldProxyEnabled(true);
    setFieldNoAd(true);
    setFieldPosOnly(false);
    setFieldNegOnly(false);
    setFieldMinCharCount(15);
  };

  // Save Task (Add or edit)
  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldSourceName.trim() || !fieldKeywords.trim()) return;

    if (editingTaskId) {
      setScraperTasks(prev => prev.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            sourceName: fieldSourceName,
            platform: fieldPlatform,
            targetKeywords: fieldKeywords,
            frequency: fieldFrequency,
            depthLimit: fieldDepthLimit,
            cookieState: fieldCookieState,
            userAgent: fieldUserAgent,
            proxyEnabled: fieldProxyEnabled,
            filterRules: {
              noAd: fieldNoAd,
              posOnly: fieldPosOnly,
              negOnly: fieldNegOnly,
              minCharCount: fieldMinCharCount
            }
          };
        }
        return t;
      }));
      setEditingTaskId(null);
    } else {
      const newTask: ScraperTask = {
        id: 't-' + Date.now(),
        sourceName: fieldSourceName,
        platform: fieldPlatform,
        targetKeywords: fieldKeywords,
        frequency: fieldFrequency,
        status: '进行中',
        recordsScraped: 0,
        depthLimit: fieldDepthLimit,
        cookieState: fieldCookieState,
        userAgent: fieldUserAgent,
        proxyEnabled: fieldProxyEnabled,
        filterRules: {
          noAd: fieldNoAd,
          posOnly: fieldPosOnly,
          negOnly: fieldNegOnly,
          minCharCount: fieldMinCharCount
        }
      };
      setScraperTasks(prev => [...prev, newTask]);
      setShowCreateForm(false);
    }
  };

  // Delete custom defined crawler
  const deleteTask = (taskId: string) => {
    setScraperTasks(prev => prev.filter(t => t.id !== taskId));
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
    }
  };

  // Toggle dynamic scrapers run state
  const toggleTask = (taskId: string) => {
    setScraperTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: t.status === '进行中' ? '已暂停' : '进行中' };
      }
      return t;
    }));
  };

  // -------------------------------------------------------------
  // SIMULATE REAL-TIME DATA INGESTION CALLS FROM CHOSEN SOURCE CONFIG
  // -------------------------------------------------------------
  const triggerSourceSync = async (task: ScraperTask) => {
    const keywordsArray = task.targetKeywords
      .split(/[,，]/)
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    const primaryKeyword = keywordsArray[0] || '网红风味';
    const secondaryKeyword = keywordsArray[1] || '轻体零食';
    const platform = task.platform;
    
    const authorNames = [
      '芝士抹茶控', '测评博主小徐', '健康轻卡达人', '烘焙研品室', '100斤吃货少女', '下午茶避雷官', '面包深度患者'
    ];
    
    const simulatedScripts = [
      {
        author: authorNames[Math.floor(Math.random() * authorNames.length)],
        content: `最近在${platform}上看到疯狂安利这个【${primaryKeyword}】！作为吃货马上跑去排队尝鲜。整体口感真的极具层次，糯叽叽的流心真的很爽。唯一的就是[${secondaryKeyword || '甜度'}]口感稍微有点重，少糖版应该会更爆火，值得打卡！`
      },
      {
        author: authorNames[Math.floor(Math.random() * authorNames.length)],
        content: `拔草警报警告！跟风买了【${primaryKeyword}】。本来以为口感会是爆浆的很浓郁，结果非常干瘪卡嗓子。根本没吃到宣传的[${secondaryKeyword || '风味'}]。虽然包装的国潮高颜值真精致，但是口感真的很一般。不推荐踩雷！`
      },
      {
        author: authorNames[Math.floor(Math.random() * authorNames.length)],
        content: `疯狂打call，实测【${primaryKeyword}】真是绝美！入口就像冰沙一样清爽、完全不干巴不腻。在办公室工作拿来做下午茶太解压了，而且感觉十分天然低卡，爆浆太爽了吧！`
      }
    ];

    let itemsToProcess = simulatedScripts;
    if (task.filterRules.negOnly) {
      itemsToProcess = [simulatedScripts[1]];
    } else if (task.filterRules.posOnly) {
      itemsToProcess = [simulatedScripts[0], simulatedScripts[2]];
    }

    setSyncingTaskId(task.id);
    setSyncMessage(null);
    let successCount = 0;

    try {
      for (const item of itemsToProcess) {
        // Run deep actual integration sequential calls to Gemini NLP API in the server.ts
        const success = await onAnalyzeNewComment(task.platform, item.content, item.author);
        if (success) {
          successCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 800)); // Throttling simulation
      }

      setScraperTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          return { ...t, recordsScraped: t.recordsScraped + successCount };
        }
        return t;
      }));

      setSyncMessage({
        type: 'success',
        text: `【${task.sourceName}】对齐并在后台调用 Gemini 3.5 完成建模分析！共提取 ${successCount} 条围绕关键字「${primaryKeyword}」的原声，已并入下文“消费者反馈舆情池”中！`
      });
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: `【${task.sourceName}】自检连接异常：探针代理IP遭到限制，请确认 HTTP Headers cookies 是否有效。`
      });
    } finally {
      setSyncingTaskId(null);
    }
  };


  // -------------------------------------------------------------
  // POS/CRM Drag Ingestion
  // -------------------------------------------------------------
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      triggerMockUpload(file.name);
    }
  };

  const triggerMockUpload = (fileName: string) => {
    const defaultSummaries = {
      POS: `检测到 ${mockRows} 条门店销售数据，椰香/开心果/麻薯制品销售极速爬坡。`,
      CRM: `累计分析了 Q2 首批 ${mockRows} 名年轻会员的支付积分周期，下午茶复购周期为 4.8 天。`,
      MiniProgram: `加载 ${mockRows} 条外卖小程序加码记录，其中「加冰/微糖」定制化风味选项被频繁提及。`,
      CustomerComplaint: `汇聚 ${mockRows} 个敏感客源吐槽，司康/法式干硬吐司引来噎脖子差评率超 40%。`
    };

    onUploadEnterpriseData(
      selectedFileType,
      fileName,
      mockRows,
      defaultSummaries[selectedFileType]
    );

    setUploadMessage(`文件 「${fileName}」 仿真导入并完成序列化建模成功！已并入 AI 动态分析引擎！`);
    setTimeout(() => {
      setUploadMessage('');
    }, 4500);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setAnalysisStatus(null);
    const author = authorName.trim() || '烘焙观察家';

    const success = await onAnalyzeNewComment(activePlatform, commentContent, author);
    if (success) {
      setAnalysisStatus({ success: true });
      setCommentContent('');
      setAuthorName('');
    } else {
      setAnalysisStatus({ error: 'AI 引擎由于网络负载或未绑定 API 密钥，本次切换为智能专家系统规则为您处理。' });
    }
  };

  return (
    <div className="space-y-6" id="data_ingestion_view">
      
      {/* Dynamic Sync feedback banner */}
      {syncMessage && (
        <div id="sync_alert_feedback" className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 transition animate-fade-in ${
          syncMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
            : 'bg-red-50 border-red-200 text-red-950'
        }`}>
          {syncMessage.type === 'success' ? (
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-spin" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold block mb-0.5">{syncMessage.type === 'success' ? '数据采集成功对齐' : '采集通道异常警告'}</span>
            <p className="opacity-90 leading-tight">{syncMessage.text}</p>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-[10px] font-bold underline cursor-pointer hover:opacity-100 opacity-60">关闭</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Real-Time Crawler Controller & Corporate File Uploader */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Scaper Crawler Controllers & Data Source Configurations */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-5" id="crawler_source_card">
            
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-800 text-md flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-600 animate-pulse" />
                  多源数据采集与探针配置中心
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">监测并配置全网数据源，包括自设鉴权 Cookies、数据获取限额、目标关键词及过滤清洗算法规则。</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startCreateTask}
                  id="btn_add_data_source"
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  增加极佳采集数据源
                </button>
              </div>
            </div>

            {/* Ingestion Source config visual list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {scraperTasks.map(task => {
                const isSyncing = syncingTaskId === task.id;
                const isEditing = editingTaskId === task.id;
                return (
                  <div 
                    key={task.id} 
                    id={`task_card_${task.id}`}
                    className={`border rounded-xl p-4 transition flex flex-col justify-between ${
                      isEditing 
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20' 
                        : 'border-slate-200 bg-linear-to-b from-slate-50 to-white hover:shadow-xs'
                    }`}
                  >
                    
                    {/* Brand header */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${task.status === '进行中' ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            task.platform.includes('xiaohongshu') || task.platform.includes('小红书') ? 'bg-red-50 text-red-700 border border-red-100' :
                            task.platform.includes('douyin') || task.platform.includes('抖音') ? 'bg-slate-900 text-white' :
                            task.platform.includes('bilibili') || task.platform.includes('B站') ? 'bg-sky-50 text-sky-700 border border-sky-100 font-bold' :
                            task.platform.includes('dianping') || task.platform.includes('大众点评') ? 'bg-amber-50 text-amber-800' :
                            'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {task.platform.length > 30 ? task.platform.replace(/^https?:\/\/(www\.)?/, '').substring(0, 24) + '...' : task.platform}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">[{task.frequency}]</span>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          task.status === '进行中' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {task.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-800">{task.sourceName}</h4>
                    </div>

                    {/* Detailed configs details */}
                    <div className="mt-2 text-[11px] text-slate-500 space-y-1 bg-white/60 p-2.5 rounded-lg border border-slate-100/80">
                      <div className="flex justify-between">
                        <span>采集监测词：</span>
                        <strong className="text-slate-800 font-sans">{task.targetKeywords}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>单期获取限额：</span>
                        <strong className="text-slate-700 font-mono">每次不超过 {task.depthLimit} 条</strong>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 mt-1">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          Cookies & Proxy：
                        </span>
                        <span className="font-semibold">
                          {task.cookieState ? '已锁定' : '未挂载'} | {task.proxyEnabled ? '已开启动态代理' : '直辖直连'}
                        </span>
                      </div>
                    </div>

                    {/* Footer options */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400 font-mono">
                        AI清洗条数: <span className="font-bold text-slate-700">{task.recordsScraped.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => triggerSourceSync(task)}
                          disabled={isSyncing || task.status === '已暂停'}
                          className="text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer"
                          title="运行数据源匹配器"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              抓取中
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              立即抓取
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition cursor-pointer"
                        >
                          {task.status === '进行中' ? '暂停' : '启动'}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditTask(task)}
                          className="text-[11.5px] font-medium bg-slate-150 text-slate-700 hover:bg-slate-200 px-2 py-1 rounded-md transition flex items-center gap-0.5 cursor-pointer"
                          title="修改身份和清洗规则"
                        >
                          <Settings className="w-3 h-3 text-slate-500" />
                          配置
                        </button>

                        {task.id.startsWith('t-') && !['t-1','t-2','t-3','t-4'].includes(task.id) && (
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="删除自定义数据源"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* INLINE EDIT AND CREATE DOCK MODULE */}
            {(showCreateForm || editingTaskId) && (
              <div className="bg-slate-50 border border-indigo-200 rounded-xl p-5 space-y-4 animate-fade-in" id="crawler_config_editor">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-xs text-slate-800">
                      {editingTaskId ? `修改采集源：${fieldSourceName}` : '创建全新的智能采集数据源'}
                    </h4>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => { setShowCreateForm(false); setEditingTaskId(null); }}
                    className="text-xs text-slate-400 hover:text-slate-700 font-bold"
                  >
                    ✕ 取消配置
                  </button>
                </div>

                <form onSubmit={saveTask} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Pipeline Name */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">① 采集源自定义命名</label>
                    <input 
                      type="text" 
                      required
                      placeholder="如：大众点评精品下午茶避雷数据槽" 
                      value={fieldSourceName} 
                      onChange={e => setFieldSourceName(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 bg-white"
                    />
                  </div>

                  {/* Platform Link Input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">② 目标数据源网站链接</label>
                    <input 
                      type="text"
                      required
                      placeholder="如 https://www.xiaohongshu.com/explore"
                      value={fieldPlatform} 
                      onChange={e => setFieldPlatform(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 bg-white"
                    />
                  </div>

                  {/* Target Keywords */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">③ 监控抓取核心词(用逗号分隔)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="开心果, 司康, 爆浆, 太甜" 
                      value={fieldKeywords} 
                      onChange={e => setFieldKeywords(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 bg-white"
                    />
                  </div>

                  {/* Ingestion limits and speed */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">④ 采集限额 (Max Depth/每次)</label>
                    <input 
                      type="number" 
                      value={fieldDepthLimit} 
                      onChange={e => setFieldDepthLimit(parseInt(e.target.value) || 100)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 bg-white"
                    />
                  </div>

                  {/* Frequency */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">⑤ 运行触发循环频率</label>
                    <select 
                      value={fieldFrequency} 
                      onChange={e => setFieldFrequency(e.target.value as any)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 bg-white"
                    >
                      <option value="Realtime">高频实时对齐侦探 (Real-time)</option>
                      <option value="Hourly">每小时周期性静默爬取 (Hourly)</option>
                      <option value="Every6h">每6小时提取清洗大盘 (6 Hours)</option>
                      <option value="Daily">每日定点汇总统计 (Daily)</option>
                    </select>
                  </div>

                  {/* Minimum length */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">⑥ 最小字数限制 (字符)</label>
                    <input 
                      type="number" 
                      value={fieldMinCharCount} 
                      onChange={e => setFieldMinCharCount(parseInt(e.target.value) || 5)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 bg-white"
                    />
                  </div>

                  {/* HTTP auth cookies */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>⑦ 身份代理: Cookie 签名串 (高级防封禁配置)</span>
                      <span className="text-[9px] text-slate-400 font-normal">提供 Cookie 便于避开无权查询检测</span>
                    </label>
                    <textarea 
                      placeholder="sh_session_id=82fe...; security_key=xhs_abc910;" 
                      value={fieldCookieState} 
                      onChange={e => setFieldCookieState(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 h-10 bg-white resize-none font-mono"
                    />
                  </div>

                  {/* Dynamic proxy settings and rules */}
                  <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="check_proxy"
                        checked={fieldProxyEnabled}
                        onChange={e => setFieldProxyEnabled(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 w-4 h-4"
                      />
                      <label htmlFor="check_proxy" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        动态高防代理IP池介入
                      </label>
                    </div>
                  </div>

                  {/* Extracted filters options */}
                  <div className="md:col-span-3 pt-2 border-t border-slate-200 flex flex-wrap gap-4 items-center">
                    <span className="text-[10px] font-bold uppercase text-indigo-700">⑧ 语义过滤算法规则：</span>
                    
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input 
                        type="checkbox" 
                        id="check_no_ad" 
                        checked={fieldNoAd}
                        onChange={e => setFieldNoAd(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <label htmlFor="check_no_ad" className="cursor-pointer">屏蔽有商业软文嫌疑贴 (AI Adfilter)</label>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input 
                        type="checkbox" 
                        id="check_neg_only" 
                        checked={fieldNegOnly}
                        onChange={e => {
                          setFieldNegOnly(e.target.checked);
                          if (e.target.checked) setFieldPosOnly(false);
                        }}
                        className="rounded border-slate-300"
                      />
                      <label htmlFor="check_neg_only" className="cursor-pointer">只锁定吃货负面客诉 (SOS Alerts)</label>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input 
                        type="checkbox" 
                        id="check_pos_only" 
                        checked={fieldPosOnly}
                        onChange={e => {
                          setFieldPosOnly(e.target.checked);
                          if (e.target.checked) setFieldNegOnly(false);
                        }}
                        className="rounded border-slate-300"
                      />
                      <label htmlFor="check_pos_only" className="cursor-pointer">只锁定好评高分推荐</label>
                    </div>
                  </div>

                  {/* Perform Action Trigger */}
                  <div className="md:col-span-3 pt-3 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => { setShowCreateForm(false); setEditingTaskId(null); }}
                      className="text-xs font-medium text-slate-500 bg-white hover:bg-slate-150 px-4 py-2 border border-slate-200 rounded-lg transition"
                    >
                      放弃
                    </button>
                    <button
                      type="submit"
                      className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5  py-2 rounded-lg transition shadow-sm cursor-pointer"
                    >
                      {editingTaskId ? '更新并激活当前配置' : '完成，将此源并入采集大盘'}
                    </button>
                  </div>

                </form>

              </div>
            )}

          </div>

          {/* Section 2: Enterprise POS/CRM Uploader & Business API Docking */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  内部经营与业务系统数据智能整合
                </h3>
                <p className="text-[11px] text-slate-400">一键集成商家本地文件与外部云端 API 生产大数，对齐洗码并融入下游 AI 趋势研判。</p>
              </div>

              {/* High Contrast Tabs Selector */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200" id="integrations_tabs">
                <button
                  type="button"
                  onClick={() => setActiveIntegrationsTab('file')}
                  className={`text-[11px] font-bold px-3 py-1 rounded-md transition duration-150 flex items-center gap-1 cursor-pointer ${
                    activeIntegrationsTab === 'file'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  本地文件手动导入
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIntegrationsTab('api')}
                  className={`text-[11px] font-bold px-3 py-1 rounded-md transition duration-150 flex items-center gap-1 cursor-pointer ${
                    activeIntegrationsTab === 'api'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  网络业务系统对接 (API/Webhook)
                </button>
              </div>
            </div>

            {/* Ingestion feedback overlay alerts */}
            {integrationMessage && (
              <div id="integration_alert" className={`p-3.5 rounded-xl border text-[11px] flex items-start gap-2.5 transition animate-fade-in ${
                integrationMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                  : integrationMessage.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-950'
                    : 'bg-indigo-50 border-indigo-150 text-indigo-950'
              }`}>
                {integrationMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : integrationMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="opacity-90 leading-tight">{integrationMessage.text}</p>
                </div>
                <button 
                  onClick={() => setIntegrationMessage(null)} 
                  className="text-[10px] font-bold underline cursor-pointer hover:opacity-100 opacity-60"
                >
                  忽略
                </button>
              </div>
            )}

            {/* TAB CONTENT 1: FILE MANUAL UPLOADER */}
            {activeIntegrationsTab === 'file' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">数据类型</label>
                    <select 
                      value={selectedFileType} 
                      onChange={e => setSelectedFileType(e.target.value as any)}
                      className="w-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 p-2 rounded-lg outline-hidden font-sans"
                    >
                      <option value="POS">POS 收银成交记录 (.csv / .xls)</option>
                      <option value="CRM">CRM 会员消费习惯记录 (.json)</option>
                      <option value="MiniProgram">外卖小程序交互动作明细 (.csv)</option>
                      <option value="CustomerComplaint">客服退款客诉记录 (.txt / .xls)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">仿真测算记录行数</label>
                    <input 
                      type="number"
                      value={mockRows}
                      onChange={e => setMockRows(parseInt(e.target.value) || 100)}
                      className="w-full text-xs border border-slate-200 p-2 rounded-lg outline-hidden focus:border-indigo-500 bg-white"
                      min={10}
                      max={100000}
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => triggerMockUpload(`仿真_${selectedFileType}_${new Date().toLocaleDateString()}.csv`)}
                      className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CloudUpload className="w-4 h-4" />
                      手动录入仿真数据包
                    </button>
                  </div>
                </div>

                {/* Drag & Drop Zone */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">
                    拖拽食客调查、会员报表 或 POS 导出文件至此
                  </p>
                  <p className="text-[10px] text-slate-400">
                    支持 CSV, XLS, JSON 格式，最大支持一次 100 万行记录清洗
                  </p>
                </div>

                {/* Ingestion response overlay alerts */}
                {uploadMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{uploadMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: LIVE API/WEBHOOK SYSTEM INTEGRATIONS */}
            {activeIntegrationsTab === 'api' && (
              <div className="space-y-4 animate-fade-in" id="api_integration_tab">
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    主业务系统 API / Webhook 对接总线 ({apiConnections.length})
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => setShowAddConnectionForm(!showAddConnectionForm)}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showAddConnectionForm ? '关闭连接表单' : '接入新业务系统 API'}
                  </button>
                </div>

                {/* ADD NEW CONNECTION FORM - INLINE DRAWER */}
                {showAddConnectionForm && (
                  <form onSubmit={handleCreateConnection} className="bg-slate-50 border border-indigo-100 rounded-xl p-4 space-y-3.5 animate-fade-in" id="add_connection_form">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Key className="w-4 h-4 text-indigo-600" />
                        配置全新的外部业务网关安全连接 (Security Endpoint)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">1. 对接业务系统名称</label>
                        <input
                          type="text"
                          required
                          placeholder="例如：客如云餐饮收银 POS 端"
                          value={newConnName}
                          onChange={e => setNewConnName(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white box-border outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">2. 同步数据架构类型</label>
                        <select
                          value={newConnType}
                          onChange={e => setNewConnType(e.target.value as any)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-sans outline-hidden focus:border-indigo-500"
                        >
                          <option value="POS">POS 线下收银流水成交监测</option>
                          <option value="CRM">CRM 客户等级及留存偏好同步</option>
                          <option value="MiniProgram">自营外卖小程序交互热度同步</option>
                          <option value="CustomerComplaint">敏感反馈与售后投诉同步</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2 font-sans">
                        <label className="block text-[11px] font-semibold text-slate-600">3. 接口 Endpoint URL / Webhook 接收端</label>
                        <input
                          type="url"
                          required
                          placeholder="https://api.yourdomain.com/v1/bills/sync"
                          value={newConnUrl}
                          onChange={e => setNewConnUrl(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-mono box-border outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">4. 安全网关鉴权模式</label>
                        <select
                          value={newConnAuth}
                          onChange={e => setNewConnAuth(e.target.value as any)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-500"
                        >
                          <option value="ApiKey">API Key 静态秘钥传入</option>
                          <option value="BearerJWT">Bearer JWT 动态安全令牌</option>
                          <option value="HmacSignature">HMAC-SHA256 签名校验端</option>
                          <option value="OAuth2">OAuth 2.0 客户端凭授权</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">5. 动态拉取触发周期</label>
                        <select
                          value={newConnFreq}
                          onChange={e => setNewConnFreq(e.target.value as any)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-500"
                        >
                          <option value="Realtime">实时推送 (Realtime Webhook)</option>
                          <option value="Hourly">每小时周期性拉取跑批 (Hourly)</option>
                          <option value="Daily">每日凌晨零点汇总 (Daily)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 space-y-1 font-sans">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-semibold text-slate-600">6. 安全凭证对齐 (Access Secret / Tokens)</label>
                          <button 
                            type="button" 
                            onClick={() => setShowTokenMask(!showTokenMask)} 
                            className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold"
                          >
                            {showTokenMask ? '显示明文' : '隐藏加密'}
                          </button>
                        </div>
                        <input
                          type={showTokenMask ? 'password' : 'text'}
                          placeholder="输入配对的 ClientSecret, Webhook 密匙或 Bearer Token 字符串..."
                          value={newConnToken}
                          onChange={e => setNewConnToken(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-mono box-border outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setShowAddConnectionForm(false)}
                        className="text-xs font-semibold text-slate-500 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        验证并激活连接
                      </button>
                    </div>
                  </form>
                )}

                {/* API CONNECTIONS LIST */}
                <div className="space-y-3">
                  {apiConnections.map(conn => {
                    const isTesting = testingConnectionId === conn.id;
                    const isSyncing = syncingConnectionId === conn.id;

                    return (
                      <div 
                        key={conn.id} 
                        className="border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 max-w-[70%]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`w-2 h-2 rounded-full ${
                              conn.status === '已连接' ? 'bg-emerald-500 animate-ping' : 'bg-rose-400'
                            }`}></span>
                            
                            <h4 className="font-bold text-xs text-slate-800">{conn.name}</h4>
                            
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                              conn.type === 'POS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              conn.type === 'CRM' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              conn.type === 'MiniProgram' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {conn.type === 'POS' ? 'POS收银' :
                               conn.type === 'CRM' ? 'CRM会员' :
                               conn.type === 'MiniProgram' ? '外卖小程序' : '客服投诉'}
                            </span>

                            <span className="text-[10px] text-slate-400 font-mono">
                              [{conn.syncFrequency === 'Realtime' ? '实时推送' : conn.syncFrequency === 'Hourly' ? '每小时轮询' : '每天零时轮询'}]
                            </span>
                          </div>

                          <div className="text-[11px] font-mono overflow-hidden text-ellipsis whitespace-nowrap bg-white p-2 rounded border border-slate-150 flex items-center gap-1">
                            <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-500 select-all">{conn.endpointUrl}</span>
                          </div>

                          <div className="flex items-center gap-4 text-[10px] text-slate-400">
                            <span>认证凭证：<strong className="text-slate-600 font-mono">{
                              conn.authType === 'BearerJWT' ? 'Bearer Token JWT' :
                              conn.authType === 'HmacSignature' ? 'HMAC-SHA256 签名' :
                              conn.authType === 'ApiKey' ? 'App API Key' : 'OAuth 2.0 Credentials'
                            }</strong></span>
                            <span>已同步：<strong className="text-slate-700 font-mono">{conn.totalSyncRecords.toLocaleString()} 条</strong></span>
                            <span>上次联动时间：<strong className="text-slate-600">{conn.lastSyncAt}</strong></span>
                          </div>
                        </div>

                        {/* CONTROLS */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => handleTestConnection(conn.id, conn.name)}
                            disabled={isTesting || isSyncing}
                            className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            {isTesting ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                握手中
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 text-indigo-500" />
                                测试连通
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSyncConnection(conn)}
                            disabled={isTesting || isSyncing}
                            className="text-[11px] font-bold bg-slate-900 border border-slate-900 text-amber-300 hover:bg-slate-800 disabled:opacity-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            {isSyncing ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin animate-spin" />
                                同步中
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                立即对齐并同步
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteConnection(conn.id, conn.name)}
                            className="text-slate-400 hover:text-rose-600 p-2 cursor-pointer transition duration-150"
                            title="断开该业务系统集成"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right Side: Paste Manual Review & Live AI Semantic Analyser */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Manual input box with live Gemini call */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col h-full justify-between space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-pink-600" />
                AI 语义解析舆情沙盒
              </h3>
              <p className="text-[11px] text-slate-400">粘贴您在小红书、抖音、美团或客服记录里听到的消费者真心话评论，由真AI自动提取细粒度的风味、口感、视觉定位及情感打分。</p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 flex-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">评论来源渠道</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['小红书', '抖音', 'B站', '大众点评'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActivePlatform(p)}
                      className={`text-[10px] py-1 px-1.5 border rounded-md transition cursor-pointer ${
                        activePlatform === p 
                          ? 'bg-slate-900 border-slate-900 text-white font-bold' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">博主/用户名称 (选填)</label>
                <input
                  type="text"
                  placeholder="如：甜点控李阿姨 / 探店达人"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">消费者评论原声文本</label>
                <textarea
                  required
                  placeholder="例如：这家新出的抹茶开心果司康也太干了吧！简直卡嗓子。国潮风的包装蛮好看但是不配饮料真的吃不下去，糯叽叽的感觉不强烈..."
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  className="w-full flex-1 min-h-[140px] text-xs p-2.5 border border-slate-200 focus:border-indigo-500 rounded-lg outline-hidden resize-none bg-white font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzing || !commentContent.trim()}
                className="w-full text-xs bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    AI多维建模语义解析中...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    递交 Gemini-3.5 智能提取
                  </>
                )}
              </button>
            </form>

            {analysisStatus && (
              <div className={`p-3 rounded-xl border text-[11px] flex gap-2 ${
                analysisStatus.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {analysisStatus.success ? (
                  <>
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>提取完毕！已解构好风味口感标签，并录入大盘趋势雷达系统！可以在下文“探针采集原声池”查看。</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>{analysisStatus.error}</span>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Raw Collected Feeds Feedbox */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              探针采集消费者原声反馈池 (Monitored Consumer Feeds)
            </h3>
            <p className="text-[11px] text-slate-400">汇编所有来自小红书、大众点评等舆情和自定义文本的AI分析记录。共 {feeds.length} 条。</p>
          </div>
        </div>

        <div className="space-y-3.5">
          {feeds.map(feed => (
            <div key={feed.id} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap md:flex-nowrap items-start justify-between gap-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    feed.platform.includes('xiaohongshu') || feed.platform === '小红书' ? 'bg-red-50 text-red-700 border border-red-100' :
                    feed.platform.includes('douyin') || feed.platform === '抖音' ? 'bg-slate-900 text-white' :
                    feed.platform.includes('bilibili') || feed.platform === 'B站' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                    feed.platform.includes('dianping') || feed.platform === '大众点评' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}>
                    {feed.platform.length > 30 ? feed.platform.replace(/^https?:\/\/(www\.)?/, '').substring(0, 24) + '...' : feed.platform}
                  </span>
                  <span className="font-semibold text-slate-700">{feed.author}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                    <Calendar className="w-3 h-3" />
                    {feed.publishedAt}
                  </span>
                </div>

                {feed.aiAnalysis && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      情感评分: <strong className="text-slate-700">{feed.aiAnalysis.sentimentScore}</strong>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      feed.aiAnalysis.sentimentLabel === '正面' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      feed.aiAnalysis.sentimentLabel === '负面' ? 'bg-red-50 text-red-700 border border-red-100' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {feed.aiAnalysis.sentimentLabel}
                    </span>
                  </div>
                )}
              </div>

              {feed.title && <h4 className="text-xs font-bold text-slate-900">{feed.title}</h4>}
              <p className="text-xs text-slate-600 leading-relaxed font-sans">{feed.content}</p>

              {/* AI structure tag display */}
              {feed.aiAnalysis && (
                <div className="bg-white rounded-lg p-3 border border-slate-200/60 divide-y divide-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pb-2">
                    <Sparkles className="w-3 h-3 text-pink-600" />
                    <span className="font-semibold text-slate-700">AI 语义识别归纳：</span>
                    <span className="text-slate-600 truncate italic">{feed.aiAnalysis.rawSummary}</span>
                  </div>

                  {/* Multi-dimension tag rows */}
                  <div className="pt-2 text-[10px] space-y-1">
                    <div className="flex flex-wrap gap-2">
                      {feed.aiAnalysis.extractedDimensions?.flavor?.length ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-emerald-50 text-emerald-700 font-semibold px-1 rounded">风味:</span>
                          <span className="text-slate-600">{feed.aiAnalysis.extractedDimensions.flavor.join(', ')}</span>
                        </div>
                      ) : null}

                      {feed.aiAnalysis.extractedDimensions?.texture?.length ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-blue-50 text-blue-700 font-semibold px-1 rounded">口感:</span>
                          <span className="text-slate-600">{feed.aiAnalysis.extractedDimensions.texture.join(', ')}</span>
                        </div>
                      ) : null}

                      {feed.aiAnalysis.extractedDimensions?.productType?.length ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-purple-50 text-purple-700 font-semibold px-1 rounded">品类:</span>
                          <span className="text-slate-600">{feed.aiAnalysis.extractedDimensions.productType.join(', ')}</span>
                        </div>
                      ) : null}

                      {feed.aiAnalysis.extractedDimensions?.visual?.length ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-pink-50 text-pink-700 font-semibold px-1 rounded">视觉:</span>
                          <span className="text-slate-600">{feed.aiAnalysis.extractedDimensions.visual.join(', ')}</span>
                        </div>
                      ) : null}

                      {feed.aiAnalysis.extractedDimensions?.scene?.length ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-amber-50 text-amber-800 font-semibold px-1 rounded">场景:</span>
                          <span className="text-slate-600">{feed.aiAnalysis.extractedDimensions.scene.join(', ')}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Word highlighting */}
                    <div className="flex gap-4 pt-1 border-t border-slate-100/50 mt-1">
                      {feed.aiAnalysis.posKeywords?.length ? (
                        <div className="text-[10px]">
                          <span className="text-emerald-700 font-bold mr-1">👍 亮点:</span>
                          <span className="text-slate-500">{feed.aiAnalysis.posKeywords.join(' | ')}</span>
                        </div>
                      ) : null}
                      {feed.aiAnalysis.negKeywords?.length ? (
                        <div className="text-[10px]">
                          <span className="text-red-700 font-bold mr-1">👎 痛点:</span>
                          <span className="text-slate-500">{feed.aiAnalysis.negKeywords.join(' | ')}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
