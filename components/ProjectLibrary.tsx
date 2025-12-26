
import React from 'react';
import { Project } from '../types';
import { Plus, LayoutGrid, Trash2, Share2, Globe } from 'lucide-react';

interface ProjectLibraryProps {
  projects: Project[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const ProjectLibrary: React.FC<ProjectLibraryProps> = ({ projects, onSelect, onDelete, onCreateNew }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="h-20 bg-white border-b border-slate-100 px-10 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-slate-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Globe className="w-5 h-5 text-white" />
            </div>
            ScholarFlow
          </div>
          <nav className="flex gap-8">
            <button className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-1">Library</button>
            <button className="text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors">Shared</button>
            <button className="text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors">Archive</button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4 hidden md:flex">
            <span className="text-sm font-bold text-slate-900 leading-tight">Alex Researcher</span>
            <span className="text-[10px] font-medium text-slate-400">Master Candidate</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center text-slate-500 font-bold text-xs">
            AR
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h2 className="heading-premium text-4xl text-slate-900">
              My <span className="font-editorial text-blue-600 italic px-1">Projects</span>
            </h2>
            <p className="text-sm font-medium text-slate-400">Orchestrating {projects.length} manuscript studies</p>
          </div>
          
          <button 
            onClick={onCreateNew}
            className="bg-slate-900 hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all shadow-xl shadow-slate-200"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-100 rounded-[40px] flex items-center justify-center text-slate-300">
              <LayoutGrid className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">No Projects Found</h3>
              <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">Your research library is empty. Start by architecting a new formal manuscript study.</p>
            </div>
            <button 
              onClick={onCreateNew}
              className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors"
            >
              Architect a Project Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map((project, index) => (
              <div 
                key={project.id}
                className="group relative bg-white border border-slate-100 rounded-[40px] p-8 flex flex-col min-h-[400px] shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 cursor-pointer border-l-2 border-l-transparent hover:border-l-blue-600"
                onClick={() => onSelect(project.id)}
              >
                {/* Number Indicator from Sketch */}
                <div className="absolute top-8 right-8 text-6xl font-black text-slate-50 select-none group-hover:text-blue-50 transition-colors">
                  {index + 1}
                </div>

                <div className="flex-1 flex flex-col justify-between relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        project.status === 'Draft' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {project.status}
                      </span>
                      <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                        {project.methodology}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                      {project.title}
                    </h3>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-300">Last Modified</span>
                        <span className="text-xs font-bold text-slate-500">{project.updatedAt}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectLibrary;
