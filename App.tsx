
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppStep, Project, CitationStyle, Methodology, ResearchSectionType, Paper } from './types';
import Landing from './components/Landing';
import Config from './components/Config';
import TopicArchitect from './components/TopicArchitect';
import ProjectLibrary from './components/ProjectLibrary';
import Dashboard from './components/Dashboard';
import NewProjectModal from './components/NewProjectModal';
import { ingestManuscript } from './services/geminiService';
// @ts-ignore
import mammoth from 'mammoth';

const STORAGE_KEY = 'scholarflow_projects';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [pendingConfig, setPendingConfig] = useState<{style: CitationStyle, meth: Methodology} | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

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
      const arrayBuffer = await file.arrayBuffer();
      let htmlContent = "";

      if (file.name.endsWith('.docx')) {
        // Convert Word to HTML preserving formatting
        const result = await mammoth.convertToHtml({ arrayBuffer });
        htmlContent = result.value;
      } else {
        // Fallback for simple text files or others
        const reader = new FileReader();
        htmlContent = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.readAsText(file);
        });
      }

      // Pass formatted HTML to Gemini for section extraction
      const sections = await ingestManuscript(htmlContent);
      
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.replace(/\.[^/.]+$/, ""),
        theme: "Uploaded: " + file.name,
        citationStyle: CitationStyle.APA,
        methodology: Methodology.QUALITATIVE,
        sections: {
          'Abstract': sections['Abstract'] || '',
          'BTHS': sections['Background'] || '',
          'QE': '',
          'Method': sections['Methodology'] || '',
          'References': sections['References'] || '',
          'Questionnaire': '',
          'Analysis': '',
          'Draft': htmlContent // Store the full original HTML in Draft as a master copy
        } as any,
        questions: [],
        references: [],
        status: 'Draft',
        updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      setProjects(prev => [newProject, ...prev]);
      setIsUploading(false);
      setIsModalOpen(false);
      setStep(AppStep.PROJECT_LIBRARY);
    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
      alert("Failed to process manuscript. Please ensure it is a valid .docx file.");
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
        'BTHS': '',
        'QE': '',
        'Method': '',
        'References': '',
        'Questionnaire': '',
        'Analysis': '',
        'Draft': ''
      },
      questions: [],
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
    if (confirm("Delete manuscript?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  const goToLibrary = useCallback(() => setStep(AppStep.PROJECT_LIBRARY), []);

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
      {step === AppStep.TOPIC_ARCHITECT && <TopicArchitect onTopicFinalized={handleProjectCreated} />}
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
