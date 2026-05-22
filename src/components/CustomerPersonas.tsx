import React, { useState } from 'react';
import { CustomerPersona, KeywordTrend } from '../types';
import { 
  Users, Sparkles, TrendingUp, AlertCircle, ShoppingBag, Compass,
  ChevronRight, Brain, User, DollarSign, PieChart, Volume2, ShieldAlert
} from 'lucide-react';

interface CustomerPersonasProps {
  personas: CustomerPersona[];
  trends: KeywordTrend[];
  onGeneratePersona: (keyword: string, demographic: string) => Promise<void>;
  isGenerating: boolean;
}

export default function CustomerPersonas({
  personas,
  trends,
  onGeneratePersona,
  isGenerating
}: CustomerPersonasProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(personas[0]?.id || null);
  const [targetTrend, setTargetTrend] = useState<string>(trends[0]?.keyword || '');
  const [customSegment, setCustomSegment] = useState<string>('Z世代潮酷极客');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedPersona = personas.find(p => p.id === selectedPersonaId) || personas[0];

  // Predefined target demographic presets
  const demographicPresets = [
    'Z世代潮酷极客',
    '格子间精致白领',
    '中式新潮养生朋克',
    '都市高净值辣妈',
    '银发精致慢品养生族',
    '校园轻卡拼单党'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTrend || !customSegment) return;
    try {
      await onGeneratePersona(targetTrend, customSegment);
      setSuccessMsg('✨ 消费者画像已成功由 AI 研判出炉，并已同步载入画像库！');
      // Auto select the newly generated persona (usually unshifted to index 0)
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
    } catch (err) {
      console.error(err);
    }
  };

  // Callback to select persona easily
  const selectPersona = (id: string) => {
    setSelectedPersonaId(id);
  };

  // Watch for changes in personas top element to automatically focus
  React.useEffect(() => {
    if (personas.length > 0) {
      setSelectedPersonaId(personas[0].id);
    }
  }, [personas.length]);

  return (
    <div className="space-y-6" id="consumer-personas-container">
      {/* Top Narrative Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            客群画像探析 (Consumer Personas)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            结合全网社交文本数据与内部交易数据，通过 AI 逆向聚类生成细分消费者画像，指导精准研发与场景化营销推广。
          </p>
        </div>

        {/* Global summary count badges */}
        <div className="flex gap-3 self-start md:self-auto">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="block text-xs text-indigo-600 font-medium">画像建库数</span>
            <span className="text-lg font-bold text-indigo-900">{personas.length} 组</span>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="block text-xs text-emerald-600 font-medium">覆盖年龄层</span>
            <span className="text-sm font-bold text-emerald-950 mt-1 block">18-35岁大势</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <span className="block text-xs text-amber-600 font-medium">核心驱动模型</span>
            <span className="text-sm font-bold text-amber-950 mt-1 block">五维价值偏好</span>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hand: Catalog & Fast Generation Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Generator Panel */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -translate-y-12 translate-x-12 -z-0 opacity-40"></div>
            
            <div className="relative z-10">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                <Brain className="w-4 h-4 text-indigo-600" />
                独家 AI 圈层画像研判
              </h2>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                输入指定的热点词汇，选择想要击穿的垂直消费客群圈层，AI 将实时沙盘演练该客群对此风尚的喜好阈值与抗拒痛点。
              </p>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Select target trend */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    1. 锚定爆款风潮 (Keyword)
                  </label>
                  <select
                    value={targetTrend}
                    onChange={(e) => setTargetTrend(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="" disabled>请选择关联的流行热点词</option>
                    {trends.map(t => (
                      <option key={t.id} value={t.keyword}>
                        {t.keyword.split(' ')[0]} ({t.lifecycle})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Predefined segment options */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    2. 目标客群定位 (Demographic)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {demographicPresets.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomSegment(preset)}
                        className={`text-[11px] font-medium text-left px-2.5 py-1.5 rounded-lg border transition-all ${
                          customSegment === preset
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isGenerating || !targetTrend}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-lg shadow-xs hover:shadow-md transition-all mt-4"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>AI正在开展人群聚类沙盘测算...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                      <span>开展 AI 圈层画像研判</span>
                    </>
                  )}
                </button>
              </form>

              {successMsg && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-emerald-700 flex items-start gap-1.5 animate-bounce">
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Catalog Selection List */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
              <span>画像馆主目录 ({personas.length})</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 font-normal px-1.5 py-0.5 rounded-full">标签聚类</span>
            </h2>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {personas.map(p => {
                const isActive = p.id === selectedPersona?.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPersona(p.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-indigo-50/50 border-indigo-100 ring-1 ring-indigo-500/20'
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg shadow-xs">
                        {p.avatar}
                      </div>
                      <div>
                        <div className={`text-xs font-bold transition-all ${isActive ? 'text-indigo-950' : 'text-gray-700 group-hover:text-indigo-600'}`}>
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {p.ageGroup} · {p.incomeLevel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-gray-400 group-hover:text-indigo-500 transition-all">
                      <span className={`text-[10px] font-mono capitalize px-1.5 py-0.5 rounded-full ${
                        p.spendingTrend === 'premium' 
                          ? 'bg-purple-50 text-purple-600' 
                          : p.spendingTrend === 'balanced' 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'bg-amber-50 text-amber-600'
                      }`}>
                        {p.spendingTrend === 'premium' ? '品位款' : p.spendingTrend === 'balanced' ? '性价比' : '特价款'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Hand: Deep Analysis ID Card Visualizer */}
        <div className="lg:col-span-7">
          {selectedPersona ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="persona-id-card-sheet">
              {/* Card visual banner */}
              <div className="bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 text-white relative">
                <div className="absolute top-0 right-0 p-3 text-[10px] font-mono text-indigo-300 pointer-events-none uppercase tracking-wider">
                  AI-Assigned Profile ID: {selectedPersona.id}
                </div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3.5xl border border-white/20 shadow-inner">
                    {selectedPersona.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-white tracking-tight">{selectedPersona.name}</h2>
                      <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full tracking-wider font-semibold border ${
                        selectedPersona.spendingTrend === 'premium'
                          ? 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                          : selectedPersona.spendingTrend === 'balanced'
                            ? 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                            : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                      }`}>
                        {selectedPersona.spendingTrend === 'premium' ? '高溢价高感偏好' : selectedPersona.spendingTrend === 'balanced' ? '均衡性消费' : '实用极简'}
                      </span>
                    </div>
                    {/* Demographics details grids */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-200 mt-1.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-300" />
                        性别分布: {selectedPersona.genderDistribution}
                      </span>
                      <span>•</span>
                      <span>年龄层: {selectedPersona.ageGroup}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <DollarSign className="w-3 h-3 text-indigo-300" />
                        商圈客单: {selectedPersona.incomeLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="p-6 space-y-5">
                
                {/* 1. Demographics narrative quote block */}
                <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-xl">
                  <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-slate-600" />
                    客群心智综合画像叙事 (Portrait Narrative)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    “{selectedPersona.aiDescription}”
                  </p>
                </div>

                {/* 2. Purchasing Decision Drivers weight mapping */}
                <div>
                  <h3 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1">
                    <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                    核心选品决策因子权重 (Five-dimensional Decision Drivers)
                  </h3>
                  
                  <div className="space-y-2 font-mono">
                    {/* Health Weight */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-gray-700 mb-0.5">
                        <span>🥬 纯天然减糖度 (Health Focus)</span>
                        <span>{selectedPersona.purchasingDrivers.health}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${selectedPersona.purchasingDrivers.health}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Flavor Weight */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-gray-700 mb-0.5">
                        <span>👅 风味饱满还原 (Flavor/Taste Experience)</span>
                        <span>{selectedPersona.purchasingDrivers.flavor}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                          style={{ width: `${selectedPersona.purchasingDrivers.flavor}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Visual Weight */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-gray-700 mb-0.5">
                        <span>📸 颜值美学出片率 (Aesthetics/Packaging)</span>
                        <span>{selectedPersona.purchasingDrivers.visual}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-pink-500 rounded-full transition-all duration-1000"
                          style={{ width: `${selectedPersona.purchasingDrivers.visual}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Price Weight */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-gray-700 mb-0.5">
                        <span>💰 性价比/团购敏感 (Value Sensitivity)</span>
                        <span>{selectedPersona.purchasingDrivers.price}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                          style={{ width: `${selectedPersona.purchasingDrivers.price}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Convenience Weight */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-gray-700 mb-0.5">
                        <span>🚀 配送即达/场景饱腹 (Convenience & Fulfillment)</span>
                        <span>{selectedPersona.purchasingDrivers.convenience}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${selectedPersona.purchasingDrivers.convenience}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Taste, Texture preferences & Painpoints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Preferences card block */}
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                      风味/口感诉求倾向
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="block text-[10px] text-gray-500 font-medium mb-1">精选偏好味系 (Flavor Likes)</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPersona.flavorPreferences.map((f, idx) => (
                            <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] text-gray-500 font-medium mb-1">口感咬感嗜好 (Texture Likes)</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPersona.texturePreferences.map((t, idx) => (
                            <span key={idx} className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scenes and hurdles block */}
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                      场景契机与决策壁垒
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <span className="block text-[10px] text-gray-500 font-medium mb-1">主打消费场景 (Best Scene)</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPersona.preferredScenes.map((s, idx) => (
                            <span key={idx} className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] text-gray-500 font-medium mb-1">雷区痛点 (Risk Hurdles)</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPersona.painPoints.map((p, idx) => (
                            <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                              <ShieldAlert className="w-3 h-3 text-rose-400 flex-shrink-0" />
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 4. Preferred mediums/channels */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
                  <span className="text-gray-500 font-medium">首选触达媒介/销售端点 (Channels):</span>
                  <div className="flex items-center gap-2">
                    {selectedPersona.preferredChannels.map((ch, idx) => (
                      <span key={idx} className="font-semibold bg-slate-100 text-slate-800 rounded-md px-2.5 py-1 text-[10px]">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="h-[400px] bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <Users className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-xs">请在左侧目录选择一个客群研究组，以渲染其深度雷达细节。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
