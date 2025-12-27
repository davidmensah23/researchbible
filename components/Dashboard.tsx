
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, ResearchSectionType, Paper, Question } from '../types';
import { 
  Search, Wand2, Loader2, Plus, ArrowLeft, FileText, Bold, Italic, Underline, 
  Undo, Redo, Printer, AlignLeft, AlignCenter, AlignRight, 
  Sparkles, ChevronDown, ChevronRight, Maximize2, Minimize2,
  Languages, Info, Scissors, Share2, BarChart3, Users, Globe, FileDown, Table as TableIcon
} from 'lucide-react';
import { formatCitation, formatInTextCitation } from '../services/sourceService';
import { 
  searchAcademicSources, generateBackground, generateQuestionnaireJSON, 
  generateAnalysis, analyzeContextForSuggestions, GroundedSource 
} from '../services/geminiService';

interface DashboardProps {
  project: Project;
  onUpdateSection: (section: ResearchSectionType, content: string) => void;
  onAddCitation: (paper: Paper) => void;
  onBack: void;
}

const PAGE_HEIGHT = 1056; 
const PAGE_GAP = 40; 

const Dashboard: React.FC<DashboardProps> = ({ project, onUpdateSection, onAddCitation, onBack }) => {
  const sectionKeys = Object.keys(project.sections) as ResearchSectionType[];
  // Fix: Initialized with 'Abstract' instead of self-reference
  const [activeSection, setActiveSection] = useState<ResearchSectionType>('Abstract');
  const [searchQuery, setSearchQuery] = useState(project.title || project.theme);
  const [papers, setPapers] = useState<GroundedSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncingContext, setIsSyncingContext] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  
  const [stats, setStats] = useState({ words: 0, chars: 0, totalPages: 1, currentPage: 1 });
  const [toolbarState, setToolbarState] = useState({ bold: false, italic: false, underline: false, justifyLeft: true, justifyCenter: false, justifyRight: false, fontName: 'Arial', fontSize: '3' });

  const editorRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastActiveSectionRef = useRef<ResearchSectionType | null>(null);

  // --- EDITOR CORE ---
  const handleInput = useCallback(() => {
    if (editorRef.current && activeSection !== 'Questionnaire') {
      const currentHTML = editorRef.current.innerHTML;
      onUpdateSection(activeSection, currentHTML);
      calculateStats();
    }
  }, [activeSection, onUpdateSection]);

  const calculateStats = useCallback(() => {
    if (!editorRef.current || !viewportRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const contentHeight = editorRef.current.scrollHeight;
    const totalPages = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT));
    const scrollTop = viewportRef.current.scrollTop;
    const currentPage = Math.min(totalPages, Math.max(1, Math.ceil((scrollTop + 500) / (PAGE_HEIGHT + PAGE_GAP))));
    setStats({ words, chars: text.length, totalPages, currentPage });
  }, []);

  const updateToolbarState = useCallback(() => {
    if (typeof document === 'undefined') return;
    setToolbarState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      fontName: document.queryCommandValue('fontName').replace(/"/g, '') || 'Arial',
      fontSize: document.queryCommandValue('fontSize') || '3',
    });
    calculateStats();
  }, [calculateStats]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateToolbarState();
    handleInput();
  };

  useEffect(() => {
    if (editorRef.current && lastActiveSectionRef.current !== activeSection) {
      editorRef.current.innerHTML = project.sections[activeSection] || '';
      lastActiveSectionRef.current = activeSection;
      calculateStats();
      if (viewportRef.current) viewportRef.current.scrollTop = 0;
    }
  }, [activeSection, project.sections, calculateStats]);

  // --- QUESTIONNAIRE CORE ---
  const [questions, setQuestions] = useState<Question[]>(project.questions || []);
  const handleAddQuestion = () => {
    const newQ: Question = { id: Math.random().toString(), type: 'text', label: 'New Question' };
    setQuestions([...questions, newQ]);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      if (activeSection === 'Questionnaire') {
        const aiQs = await generateQuestionnaireJSON(project.title, project.methodology);
        setQuestions(aiQs);
      } else {
        const content = activeSection === 'Analysis' 
          ? await generateAnalysis(project.title, project.methodology)
          : await generateBackground(project.title, project.methodology);
        if (editorRef.current) {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = content;
          editorRef.current.appendChild(wrapper);
          handleInput();
        }
      }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  // --- SEARCH CORE ---
  const handleSearch = useCallback(async (customQuery?: string) => {
    const q = (customQuery || searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const results = await searchAcademicSources(q);
      setPapers(results);
    } catch (error) { console.error(error); } finally { setIsSearching(false); }
  }, [searchQuery]);

  const handleCite = (source: GroundedSource) => {
    // 1. Create paper object
    const paper: Paper = { 
      id: Math.random().toString(), 
      title: source.title, 
      authors: [source.authors], 
      year: parseInt(source.year) || 2024, 
      journal: "Scholarly Publication", 
      abstract: source.summary 
    };

    // 2. Add to project bibliography
    onAddCitation(paper);
    
    // 3. Format in-text citation based on index and style
    const citationIndex = project.references.length + 1;
    const inText = formatInTextCitation(paper, project.citationStyle, citationIndex);

    // 4. Insert directly at cursor in editor
    editorRef.current?.focus();
    execCommand('insertHTML', ` ${inText} `);
    
    // 5. Update References text section (bibliography)
    const refHtml = `<p style="margin-bottom: 1em;">${formatCitation(paper, project.citationStyle)}</p>`;
    onUpdateSection('References', (project.sections['References'] || '') + refHtml);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 z-50 flex flex-col shrink-0 shadow-sm print:hidden">
        <div className="h-14 px-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-lg group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-900 truncate max-w-[350px] leading-none uppercase tracking-tight">{project.title}</span>
                <div className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest">{project.methodology}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               Saved: {project.updatedAt}
            </div>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="h-11 border-t border-slate-100 px-5 flex items-center gap-1 bg-[#F8F9FA] overflow-x-auto no-scrollbar">
          <button onClick={() => execCommand('undo')} title="Undo" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><Undo className="w-4 h-4 text-slate-600" /></button>
          <button onClick={() => execCommand('redo')} title="Redo" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><Redo className="w-4 h-4 text-slate-600" /></button>
          <div className="w-px h-6 bg-slate-300 mx-2 shrink-0" />
          
          <button onClick={() => execCommand('bold')} className={`p-1.5 rounded-lg transition-colors ${toolbarState.bold ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'}`}><Bold className="w-4 h-4" /></button>
          <button onClick={() => execCommand('italic')} className={`p-1.5 rounded-lg transition-colors ${toolbarState.italic ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'}`}><Italic className="w-4 h-4" /></button>
          <button onClick={() => execCommand('underline')} className={`p-1.5 rounded-lg transition-colors ${toolbarState.underline ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-600'}`}><Underline className="w-4 h-4" /></button>
          
          <div className="w-px h-6 bg-slate-300 mx-2 shrink-0" />
          
          <button onClick={() => execCommand('justifyLeft')} className={`p-1.5 rounded-lg transition-colors ${toolbarState.justifyLeft ? 'bg-slate-200' : 'hover:bg-slate-200 text-slate-600'}`}><AlignLeft className="w-4 h-4" /></button>
          <button onClick={() => execCommand('justifyCenter')} className={`p-1.5 rounded-lg transition-colors ${toolbarState.justifyCenter ? 'bg-slate-200' : 'hover:bg-slate-200 text-slate-600'}`}><AlignCenter className="w-4 h-4" /></button>
          <button onClick={() => execCommand('justifyRight')} className={`p-1.5 rounded-lg transition-colors ${toolbarState.justifyRight ? 'bg-slate-200' : 'hover:bg-slate-200 text-slate-600'}`}><AlignRight className="w-4 h-4" /></button>
          
          <div className="w-px h-6 bg-slate-300 mx-2 shrink-0" />
          
          <button onClick={() => execCommand('insertHTML', '<table style="width:100%; border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 1em;"><tr><th style="border: 1px solid #ddd; padding: 8px;">Header</th><th style="border: 1px solid #ddd; padding: 8px;">Header</th></tr><tr><td style="border: 1px solid #ddd; padding: 8px;">Cell</td><td style="border: 1px solid #ddd; padding: 8px;">Cell</td></tr></table>')} title="Insert Table" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"><TableIcon className="w-4 h-4" /></button>
          <button onClick={insertPageBreak} title="Page Break" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"><Scissors className="w-4 h-4" /></button>
          
          <div className="w-px h-6 bg-slate-300 mx-2 shrink-0" />
          
          <button onClick={handleGenerateAI} disabled={isGenerating} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Assist
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT NAV: MANUSCRIPT STRUCTURE */}
        <aside style={{ width: isLeftPanelOpen ? '260px' : '0px' }} className="bg-white border-r border-slate-200 shrink-0 transition-all overflow-hidden print:hidden">
          <div className="p-6 flex flex-col h-full w-[260px]">
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8 px-2 flex items-center gap-2">
               <FileText className="w-3 h-3" /> Structure
             </span>
             <nav className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
                {sectionKeys.map((sec) => (
                  <button 
                    key={sec} 
                    onClick={() => setActiveSection(sec)} 
                    className={`w-full text-left px-4 py-3 text-xs font-bold transition-all rounded-2xl flex items-center gap-3 ${
                      activeSection === sec ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeSection === sec ? 'bg-blue-500 shadow-sm shadow-blue-200' : 'bg-slate-200'}`} />
                    <span className="truncate flex-1 tracking-tight">{sec}</span>
                  </button>
                ))}
             </nav>
             
             <div className="mt-6 pt-6 border-t border-slate-100">
                <button onClick={() => setIsLeftPanelOpen(false)} className="w-full py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                  Collapse View
                </button>
             </div>
          </div>
        </aside>

        {!isLeftPanelOpen && (
          <button onClick={() => setIsLeftPanelOpen(true)} className="fixed left-4 bottom-20 z-[60] bg-white border border-slate-200 p-3 rounded-full shadow-2xl text-slate-400 hover:text-blue-600 transition-all hover:scale-110 print:hidden">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* MIDDLE WORKSPACE: PAGINATED EDITOR */}
        <main ref={viewportRef} onScroll={calculateStats} className="flex-1 overflow-y-auto flex flex-col items-center bg-[#F1F3F4] relative pt-12 pb-48 scroll-smooth no-scrollbar">
          
          {activeSection === 'Questionnaire' ? (
            /* --- FORM BUILDER: DYNAMIC DATA COLLECTION --- */
            <div className="w-[816px] space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
                <div className="flex items-center justify-between mb-10">
                   <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Research Instrument</h2>
                     <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Instrument Type: {project.methodology}</p>
                   </div>
                   <div className="flex gap-2">
                     <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                        <Share2 className="w-4 h-4" /> Deploy Form
                     </button>
                   </div>
                </div>

                <div className="space-y-6">
                   {questions.map((q, idx) => (
                      <div key={q.id} className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 group hover:border-blue-200 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-50/50">
                         <div className="flex items-start gap-5 mb-4">
                            <span className="text-xs font-black text-slate-300 bg-white w-8 h-8 rounded-full flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                               {idx+1}
                            </span>
                            <div className="flex-1">
                               <input 
                                 type="text" 
                                 value={q.label} 
                                 onChange={(e) => {
                                   const next = [...questions];
                                   next[idx].label = e.target.value;
                                   setQuestions(next);
                                 }}
                                 placeholder="Enter research question..."
                                 className="w-full bg-transparent text-lg font-bold text-slate-800 outline-none border-b-2 border-transparent focus:border-blue-400 pb-1 transition-all"
                               />
                            </div>
                         </div>
                         <div className="flex items-center gap-3 ml-13">
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black uppercase text-slate-400 tracking-wider">
                               Type: {q.type}
                            </span>
                         </div>
                      </div>
                   ))}
                   <button onClick={handleAddQuestion} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all group">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">Append Custom Data Node</span>
                   </button>
                </div>
              </div>
            </div>
          ) : (
            /* --- DOCUMENT EDITOR: HIGH FIDELITY LAYOUT --- */
            <div className="paginated-container group relative">
               <div
                 ref={editorRef}
                 contentEditable
                 onInput={handleInput}
                 onKeyUp={updateToolbarState}
                 onMouseUp={updateToolbarState}
                 className="w-full outline-none text-[#334155] text-[17px] leading-[1.8] font-normal editor-content min-h-[1056px] relative z-20"
                 // Fix: Property 'placeholder' does not exist on type 'DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>'. 
                 // Using data-placeholder and updating CSS instead.
                 data-placeholder={`Begin your ${activeSection} manuscript...`}
                 spellCheck="true"
               />
               
               {/* Context Awareness Pulse */}
               {isSyncingContext && (
                 <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce z-[100] border border-white/20 print:hidden">
                   <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Orchestrating Manuscript Intelligence...</span>
                 </div>
               )}
            </div>
          )}
          
          {/* STATUS BAR: DOC ANALYTICS */}
          <div className="w-full h-10 bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-50 px-8 flex items-center justify-between text-[11px] font-bold text-slate-400 print:hidden shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-slate-300" />
                  <span>Page {stats.currentPage} of {stats.totalPages}</span>
               </div>
               <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-300" />
                  <span>{stats.words} words • {stats.chars} characters</span>
               </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-widest text-[9px] font-black">{project.citationStyle} CITATION ENGINE ACTIVE</span>
               </div>
               <div className="w-px h-4 bg-slate-200" />
               <div className="flex items-center gap-2"><Languages className="w-3.5 h-3.5" /> EN-US</div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: CITATION ENGINE & ANALYTICS */}
        <aside style={{ width: isSourceOpen ? '360px' : '0px' }} className="bg-white border-l border-slate-200 shrink-0 transition-all overflow-hidden print:hidden shadow-[-4px_0_25px_rgba(0,0,0,0.03)]">
           <div className="w-[360px] flex flex-col h-full">
              {activeSection === 'Questionnaire' ? (
                /* --- LIVE ANALYTICS ENGINE --- */
                <div className="p-8 flex flex-col h-full animate-in slide-in-from-right-8 duration-700">
                   <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5">
                         <BarChart3 className="w-4 h-4 text-blue-600" /> Response Flow
                      </h3>
                      <span className="text-[10px] font-black text-green-500 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">LIVE</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="p-6 bg-slate-900 rounded-[24px] shadow-xl shadow-slate-200">
                         <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-wider">Engagements</span>
                         <span className="text-2xl font-black text-white">1,248</span>
                      </div>
                      <div className="p-6 bg-blue-50 rounded-[24px] border border-blue-100">
                         <span className="text-[9px] font-black text-blue-400 uppercase block mb-1 tracking-wider">Submissions</span>
                         <span className="text-2xl font-black text-blue-900">42</span>
                      </div>
                   </div>

                   <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
                      <div className="space-y-3">
                         <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-500 uppercase tracking-tight">Instrument Reliability</span>
                            <span className="text-blue-600">α = 0.84</span>
                         </div>
                         <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[84%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                         </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 block">Geographical Distribution</span>
                         {[
                           { label: 'Cluster A: Academic Hubs', val: '64%' },
                           { label: 'Cluster B: Corporate Beta', val: '22%' },
                           { label: 'Cluster C: Unverified', val: '14%' }
                         ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all mb-2 cursor-pointer group">
                               <div className="flex items-center gap-4">
                                  <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                               </div>
                               <span className="text-[11px] font-black text-slate-900">{item.val}</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-8 mt-auto border-t border-slate-100">
                      <button className="w-full py-4 bg-slate-50 text-slate-900 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                         <FileDown className="w-4 h-4" /> Export Raw Dataset (XLS)
                      </button>
                   </div>
                </div>
              ) : (
                /* --- SOURCE ENGINE: ACADEMIC GROUNDING --- */
                <div className="p-8 flex flex-col h-full animate-in slide-in-from-right-8 duration-700">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-blue-600" /> Grounding Engine
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  </div>

                  <div className="relative mb-8 group">
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all"
                      placeholder="Contextual search..." 
                    />
                    <Search className="absolute right-4 top-4 w-4 h-4 text-slate-300 group-focus-within:text-blue-500" />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-5 no-scrollbar pr-1">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scraping Repositories...</span>
                      </div>
                    ) : papers.length > 0 ? papers.map((p, idx) => (
                      <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-2xl hover:shadow-blue-100/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                        <h4 className="text-[13px] font-black text-slate-900 leading-[1.3] mb-3 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                        <div className="flex items-center gap-3 mb-4">
                           <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase">{p.year}</span>
                           <span className="text-[10px] font-bold text-slate-400 truncate flex-1">{p.authors}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-3 mb-5 leading-relaxed italic">{p.summary}</p>
                        <button 
                          onMouseDown={(e) => e.preventDefault()} // Keeps focus in editor while clicking
                          onClick={() => handleCite(p)} 
                          className="w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-900 py-3 bg-slate-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" /> Automate Citation
                        </button>
                      </div>
                    )) : (
                      <div className="text-center py-20">
                         <Search className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">Enter keywords to ground your study in existing literature.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
           </div>
        </aside>
      </div>

      <style>{`
        .paginated-container {
          width: 816px;
          background: white;
          box-shadow: 0 4px 50px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.02);
          padding: 96px;
          border: 1px solid #e2e8f0;
          position: relative;
          background-image: linear-gradient(to bottom, transparent 0%, transparent ${PAGE_HEIGHT}px, #F1F3F4 ${PAGE_HEIGHT}px, #F1F3F4 ${PAGE_HEIGHT + PAGE_GAP}px);
          background-size: 100% ${PAGE_HEIGHT + PAGE_GAP}px;
          flex-shrink: 0;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        // Fix: content attr(data-placeholder) replaces content attr(placeholder)
        .editor-content:empty:before { content: attr(data-placeholder); color: #cbd5e1; font-style: italic; pointer-events: none; }
        
        /* High Fidelity Academic CSS Preservation */
        .editor-content h1, .editor-content h2, .editor-content h3 { font-family: 'Roboto', sans-serif; font-weight: 800; color: #0f172a; margin-top: 1.5em; margin-bottom: 0.8em; line-height: 1.2; }
        .editor-content h1 { font-size: 2.2em; text-align: center; border-bottom: 3px double #f1f5f9; padding-bottom: 0.5em; margin-bottom: 1.5em; }
        .editor-content h2 { font-size: 1.6em; border-left: 4px solid #3b82f6; padding-left: 15px; }
        .editor-content h3 { font-size: 1.3em; color: #475569; }
        .editor-content p { margin-bottom: 1.2em; text-align: justify; text-justify: inter-word; hyphens: auto; }
        .editor-content b, .editor-content strong { font-weight: 700; color: #1e293b; }
        .editor-content i, .editor-content em { font-style: italic; }
        .editor-content ul, .editor-content ol { padding-left: 2.5em; margin-bottom: 1.2em; }
        .editor-content ul { list-style-type: disc; }
        .editor-content ol { list-style-type: decimal; }
        .editor-content li { margin-bottom: 0.5em; }
        .editor-content table { width: 100%; border-collapse: collapse; margin-bottom: 1.5em; border: 1px solid #e2e8f0; font-size: 0.9em; }
        .editor-content th, .editor-content td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        .editor-content th { background-color: #f8fafc; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8em; color: #64748b; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .page-break {
          border: none;
          height: 40px;
          background-color: #F1F3F4;
          margin-left: -96px;
          margin-right: -96px;
          pointer-events: none;
          display: block;
        }

        @media print {
          body { background: white !important; }
          .paginated-container { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: none !important; }
          .page-break { page-break-after: always; display: block; height: 0; background: transparent; }
          aside, header, .fixed, .status-bar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

function insertPageBreak() {
  document.execCommand('insertHTML', false, '<hr class="page-break" />');
}

export default Dashboard;
