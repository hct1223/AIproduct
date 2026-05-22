import React, { useState, useEffect } from 'react';
import { KeywordTrend, ScrapedDataFeed, CompetitorBrand, IntelligenceReport, EnterpriseDataUpload, MarketingStrategyProposal, CustomerPersona } from './types';
import Dashboard from './components/Dashboard';
import DataIngestion from './components/DataIngestion';
import ReportCenter from './components/ReportCenter';
import MarketingStrategy from './components/MarketingStrategy';
import CompetitorMonitor from './components/CompetitorMonitor';
import CustomerPersonas from './components/CustomerPersonas';
import AiChat from './components/AiChat';
import { 
  BarChart3, Database, FileText, Megaphone, Compass, 
  HelpCircle, Coffee, Sparkles, Loader2, AlertCircle, RefreshCw, Users
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingestion' | 'reports' | 'marketing' | 'competitors' | 'personas' | 'chat'>('dashboard');

  // Backend state databases
  const [trends, setTrends] = useState<KeywordTrend[]>([]);
  const [feeds, setFeeds] = useState<ScrapedDataFeed[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorBrand[]>([]);
  const [uploads, setUploads] = useState<EnterpriseDataUpload[]>([]);
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [personas, setPersonas] = useState<CustomerPersona[]>([]);

  // Selection state for seamless cross-tab strategy generation
  const [strategyKeyword, setStrategyKeyword] = useState<string>("开心果");

  // Loading & Action state boundaries
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAnalyzingFeed, setIsAnalyzingFeed] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch full dataset on launch with enhanced resilience against partial failure OR startup delays
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const fetchHelper = async (url: string, fallback: any) => {
        try {
          const r = await fetch(url);
          if (!r.ok) {
            console.warn(`[API Warn] ${url} returned status ${r.status}`);
            return fallback;
          }
          const contentType = r.headers.get("Content-Type") || "";
          if (!contentType.includes("application/json")) {
            console.warn(`[API Warn] ${url} returned non-JSON contentType: ${contentType}`);
            return fallback;
          }
          return await r.json();
        } catch (e) {
          console.error(`[API Error] Failed fetching ${url}:`, e);
          return fallback;
        }
      };

      const [trendsRes, feedsRes, competitorsRes, uploadsRes, reportsRes, personasRes] = await Promise.all([
        fetchHelper('/api/analytics/trends', { status: 'success', data: [] }),
        fetchHelper('/api/analytics/feeds', { status: 'success', data: [] }),
        fetchHelper('/api/analytics/competitors', { status: 'success', data: [] }),
        fetchHelper('/api/analytics/enterprise', { status: 'success', data: [] }),
        fetchHelper('/api/analytics/reports', { status: 'success', data: [] }),
        fetchHelper('/api/analytics/personas', { status: 'success', data: [] })
      ]);

      if (trendsRes && trendsRes.status === 'success') setTrends(trendsRes.data);
      if (feedsRes && feedsRes.status === 'success') setFeeds(feedsRes.data);
      if (competitorsRes && competitorsRes.status === 'success') setCompetitors(competitorsRes.data);
      if (uploadsRes && uploadsRes.status === 'success') setUploads(uploadsRes.data);
      if (reportsRes && reportsRes.status === 'success') setReports(reportsRes.data);
      if (personasRes && personasRes.status === 'success') setPersonas(personasRes.data);

    } catch (err: any) {
      console.error("Failed to load backend system parameters:", err);
      setErrorMessage("服务器网络连接可能由于启动延迟尚未完全就绪，请尝试刷新。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler: Generate dynamic customer portrait via Gemini AI
  const handleGeneratePersona = async (keyword: string, demographic: string) => {
    try {
      setIsGeneratingPersona(true);
      const res = await fetch('/api/analytics/personas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, demographic })
      }).then(r => r.json());

      if (res.status === 'success') {
        const updatedPersonas = await fetch('/api/analytics/personas').then(r => r.json());
        if (updatedPersonas.status === 'success') {
          setPersonas(updatedPersonas.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  // Handler: Manually trigger simulated consumer feedback bursts
  const handleSimulateTrendBoost = async (keyword: string) => {
    try {
      setIsSimulating(true);
      const res = await fetch('/api/analytics/trends/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, dimension: 'flavor', simulatedIncrease: 120 })
      }).then(r => r.json());

      if (res.status === 'success') {
        // Refetch newest states
        const updatedTrends = await fetch('/api/analytics/trends').then(r => r.json());
        if (updatedTrends.status === 'success') {
          setTrends(updatedTrends.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Submit consumer feedback to Gemini AI sentiment + fine-grained segment parser
  const handleAnalyzeNewComment = async (platform: string, content: string, author: string): Promise<boolean> => {
    try {
      setIsAnalyzingFeed(true);
      const res = await fetch('/api/analytics/analyze-feed-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, content, author })
      }).then(r => r.json());

      if (res.status === 'success') {
        const updatedFeeds = await fetch('/api/analytics/feeds').then(r => r.json());
        if (updatedFeeds.status === 'success') {
          setFeeds(updatedFeeds.data);
        }
        
        // Also update trends, as new keywords might be created or volumes affected
        const updatedTrends = await fetch('/api/analytics/trends').then(r => r.json());
        if (updatedTrends.status === 'success') {
          setTrends(updatedTrends.data);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsAnalyzingFeed(false);
    }
  };

  // Handler: Ingest corporate CSV summaries
  const handleUploadEnterpriseData = async (
    dataType: 'POS' | 'CRM' | 'MiniProgram' | 'CustomerComplaint',
    title: string,
    count: number,
    summary: string
  ) => {
    try {
      const res = await fetch('/api/analytics/upload-enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataType, title, recordCount: count, summary })
      }).then(r => r.json());

      if (res.status === 'success') {
        const updatedUploads = await fetch('/api/analytics/enterprise').then(r => r.json());
        if (updatedUploads.status === 'success') {
          setUploads(updatedUploads.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Generate Intelligence Business Reports with Gemini
  const handleGenerateNewReport = async (
    type: 'daily' | 'weekly' | 'monthly' | 'special_alert',
    focalKeywords: string[]
  ): Promise<boolean> => {
    try {
      setIsGeneratingReport(true);
      const res = await fetch('/api/analytics/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: type, focalKeywords })
      }).then(r => r.json());

      if (res.status === 'success') {
        const updatedReports = await fetch('/api/analytics/reports').then(r => r.json());
        if (updatedReports.status === 'success') {
          setReports(updatedReports.data);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handler: Propose fully optimized tactical planning via Gemini
  const handleGenerateMarketingStrategy = async (
    keyword: string,
    audience: string
  ): Promise<MarketingStrategyProposal | null> => {
    try {
      setIsGeneratingStrategy(true);
      const res = await fetch('/api/analytics/strategies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, audience })
      }).then(r => r.json());

      if (res.status === 'success') {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // Quick cross-tab shortcut to jump to strategy workbench with preset keyword
  const handleSelectKeywordForStrategy = (keyword: string) => {
    const cleanWord = keyword.split(' ')[0];
    setStrategyKeyword(cleanWord);
    setActiveTab('marketing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          正在加载食品行研商情分析雷达大盘...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 border-t-4 border-slate-900 flex flex-col md:flex-row">
      
      {/* 📱 Mobile Top Header & Horizontal Swiper (Shown ONLY on mobile screens) */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="bg-slate-900 text-white p-1 rounded">
              <Coffee className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-bold text-xs text-slate-900 tracking-tight">食品商情洞察与趋势分析系统</span>
          </div>
          <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">AI-Powered</span>
        </div>
        
        <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none snap-x" id="mobile_integrations_tabs">
          {[
            { id: 'dashboard', label: '大盘红警', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'ingestion', label: '采集沙盒', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'reports', label: '情报报告', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'marketing', label: '爆款策划', icon: <Megaphone className="w-3.5 h-3.5" /> },
            { id: 'competitors', label: '竞品监测', icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'personas', label: '客户画像', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'chat', label: 'AI智脑对话', icon: <Sparkles className="w-3.5 h-3.5" /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 flex items-center gap-1 cursor-pointer shrink-0 snap-start ${
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 🧭 Desktop Sidebar Navigation (Sticky on Desktop, Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col justify-between sticky top-0 h-screen shrink-0">
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Logo Heading & Context */}
          <div className="p-5 border-b border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 text-white p-1.5 rounded-lg shrink-0">
                <Coffee className="w-5 h-5 text-amber-400" />
              </div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight font-display">
                食品商情洞察与趋势
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              多源全天候采集 · 深度风味口感挖掘 · 秒级商情自动研判与红警
            </p>
            <div className="pt-1 select-none">
              <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                AI-Powered 旗舰版
              </span>
            </div>
          </div>

          {/* Desktop Tab Selection Grid Rendered Vertically */}
          <nav className="flex-1 p-4 space-y-1.5">
            <span className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2 select-none">
              系统功能导航菜单
            </span>
            {[
              { id: 'dashboard', label: '① 趋势红警大盘', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'ingestion', label: '② 多源采集与 AI 沙盒', icon: <Database className="w-4 h-4" /> },
              { id: 'reports', label: '③ 情报报告中心', icon: <FileText className="w-4 h-4" /> },
              { id: 'marketing', label: '④ 智能爆款策划', icon: <Megaphone className="w-4 h-4" /> },
              { id: 'competitors', label: '⑤ 竞品动态监测', icon: <Compass className="w-4 h-4" /> },
              { id: 'personas', label: '⑥ 消费者客群画像', icon: <Users className="w-4 h-4" /> },
              { id: 'chat', label: '⑦ AI 智脑对话中心', icon: <Sparkles className="w-4 h-4" /> }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-xs font-semibold py-3 px-3.5 rounded-xl transition duration-150 flex items-center gap-3 outline-hidden cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Desktop Sidebar Bottom Stats */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
          <div className="text-[10px] space-y-1 text-slate-500 font-medium select-none">
            <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200/60 shadow-2xs">
              <span>雷达库主维度:</span>
              <span className="text-slate-900 font-mono font-bold">{trends.length} 维标签</span>
            </div>
            <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200/60 shadow-2xs">
              <span>社媒监测语料:</span>
              <span className="text-slate-900 font-mono font-bold">{feeds.length} 原声</span>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            className="w-full text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="刷新全量数据库"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-hover" />
            一键刷新全盘数据
          </button>
        </div>
      </aside>

      {/* 🖥️ Right Pane (Main Area Content Scrollport) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Row on Desktop */}
        <header className="hidden md:flex items-center justify-between px-6 py-4.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-xs"></span>
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {activeTab === 'dashboard' && '趋势红警大盘 · FLAVOR BUZZ DIAGNOSTICS'}
              {activeTab === 'ingestion' && '多源采集与 AI 沙盒 · MULTI-SOURCE INGESTOR'}
              {activeTab === 'reports' && '情报报告中心 · ANALYTIC INTELLIGENCE'}
              {activeTab === 'marketing' && '智能爆款策划 · TACTICAL GENERATOR'}
              {activeTab === 'competitors' && '竞品动态监测 · COMPETITOR TRACKING'}
              {activeTab === 'personas' && '消费者客群画像 · CONSUMER PERSONAS DECODER'}
              {activeTab === 'chat' && 'AI 智脑对话中心 · ANALYTIC AI COPILOT'}
            </h2>
          </div>
          
          <div className="text-slate-400 text-[10px] font-mono flex items-center gap-4">
            <span>数据同步: <strong className="text-emerald-500 font-sans">LIVE</strong></span>
            <span>当前时区: 2026-05-22 UTC</span>
          </div>
        </header>

        {/* ⚠️ System level errors message alert */}
        {errorMessage && (
          <div className="px-6 mt-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">系统自检异常提示:</strong>
                <p className="text-xs text-amber-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Render child pages */}
        <main className="flex-grow px-4 md:px-6 py-6" id="app_main_arena">
          {activeTab === 'dashboard' && (
            <Dashboard 
              trends={trends} 
              onSelectKeywordForStrategy={handleSelectKeywordForStrategy}
              onSimulateTrendBoost={handleSimulateTrendBoost}
              isSimulating={isSimulating}
            />
          )}

          {activeTab === 'ingestion' && (
            <DataIngestion 
              feeds={feeds}
              uploads={uploads}
              onAnalyzeNewComment={handleAnalyzeNewComment}
              onUploadEnterpriseData={handleUploadEnterpriseData}
              isAnalyzing={isAnalyzingFeed}
            />
          )}

          {activeTab === 'reports' && (
            <ReportCenter 
              reports={reports}
              onGenerateNewReport={handleGenerateNewReport}
              isGenerating={isGeneratingReport}
            />
          )}

          {activeTab === 'marketing' && (
            <MarketingStrategy 
              onGenerateStrategy={handleGenerateMarketingStrategy}
              isGenerating={isGeneratingStrategy}
              selectedDefaultKeyword={strategyKeyword}
            />
          )}

          {activeTab === 'competitors' && (
            <CompetitorMonitor 
              competitors={competitors}
            />
          )}

          {activeTab === 'personas' && (
            <CustomerPersonas 
              personas={personas}
              trends={trends}
              onGeneratePersona={handleGeneratePersona}
              isGenerating={isGeneratingPersona}
            />
          )}

          {activeTab === 'chat' && (
            <AiChat />
          )}
        </main>

        {/* Footnotes */}
        <footer className="bg-white border-t border-slate-200 py-3.5 px-6 shrink-0 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>© 2026 AI 食品商情洞察先锋雷达系统</span>
            <span className="mx-2 hidden sm:inline">|</span>
            <span className="hidden sm:inline">遵守《个人信息保护法》，仅对公开发表原声进行清洗融合。</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>系统状态: OK</span>
            <span>接口端口: 3000</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
