'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface VideoChainItem {
  id: string;
  user: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  song: string;
  created_at: string;
}

interface VideoChainProps {
  currentVideoId: string;
  onClose: () => void;
}

export function VideoChain({ currentVideoId, onClose }: VideoChainProps) {
  const [chain, setChain] = useState<VideoChainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideoChain();
  }, [currentVideoId]);

  const fetchVideoChain = async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      
      // Get the current video's parent chain
      const { data: currentVideo, error: currentError } = await supabase
        .from('zippclips')
        .select('parent_zippclip_id')
        .eq('id', currentVideoId)
        .single();

      if (currentError) {
        console.error('Error fetching current video:', currentError);
        return;
      }

      if (!currentVideo?.parent_zippclip_id) {
        setLoading(false);
        return;
      }

      // Build the chain by following parent relationships
      const chainItems: VideoChainItem[] = [];
      let currentParentId = currentVideo.parent_zippclip_id;

      while (currentParentId && chainItems.length < 5) { // Limit to 5 levels to prevent infinite loops
        const { data: parentVideo, error: parentError } = await supabase
          .from('zippclips')
          .select(`
            id,
            description,
            media_url,
            media_type,
            song,
            created_at,
            parent_zippclip_id,
            profiles:user_id (
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', currentParentId)
          .single();

        if (parentError || !parentVideo) {
          break;
        }

        chainItems.push({
          id: parentVideo.id,
          user: {
            username: parentVideo.profiles?.username || 'unknown',
            full_name: parentVideo.profiles?.full_name || 'Unknown User',
            avatar_url: parentVideo.profiles?.avatar_url || null
          },
          description: parentVideo.description || '',
          media_url: parentVideo.media_url,
          media_type: parentVideo.media_type || 'image',
          song: parentVideo.song || 'Unknown Song',
          created_at: parentVideo.created_at
        });

        currentParentId = parentVideo.parent_zippclip_id;
      }

      setChain(chainItems.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching video chain:', error);
      toast({
        title: 'Error',
        description: 'Failed to load video chain',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    // Do not show any loading UI; keep the top-left area clean for PiP
    return null;
  }

  if (chain.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 z-50 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-300 ${
      expanded ? 'w-80' : 'w-20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-white/20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <ChevronUp className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
          {expanded && (
            <span className="text-white text-sm font-medium">
              Zipper Chain ({chain.length})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chain Items */}
      {expanded && (
        <div className="max-h-96 overflow-y-auto">
          {chain.map((item, index) => (
            <div key={item.id} className="p-3 border-b border-white/10 last:border-b-0">
              <div className="flex items-start gap-3">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {item.user.avatar_url ? (
                    <Image
                      src={item.user.avatar_url}
                      alt={item.user.username}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {item.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium">
                      @{item.user.username}
                    </span>
                    <span className="text-white/60 text-xs">
                      #{chain.length - index}
                    </span>
                  </div>
                  
                  <p className="text-white/80 text-xs mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <span>🎵 {item.song}</span>
                  </div>
                </div>

                {/* Media Preview */}
                <div className="flex-shrink-0">
                  {item.media_type === 'video' ? (
                    <video
                      src={item.media_url}
                      className="w-12 h-12 rounded object-cover"
                      muted
                      loop
                    />
                  ) : (
                    <Image
                      src={item.media_url}
                      alt={item.description}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsed View */}
      {!expanded && (
        <div className="p-2">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {chain.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
