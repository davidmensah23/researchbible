'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Project, Question } from '@/types';

export default function SurveyPage() {
    const { id } = useParams() as { id: string };
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchProject() {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error(error);
                setError("Survey not found or access denied.");
            } else {
                setProject(data);
            }
            setLoading(false);
        }
        fetchProject();
    }, [id, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project) return;
        setSubmitting(true);

        // Validate required fields (all text/mcq are implicitly required for this v1)
        const requiredIds = project.questions.map(q => q.id);
        const missing = requiredIds.filter(qid => !answers[qid] || answers[qid].trim() === '');

        if (missing.length > 0) {
            setError("Please answer all questions before submitting.");
            setSubmitting(false);
            return;
        }

        const { error } = await supabase.from('responses').insert({
            project_id: project.id,
            data: answers
        });

        if (error) {
            console.error(error);
            setError("Failed to submit response. Please try again.");
        } else {
            setSubmitted(true);
        }
        setSubmitting(false);
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (error) return <div className="h-screen flex items-center justify-center text-red-500 gap-2"><AlertCircle /> {error}</div>;
    if (submitted) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 gap-4 animate-in fade-in zoom-in duration-500">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h1 className="text-2xl font-bold">Thank you!</h1>
            <p className="text-slate-500">Your response has been recorded.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-2xl w-full bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                <header className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">{project?.title}</h1>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{project?.methodology} Study</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {project?.questions.map((q, idx) => (
                        <div key={q.id} className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">
                                {idx + 1}. {q.label}
                            </label>

                            {q.type === 'text' && (
                                <textarea
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                                    rows={3}
                                    value={answers[q.id] || ''}
                                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                    placeholder="Type your answer here..."
                                />
                            )}

                            {q.type === 'multiple-choice' && (
                                <div className="space-y-2">
                                    {q.options?.map((opt, i) => (
                                        <label key={i} className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={opt}
                                                checked={answers[q.id] === opt}
                                                onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                                                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Fallback for other types or ratings */}
                            {q.type !== 'text' && q.type !== 'multiple-choice' && (
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500"
                                    value={answers[q.id] || ''}
                                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}

                    <div className="pt-8 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Response'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
