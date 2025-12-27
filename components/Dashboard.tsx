
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, ResearchSectionType, Paper } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Book, 
  Wand2, 
  Loader2, 
  Plus,
  ArrowRight,
  Download,
  LayoutGrid,
  Eye,
  Edit2,
  FileText,
  ExternalLink,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List as ListIcon,
  ListOrdered,
  X,
  Sparkles,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Type,
  Maximize2,
  History,
  ChevronDown,
  PlusCircle,
  MoreVertical
} from 'lucide-react';
import { formatCitation } from '../services/sourceService';
import { searchAcademicSources, analyzeContextForSuggestions, GroundedSource } from '../services/geminiService';

interface DashboardProps {
  project: Project;
  onUpdateSection: (section: string, content: string) => void;
  onAddCitation: (paper: Paper) => void;
  onBack: () => void;
}

const WORKFLOW_SECTIONS = ['Questionnaire', 'Analysis', 'Draft'];

const MIN_LEFT_WIDTH = 200;
const MAX_LEFT_WIDTH = 350;
const MIN_RIGHT_WIDTH = 250;
const MAX_RIGHT_WIDTH = 450;

const Dashboard: React.FC<DashboardProps> = ({ project, onUpdateSection, onAddCitation, onBack }) => {
  // Use project sections as keys. If none exist, default to empty.
  const sectionKeys = Object.keys(project.sections).filter(s => !WORKFLOW_SECTIONS.includes(s));
  const [activeSection, setActiveSection] = useState<string>(sectionKeys[0] || 'Draft');
  const [searchQuery, setSearchQuery] = useState(project.title || project.theme);
  const [papers, setPapers] = useState<GroundedSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(true);
  const [previewSource, setPreviewSource] = useState<GroundedSource | null>(null);
  const [suggestedQuery, setSuggestedQuery] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHeadings, setShowHeadings] = useState(false);
  
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(300);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const startResizingLeft = (e: React.MouseEvent) => { e.preventDefault(); setIsResizingLeft(true); };
  const startResizingRight = (e: React.MouseEvent) => { e.preventDefault(); setIsResizingRight(true); };
  const stopResizing = useCallback(() => { setIsResizingLeft(false); setIsResizingRight(false); }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = e.clientX;
      if (newWidth >= MIN_LEFT_WIDTH && newWidth <= MAX_LEFT_WIDTH) setLeftWidth(newWidth);
    }
    if (isResizingRight) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_RIGHT_WIDTH && newWidth <= MAX_RIGHT_WIDTH) setRightWidth(newWidth);
    }
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleSearch = useCallback(async (customQuery?: string) => {
    const q = customQuery || searchQuery;
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchAcademicSources(q);
      setPapers(results);
      setSuggestedQuery(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = project.sections[activeSection as ResearchSectionType] || '';
    }
  }, [activeSection]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onUpdateSection(activeSection, content);
      triggerContextAnalysis(content);
    }
  };

  const contextTimeoutRef = useRef<number | null>(null);
  const triggerContextAnalysis = (content: string) => {
    if (contextTimeoutRef.current) window.clearTimeout(contextTimeoutRef.current);
    if (content.length < 200) return;
    contextTimeoutRef.current = window.setTimeout(async () => {
      setIsAnalyzing(true);
      const query = await analyzeContextForSuggestions(content);
      if (query && query !== searchQuery) setSuggestedQuery(query);
      setIsAnalyzing(false);
    }, 5000);
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleCite = (source: GroundedSource) => {
    const paper: Paper = {
      id: Math.random().toString(36).substr(2, 9),
      title: source.title,
      authors: [source.authors],
      year: parseInt(source.year) || 2024,
      journal: "Academic Journal",
      abstract: source.summary
    };
    onAddCitation(paper);
    const formatted = formatCitation(paper, project.citationStyle);
    const currentRefs = project.sections['References'];
    onUpdateSection('References', currentRefs ? currentRefs + "<br><br>" + formatted : formatted);
  };

  const handleAddSection = () => {
    const name = prompt("Enter section title (e.g. Introduction, Abstract):");
    if (name && name.trim()) {
      onUpdateSection(name.trim(), "");
      setActiveSection(name.trim());
    }
  };

  return (
    <div className={`h-screen flex flex-col bg-white overflow-hidden ${isResizingLeft || isResizingRight ? 'cursor-col-resize select-none' : ''}`}>
      {/* GLOBAL TOP TOOLS */}
      <div className="h-14 border-b border-slate-100 flex items-center px-4 bg-white z-50 shrink-0">
        <button onClick={onBack} className="p-2 mr-4 text-slate-400 hover:text-slate-900 transition-colors">
          <LayoutGrid className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-slate-100 mr-4"></div>
        <div className="flex-1 flex items-center justify-center gap-1">
          <div className="text-[10px] font-black text-slate-300 mr-4 uppercase tracking-[0.2em] hidden md:block">Formatting Toolkit</div>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
            <button onClick={() => execCommand('bold')} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all" title="Bold"><Bold className="w-4 h-4" /></button>
            <button onClick={() => execCommand('italic')} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all" title="Italic"><Italic className="w-4 h-4" /></button>
            <button onClick={() => execCommand('underline')} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all" title="Underline"><Underline className="w-4 h-4" /></button>
            <button onClick={() => execCommand('strikethrough')} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all" title="Strikethrough"><Strikethrough className="w-4 h-4" /></button>
          </div>
          <div className="h-6 w-px bg-slate-100 mx-2"></div>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
             <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all" title="Bullets"><ListIcon className="w-4 h-4" /></button>
             <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all" title="Ordered"><ListOrdered className="w-4 h-4" /></button>
          </div>
          <div className="h-6 w-px bg-slate-100 mx-2"></div>
          <div className="relative">
            <button onClick={() => setShowHeadings(!showHeadings)} className="p-1.5 text-slate-400 hover:text-slate-900 transition-all flex items-center gap-1"><Type className="w-4 h-4" /><ChevronDown className="w-3 h-3" /></button>
            {showHeadings && (
              <div className="absolute top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-xl p-1 z-[60] flex flex-col min-w-[120px]">
                <button onClick={() => { execCommand('formatBlock', '<h1>'); setShowHeadings(false); }} className="text-left px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Header 1</button>
                <button onClick={() => { execCommand('formatBlock', '<h2>'); setShowHeadings(false); }} className="text-left px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Header 2</button>
                <button onClick={() => { execCommand('formatBlock', '<p>'); setShowHeadings(false); }} className="text-left px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Paragraph</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <button onClick={() => {}} className="text-xs font-bold text-slate-400 flex items-center gap-2 hover:text-slate-900 transition-colors"><Download className="w-3.5 h-3.5" /> Export</button>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-50 transition-all">Submit Manuscript</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <aside style={{ width: `${leftWidth}px` }} className="border-r border-slate-100 bg-white flex flex-col shrink-0 overflow-hidden relative">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center gap-2 mb-8 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
               <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Book className="w-4 h-4" /></div>
               <span className="text-sm font-black text-slate-900 tracking-tight truncate">Project &rarr;</span>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
               <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Manuscript Index</label>
               <button onClick={handleAddSection} className="text-blue-500 hover:text-blue-700 transition-colors">
                  <PlusCircle className="w-4 h-4" />
               </button>
            </div>

            <nav className="space-y-1">
              {sectionKeys.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`w-full text-left px-4 py-3 text-xs font-bold transition-all rounded-xl flex items-center justify-between group ${
                    activeSection === sec ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{sec}</span>
                  {activeSection === sec && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                </button>
              ))}
              {sectionKeys.length === 0 && (
                <div className="px-4 py-8 border-2 border-dashed border-slate-50 rounded-2xl text-center">
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">No sections created</p>
                </div>
              )}
            </nav>
          </div>

          {/* Workflow buttons at the bottom - NOW LEFT ALIGNED */}
          <div className="p-8 space-y-4 bg-white border-t border-slate-50">
            {WORKFLOW_SECTIONS.map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`w-full text-left py-2 px-2 text-xs font-bold transition-all flex items-center gap-3 ${
                  activeSection === sec 
                    ? 'text-blue-600' 
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                <div className={`w-1 h-1 rounded-full ${activeSection === sec ? 'bg-blue-600' : 'bg-transparent'}`} />
                {sec}
              </button>
            ))}
          </div>
        </aside>

        {/* LEFT RESIZER */}
        <div onMouseDown={startResizingLeft} className="w-0.5 hover:w-1 bg-slate-100 hover:bg-blue-400 cursor-col-resize transition-all shrink-0 z-30" />

        {/* MIDDLE PANEL: Simplified Editor Area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-12 md:p-24">
            <div className="max-w-3xl mx-auto min-h-screen">
               {/* Header removed for focus as per blueprint instructions */}
               <div
                 ref={editorRef}
                 contentEditable
                 onInput={handleInput}
                 className="w-full min-h-[70vh] outline-none text-slate-800 text-lg leading-[2] font-light editor-content"
                 placeholder={`Start orchestrating the ${activeSection}...`}
               />
            </div>
          </div>
        </main>

        {/* RIGHT RESIZER */}
        <div onMouseDown={startResizingRight} className="w-0.5 hover:w-1 bg-slate-100 hover:bg-blue-400 cursor-col-resize transition-all shrink-0 z-30" />

        {/* RIGHT PANEL: Source Engine */}
        <aside 
          style={{ width: isSourceOpen ? `${rightWidth}px` : '50px' }}
          className="flex flex-col border-l border-slate-100 transition-all shrink-0 bg-white"
        >
          <button onClick={() => setIsSourceOpen(!isSourceOpen)} className="h-10 border-b border-slate-100 flex items-center justify-center hover:bg-slate-50">
            {isSourceOpen ? <ChevronRight className="w-4 h-4 text-slate-300" /> : <ChevronLeft className="w-4 h-4 text-slate-300" />}
          </button>

          {isSourceOpen ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-6 border-b border-slate-100">
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search sources..."
                    className="w-full bg-slate-50 py-3 pl-4 pr-10 rounded-2xl border-2 border-transparent focus:border-blue-100 focus:bg-white transition-all text-xs font-bold"
                  />
                  <Search className="absolute right-3 top-3 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {papers.map((paper, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 p-5 rounded-[30px] shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all flex items-center justify-between group">
                    <div className="flex-1 mr-4">
                      <h4 className="text-xs font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{paper.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{paper.authors}</span>
                        <span className="text-[10px] font-medium text-slate-300 italic">{paper.year}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCite(paper)}
                      className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0 shadow-sm"
                      title="Quick Cite"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {!isSearching && papers.length === 0 && (
                  <div className="text-center py-20 px-8">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><History className="w-6 h-6 text-slate-200" /></div>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Library Search Idle</p>
                  </div>
                )}
                {isSearching && <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" /></div>}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center py-10 gap-20 text-slate-200">
               <Search className="w-5 h-5" />
               <div className="[writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-[0.5em] opacity-40">Source Intelligence</div>
            </div>
          )}
        </aside>
      </div>

      <style>{`
        .editor-content h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
        .editor-content h2 { font-size: 1.8rem; font-weight: 700; margin-bottom: 1.5rem; color: #1e293b; margin-top: 2.5rem; }
        .editor-content ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1.5rem; }
        .editor-content ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1.5rem; }
        .editor-content p { margin-bottom: 1.5rem; line-height: 2.2; }
        .editor-content:empty:before {
          content: attr(placeholder);
          color: #cbd5e1;
          font-style: italic;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
