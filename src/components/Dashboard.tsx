import React, { useState } from 'react';
import { KeywordTrend, TrendDimension } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, MessageSquare, ShieldAlert, Award, Star, 
  Search, Eye, RefreshCw, BarChart2, Coffee, Zap, Layers, Sparkles 
} from 'lucide-react';

interface DashboardProps {
  trends: KeywordTrend[];
  onSelectKeywordForStrategy: (keyword: string) => void;
  onSimulateTrendBoost: (keyword: string) => void;
  isSimulating: boolean;
}

export default function Dashboard({ 
  trends, 
  onSelectKeywordForStrategy, 
  onSimulateTrendBoost,
  isSimulating 
}: DashboardProps) {
  const [selectedDimension, setSelectedDimension] = useState<TrendDimension | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeKeywordId, setActiveKeywordId] = useState<string | null>(trends[0]?.id || null);

  // Sub-dimension dictionary mapper
  const dimensionMeta: Record<TrendDimension, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    flavor: { label: '风味特征 (Flavor)', color: '#22c55e', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Coffee className="w-4 h-4" /> },
    texture: { label: '口感质地 (Texture)', color: '#3b82f6', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Layers className="w-4 h-4" /> },
    productType: { label: '产品品类 (Form)', color: '#a855f7', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: <BarChart2 className="w-4 h-4" /> },
    visual: { label: '视觉艺术 (Visual)', color: '#ec4899', bg: 'bg-pink-50 text-pink-700 border-pink-200', icon: <Sparkles className="w-4 h-4" /> },
    scene: { label: '消费场景 (Occasion)', color: '#eab308', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Zap className="w-4 h-4" /> }
  };

  // Filter trends based on search and selected dimension
  const filteredTrends = trends.filter(t => {
    const matchesDim = selectedDimension === 'all' || t.dimension === selectedDimension;
    const matchesSearch = t.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDim && matchesSearch;
  });

  // Hot alerts (>200% growth)
  const alarmTrends = trends.filter(t => t.warning);

  // Find active selected keyword details
  const activeKeyword = trends.find(t => t.id === activeKeywordId) || trends[0];

  const totalInternetVolume = trends.reduce((sum, t) => sum + t.volume, 0);
  const averageSentiment = Number((trends.reduce((sum, t) => sum + t.forecastSentiment, 0) / trends.length).toFixed(1));

  // Prepare chart data: top 10 by volume
  const chartData = [...filteredTrends]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8)
    .map(t => ({
      name: t.keyword.split(' ')[0],
      "声量指数": t.volume,
      "上期声量": t.prevVolume,
      "增长率 (YoY)": t.growthRate
    }));

  // Pie chart data for active keyword platform share
  const platformPieData = activeKeyword ? [
    { name: '小红书 (XHS)', value: activeKeyword.platformDistribution.xiaohongshu, color: '#ff2442' },
    { name: '抖音 (Douyin)', value: activeKeyword.platformDistribution.douyin, color: '#1c0b24' },
    { name: 'B站 (Bilibili)', value: activeKeyword.platformDistribution.bilibili, color: '#00a1d6' },
    { name: '美团点评', value: activeKeyword.platformDistribution.meituan, color: '#ffc300' }
  ] : [];

  // Sentiment chart data for active keyword
  const sentimentPieData = activeKeyword ? [
    { name: '正面声量', value: activeKeyword.sentimentPositive, color: '#22c55e' },
    { name: '中性反馈', value: activeKeyword.sentimentNeutral, color: '#94a3b8' },
    { name: '负面差评', value: activeKeyword.sentimentNegative, color: '#ef4444' }
  ] : [];

  return (
    <div className="space-y-6" id="dashboard_view">
      {/* 🚀 System Alerts Ribbon for Explosive Growth */}
      {alarmTrends.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 rounded-r-lg p-3 flex items-center justify-between shadow-xs animate-subtle-pulse">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 animate-pulse-alert"></span>
            </span>
            <span className="text-red-800 text-xs font-semibold uppercase tracking-wider bg-red-200 px-2 py-0.5 rounded">
              新趋势爆点预警 (Growth &gt; 200%)
            </span>
            <div className="text-red-700 text-xs md:text-sm">
              检测到 <strong>{alarmTrends.map(t => t.keyword.split(' ')[0]).join(', ')}</strong> 等词声量短周期呈飙升态势！市场抢滩窗口极窄。
            </div>
          </div>
          <div className="text-xs text-red-600 font-semibold cursor-pointer hover:underline hidden md:block">
            共 {alarmTrends.length} 类飙升极速响应
          </div>
        </div>
      )}

      {/* 🏆 Headline KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between" id="kpi_total_volume">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">全网监测声量总指数</div>
            <div className="text-2xl font-bold font-display text-slate-900">
              {totalInternetVolume.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">汇聚周级百万级文本动态数据</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between" id="kpi_explosive_spots">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">爆发式红警趋势数</div>
            <div className="text-2xl font-bold font-display text-red-600 flex items-center gap-1">
              {alarmTrends.length}
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-normal">
                极速窗口
              </span>
            </div>
            <div className="text-xs text-slate-400">环比增长率超 200% 的热点</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between" id="kpi_sentiment_rate">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">行业平均舆情好评率</div>
            <div className="text-2xl font-bold font-display text-emerald-600">
              {trends.length > 0 ? (trends.reduce((sum, t) => sum + t.sentimentPositive, 0) / trends.length).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-slate-400">排除恶意差评后的正向期待度</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between" id="kpi_average_sentiment">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">AI舆情感知平均评分</div>
            <div className="text-2xl font-bold font-display text-slate-900 flex items-center gap-1">
              {averageSentiment} <span className="text-xs text-slate-400">/ 10.0</span>
            </div>
            <div className="text-xs text-slate-400">多维度语义深度打分均值</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-500">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 📊 Main Chart & Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Interactive Trend Radar List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                互联网消费声量雷达
              </h3>
              <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                5D-Insights Enabled
              </span>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索风味、口感、或场景..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg outline-hidden transition"
              />
            </div>

            {/* Sub-dimension Filter Quick-row */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedDimension('all')}
                className={`text-[10px] px-2 py-1 rounded-md transition border ${
                  selectedDimension === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                全部
              </button>
              {(Object.keys(dimensionMeta) as TrendDimension[]).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedDimension(key)}
                  className={`text-[10px] px-2 py-1 rounded-md transition border flex items-center gap-1 ${
                    selectedDimension === key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {dimensionMeta[key].label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* List items scrollable container */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
            {filteredTrends.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                无匹配趋势指标，可切换过滤条件。
              </div>
            ) : (
              filteredTrends.map(item => {
                const isSelected = item.id === activeKeywordId;
                const isWarningRate = item.warning;
                const meta = dimensionMeta[item.dimension];

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveKeywordId(item.id)}
                    className={`p-3.5 text-left cursor-pointer transition flex items-start gap-3 border-l-3 ${
                      isSelected 
                        ? 'bg-slate-50/90 border-slate-900' 
                        : 'hover:bg-slate-50/50 border-transparent'
                    }`}
                  >
                    {/* Circle indicators */}
                    <div className="mt-1 flex-shrink-0">
                      <div className={`p-1.5 rounded-lg border ${meta.bg}`}>
                        {meta.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-slate-800 text-xs truncate max-w-[130px]" title={item.keyword}>
                          {item.keyword}
                        </span>
                        
                        {isWarningRate ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded animate-pulse">
                            爆发 {item.growthRate}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            +{item.growthRate}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-mono">大盘声量: {item.volume.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-100 px-1 rounded text-slate-600">
                            {item.lifecycle}
                          </span>
                          <span className="text-yellow-600 font-semibold flex items-center">
                            ★ {item.forecastSentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side 2-blocks: Top Trend Visualization and Detailed Feature Audit */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top block: Visual Volume Chart for selected scope */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">
                  热门声量风向标 (TOP 8 细分声量对比)
                </h3>
                <p className="text-[11px] text-slate-400">基于多渠道交互指数自动加权核算</p>
              </div>
              <div className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded">
                筛选结果共 {filteredTrends.length} 条
              </div>
            </div>

            <div className="h-[200px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="声量指数" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="上期声量" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  无充足声量数据支持图表渲染
                </div>
              )}
            </div>
          </div>

          {/* Bottom block: Advanced Multi-dimensional Sentiment Audit for ACTIVE keyword */}
          {activeKeyword ? (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 font-display">
                      {activeKeyword.keyword}
                    </span>
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                      dimensionMeta[activeKeyword.dimension].bg
                    }`}>
                      {dimensionMeta[activeKeyword.dimension].label.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    生命阶段: <span className="font-semibold text-indigo-600">{activeKeyword.lifecycle}</span> | 
                    未来数周好玩探路舆情潜力打分: <span className="font-semibold text-yellow-600">{activeKeyword.forecastSentiment} / 10.0</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectKeywordForStrategy(activeKeyword.keyword)}
                    className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    AI 智能爆款策划
                  </button>
                  <button
                    onClick={() => onSimulateTrendBoost(activeKeyword.keyword.split(' ')[0])}
                    disabled={isSimulating}
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    舆情灌入增强
                  </button>
                </div>
              </div>

              {/* Data visualizations of sub-distributions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Platform metrics */}
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-700 mb-2 self-start">
                    各社交及本地生活平台声量占比
                  </span>
                  <div className="w-full h-[120px] flex items-center gap-4">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={38}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {platformPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-1">
                      {platformPieData.map((plat, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: plat.color }}></span>
                            <span>{plat.name.split(' ')[0]}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">{plat.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sentiment distribution */}
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-700 mb-2 self-start flex justify-between w-full">
                    <span>AI 深度语义情感大方向测算</span>
                    <span className="text-emerald-700">{activeKeyword.sentimentPositive}% 正面</span>
                  </span>
                  <div className="w-full h-[120px] flex items-center gap-4">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={10}
                            outerRadius={38}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {sentimentPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-1">
                      {sentimentPieData.map((sent, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sent.color }}></span>
                            <span>{sent.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">{sent.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Focus Opportunities & Risks lists carefully mapped */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                    AI 开发创新机遇点 (Opportunities)
                  </span>
                  <ul className="text-[11px] text-emerald-900 space-y-1 pl-1 list-inside list-disc">
                    {activeKeyword.keyOpportunities.map((opp, i) => (
                      <li key={i} className="leading-relaxed">{opp}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-3 space-y-1.5">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    风控及负面规避点 (Risks & Bottlenecks)
                  </span>
                  <ul className="text-[11px] text-rose-950 space-y-1 pl-1 list-inside list-disc">
                    {activeKeyword.keyRisks.map((risk, i) => (
                      <li key={i} className="leading-relaxed">{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400 text-xs">
              点击列表中的消费趋势词，即可调阅详细的一站式深度商情看板
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
