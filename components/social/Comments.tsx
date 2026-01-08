'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, User as UserIcon, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: {
        full_name: string;
        username: string;
        avatar_url: string;
    };
}

export default function CommentsSection({ projectId }: { projectId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchComments();
        checkUser();

        // Real-time subscription
        const channel = supabase.channel('comments')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments', filter: `project_id=eq.${projectId}` },
                () => fetchComments()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, [projectId]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUser(user.id);
    };

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles (full_name, username, avatar_url)
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setComments(data as any);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please sign in to comment.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('comments').insert({
            project_id: projectId,
            user_id: user.id,
            content: newComment
        });

        if (error) {
            console.error("Error posting comment:", error);
            alert("Failed to post comment.");
        } else {
            setNewComment('');
        }
        setLoading(false);
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (error) console.error("Error deleting comment:", error);
        else fetchComments(); // Refresh list immediately (realtime might tackle this too)
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-12 border-t border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Discussion ({comments.length})</h3>

            {/* Comment List */}
            <div className="space-y-8 mb-10">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className="flex-shrink-0">
                            {comment.profiles?.avatar_url ? (
                                <img src={comment.profiles.avatar_url} alt={comment.profiles.username} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 text-sm">
                                    {comment.profiles?.full_name || comment.profiles?.username || 'Unknown User'}
                                </span>
                                <span className="text-slate-400 text-xs">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                                {currentUser === comment.user_id && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="relative">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a thoughtful comment..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 min-h-[100px] resize-none transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !newComment.trim()}
                    className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
