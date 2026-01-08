'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface LikeButtonProps {
    projectId: string;
    initialLikes?: number;
}

export default function LikeButton({ projectId, initialLikes = 0 }: LikeButtonProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        checkLikeStatus();
        fetchLikeCount();
    }, [projectId]);

    const checkLikeStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('project_likes')
            .select('*')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();

        if (data) setIsLiked(true);
    };

    const fetchLikeCount = async () => {
        const { count } = await supabase
            .from('project_likes')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

        if (count !== null) setLikes(count);
    };

    const toggleLike = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("Please sign in to like this project.");
            setLoading(false);
            return;
        }

        // Optimistic Update
        const previousLiked = isLiked;
        const previousCount = likes;
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);

        try {
            if (previousLiked) {
                // Remove Like
                const { error } = await supabase
                    .from('project_likes')
                    .delete()
                    .eq('project_id', projectId)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                // Add Like
                const { error } = await supabase
                    .from('project_likes')
                    .insert({ project_id: projectId, user_id: user.id });
                if (error) throw error;
            }
        } catch (err) {
            console.error("Failed to toggle like", err);
            // Revert on error
            setIsLiked(previousLiked);
            setLikes(previousCount);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleLike}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 ${isLiked
                    ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-white hover:shadow-md'
                }`}
        >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-bold">{likes}</span>
        </button>
    );
}
