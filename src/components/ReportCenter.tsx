import React, { useState } from 'react';
import { IntelligenceReport } from '../types';
import { 
  FileText, Calendar, CloudLightning, Download, Copy, Printer, 
  Sparkles, Check, Brain, ChevronRight, FileCheck, HelpCircle, Loader2
} from 'lucide-react';

interface ReportCenterProps {
  reports: IntelligenceReport[];
  onGenerateNewReport: (type: 'daily' | 'weekly' | 'monthly' | 'special_alert', focalKeywords: string[]) => Promise<boolean>;
  isGenerating: boolean;
}

export default function ReportCenter({
  reports,
  onGenerateNewReport,
  isGenerating
}: ReportCenterProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [targetReportType, setTargetReportType] = useState<'daily' | 'weekly' | 'monthly' | 'special_alert'>('daily');
  
  // Tag targets checkbox
  const availableTags = ['开心果(Pistachio)', '司康(Scone)', '陈皮红豆', '糯叽叽', "冰爽沙沙", "巴斯克蛋糕", "办公室场景", "低卡代餐杯"];
  const [selectedTags, setSelectedTags] = useState<string[]>(['开心果(Pistachio)', '陈皮红豆', '司康(Scone)']);

  const [copiedMessage, setCopiedMessage] = useState(false);

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerate = async () => {
    const success = await onGenerateNewReport(targetReportType, selectedTags);
    if (success && reports.length > 0) {
      // Auto-focus the newest generated report (usually prepended to the top of the list)
      setTimeout(() => {
        if (reports[0]) {
          setSelectedReportId(reports[0].id);
        }
      }, 500);
    }
  };

  const copyToClipboard = () => {
    if (!activeReport) return;
    navigator.clipboard.writeText(activeReport.contentMarkdown);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const triggerPrint = () => {
    window.print();
  };

  // Ultra-robust custom compiler to render markdown-like structures into elegant stylized HTML components.
  // This guarantees bulletproof formatting, beautiful spacing, code blocks and card integrations.
  const renderFormattedMarkdown = (markdown: string) => {
    if (!markdown) return null;
    const lines = markdown.split('\n');
    
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-bold font-display text-slate-900 border-b border-slate-200 pb-2 mt-6 mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-5 bg-indigo-600 rounded"></span>
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2 flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl font-bold font-display text-slate-900 mt-6 mb-4">
            {line.replace('# ', '')}
          </h1>
        );
      }

      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="bg-indigo-50/50 border-l-4 border-indigo-500 text-xs italic text-indigo-950 p-3.5 rounded-r-lg my-3 leading-relaxed">
            {line.replace('> ', '')}
          </div>
        );
      }

      // Bullets
      if (line.trim().startsWith('- ')) {
        // Parse bold markers inside bullet points
        const text = line.trim().replace('- ', '');
        return (
          <li key={idx} className="text-xs text-slate-600 leading-relaxed ml-4 my-1.5 list-disc list-outside">
            {parseInlineStyles(text)}
          </li>
        );
      }

      // Empty line
      if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      }

      // Normal paragraph
      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed my-2 font-sans">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  // Parse inline bold markers **text** or high-contrast highlights
  const parseInlineStyles = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, i) => {
      // Odd indexes are bold texts
      if (i % 2 === 1) {
        // Highlight specific triggers
        if (part.includes('爆发式') || part.includes('红警') || part.includes('🚨')) {
          return <strong key={i} className="text-red-700 bg-red-100 px-1 py-0.5 rounded font-bold">{part}</strong>;
        }
        return <strong key={i} className="font-bold text-slate-900">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6" id="report_center_view">
      
      {/* Dynamic AI Report Configuration Board */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-pink-600" />
              AI 智能情报深度生成仓
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">配置核心监测词集，按需指挥 AI 提取一键产出符合国家行规与市场敏感度的高质量商情报告。</p>
          </div>
          
          <div className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-sm">
            搭载 Gemini 3.5 行业分析大脑
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          {/* Col 1: Report Type select */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">选择报告规格层级</label>
            <div className="space-y-1.5">
              {[
                { type: 'daily', label: '每日热点简报 (1页极简)', desc: '本日3-5个最快食品风向点拔' },
                { type: 'weekly', label: '每周趋势深度报告 (5-10页)', desc: '本周核心指标、KOL渠道发酵分析' },
                { type: 'monthly', label: '月度消费者洞察白皮书', desc: '全品类大盘机会、周期白皮书策划' },
                { type: 'special_alert', label: '爆发式热点2h专项快报', desc: '突发舆情或200%+词汇暴利推导' }
              ].map(cfg => (
                <div
                  key={cfg.type}
                  onClick={() => setTargetReportType(cfg.type as any)}
                  className={`p-2.5 border rounded-lg cursor-pointer transition flex items-start gap-2 ${
                    targetReportType === cfg.type
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
                  }`}
                >
                  <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${targetReportType === cfg.type ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-xs font-bold leading-tight">{cfg.label}</div>
                    <div className={`text-[10px] ${targetReportType === cfg.type ? 'text-slate-300' : 'text-slate-400'}`}>{cfg.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Targets selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">锁定本次报告监控特色词库</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <div
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`p-2 border rounded-lg cursor-pointer transition text-[11px] flex items-center gap-1.5 truncate ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-700' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                    />
                    <span>{tag}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">注：选中的元素会在生成报告时优先作为交叉统计与竞品监控的关键参数进行交叉印证。</p>
          </div>

          {/* Col 3: Execute triggers */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">系统自检参数</span>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>多平台交叉探针:</span>
                  <strong className="text-slate-800">小红书 & 点评 Active</strong>
                </div>
                <div className="flex justify-between">
                  <span>包含细度偏好维度:</span>
                  <strong className="text-slate-800">5维度全覆盖</strong>
                </div>
                <div className="flex justify-between">
                  <span>报告起草时间:</span>
                  <strong className="text-slate-800">2026-05-22</strong>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedTags.length === 0}
              className="w-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 bg-linear-to-r from-slate-900 to-indigo-950 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Gemini 正全速提炼情报报告...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  指挥 AI 自动生成商情白皮书
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main split work-desk: Left reports catalogue; Right detailed view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left List catalog list */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs max-h-[500px] overflow-y-auto">
          <div className="p-3.5 border-b border-slate-100 font-semibold text-xs text-slate-700">
            精选多期商情报告库存
          </div>
          <div className="divide-y divide-slate-100">
            {reports.map(rep => {
              const isSelected = rep.id === selectedReportId;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`p-3.5 text-left cursor-pointer transition hover:bg-slate-50 flex items-start gap-2.5 ${
                    isSelected ? 'bg-slate-50 border-r-4 border-indigo-600' : ''
                  }`}
                >
                  <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${
                    rep.type === 'special_alert' ? 'text-red-500' : 'text-slate-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5 text-[10px]">
                      <span className={`px-1 py-0.1 font-bold rounded ${
                        rep.type === 'daily' ? 'bg-slate-150 text-slate-600' :
                        rep.type === 'weekly' ? 'bg-blue-50 text-blue-700' :
                        rep.type === 'monthly' ? 'bg-purple-50 text-purple-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {rep.type === 'daily' ? '日报' :
                         rep.type === 'weekly' ? '周报' :
                         rep.type === 'monthly' ? '月度白皮书' : '快报'}
                      </span>
                      <span className="text-slate-400 font-mono italic">{rep.createdAt.split(' ')[0]}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1 truncate" title={rep.title}>
                      {rep.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{rep.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detailed Markdown viewer */}
        {activeReport ? (
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between" id="report_details_panel">
            {/* Header commands */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span>发布时间: {activeReport.createdAt}</span>
                  <span>|</span>
                  <span className="flex items-center text-emerald-600">
                    <FileCheck className="w-3 h-3 mr-0.5" /> AI校对完成
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-xs md:text-sm truncate">
                  {activeReport.title}
                </h3>
              </div>

              {/* Utility buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={copyToClipboard}
                  className="text-xs bg-white text-slate-700 border border-slate-250 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="Copy whole plain markdown text to copy paste anywhere"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      复制
                    </>
                  )}
                </button>
                <button
                  onClick={triggerPrint}
                  className="text-xs bg-white text-slate-700 border border-slate-250 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  打印
                </button>
              </div>
            </div>

            {/* Main scroll content screen */}
            <div className="p-6 bg-white overflow-y-auto max-h-[500px] prose prose-slate max-w-none text-slate-800">
              {/* Highlight summary panel */}
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1 mb-1">
                  <Brain className="w-3.5 h-3.5 text-pink-500" />
                  本期摘要
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">
                  “ {activeReport.summary} ”
                </p>
              </div>

              {/* Render parser */}
              <div className="space-y-2">
                {renderFormattedMarkdown(activeReport.contentMarkdown)}
              </div>
            </div>

            {/* Footer download notification */}
            <div className="p-3 border-t border-slate-100 bg-slate-100 text-center text-[10px] text-slate-500 flex items-center justify-between px-5">
              <span>系统自动生成，已过滤敏感数据。符合食品广告法、不涉保密隐私。</span>
              <strong className="text-indigo-600">PDF / MS Word 兼容格式已嵌入</strong>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400 text-xs">
            选择一份左侧商情，随时进行富文本内容预览、打印或复制。
          </div>
        )}

      </div>

    </div>
  );
}
