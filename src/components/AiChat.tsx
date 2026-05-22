import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Brain, Bot, User, Trash2, 
  ArrowRight, HeartHandshake, BookOpen, ThumbsUp, Flame, HelpCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '👋 您好！我是您的**食品茶饮AI智脑导师**。您可以向我提问关于本季度爆款研发趋势、受众群画像心智、竞品御敌策以及小红书宣传文案等任何问题！您可以点击下方的预设分析专题，或者在输入框内自由输入表达。',
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Quick Action Pre-populated Prompts
  const quickPromptChips = [
    { label: '🔥 坚果流心新品破局', text: '分析开心果冷萃酸奶流心大福的爆款潜质、适宜价格段与主要痛点突破口。' },
    { label: '✍️ 小红书爆款慢滋补文案', text: '为我研发的新品“五年陈皮红豆清润巴斯克蛋糕”写一版主打办公室白领下午茶解压、轻卡低糖的小红书种草文案。' },
    { label: '👥 Z世代多重咬感策划', text: '推荐3个针对18-25岁Z世代消费者，主打“糯叽叽+酥润沙沙”双重极致口感的本季度新品口味组合。' },
    { label: '🛡️ 竞品重围狙击策', text: '我们的直接竞品“酥合桃源”新推了茉莉生椰乌龙起司，我们应该如何利用“药食同源”及高颜值包装打出差异化反击？' }
  ];

  // Auto Scroll Chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle messages submit
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsSending(true);

    try {
      // Build previous dialogue context for stateless Gemini endpoint
      const formattedHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: formattedHistory })
      });

      if (!res.ok) {
        throw new Error('API server disconnect');
      }

      const data = await res.json();
      
      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        role: 'model',
        content: data.content || '智脑正遇到了一些小卡顿，请重试！',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: 'error_' + Date.now(),
          role: 'model',
          content: '❌ **智脑通信异常**：可能是服务器网络有启动延迟，请再次尝试提问。',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Clear messages history
  const handleClearHistory = () => {
    if (window.confirm('您确定要清空当前的智脑对话记录吗？')) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: '👋 智脑数据库已全部清重。我是您的**食品茶饮AI智脑导师**，随时等候您的研发与营销指令！',
          timestamp: new Date()
        }
      ]);
    }
  };

  // Simple, highly robust Markdown parser text renderer inside pure React 19 to avoid any rendering bugs
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // 1. Double break
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      // 2. Titles (H1, H2, H3: #, ##, ###)
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-gray-900 mt-3 mb-1.5 flex items-center gap-1 border-l-2 border-indigo-500 pl-2">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-indigo-950 mt-4 mb-2 border-b border-gray-100 pb-1">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-extrabold text-indigo-950 mt-5 mb-3">{line.replace('# ', '')}</h2>;
      }

      // 3. Unordered list (- or *)
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const pureText = line.substring(2);
        return (
          <li key={idx} className="text-xs text-gray-700 ml-4 list-disc mb-1 leading-relaxed">
            {parseBoldText(pureText)}
          </li>
        );
      }

      // 4. Ordered list (1., 2.)
      const matchOrdered = line.match(/^(\d+)\.\s(.*)/);
      if (matchOrdered) {
        return (
          <li key={idx} className="text-xs text-gray-700 ml-4 list-decimal mb-1 leading-relaxed">
            {parseBoldText(matchOrdered[2])}
          </li>
        );
      }

      // 5. Default paragraph
      return (
        <p key={idx} className="text-xs text-gray-700 leading-relaxed mb-1.5">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Helper parsing **bold** style
  const parseBoldText = (text: string) => {
    const parts = text.split('**');
    if (parts.length < 3) return text;
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-indigo-950 bg-indigo-50/50 px-1 rounded">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6" id="ai-chat-central-panel">
      {/* Narrative Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
            AI 智脑对话中心 (Analytic AI Copilot)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            连接顶尖大语言模型，实时推演跨品类创意、定制逆向研发方案，在配方打磨及社交媒介文案设计上给与您最高效的支持。
          </p>
        </div>

        <div>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 border border-gray-100 px-3.5 py-2 rounded-xl transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空对话流</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Quick Topics Suggestions Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -translate-y-12 translate-x-12 opacity-30"></div>
            <div className="relative z-10">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                热点研讨论题 (Starter chips)
              </h2>
              <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                点击下方精选卡圈以立刻快捷发起对应主题与AI智脑的探讨，帮助您的产品线打出极致差异度。
              </p>
              
              <div className="space-y-2.5">
                {quickPromptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.text)}
                    disabled={isSending}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-indigo-50/30 transition-all font-medium text-xs text-gray-700 hover:text-indigo-950 group cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-[11px] group-hover:text-indigo-600">{chip.label}</span>
                      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 lines-clamp-2 leading-relaxed">
                      {chip.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guidelines info card box */}
          <div className="bg-linear-to-b from-indigo-950 to-slate-950 p-5 rounded-2xl border border-indigo-900/30 text-indigo-200">
            <h3 className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              对话实操锦囊 (Best practices)
            </h3>
            <ul className="space-y-2 text-[11px] text-indigo-200/80 leading-relaxed font-sans">
              <li className="flex items-start gap-1">
                <span className="text-indigo-400 font-mono">•</span>
                <span>结合本大盘的<strong>「爆款风潮」</strong>如陈皮红豆进行具象化配方咨询。</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-indigo-400 font-mono">•</span>
                <span>指定特定客群（如<strong>「精致老银发、校园冷卡党」</strong>）反向推演主场卖点。</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-indigo-400 font-mono">•</span>
                <span>让智脑模仿专业CMO对指定竞品做双生差异化定位分析。</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right column: Interactive Main Conversation Canvas */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[580px]" id="dialogue-chat-viewport">
          
          {/* Header */}
          <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-xs font-bold text-slate-700">智脑专家在线研判席 (Active)</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">Gemini-3.5-Flash</span>
          </div>

          {/* Scrolling messages list inside frame */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans bg-gray-50/50">
            {messages.map(m => {
              const isModel = m.role === 'model';
              return (
                <div 
                  key={m.id} 
                  className={`flex gap-3 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar wrapper */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-xs border ${
                    isModel 
                      ? 'bg-indigo-600 text-white border-indigo-700' 
                      : 'bg-white text-gray-700 border-gray-100'
                  }`}>
                    {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble container */}
                  <div className={`rounded-xl px-4 py-3 shadow-2xs leading-relaxed ${
                    isModel 
                      ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    {isModel ? (
                      <div className="space-y-1">
                        {renderMessageContent(m.content)}
                      </div>
                    ) : (
                      <p className="text-xs whitespace-pre-wrap">{m.content}</p>
                    )}
                    <span className={`block text-[9px] mt-1.5 text-right font-mono ${isModel ? 'text-gray-400' : 'text-indigo-200'}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white border border-indigo-700 flex items-center justify-center text-sm shadow-xs animate-bounce">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white text-gray-500 border border-gray-100 rounded-xl rounded-tl-none px-4 py-3 shadow-2xs flex items-center gap-1.5 text-xs">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>智脑大势推演演算中...</span>
                </div>
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>

          {/* Interactive input panel */}
          <div className="p-4 bg-white border-t border-gray-100 mt-auto">
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
                disabled={isSending}
                placeholder="在此输入您的新品创意、口味混搭或营销咨询需求..."
                className="flex-1 bg-gray-50 hover:bg-gray-100/50 focus:bg-white text-xs border border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-4 py-2.5 transition-all outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={isSending || !userInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-150 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-xs transition-all hover:shadow-md cursor-pointer flex-shrink-0"
              >
                <span>研判</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[9px] text-gray-400 mt-2 text-center">
              💡 提问小诀窍：词汇越精准，AI针对该食品特性所推荐的风味搭配口感方案可行性越高。
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
