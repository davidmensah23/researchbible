
import React, { useState, useEffect } from 'react';
import { Project, ResearchSectionType, Paper } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Book, 
  History, 
  Wand2, 
  Loader2, 
  Plus,
  ArrowRight,
  Download,
  LayoutGrid,
  Eye,
  Edit2,
  FileText,
  ExternalLink
} from 'lucide-react';
import { formatCitation } from '../services/sourceService';
import { generateBackground, searchAcademicSources, GroundedSource } from '../services/geminiService';

interface DashboardProps {
  project: Project;
  onUpdateSection: (section: ResearchSectionType, content: string) => void;
  onAddCitation: (paper: Paper) => void;
  onBack: () => void;
}

const SECTIONS: ResearchSectionType[] = ['Abstract', 'Background', 'Literature Review', 'Methodology', 'References'];

const Dashboard: React.FC<DashboardProps> = ({ project, onUpdateSection, onAddCitation, onBack }) => {
  const [activeSection, setActiveSection] = useState<ResearchSectionType>('Abstract');
  const [searchQuery, setSearchQuery] = useState(project.title || project.theme);
  const [papers, setPapers] = useState<GroundedSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'editor' | 'reader'>(project.sourceFile ? 'reader' : 'editor');

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchAcademicSources(searchQuery);
      setPapers(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCite = (source: GroundedSource) => {
    // Convert GroundedSource to Paper type for the citation engine
    const paper: Paper = {
      id: Math.random().toString(36).substr(2, 9),
      title: source.title,
      authors: [source.authors],
      year: parseInt(source.year) || new Date().getFullYear(),
      journal: "Scholarly Source",
      abstract: source.summary
    };

    onAddCitation(paper);
    const formatted = formatCitation(paper, project.citationStyle);
    const currentRefs = project.sections['References'];
    const newRefs = currentRefs ? currentRefs + "\n\n" + formatted : formatted;
    onUpdateSection('References', newRefs);
  };

  const handleGenerateBackground = async () => {
    setIsGenerating(true);
    try {
      const text = await generateBackground(project.title, project.methodology);
      onUpdateSection('Background', text);
      setActiveSection('Background');
      setViewMode('editor');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 shrink-0 bg-white z-20">
        <div className="flex items-center gap-5">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
            title="Library"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-100"></div>
          <div className="flex flex-col">
            <h1 className="font-bold text-slate-900 text-sm truncate max-w-[400px] tracking-tight">{project.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-600">
                {project.methodology} Methodology
              </span>
              <span className="text-[10px] text-slate-300">•</span>
              <span className="text-[10px] font-medium text-slate-400">
                {project.citationStyle} Standard
              </span>
            </div>
          </div>
        </div>

        {project.sourceFile && (
          <div className="flex bg-slate-50 p-1 rounded-full border border-slate-100">
            <button 
              onClick={() => setViewMode('reader')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${viewMode === 'reader' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              <Eye className="w-3 h-3" /> Reader
            </button>
            <button 
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${viewMode === 'editor' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              <Edit2 className="w-3 h-3" /> Editor
            </button>
          </div>
        )}

        <div className="flex items-center gap-6">
          <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-100">
            Sync Manuscript
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Outline */}
        <aside className="w-64 border-r border-slate-100 bg-white flex flex-col shrink-0">
          <div className="p-6">
            <label className="text-[11px] font-bold text-slate-300 block mb-6 px-1">Manuscript Sections</label>
            <nav className="space-y-1.5">
              {SECTIONS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => { setActiveSection(sec); setViewMode('editor'); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeSection === sec && viewMode === 'editor'
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-100 scale-[1.02]' 
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {sec}
                  {activeSection === sec && viewMode === 'editor' && <ArrowRight className="w-3.5 h-3.5 opacity-50" />}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto p-6 border-t border-slate-50 bg-slate-50/30">
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-300 mb-4 px-1">AI Research Assistant</p>
              <button 
                onClick={handleGenerateBackground}
                disabled={isGenerating}
                className="w-full bg-white hover:border-blue-200 border border-slate-200 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-all disabled:opacity-50 shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                Draft {activeSection}
              </button>
            </div>
          </div>
        </aside>

        {/* MIDDLE PANEL: Main View Area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div className="h-10 border-b border-slate-50 flex items-center px-8 bg-white shrink-0">
            <span className="font-editorial text-blue-600 italic text-sm">
              {viewMode === 'reader' ? `Reading: ${project.sourceFile?.name}` : `${activeSection} Manuscript Stage`}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'reader' && project.sourceFile ? (
              <div className="h-full bg-slate-100/50 flex flex-col">
                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                   <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-sm p-16 min-h-screen">
                      <div className="flex items-center gap-3 mb-12 text-slate-300">
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{project.sourceFile.type} DOCUMENT</span>
                      </div>
                      <h1 className="heading-premium text-4xl mb-6">{project.title}</h1>
                      <div className="space-y-8 text-slate-600 leading-[1.8] font-light">
                        {Object.values(project.sections).map((text, i) => (
                          text && (
                            <div key={i} className="animate-in fade-in duration-700">
                              <h3 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-widest">{SECTIONS[i]}</h3>
                              <p className="mb-8">{text}</p>
                            </div>
                          )
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-12 md:p-20">
                <div className="max-w-3xl mx-auto">
                  <h2 className="heading-premium text-4xl text-slate-900 mb-10 border-b border-slate-50 pb-6">
                    {activeSection} <span className="font-editorial text-slate-300 italic px-1">Draft</span>
                  </h2>
                  <textarea
                    value={project.sections[activeSection]}
                    onChange={(e) => onUpdateSection(activeSection, e.target.value)}
                    placeholder={`Begin typing the official ${activeSection.toLowerCase()} content here...`}
                    className="w-full h-[60vh] bg-transparent border-none focus:ring-0 text-slate-700 text-lg leading-[1.8] placeholder:text-slate-200 resize-none font-light"
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL: Source Engine (Live Search) */}
        <aside className={`${isSourceOpen ? 'w-80' : 'w-12'} border-l border-slate-100 flex flex-col transition-all duration-300 shrink-0 bg-white`}>
          <button 
            onClick={() => setIsSourceOpen(!isSourceOpen)}
            className="h-10 border-b border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
          >
            {isSourceOpen ? <ChevronRight className="w-4 h-4 text-slate-300" /> : <ChevronLeft className="w-4 h-4 text-slate-300" />}
          </button>

          {isSourceOpen && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-6 duration-500">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Live Source Engine</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search scholarly databases..."
                    className="w-full bg-slate-50 text-xs font-bold py-3 px-4 rounded-xl border-none focus:ring-1 focus:ring-blue-100 placeholder:text-slate-300"
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {papers.map((paper, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group border-l-2 border-l-transparent hover:border-l-blue-600">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug mb-3 group-hover:text-blue-600 transition-colors">{paper.title}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 max-w-[120px] truncate">{paper.authors}</span>
                      <span className="text-[10px] text-slate-200">•</span>
                      <span className="text-[10px] font-medium text-slate-400 italic font-editorial">{paper.year}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-4 line-clamp-3">{paper.summary}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCite(paper)}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg text-[10px] font-bold hover:bg-blue-600 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        Cite
                      </button>
                      <a 
                        href={paper.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 flex items-center justify-center border border-slate-100 text-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        title="View Source"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
                
                {!isSearching && papers.length === 0 && (
                  <div className="text-center py-20">
                    <History className="w-8 h-8 text-slate-100 mx-auto mb-4" />
                    <p className="text-xs text-slate-300 font-bold px-10 leading-relaxed italic font-editorial">Enter a research topic to search real publications and journals.</p>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[10px] font-bold text-slate-400">Project Bibliography</span>
                  <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">{project.references.length}</span>
                </div>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {project.references.map((r, i) => (
                    <div 
                      key={r.id} 
                      className="w-7 h-7 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm" 
                      title={r.title}
                    >
                      {r.authors[0][0]}
                    </div>
                  ))}
                  {project.references.length === 0 && (
                    <div className="text-xs font-medium text-slate-300 italic font-editorial px-1">Library empty...</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
