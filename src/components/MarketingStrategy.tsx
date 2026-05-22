import React, { useState } from 'react';
import { MarketingStrategyProposal } from '../types';
import { 
  Sparkles, Megaphone, Coffee, Target, ArrowRight, Share2, 
  Copy, Check, FileText, Compass, BadgeCheck, Zap, Loader2
} from 'lucide-react';

interface MarketingStrategyProps {
  onGenerateStrategy: (keyword: string, audience: string) => Promise<MarketingStrategyProposal | null>;
  isGenerating: boolean;
  selectedDefaultKeyword?: string;
}

export default function MarketingStrategy({
  onGenerateStrategy,
  isGenerating,
  selectedDefaultKeyword = "开心果"
}: MarketingStrategyProps) {
  const [keywordInput, setKeywordInput] = useState(selectedDefaultKeyword);
  const [selectedAudience, setSelectedAudience] = useState('一二线年轻白领 / 下午茶解压群体');
  const [proposal, setProposal] = useState<MarketingStrategyProposal | null>(null);

  const [activeTab, setActiveTab] = useState<'product' | 'copy' | 'event'>('product');
  const [copiedText, setCopiedText] = useState(false);

  const predefinedKeywords = ['开心果 (Pistachio)', '陈皮红豆 (Aged Peel)', '糯叽叽 (Soft & Chewy)', '精致法式司康', '冰爽沙沙 (Frosty)'];
  const audiences = [
    '一二线年轻白领 / 下午茶解压群体',
    'Z世代尝鲜少年 / 潮流探店自拍党',
    '低脂肪低热能健身狂热者 / 轻养生人群',
    '中产精致宝妈 / 低糖原健康代餐需求'
  ];

  const handleGenerate = async () => {
    const res = await onGenerateStrategy(keywordInput, selectedAudience);
    if (res) {
      setProposal(res);
      setActiveTab('product'); // Default page
    }
  };

  const copyProposalToClipboard = () => {
    if (!proposal) return;
    const bodyStr = `
【爆款企划】${proposal.title}
【聚焦热词】${proposal.targetKeyword} | 【目标群体】${proposal.targetAudience}

[研发风味定位]：${proposal.productBrief.flavorSuggestion}
[研发口感设计]：${proposal.productBrief.textureSuggestion}
[视觉设计包装]：${proposal.productBrief.visualDesign}
[零售价建议]：${proposal.productBrief.pricingEstimate}

[小红书种草标题]：${proposal.socialCampaignCopy.xiaohongshuTitle}
[小红书种草正文]：${proposal.socialCampaignCopy.xiaohongshuBody}

[营销活动主题]：${proposal.eventPlanning.theme}
[促销设计机制]：${proposal.eventPlanning.promotions}
[KOL投放配比]：${proposal.eventPlanning.kolTypes.join(', ')}

[ROI测算效果预测]：${proposal.predictedOutcome}
    `;
    navigator.clipboard.writeText(bodyStr);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6" id="marketing_strategy_view">
      
      {/* Configuration Input cards */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-indigo-600" />
            AI 智能营销策略与内容生成工坊 (Tactical Marketing Generator)
          </h3>
          <p className="text-[11px] text-slate-400">选择爆发热点，瞄准特征客群。AI 自动定制符合目标平台推荐因子的文案，提供一碗端产品、视觉、投放融合配方的企划建议书。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          {/* Col 1: Trend Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">1. 选择爆破热度词</label>
            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
              {predefinedKeywords.map(k => {
                const isSelected = keywordInput.includes(k.split(' ')[0]);
                return (
                  <div
                    key={k}
                    onClick={() => setKeywordInput(k.split(' ')[0])}
                    className={`p-2.5 border text-xs rounded-lg cursor-pointer transition flex items-center justify-between ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white font-bold' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-600'
                    }`}
                  >
                    <span>{k}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                );
              })}
            </div>
            
            <div>
              <input
                type="text"
                placeholder="或者输入你自己的词汇..."
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 focus:border-indigo-500 rounded-lg outline-hidden"
              />
            </div>
          </div>

          {/* Col 2: Audience Target Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">2. 瞄准目标细分客群</label>
            <div className="space-y-1.5">
              {audiences.map(aud => (
                <div
                  key={aud}
                  onClick={() => setSelectedAudience(aud)}
                  className={`p-2 border rounded-lg cursor-pointer transition text-[11px] ${
                    selectedAudience === aud 
                      ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {aud}
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Strategy summary card */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2 text-slate-600 text-xs leading-normal">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">配方企划规格</span>
              <div>
                • <strong>产品配方设计</strong>: 口感、流心与健康比调谐
              </div>
              <div>
                • <strong>小红书双轨文案</strong>: 标题抓取 + 高种草力文案
              </div>
              <div>
                • <strong>活动线下引流</strong>: 裂变机制 + 主题快闪活动配套
              </div>
              <div>
                • <strong>KOL 组合投放</strong>: 头腰小红书/抖音KOL合理占比
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !keywordInput.trim()}
              className="w-full text-xs font-semibold bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  CMO大脑正在深度构思中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  智能生成全链路企划方案
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main output displaying AI Strategy Proposal */}
      {proposal ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id="strategy_proposal_panel">
          
          {/* Header of Strategy proposal */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded uppercase">
                  AI Brand Planner
                </span>
                <span className="text-[11px] font-mono text-slate-400">PROPOSAL-ID: {proposal.id}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {proposal.title}
              </h3>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyProposalToClipboard}
                className="text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                    已复制方案
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    一键复制完整企划书
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active segments navigation tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {[
              { id: 'product', label: '① 研发与产品策略 (R&D Recipe)', icon: <Coffee className="w-4 h-4" /> },
              { id: 'copy', label: '② 内容营销文案 (Social Copy)', icon: <Megaphone className="w-4 h-4" /> },
              { id: 'event', label: '③ 裂变活动与投放 (Campaign)', icon: <Compass className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs px-4 py-3 font-semibold transition flex items-center gap-1.5 border-b-2 outline-hidden cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content display based on active tabs */}
          <div className="p-6">
            
            {activeTab === 'product' && (
              <div className="space-y-6" id="strategy_tab_product">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1 mb-2">
                      <span className="w-1.5 h-3 bg-emerald-500 rounded"></span>
                      建议风味调和配方
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{proposal.productBrief.flavorSuggestion}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1 mb-2">
                      <span className="w-1.5 h-3 bg-blue-500 rounded"></span>
                      口感质地工艺改良
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{proposal.productBrief.textureSuggestion}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1 mb-2">
                      <span className="w-1.5 h-3 bg-pink-500 rounded"></span>
                      视觉彩套与包装构想
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{proposal.productBrief.visualDesign}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1 mb-2">
                      <span className="w-1.5 h-3 bg-amber-500 rounded"></span>
                      毛定核价与客单区间
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{proposal.productBrief.pricingEstimate}</p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
                  <BadgeCheck className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">大颗粒风味及情感推荐指数提示：</strong>
                    该产品结构精准打击了目标消费者关于“{proposal.targetKeyword}”的高级和解压诉求，在规避竞品干硬掉渣的基础上合理融合视觉美感，研发风险系数极低。
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'copy' && (
              <div className="space-y-6" id="strategy_tab_copy">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Xiaohongshu copy */}
                  <div className="lg:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                        📕 小红书爆文双轨模板 (Copy Paste Available)
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-150 text-xs text-slate-900 font-bold leading-normal">
                        🍉 标题：{proposal.socialCampaignCopy.xiaohongshuTitle}
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-150 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">
                        {proposal.socialCampaignCopy.xiaohongshuBody}
                      </div>
                    </div>
                  </div>

                  {/* Douyin video structure */}
                  <div className="lg:col-span-1 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="pb-2 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Zap className="w-4 h-4 text-purple-600" />
                      抖音15秒视频流创意
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400">镜头分镜与运镜</span>
                        <p className="text-slate-600">{proposal.socialCampaignCopy.douyinVideoConcept}</p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        <span className="block text-[10px] font-bold text-slate-400">首秒爆爽钩子口播词 (Hooks)</span>
                        {proposal.socialCampaignCopy.douyinHookLines.map((hook, idx) => (
                          <div key={idx} className="bg-purple-50 border border-purple-100 text-purple-950 p-2 rounded-md font-mono text-[11px] font-semibold leading-tight">
                            “{hook}”
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'event' && (
              <div className="space-y-6" id="strategy_tab_event">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">线上线下营销活动主题</span>
                    <h5 className="font-bold text-xs text-slate-800 leading-tight">{proposal.eventPlanning.theme}</h5>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">推荐合作KOL类型配比</span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {proposal.eventPlanning.kolTypes.map((kType, i) => (
                        <span key={i} className="text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded">
                          {kType}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">裂变促销折扣折扣机制</span>
                    <p className="text-xs text-slate-600 font-sans">{proposal.eventPlanning.promotions}</p>
                  </div>
                </div>

                <div className="bg-slate-900 text-indigo-200 rounded-xl p-5 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">AI ROI 综合效能评估测算预测：</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {proposal.predictedOutcome}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
          选择左上侧首款关注词，点击“智能生成全链路企划方案”按钮，即可在这里产出一站式品牌爆款企划书。
        </div>
      )}

    </div>
  );
}
