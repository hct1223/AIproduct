import React from 'react';
import { CompetitorBrand } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShieldAlert, ThumbsDown, Award, TrendingUp, BarChart3, AlertCircle, Sparkles, Zap } from 'lucide-react';

interface CompetitorMonitorProps {
  competitors: CompetitorBrand[];
}

export default function CompetitorMonitor({ competitors }: CompetitorMonitorProps) {

  // Map and reshape comparison ratings
  const comparisonData = competitors.map(comp => ({
    name: comp.brandName.split(' ')[0],
    "口味/美味度": comp.scoreComparison.taste,
    "优质服务": comp.scoreComparison.service,
    "环境出片率": comp.scoreComparison.environment,
    "性价比 / VFM": comp.scoreComparison.valueForMoney
  }));

  // Add our own mock brand for reference
  const fullComparisonData = [
    {
      name: "本品牌 (Our Brand)",
      "口味/美味度": 8.7,
      "优质服务": 8.9,
      "环境出片率": 8.4,
      "性价比 / VFM": 8.2
    },
    ...comparisonData
  ];

  return (
    <div className="space-y-6" id="competitor_monitor_view">
      
      {/* Visual Bar Comparison grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col 2 tabs: Chart comparison */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              品牌硬实力四维雷达数据对比 (Competitive Scoring Radar)
            </h3>
            <p className="text-[11px] text-slate-400">基于美团点评、饿了么及客服投诉文本进行情感极性回归后的综合评分（满分 10.0）</p>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fullComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="口味/美味度" fill="#6366f1" />
                <Bar dataKey="优质服务" fill="#22c55e" />
                <Bar dataKey="环境出片率" fill="#ec4899" />
                <Bar dataKey="性价比 / VFM" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Tab: Fast insights card */}
        <div className="lg:col-span-1 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI 竞争动态情报要点</span>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-slate-700">焙感心动 司康工艺大改良</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">上线「浓浓开心果软司康」，针对传统硬干司康进行了持水率工艺调整，评分飙升至 4.7 分，分流我市约 18% 烘焙客流量。</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <Award className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-slate-700">拾光古风 汉砖模压印设计</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">推出「陈皮红豆流心砖酥」，将视觉艺术（国潮国风雕纹）与中式养生完美融合，国潮爱好者复购极高。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-150 rounded-lg p-3 text-[10px] text-amber-900 leading-normal flex gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>提醒：美团评分显示，我市消费者对新品“古风干司康”的评价较干涩，建议市场部研究「焙感心动」的“外酥里湿持水工艺”以提升复购。</span>
          </div>
        </div>

      </div>

      {/* Competitors active list */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          竞品新上市单品名录与用户痛点挖掘 (Auto Discovery Monitor)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitors.map(comp => (
            <div key={comp.id} className="border border-slate-200/85 rounded-xl p-4 bg-slate-50/70 space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{comp.brandName}</h4>
                  <p className="text-[10px] text-slate-400">客单价水位: {comp.pricingRange} | 菜品数: {comp.activeDishesCount} 样</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-indigo-700 font-mono">
                    大盘评级 ★ {comp.avgRating}
                  </span>
                </div>
              </div>

              {/* Launched products detailed breakdown */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">近期新品发布雷达</span>
                
                {comp.newLaunchDishes.map((dish, dIdx) => (
                  <div key={dIdx} className="bg-white rounded-lg p-3 border border-slate-150 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="font-bold text-slate-800">{dish.name}</strong>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono">¥{dish.price}</span>
                        <span className="text-yellow-600 font-semibold font-mono">★ {dish.userRating}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {dish.keySellingPoints.map((sp, spIdx) => (
                        <span key={spIdx} className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                          ⭐ {sp}
                        </span>
                      ))}
                    </div>

                    {/* AI extracted pain points */}
                    <div className="bg-rose-50/60 border border-rose-100 rounded p-2 text-[10px] space-y-1">
                      <span className="font-bold text-rose-800 flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3 text-rose-500" />
                        AI 监测得出的用户评测痛点 (Customer Pain Points)
                      </span>
                      <ul className="text-rose-950 pl-2 list-disc list-inside space-y-0.5">
                        {dish.aiCustomerPainPoints.map((pain, pIdx) => (
                          <li key={pIdx}>{pain}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Campaigns */}
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
                <span className="font-bold block text-slate-600">最近进行中的KOL或社媒企划:</span>
                <ul className="pl-2 list-decimal list-inside text-slate-600">
                  {comp.recentKolCampaigns.map((camp, cIdx) => (
                    <li key={cIdx}>{camp}</li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
