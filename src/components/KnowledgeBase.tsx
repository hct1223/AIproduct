import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Shield, ShieldAlert, Lock, Unlock, Users, Trash2, 
  Search, Sparkles, FileText, ChevronLeft, Eye, Settings, Tags, Calendar, 
  AlertCircle, HelpCircle, Layers, Check, Edit2, ArrowRight, User
} from 'lucide-react';
import { KnowledgeBase as KBType, KnowledgeDocument as DocType } from '../types';

interface KnowledgeBaseProps {
  userRole?: string;
}

export default function KnowledgeBase({ userRole = '高管层' }: KnowledgeBaseProps) {
  // DB stores
  const [kbs, setKbs] = useState<KBType[]>([]);
  const [selectedKb, setSelectedKb] = useState<KBType | null>(null);
  const [docs, setDocs] = useState<DocType[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null);

  // Loading & interactive states
  const [isLoadingKbs, setIsLoadingKbs] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isSavingKb, setIsSavingKb] = useState(false);
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  
  // Modals visibility
  const [showCreateKbModal, setShowCreateKbModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [showAiDraftModal, setShowAiDraftModal] = useState(false);
  
  // Selection for Permission Modal
  const [permissionTargetKb, setPermissionTargetKb] = useState<KBType | null>(null);

  // Filtering states (Main List)
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [securityFilter, setSecurityFilter] = useState<string>('all');

  // Document filtration query
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Form Fields: Create KB
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');
  const [newKbCategory, setNewKbCategory] = useState<'formula' | 'competitor' | 'insight' | 'marketing' | 'policy'>('formula');
  const [newKbSecurity, setNewKbSecurity] = useState<'L1' | 'L2' | 'L3'>('L1');
  const [newKbIsPublic, setNewKbIsPublic] = useState(true);
  const [newKbRoles, setNewKbRoles] = useState<string[]>(["研发组", "策划组"]);

  // Form Fields: Edit Permissions
  const [editKbRoles, setEditKbRoles] = useState<string[]>([]);
  const [editKbSecurity, setEditKbSecurity] = useState<'L1' | 'L2' | 'L3'>('L1');
  const [editKbIsPublic, setEditKbIsPublic] = useState(true);

  // Form Fields: Create Document manually
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocAuthor, setNewDocAuthor] = useState('管理员');
  const [newDocTagsString, setNewDocTagsString] = useState('配方, 核心');

  // Form Fields: AI Document Generator Assisted Sandbox
  const [aiDocTitlePrompt, setAiDocTitlePrompt] = useState('新潮水牛奶麻薯开心果慕斯杯工艺要旨');
  const [aiDocKeywords, setAiDocKeywords] = useState('0蔗糖赤藓糖醇, 质感阻尼, 100%纯压榨浆');
  const [aiDocAudience, setAiDocAudience] = useState('配方研发团队与主厨线');
  const [aiDraftPreview, setAiDraftPreview] = useState<{ title: string; content: string; tags: string[] } | null>(null);

  // List of all potential role profiles
  const availableRolesList = ["研发组", "策划组", "销售组", "高管层", "财务部", "店长层"];

  // Category Chinese Translation Map
  const categoryMap: { [key: string]: { label: string; color: string } } = {
    formula: { label: '研发配方工艺', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    competitor: { label: '重磅竞品动态', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    insight: { label: '前沿消费洞察', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    marketing: { label: '品牌新媒合规', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    policy: { label: '法律审计政策', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  // Helper translations for Level
  const levelMap = {
    L1: { label: 'L1级 · 全面公开', bg: 'bg-teal-50 text-teal-800 border-teal-100', icon: <Unlock className="w-3 h-3" /> },
    L2: { label: 'L2级 · 团队内部', bg: 'bg-indigo-50 text-indigo-800 border-indigo-100', icon: <Users className="w-3 h-3" /> },
    L3: { label: 'L3级 · 绝对机密', bg: 'bg-rose-50 text-rose-800 border-rose-100', icon: <ShieldAlert className="w-3 h-3 animate-pulse" /> },
  };

  // Fetch Knowledge Bases
  const fetchKbs = async () => {
    setIsLoadingKbs(true);
    try {
      const res = await fetch('/api/kb');
      if (res.ok) {
        const result = await res.json();
        setKbs(result.data || []);
      }
    } catch (e) {
      console.error('Error loading knowledge bases:', e);
    } finally {
      setIsLoadingKbs(false);
    }
  };

  // Fetch Documents
  const fetchKbDocs = async (kbId: string) => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch(`/api/kb/docs/${kbId}`);
      if (res.ok) {
        const result = await res.json();
        const loadedDocs = result.data || [];
        setDocs(loadedDocs);
        if (loadedDocs.length > 0) {
          setActiveDoc(loadedDocs[0]);
        } else {
          setActiveDoc(null);
        }
      }
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchKbs();
  }, []);

  // Handle Create Knowledge Base
  const handleCreateKbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle.trim() || !newKbDesc.trim()) return;

    setIsSavingKb(true);
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newKbTitle,
          description: newKbDesc,
          category: newKbCategory,
          securityLevel: newKbSecurity,
          isPublic: newKbIsPublic,
          permittedRoles: newKbRoles
        })
      });

      if (res.ok) {
        // Reload KBs
        await fetchKbs();
        setShowCreateKbModal(false);
        // Clear fields
        setNewKbTitle('');
        setNewKbDesc('');
        setNewKbCategory('formula');
        setNewKbSecurity('L1');
        setNewKbIsPublic(true);
        setNewKbRoles(["研发组", "策划组"]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingKb(false);
    }
  };

  // Handle open permissions configuration modal
  const openPermissionConfig = (kb: KBType) => {
    setPermissionTargetKb(kb);
    setEditKbRoles(kb.permittedRoles || []);
    setEditKbSecurity(kb.securityLevel);
    setEditKbIsPublic(kb.isPublic);
    setShowPermissionsModal(true);
  };

  // Submit revised authorization permissions
  const handleEditPermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionTargetKb) return;

    try {
      const res = await fetch('/api/kb/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: permissionTargetKb.id,
          permittedRoles: editKbRoles,
          securityLevel: editKbSecurity,
          isPublic: editKbIsPublic
        })
      });

      if (res.ok) {
        // Sync local representation
        await fetchKbs();
        // If the workspace is currently viewed, update selected attributes as well
        if (selectedKb && selectedKb.id === permissionTargetKb.id) {
          const updated = {
            ...selectedKb,
            permittedRoles: editKbRoles,
            securityLevel: editKbSecurity,
            isPublic: editKbIsPublic
          };
          setSelectedKb(updated);
        }
        setShowPermissionsModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle delete knowledge base
  const handleKbDelete = async (id: string, name: string) => {
    if (window.confirm(`⚠️ 安全警告：此操作不可挽回！\n您确定要彻底删除知识库「${name}」以及它包含的所有子文章文档吗？`)) {
      try {
        const res = await fetch(`/api/kb/${id}`, { method: 'DELETE' });
        if (res.ok) {
          if (selectedKb && selectedKb.id === id) {
            setSelectedKb(null);
          }
          await fetchKbs();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle manual Document formulation submittal
  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKb || !newDocTitle.trim() || !newDocContent.trim()) return;

    setIsSavingDoc(true);
    try {
      const parsedTags = newDocTagsString.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/kb/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kbId: selectedKb.id,
          title: newDocTitle,
          content: newDocContent,
          author: newDocAuthor,
          tags: parsedTags
        })
      });

      if (res.ok) {
        const data = await res.json();
        await fetchKbDocs(selectedKb.id);
        await fetchKbs(); // Sync main page layout document numerical values
        setShowCreateDocModal(false);
        // Clear fields
        setNewDocTitle('');
        setNewDocContent('');
        setNewDocTagsString('研发, 工艺');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDoc(false);
    }
  };

  // Trigger AI to Draft a documentation in the custom workspace sandbox
  const handleAIGenerateDraft = async () => {
    if (!aiDocTitlePrompt.trim()) return;

    setIsGeneratingDoc(true);
    setAiDraftPreview(null);
    try {
      const res = await fetch('/api/kb/docs/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titlePrompt: aiDocTitlePrompt,
          keyElements: aiDocKeywords,
          audience: aiDocAudience
        })
      });

      if (res.ok) {
        const result = await res.json();
        setAiDraftPreview(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // Adopt AI Draft directly into active database
  const saveAiDraftToDb = async () => {
    if (!selectedKb || !aiDraftPreview) return;

    setIsSavingDoc(true);
    try {
      const res = await fetch('/api/kb/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kbId: selectedKb.id,
          title: aiDraftPreview.title,
          content: aiDraftPreview.content,
          author: 'AI 智脑拟稿专家',
          tags: aiDraftPreview.tags
        })
      });

      if (res.ok) {
        await fetchKbDocs(selectedKb.id);
        await fetchKbs(); // Update totals counter
        setShowAiDraftModal(false);
        setAiDraftPreview(null);
        setAiDocTitlePrompt('新潮水牛奶麻薯开心果慕斯杯工艺要旨');
        setAiDocKeywords('0蔗糖赤藓糖醇, 质感阻尼, 100%纯压榨浆');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDoc(false);
    }
  };

  // Delete an individual Document
  const handleDocDelete = async (docId: string, docTitle: string) => {
    if (window.confirm(`您确定要删除当前文章「${docTitle}」吗？`)) {
      try {
        const res = await fetch(`/api/kb/docs/${docId}`, { method: 'DELETE' });
        if (res.ok) {
          if (selectedKb) {
            await fetchKbDocs(selectedKb.id);
            await fetchKbs(); // Sync numeric indices
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Multi select roles mechanism helper
  const toggleRoleSelection = (role: string, isCreate: boolean) => {
    if (isCreate) {
      if (newKbRoles.includes(role)) {
        setNewKbRoles(prev => prev.filter(r => r !== role));
      } else {
        setNewKbRoles(prev => [...prev, role]);
      }
    } else {
      if (editKbRoles.includes(role)) {
        setEditKbRoles(prev => prev.filter(r => r !== role));
      } else {
        setEditKbRoles(prev => [...prev, role]);
      }
    }
  };

  // Filter KBs
  const filteredKbs = kbs.filter(kb => {
    const matchesSearch = kb.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          kb.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || kb.category === categoryFilter;
    const matchesSecurity = securityFilter === 'all' || kb.securityLevel === securityFilter;
    
    // Role-based access control checking
    const permitsRole = userRole === '高管层' || kb.isPublic || !kb.permittedRoles || kb.permittedRoles.length === 0 || kb.permittedRoles.includes(userRole);
    
    return matchesSearch && matchesCategory && matchesSecurity && permitsRole;
  });

  // Filter documents in active viewed KB
  const filteredDocs = docs.filter(doc => {
    return doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) || 
           doc.content.toLowerCase().includes(docSearchQuery.toLowerCase());
  });

  // Interactive dynamic markdown-friendly parser to visual interface representation (avoid full React-Markdown bugs)
  const renderDocBodyMarkdown = (text: string) => {
    if (!text) return null;
    
    // Convert backslash-n sequences '\n' or '\\n' to true newlines
    let processedText = text
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n');
    
    const lines = processedText.split('\n');
    
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Handles empty separator rows
      if (trimmed === '') {
        return <div key={idx} className="h-3" />;
      }

      // Blockquote Header/Note Callouts
      if (trimmed.startsWith('> ')) {
        return (
          <div key={idx} className="my-4 pl-4 py-3 border-l-4 border-indigo-500 bg-indigo-50/40 text-xs italic text-indigo-950 rounded-r-lg shadow-sm leading-relaxed max-w-3xl">
            {parseBoldAndFormatContent(line.substring(2))}
          </div>
        );
      }

      // Headers (H1, H2, H3)
      if (trimmed.startsWith('### ')) {
        const headingText = trimmed.replace('### ', '');
        return (
          <h4 key={idx} className="text-xs font-extrabold text-indigo-900 mt-6 mb-3 flex items-center border-l-2 border-indigo-400 pl-2 tracking-wide uppercase">
            {headingText}
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        const headingText = trimmed.replace('## ', '');
        return (
          <h3 key={idx} className="text-sm font-extrabold text-slate-800 mt-7 mb-4 border-b border-indigo-100/60 pb-2.5 flex items-center gap-1.5 text-indigo-950">
            <span className="w-1.5 h-3.5 bg-indigo-600 rounded-sm"></span>
            {headingText}
          </h3>
        );
      }
      if (trimmed.startsWith('# ')) {
        const headingText = trimmed.replace('# ', '');
        return (
          <h2 key={idx} className="text-base font-extrabold text-indigo-950 mt-8 mb-5 bg-linear-to-r from-indigo-50 to-transparent p-3 rounded-lg border-l-4 border-indigo-600 shadow-sm">
            {headingText}
          </h2>
        );
      }

      // Bullet List style improvements
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 mb-2.5 pl-3 leading-relaxed max-w-3xl">
            <span className="text-indigo-500 font-bold mt-1 text-xs select-none">•</span>
            <span className="select-text">{parseBoldAndFormatContent(content)}</span>
          </div>
        );
      }

      // Ordered List style improvements
      const matchOrdered = trimmed.match(/^(\d+)\.\s(.*)/);
      if (matchOrdered) {
        return (
          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 mb-2.5 pl-3 leading-relaxed max-w-3xl">
            <span className="text-indigo-650 font-bold bg-indigo-55 border border-indigo-100 text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 select-none shadow-sm">
              {matchOrdered[1]}
            </span>
            <span className="pt-0.5 select-text">{parseBoldAndFormatContent(matchOrdered[2])}</span>
          </div>
        );
      }

      // Table Row Parser Helper
      if (trimmed.startsWith('|') && trimmed.includes('---')) {
        return <div key={idx} className="hidden" />; // Divider line ignore
      }
      if (trimmed.startsWith('|')) {
        const columns = trimmed.split('|').map(c => c.trim()).filter(Boolean);
        const isHeader = trimmed.toLowerCase().includes('原') || trimmed.toLowerCase().includes('配比') || trimmed.toLowerCase().includes('节点') || trimmed.toLowerCase().includes('weight') || idx < 15; // approximate check
        
        return (
          <div key={idx} className={`grid grid-cols-4 gap-3 text-xs py-2 px-4 border-b border-gray-150 select-text transition-colors hover:bg-slate-50/50 ${isHeader ? 'bg-indigo-50/50 font-bold text-indigo-950 border-t border-b-2 border-indigo-100 rounded-t-sm' : 'text-slate-600'}`}>
            {columns.map((col, colIdx) => (
              <span key={colIdx} className="truncate tracking-wide font-sans">{col}</span>
            ))}
          </div>
        );
      }

      // Paragraph styled with clear readable margins and spacing
      return (
        <p key={idx} className="text-xs text-slate-650 leading-relaxed mb-3.5 tracking-wide text-justify select-text max-w-3xl">
          {parseBoldAndFormatContent(line)}
        </p>
      );
    });
  };

  const parseBoldAndFormatContent = (text: string) => {
    if (!text) return "";
    
    // First, split by bold tags (**)
    const boldParts = text.split('**');
    
    return boldParts.map((boldPart, boldIdx) => {
      const isBold = boldIdx % 2 === 1;
      
      // Within each part, process inline code tags (`)
      const codeParts = boldPart.split('`');
      const renderedPart = codeParts.map((codePart, codeIdx) => {
        const isCode = codeIdx % 2 === 1;
        if (isCode) {
          return (
            <code key={`code-${codeIdx}`} className="px-1.5 py-0.5 mx-0.5 bg-indigo-50 text-indigo-750 font-mono text-[10.5px] rounded border border-indigo-100 font-bold">
              {codePart}
            </code>
          );
        }
        return codePart;
      });

      if (isBold) {
        return (
          <strong key={`bold-${boldIdx}`} className="font-bold text-slate-900 bg-indigo-50/45 px-1 py-0.5 rounded border border-indigo-100/35">
            {renderedPart}
          </strong>
        );
      }
      return <React.Fragment key={`text-${boldIdx}`}>{renderedPart}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-6" id="knowledge-base-central-screen-root">
      
      {/* ------------------ SCENE A: Main Listing Grid (Not inside a specific KB) ------------------ */}
      {!selectedKb && (
        <div className="space-y-6">
          
          {/* Main Visual Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5.5 h-5.5 text-indigo-600" />
                知识库 (Enterprise Knowledge Repositories)
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                统一管理与沉淀团队工艺配方、行业合规规范、竞品对比分析等核心知识资产，支持灵活的部门协作与角色权限安全管控。
              </p>
            </div>

            <div>
              <button
                onClick={() => setShowCreateKbModal(true)}
                className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>新建知识库</span>
              </button>
            </div>
          </div>

          {/* Filtration bar and Segment Selection */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col md:flex-row gap-3.5 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索知识库标题/说明..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 text-xs pl-9 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:bg-white focus:border-indigo-500 transition-all text-gray-700"
              />
            </div>

            {/* Selector Categories & Security classifications */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              
              {/* Category selector chips */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-1 rounded-lg">
                <span className="text-[10px] text-gray-400 px-1 font-bold">分类</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs text-gray-700 outline-none select-none border-none py-0.5 px-1 font-medium cursor-pointer"
                >
                  <option value="all">全部大类</option>
                  <option value="formula">研发配方工艺</option>
                  <option value="competitor">重磅竞品动态</option>
                  <option value="insight">前沿消费洞察</option>
                  <option value="marketing">品牌新媒合规</option>
                  <option value="policy">法律审计政策</option>
                </select>
              </div>

              {/* Security level selector */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-1 rounded-lg">
                <span className="text-[10px] text-gray-400 px-1 font-bold">密级</span>
                <select
                  value={securityFilter}
                  onChange={e => setSecurityFilter(e.target.value)}
                  className="bg-transparent text-xs text-gray-700 outline-none select-none border-none py-0.5 px-1 font-medium cursor-pointer"
                >
                  <option value="all">全部密级</option>
                  <option value="L1">L1公开</option>
                  <option value="L2">L2团队</option>
                  <option value="L3">L3机密</option>
                </select>
              </div>

            </div>
          </div>

          {/* Loader status */}
          {isLoadingKbs ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
              <p className="text-xs text-gray-400 mt-3 font-mono">加载知识库大盘参数...</p>
            </div>
          ) : filteredKbs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-gray-500 text-xs font-bold">没有匹配当前过滤条件的知识库仓储</p>
              <p className="text-[11px] text-gray-400">您可以尝试清空搜索条文，或点击右上角“新建知识库”。</p>
            </div>
          ) : (
            /* KB grid lists */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredKbs.map(kb => {
                const km = categoryMap[kb.category] || { label: '未归类', color: 'bg-gray-100 text-gray-600' };
                const lm = levelMap[kb.securityLevel] || { label: '公开', bg: 'bg-gray-100 text-gray-600', icon: <Unlock /> };
                
                return (
                  <div 
                    key={kb.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-all hover:border-indigo-100 flex flex-col justify-between overflow-hidden group relative"
                  >
                    {/* Top Accent Category Ribbon */}
                    <div className="px-5 pt-5 pb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${km.color}`}>
                          {km.label}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Security tag */}
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 border ${lm.bg}`}>
                            {lm.icon}
                            <span>{lm.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Title and descriptions */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {kb.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 line-clamp-3 mt-1.5 leading-relaxed h-[48px]">
                          {kb.description}
                        </p>
                      </div>

                      {/* Permitted Roles Indicators */}
                      <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-bold">获授鉴权角色:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {kb.isPublic || (kb.permittedRoles && kb.permittedRoles.length === availableRolesList.length) ? (
                            <span className="text-[9px] font-sans bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-sm">
                              全员共享
                            </span>
                          ) : kb.permittedRoles && kb.permittedRoles.length > 0 ? (
                            kb.permittedRoles.map((role: string) => (
                              <span key={role} className="text-[9px] font-sans bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm">
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-sans bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm">
                              无角色授权 (管理员专享)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom action panel */}
                    <div className="bg-slate-50/50 border-t border-gray-100 px-5 py-3.5 flex items-center justify-between text-[11px] text-gray-400">
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-extrabold text-indigo-600 text-xs font-mono">{kb.documentCount || 0}</span>
                        <span>篇文章</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Go to workspace */}
                        <button
                          onClick={() => {
                            setSelectedKb(kb);
                            fetchKbDocs(kb.id);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>查阅</span>
                        </button>

                        {/* Adjust Permission */}
                        <button
                          onClick={() => openPermissionConfig(kb)}
                          className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 p-1.5 rounded-md transition-all cursor-pointer"
                          title="配置组织权限规则"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete KB */}
                        <button
                          onClick={() => handleKbDelete(kb.id, kb.title)}
                          className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 p-1.5 rounded-md transition-all cursor-pointer"
                          title="销毁冷库"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------ SCENE B: Detailed View (Inside a single Knowledge Base) ------------------ */}
      {selectedKb && (
        <div className="space-y-6" id="dedicated-kb-viewer-workspace">
          
          {/* Visual Sub-Header for Active KB with Back and Context Controls */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-start gap-3.5">
              <button
                onClick={() => setSelectedKb(null)}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 p-2 rounded-xl transition-all cursor-pointer mt-0.5"
                title="返回主列表"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-gray-900">{selectedKb.title}</h1>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${categoryMap[selectedKb.category]?.color || 'bg-gray-50'}`}>
                    {categoryMap[selectedKb.category]?.label}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${levelMap[selectedKb.securityLevel]?.bg || 'bg-gray-50'}`}>
                    权限：{levelMap[selectedKb.securityLevel]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{selectedKb.description}</p>
              </div>
            </div>

            {/* Action Triggers for Writing & Generative AI Draft Assistant */}
            <div className="flex items-center gap-2 flex-shrink-0">
              
              {/* Write Doc */}
              <button
                onClick={() => setShowCreateDocModal(true)}
                className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-2 rounded-xl transition-all font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>撰写手工文档</span>
              </button>

              {/* AI Generative Drafting */}
              <button
                onClick={() => {
                  setAiDocTitlePrompt(`${selectedKb.category === 'formula' ? '新会陈皮抹茶爆浆大福配方调控要点' : selectedKb.category === 'competitor' ? '针对茉酸奶低温酸奶战略迎击策略' : '小红书食品营销合规风控实务'}`);
                  setShowAiDraftModal(true);
                }}
                className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-all font-bold shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>AI 智脑拟草案</span>
              </button>

              {/* Open Permissions right inside viewed KB */}
              <button
                onClick={() => openPermissionConfig(selectedKb)}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                title="调整当前仓储鉴权"
              >
                <Settings className="w-4 h-4" />
              </button>

            </div>
          </div>

          {/* Interactive Split Canvas: LHS Documents list, RHS Active Rich markdown Document viewing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* LHS: Documents catalogue */}
            <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl flex flex-col h-[520px]">
              
              {/* Catalogue Header & search filter */}
              <div className="p-4 border-b border-gray-100 space-y-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">章节手册大纲 (Docs list)</span>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="在本书中查找..."
                    value={docSearchQuery}
                    onChange={e => setDocSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 pl-8 pr-3 py-1.5 rounded-lg outline-none text-xs focus:bg-white focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Catalogue index scroll list */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2">
                {isLoadingDocs ? (
                  <div className="py-12 text-center text-gray-400 text-xs">加载图书文档...</div>
                ) : filteredDocs.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-gray-400 text-[11px]">暂无拟定文档</p>
                    <p className="text-[10px] text-gray-300">点击页面右上角即可起草第一篇专业文档。</p>
                  </div>
                ) : (
                  filteredDocs.map(doc => {
                    const isActive = activeDoc && activeDoc.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setActiveDoc(doc)}
                        className={`p-3 rounded-lg text-left transition-all cursor-pointer relative group flex flex-col gap-1.5 ${
                          isActive 
                            ? 'bg-indigo-50/55 border border-indigo-100/50' 
                            : 'hover:bg-slate-50/70 border border-transparent'
                        }`}
                      >
                        {/* Selector indicator */}
                        {isActive && <div className="absolute left-0 top-3 w-1 h-8 bg-indigo-600 rounded-r-md"></div>}
                        
                        <div className="flex items-start justify-between gap-1">
                          <h4 className={`text-xs font-bold leading-relaxed line-clamp-2 ${isActive ? 'text-indigo-950' : 'text-gray-700 font-medium'}`}>
                            {doc.title}
                          </h4>
                          
                          {/* Trash button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocDelete(doc.id, doc.title);
                            }}
                            className="text-gray-300 hover:text-rose-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                            title="从本书解聘删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Date and tags */}
                        <div className="flex items-center justify-between text-[9px] text-gray-400 font-sans">
                          <span className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{doc.author}</span>
                          </span>
                          <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RHS: Active content Viewer window */}
            <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col h-[520px]">
              {activeDoc ? (
                <div className="h-full flex flex-col">
                  
                  {/* Title Area */}
                  <div className="border-b border-gray-100 pb-4 mb-4 flex-shrink-0">
                    <h2 className="text-base font-extrabold text-gray-900 leading-snug">
                      {activeDoc.title}
                    </h2>
                    
                    {/* Meta info tags */}
                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1 font-sans bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-sm">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>起草人：<strong>{activeDoc.author}</strong></span>
                      </span>

                      <span className="flex items-center gap-1 font-sans bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-sm">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>更新：{new Date(activeDoc.updatedAt).toLocaleString()}</span>
                      </span>

                      {/* Doc structural Tags */}
                      {activeDoc.tags && activeDoc.tags.map(t => (
                        <span key={t} className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body Content with nice scrolls */}
                  <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-3 font-sans text-xs">
                    {renderDocBodyMarkdown(activeDoc.content)}
                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                  <div className="w-16 h-16 bg-slate-50 border border-gray-100 rounded-full flex items-center justify-center text-gray-300">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-xs font-bold text-gray-700">尚未拟定或选择知识手册文章</h3>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                      请点击左侧面板相应栏目查阅，或自行为当季库添加“手工工艺配方”、“品牌避坑文案”。
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ------------------ MODALS ------------------ */}

      {/* 1. Modal: Create Knowledge Base */}
      {showCreateKbModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-slide-up">
            
            {/* Header */}
            <div className="bg-indigo-950 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                创建全新级企业核能知识库
              </h3>
              <button 
                onClick={() => setShowCreateKbModal(false)}
                className="text-indigo-200 hover:text-white transition-all text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateKbSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">知识库标题*</label>
                <input
                  type="text"
                  required
                  placeholder="例如：五年陈皮红豆巴斯克低温慢焙独家研发工艺库"
                  value={newKbTitle}
                  onChange={e => setNewKbTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none text-xs focus:bg-white focus:border-indigo-500 transition-all placeholder-gray-400"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">简析描述 (核心应用场景与归宿)*</label>
                <textarea
                  required
                  rows={3}
                  placeholder="简述该库收集的技术配比参数、供应链源头价格破译或营销红绿线规范，帮助下属及同事打差异战。"
                  value={newKbDesc}
                  onChange={e => setNewKbDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none text-xs focus:bg-white focus:border-indigo-500 transition-all placeholder-gray-400"
                />
              </div>

              {/* Category & Security Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">业务类别</label>
                  <select
                    value={newKbCategory}
                    onChange={e => setNewKbCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="formula">研发配方工艺</option>
                    <option value="competitor">重磅竞品动态</option>
                    <option value="insight">前沿消费洞察</option>
                    <option value="marketing">品牌新媒合规</option>
                    <option value="policy">法律审计政策</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">保护密级分发限制</label>
                  <select
                    value={newKbSecurity}
                    onChange={e => setNewKbSecurity(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="L1">L1 绝密公开 (通用普及手册)</option>
                    <option value="L2">L2 团队内通 (项目策划级核心)</option>
                    <option value="L3">L3 商业绝对机密 (高管及配方持权人)</option>
                  </select>
                </div>
              </div>

              {/* Public sharing switch */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                <div>
                  <span className="font-bold text-gray-800 block text-[11px]">全员直接可用公开机制</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">直接绕过所属成员组鉴权，对全平台白领共享查阅。</p>
                </div>
                <input
                  type="checkbox"
                  checked={newKbIsPublic}
                  onChange={e => {
                    setNewKbIsPublic(e.target.checked);
                    if (e.target.checked) {
                      setNewKbRoles(availableRolesList);
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Roles Selector checklists */}
              {!newKbIsPublic && (
                <div className="space-y-1.5 bg-slate-50 border border-gray-100 p-3 rounded-lg">
                  <span className="block text-[11px] font-bold text-indigo-900">分配哪些组织角色对该库赋能有权查阅权限：*</span>
                  <div className="grid grid-cols-3 gap-2">
                    {availableRolesList.map(role => {
                      const isSelected = newKbRoles.includes(role);
                      return (
                        <button
                          type="button"
                          key={role}
                          onClick={() => toggleRoleSelection(role, true)}
                          className={`px-2 py-1.5 rounded-md border text-center transition-all cursor-pointer font-medium text-[10px] ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-3xs' 
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                            <span>{role}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateKbModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSavingKb}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingKb ? '保存创建中...' : '确认并开设'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Edit Permissions Configuration in Sandbox */}
      {showPermissionsModal && permissionTargetKb && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-slide-up">
            
            {/* Header */}
            <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-xs font-bold font-sans flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                配置权限组：{permissionTargetKb.title}
              </h3>
              <button 
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-300 hover:text-white transition-all text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditPermissionsSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Info card block */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-start gap-2 text-[10px] leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <p>
                  <strong>组织权限分发原则：</strong>高级别 L3 机密原则上仅授予高管层与研发组专人专阅，分配权限后，其他组（如销售、店长）前端将无法拉取到该接口卡片及文档数据。
                </p>
              </div>

              {/* Security Level selector */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">保护密级评定 Level</label>
                <select
                  value={editKbSecurity}
                  onChange={e => setEditKbSecurity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="L1">L1 级全面公开</option>
                  <option value="L2">L2 级所属团队内通</option>
                  <option value="L3">L3 极核心商业配方机密</option>
                </select>
              </div>

              {/* Public/Private sharing toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                <div>
                  <span className="font-bold text-gray-800 block text-[11px]">极速全员公开，免除角色审批</span>
                  <p className="text-[9px] text-gray-400 mt-0.5">此开关会优先超越下方具体的角色授权配置。</p>
                </div>
                <input
                  type="checkbox"
                  checked={editKbIsPublic}
                  onChange={e => {
                    setEditKbIsPublic(e.target.checked);
                    if (e.target.checked) {
                      setEditKbRoles(availableRolesList);
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Checkbox matrix */}
              {!editKbIsPublic && (
                <div className="space-y-1.5 bg-slate-50 border border-gray-100 p-3 rounded-lg">
                  <span className="block text-[11px] font-bold text-slate-800">打勾选中允许查阅的组织角色：</span>
                  <div className="grid grid-cols-2 gap-2">
                    {availableRolesList.map(role => {
                      const isSelected = editKbRoles.includes(role);
                      return (
                        <button
                          type="button"
                          key={role}
                          onClick={() => toggleRoleSelection(role, false)}
                          className={`p-2 rounded-md border text-left transition-all cursor-pointer text-[10px] ${
                            isSelected 
                              ? 'bg-emerald-600 text-white border-emerald-700 font-bold' 
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-white text-emerald-700' : 'bg-transparent border-gray-300'}`}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span>{role}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold cursor-pointer"
                >
                  配置并生效
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Write manual Document form */}
      {showCreateDocModal && selectedKb && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-slide-up">
            
            {/* Header */}
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                正在向「{selectedKb.title}」追加撰写手工工艺/文案
              </h3>
              <button 
                onClick={() => setShowCreateDocModal(false)}
                className="text-gray-300 hover:text-white transition-all text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDocSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Title & Author */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">文章标题 (Markdown友好)*</label>
                  <input
                    type="text"
                    required
                    placeholder="例如：【工艺要诀】冷轧开心果碎常温熟成阻水油渗透指南"
                    value={newDocTitle}
                    onChange={e => setNewDocTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">执笔科学家 / 核心责任人*</label>
                  <input
                    type="text"
                    required
                    value={newDocAuthor}
                    onChange={e => setNewDocAuthor(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">技术特征/定位Tags标签 (半角逗号分隔英文或中文)*</label>
                <input
                  type="text"
                  placeholder="配方, 开心果, 质阻工艺"
                  value={newDocTagsString}
                  onChange={e => setNewDocTagsString(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Content textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-gray-700">文档深度正文内容*</label>
                  <span className="text-[10px] text-gray-400 font-mono">支持 Markdown 语法分节</span>
                </div>
                <textarea
                  required
                  rows={9}
                  placeholder={`## 拟定背景：
针对本季度爆发的新中式茶饮流行，我们针对原料调控引入本标准...

### 一、 工艺投料细颗粒配置：
| 原物料 | 配比 | 投料节点 |目的 |
| --- | --- | --- | --- |
| 100%低温压榨开心果碎 | 12% | 灌底点缀 | 丰富咀嚼脆度声响 |`}
                  value={newDocContent}
                  onChange={e => setNewDocContent(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none font-mono text-[11px] focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Submit panel */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateDocModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold cursor-pointer"
                >
                  放弃草案
                </button>
                <button
                  type="submit"
                  disabled={isSavingDoc}
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingDoc ? '核对入库中...' : '审核并发表归档'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: AI Smart Draft Draftsman assistant sandbox */}
      {showAiDraftModal && selectedKb && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-linear-to-r from-indigo-950 via-slate-950 to-indigo-950 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                AI 智脑大势研判文章拟定机 (AI Drafting Assistant Sandbox)
              </h3>
              <button 
                onClick={() => {
                  setShowAiDraftModal(false);
                  setAiDraftPreview(null);
                }}
                className="text-indigo-200 hover:text-white transition-all text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Split input / Preview panel */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6 text-xs font-sans">
              
              {!aiDraftPreview ? (
                /* Stage 1: Fields Inputs */
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-950 text-[11px] leading-relaxed">
                    <p className="font-bold mb-1">🤖 智脑高级顾问入驻：</p>
                    我将代表20年食宿茶饮行业CTO，检索您当前的知识库分类（<strong>{categoryMap[selectedKb.category]?.label}</strong>），结合大势演算和规避法则为您深度生成。本服务既可在连接 Gemini AI 时完全自动深度起草，也可在离线时进入高拟真模板沙盒。
                  </div>

                  {/* Title direction */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">拟起草的研发主题 / 核心论点方向*</label>
                    <input
                      type="text"
                      value={aiDocTitlePrompt}
                      onChange={e => setAiDocTitlePrompt(e.target.value)}
                      placeholder="例如：新中式五年陈皮绿豆红豆巴斯克溏心成熟温控标准"
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none text-xs focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  {/* Key keywords ingredients */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">必须融入的关键原物料、技术要诀、法规合规词 (以逗号隔开)</label>
                    <input
                      type="text"
                      value={aiDocKeywords}
                      onChange={e => setAiDocKeywords(e.target.value)}
                      placeholder="0蔗糖赤藓糖醇, 质感阻尼, 100%纯压榨浆"
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none text-xs focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  {/* Target audience */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">目标读者客群 / 内部交班部门 / 应用场景环境</label>
                    <input
                      type="text"
                      value={aiDocAudience}
                      onChange={e => setAiDocAudience(e.target.value)}
                      placeholder="研发科学家团队或新媒体KOL文案撰稿人"
                      className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 outline-none text-xs focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleAIGenerateDraft}
                      disabled={isGeneratingDoc || !aiDocTitlePrompt.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer text-xs"
                    >
                      {isGeneratingDoc ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>智脑深度起草并校对排版中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
                          <span>立刻由 AI 智脑专家起草草案</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Stage 2: Rich Markdown Preview before saving */
                <div className="space-y-5 animate-fade-in flex flex-col h-full">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-100 font-sans flex items-center gap-1 w-max">
                        <Check className="w-3 h-3" />
                        AI草案拟定成功 (Draft prepared)
                      </span>
                      <h4 className="text-sm font-extrabold text-indigo-950 mt-1">{aiDraftPreview.title}</h4>
                    </div>

                    <button
                      onClick={() => setAiDraftPreview(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-100 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      重新调整指令
                    </button>
                  </div>

                  {/* Draft reading window */}
                  <div className="bg-slate-50 border border-gray-150 p-4 rounded-xl min-h-[220px] max-h-[340px] overflow-y-auto space-y-2.5 font-sans leading-relaxed">
                    {renderDocBodyMarkdown(aiDraftPreview.content)}
                  </div>

                  {/* Adopt / Cancel buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setAiDraftPreview(null);
                        setShowAiDraftModal(false);
                      }}
                      className="bg-gray-150 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      放弃该草案
                    </button>
                    
                    <button
                      onClick={saveAiDraftToDb}
                      disabled={isSavingDoc}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>审核通过：追加发布至本库</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
