import React from 'react';
import { GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-30"></div>
      </div>

      <header className="absolute top-0 w-full p-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900 tracking-tight">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span>ScholarFlow</span>
        </div>
        <nav className="hidden md:flex gap-10 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-blue-600 transition-colors">Methodology</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Citations</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Archive</a>
        </nav>
      </header>

      <main className="relative z-10 text-center max-w-4xl px-6">
        <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold mb-10 border border-slate-100">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          The future of student research orchestration
        </div>

        <h1 className="heading-premium text-6xl md:text-8xl text-slate-900 leading-[0.95] mb-8">
          Master your <br />
          <span className="font-editorial text-blue-600 px-2 italic">academic</span> flow
        </h1>

        <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed font-light">
          An orchestrated workspace for modern researchers. From <span className="font-editorial text-slate-800 italic text-xl">AI-driven</span> topics to real-time manuscript automation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth"
            className="group bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide transition-all duration-300 shadow-2xl shadow-slate-200 hover:shadow-blue-200 flex items-center gap-3"
          >
            Create New Project
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 rounded-full font-bold text-sm text-slate-500 hover:text-slate-900 transition-colors">
            View Live Demo
          </button>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-left pt-16 border-t border-slate-50">
          <div>
            <div className="w-8 h-1 bg-blue-600 mb-4 rounded-full"></div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Topic Architect</h3>
            <p className="text-sm leading-relaxed text-slate-500 font-medium">AI-orchestrated titles ready for publication, generated as you type.</p>
          </div>
          <div>
            <div className="w-8 h-1 bg-slate-200 mb-4 rounded-full"></div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Source Engine</h3>
            <p className="text-sm leading-relaxed text-slate-500 font-medium">Real-time database scraping with one-click automated citations.</p>
          </div>
          <div>
            <div className="w-8 h-1 bg-slate-200 mb-4 rounded-full"></div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Drafting Suite</h3>
            <p className="text-sm leading-relaxed text-slate-500 font-medium">A structured writing environment built for speed and academic precision.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
