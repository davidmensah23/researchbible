
import React, { useState } from 'react';
import { CitationStyle, Methodology } from '../types';
import { Check, ChevronRight, Hash, Quote } from 'lucide-react';

interface ConfigProps {
  onComplete: (style: CitationStyle, methodology: Methodology) => void;
}

const Config: React.FC<ConfigProps> = ({ onComplete }) => {
  const [style, setStyle] = useState<CitationStyle>(CitationStyle.APA);
  const [meth, setMeth] = useState<Methodology>(Methodology.QUALITATIVE);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="mb-14">
          <h2 className="heading-premium text-4xl text-slate-900 mb-3 leading-tight">
            Project <span className="font-editorial text-blue-600 italic px-1">Structural</span> Settings
          </h2>
          <p className="text-slate-500 text-sm font-medium">Define your foundation before architecting your theme.</p>
        </div>

        <div className="space-y-12">
          <section>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-5">
              <Quote className="w-4 h-4 text-blue-600" />
              Citation Standards
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(CitationStyle).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                    style === s ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="font-bold text-sm tracking-tight">{s} Style</span>
                  {style === s && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-5">
              <Hash className="w-4 h-4 text-blue-600" />
              Methodological Approach
            </label>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button
                onClick={() => setMeth(Methodology.QUALITATIVE)}
                className={`flex-1 py-4 px-6 rounded-xl text-xs font-bold transition-all ${
                  meth === Methodology.QUALITATIVE ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Qualitative
              </button>
              <button
                onClick={() => setMeth(Methodology.QUANTITATIVE)}
                className={`flex-1 py-4 px-6 rounded-xl text-xs font-bold transition-all ${
                  meth === Methodology.QUANTITATIVE ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Quantitative
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-400 leading-relaxed font-medium">
              {meth === Methodology.QUALITATIVE 
                ? 'Focuses on understanding human experience, behaviors, and social phenomena through depth.' 
                : 'Focuses on numerical data, statistical significance, and empirical analysis through scale.'}
            </p>
          </section>

          <button
            onClick={() => onComplete(style, meth)}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            Enter Architect
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Config;
