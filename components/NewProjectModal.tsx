
import React, { useRef } from 'react';
import { X, Wand2, Upload, FileText, File as FileIcon, Loader2 } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onStartFresh: () => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onStartFresh, onUpload, isUploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-12 text-center">
          <h2 className="heading-premium text-4xl text-slate-900 mb-2">New <span className="font-editorial text-blue-600 italic px-1">Project</span></h2>
          <p className="text-slate-500 font-medium mb-12">How would you like to begin your research orchestration?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={onStartFresh}
              disabled={isUploading}
              className="flex flex-col items-center p-10 rounded-[40px] border border-slate-100 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-50"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wand2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Architect from Scratch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Let Gemini help you refine a theme and build a structure from the ground up.</p>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex flex-col items-center p-10 rounded-[40px] border border-slate-100 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-50"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {isUploading ? <Loader2 className="w-8 h-8 text-slate-400 animate-spin" /> : <Upload className="w-8 h-8 text-slate-600" />}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Upload Manuscript</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Import a PDF or Word document. We'll extract and categorize it for editing.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx" 
                onChange={handleFileChange}
              />
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
              <FileIcon className="w-3.5 h-3.5" /> PDF Supported
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
              <FileText className="w-3.5 h-3.5" /> Word (DOCX)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
