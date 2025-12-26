
import React, { useState, useCallback, useMemo } from 'react';
import { AppStep, Project, CitationStyle, Methodology, ResearchSectionType, Paper } from './types';
import Landing from './components/Landing';
import Config from './components/Config';
import TopicArchitect from './components/TopicArchitect';
import ProjectLibrary from './components/ProjectLibrary';
import Dashboard from './components/Dashboard';
import NewProjectModal from './components/NewProjectModal';
import { ingestManuscript } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [pendingConfig, setPendingConfig] = useState<{style: CitationStyle, meth: Methodology} | null>(null);

  const currentProject = useMemo(() => 
    projects.find(p => p.id === currentProjectId) || null
  , [projects, currentProjectId]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const startNewProjectFlow = useCallback(() => {
    setIsModalOpen(false);
    setStep(AppStep.CONFIG);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      // In a real app, we'd use a PDF parser here. For this MVP, we simulate reading text.
      // We'll use the file name as the title and process placeholder text with Gemini.
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = (e.target?.result as string) || "Sample manuscript content...";
        const sections = await ingestManuscript(text);
        
        const newProject: Project = {
          id: Math.random().toString(36).substr(2, 9),
          title: file.name.replace(/\.[^/.]+$/, ""),
          theme: "Uploaded manuscript",
          citationStyle: CitationStyle.APA,
          methodology: Methodology.QUALITATIVE,
          sections: sections,
          references: [],
          status: 'Draft',
          updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          sourceFile: {
            name: file.name,
            type: file.type,
            data: URL.createObjectURL(file)
          }
        };

        setProjects(prev => [newProject, ...prev]);
        setIsUploading(false);
        setIsModalOpen(false);
        setStep(AppStep.PROJECT_LIBRARY);
      };
      reader.readAsText(file.slice(0, 10000)); // Sample start of file for context
    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
    }
  }, []);

  const handleConfigComplete = useCallback((style: CitationStyle, meth: Methodology) => {
    setPendingConfig({ style, meth });
    setStep(AppStep.TOPIC_ARCHITECT);
  }, []);

  const handleProjectCreated = useCallback((topic: string, theme: string) => {
    if (!pendingConfig) return;

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: topic,
      theme: theme,
      citationStyle: pendingConfig.style,
      methodology: pendingConfig.meth,
      sections: {
        'Abstract': '',
        'Background': '',
        'Literature Review': '',
        'Methodology': '',
        'References': ''
      },
      references: [],
      status: 'Draft',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setProjects(prev => [newProject, ...prev]);
    setPendingConfig(null);
    setStep(AppStep.PROJECT_LIBRARY);
  }, [pendingConfig]);

  const selectProject = useCallback((id: string) => {
    setCurrentProjectId(id);
    setStep(AppStep.DASHBOARD);
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const goToLibrary = useCallback(() => {
    setStep(AppStep.PROJECT_LIBRARY);
  }, []);

  const updateSection = useCallback((section: ResearchSectionType, content: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          sections: { ...p.sections, [section]: content },
          updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
      return p;
    }));
  }, [currentProjectId]);

  const addCitation = useCallback((paper: Paper) => {
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        if (p.references.find(ref => ref.id === paper.id)) return p;
        return {
          ...p,
          references: [...p.references, paper],
          updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
      return p;
    }));
  }, [currentProjectId]);

  return (
    <div className="min-h-screen bg-white">
      {isModalOpen && (
        <NewProjectModal 
          onClose={closeModal} 
          onStartFresh={startNewProjectFlow} 
          onUpload={handleUpload}
          isUploading={isUploading}
        />
      )}
      
      {step === AppStep.LANDING && <Landing onStart={openModal} />}
      {step === AppStep.CONFIG && <Config onComplete={handleConfigComplete} />}
      {step === AppStep.TOPIC_ARCHITECT && (
        <TopicArchitect onTopicFinalized={handleProjectCreated} />
      )}
      {step === AppStep.PROJECT_LIBRARY && (
        <ProjectLibrary 
          projects={projects} 
          onSelect={selectProject} 
          onDelete={deleteProject}
          onCreateNew={openModal}
        />
      )}
      {step === AppStep.DASHBOARD && currentProject && (
        <Dashboard 
          project={currentProject} 
          onUpdateSection={updateSection} 
          onAddCitation={addCitation}
          onBack={goToLibrary}
        />
      )}
    </div>
  );
};

export default App;
