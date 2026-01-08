'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { User, MapPin, Link as LinkIcon, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { Project } from '@/types';

// Profile interface (matching the SQL schema)
interface Profile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    institution: string;
    website: string;
    created_at: string;
}

export default function UserProfilePage() {
    const { username } = useParams() as { username: string };
    const [profile, setProfile] = useState<Profile | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchProfileAndProjects() {
            setLoading(true);

            // 1. Fetch Profile by username
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (profileError || !profileData) {
                console.error("Profile not found", profileError);
                setLoading(false);
                return;
            }

            setProfile(profileData);

            // 2. Fetch PUBLISHED Projects by this user
            const { data: projectsData } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', profileData.id)
                .eq('status', 'Published') // Only show published works
                .order('created_at', { ascending: false });

            setProjects((projectsData as unknown as Project[]) || []);
            setLoading(false);
        }

        if (username) {
            fetchProfileAndProjects();
        }
    }, [username, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <User className="w-16 h-16 text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">User not found</h1>
                <p className="text-slate-500 mt-2">The researcher @{username} does not exist or has no public profile.</p>
                <Link href="/dashboard" className="mt-8 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-900 font-medium hover:bg-slate-50 transition-colors">
                    Back to ResearchBible
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Cover */}
            <div className="h-64 bg-gradient-to-r from-slate-900 to-slate-800 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>

            <div className="max-w-5xl mx-auto px-6 sm:px-8">
                <div className="flex flex-col md:flex-row gap-10 -mt-20 relative z-10">

                    {/* Left Column: Profile Info */}
                    <aside className="w-full md:w-80 flex-shrink-0">
                        <div className="bg-white p-2 rounded-[32px] shadow-xl shadow-slate-200/50 inline-block mb-6">
                            <div className="w-40 h-40 rounded-[28px] bg-slate-100 overflow-hidden relative">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-500">
                                        <User className="w-16 h-16" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{profile.full_name || profile.username}</h1>
                        <p className="text-lg text-slate-500 font-medium mb-6">@{profile.username}</p>

                        <div className="space-y-4 text-sm text-slate-600 mb-8 border-b border-slate-100 pb-8">
                            {profile.bio && <p className="leading-relaxed">{profile.bio}</p>}

                            {profile.institution && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span>{profile.institution}</span>
                                </div>
                            )}

                            {profile.website && (
                                <div className="flex items-center gap-3">
                                    <LinkIcon className="w-4 h-4 text-slate-400" />
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                        {profile.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </aside>

                    {/* Right Column: Published Works */}
                    <main className="flex-1 pt-0 md:pt-32 pb-20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                Published Research
                            </h2>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{projects.length} Works</span>
                        </div>

                        <div className="grid gap-6">
                            {projects.length > 0 ? projects.map(project => (
                                <Link key={project.id} href={`/project/${project.id}`} className="group block bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {project.methodology}
                                        </div>
                                        <span className="text-slate-400 text-xs font-medium">
                                            {new Date(project.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                                        {project.title}
                                    </h3>

                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6">
                                        {/* Fallback description if no abstract */}
                                        {project.theme || "A research study conducted using ResearchBible methods."}
                                    </p>

                                    <div className="flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        Read Full Study <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </Link>
                            )) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">No published works yet.</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
