'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CitationStyle, Methodology, Project } from '@/types';
import { Check, ChevronRight, Hash, Quote, Loader2, Sparkles, Wand2, Search, ArrowRight, Edit3 } from 'lucide-react';
import { suggestTopics } from '@/services/geminiService';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

enum CreateStep {
    CONFIG,
    TOPIC
}

export default function CreateProject() {
    const [step, setStep] = useState<CreateStep>(CreateStep.CONFIG);
    const [config, setConfig] = useState<{ style: CitationStyle, meth: Methodology } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleConfigComplete = (style: CitationStyle, meth: Methodology) => {
        setConfig({ style, meth });
        setStep(CreateStep.TOPIC);
    };

    const handleProjectCreated = async (topic: string, theme: string) => {
        if (!config) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Authentication error. Please login again.");
            return;
        }

        const newProjectPayload = {
            user_id: user.id,
            title: topic,
            theme: theme,
            citation_style: config.style,
            methodology: config.meth,
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
            bibliography: [],
            status: 'Draft'
        };

        const { data, error } = await supabase.from('projects').insert(newProjectPayload).select().single();

        if (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project.");
        } else if (data) {
            router.push(`/project/${data.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {step === CreateStep.CONFIG && (
                <ConfigView onComplete={handleConfigComplete} />
            )}
            {step === CreateStep.TOPIC && (
                <TopicArchitectView onTopicFinalized={handleProjectCreated} />
            )}
        </div>
    );
}

// --- Sub-components adapted from legacy ---

const ConfigView = ({ onComplete }: { onComplete: (s: CitationStyle, m: Methodology) => void }) => {
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
                                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${style === s ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-slate-100 hover:border-slate-200 text-slate-500'
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
                                className={`flex-1 py-4 px-6 rounded-xl text-xs font-bold transition-all ${meth === Methodology.QUALITATIVE ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Qualitative
                            </button>
                            <button
                                onClick={() => setMeth(Methodology.QUANTITATIVE)}
                                className={`flex-1 py-4 px-6 rounded-xl text-xs font-bold transition-all ${meth === Methodology.QUANTITATIVE ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
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

const TopicArchitectView = ({ onTopicFinalized }: { onTopicFinalized: (t: string, th: string) => void }) => {
    const [theme, setTheme] = useState('');
    const [loading, setLoading] = useState(false);
    const [topics, setTopics] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [editedTopic, setEditedTopic] = useState('');
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (theme.trim().length > 3) {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);

            setLoading(true);
            debounceTimer.current = setTimeout(async () => {
                try {
                    const results = await suggestTopics(theme);
                    setTopics(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            }, 800);
        } else {
            setTopics([]);
            setLoading(false);
        }

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [theme]);

    const handleSelectSuggestion = (topic: string) => {
        setSelectedTopic(topic);
        setEditedTopic(topic);
    };

    if (selectedTopic) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="max-w-xl w-full space-y-10 text-center">
                    <div className="space-y-4">
                        <div className="text-blue-600 bg-blue-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-blue-100">
                            <Edit3 className="w-8 h-8" />
                        </div>
                        <h2 className="heading-premium text-4xl text-slate-900 leading-tight">
                            Finalize <span className="font-editorial text-blue-600 italic px-1">Manuscript</span> Title
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">Refine your title before orchestrating the project.</p>
                    </div>

                    <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50">
                        <textarea
                            value={editedTopic}
                            onChange={(e) => setEditedTopic(e.target.value)}
                            className="w-full bg-transparent border-none text-center text-2xl font-bold text-slate-900 focus:ring-0 leading-relaxed resize-none p-0"
                            rows={4}
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => onTopicFinalized(editedTopic, theme)}
                            className="w-full bg-slate-900 hover:bg-blue-600 text-white py-6 rounded-[30px] font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200"
                        >
                            Create Project
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSelectedTopic(null)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            Return to suggestions
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-2xl w-full space-y-10">
                <div className="text-center space-y-4">
                    <div className="bg-white border border-slate-100 shadow-sm text-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Wand2 className="w-7 h-7" />
                    </div>
                    <h2 className="heading-premium text-4xl text-slate-900 tracking-tight">
                        Topic <span className="font-editorial text-blue-600 italic px-1">Architect</span>
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Start typing to see AI-orchestrated research titles in real-time.</p>
                </div>

                <div className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <div className="pl-6 text-slate-300">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="Describe your research theme (e.g., Quantum ethics)..."
                        className="flex-1 bg-transparent border-none outline-none py-6 px-4 text-slate-900 placeholder:text-slate-300 font-medium text-lg"
                    />
                    <div className="pr-6">
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : theme.trim().length > 0 ? (
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        ) : null}
                    </div>
                </div>

                {topics.length > 0 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <div className="flex items-center gap-4 px-2">
                            <h3 className="text-xs font-bold text-slate-400">Formal Suggestions</h3>
                            <div className="h-px flex-1 bg-slate-200"></div>
                        </div>
                        <div className="grid gap-4">
                            {topics.map((t, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelectSuggestion(t)}
                                    className="bg-white border border-slate-200 p-6 rounded-2xl text-left hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-blue-50 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-slate-700 font-bold group-hover:text-slate-900 leading-snug text-lg">{t}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : theme.trim().length > 3 && !loading ? (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-sm font-medium text-slate-400 italic font-editorial">Searching for formal themes...</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
