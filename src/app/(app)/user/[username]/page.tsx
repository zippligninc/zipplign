
// src/app/(app)/user/[username]/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, Link as LinkIcon, Share2, Loader2, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, use } from 'react';
import type { User } from '@supabase/supabase-js';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);


type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  cover_url: string;
  website_url?: string;
  instagram_url?: string;
  zipping_count: number;
  zippers_count: number;
  likes_count: number;
};

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Unwrap the params Promise using React.use()
  const { username } = use(params);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [zippclips, setZippclips] = useState<any[]>([]);
  const [loadingClips, setLoadingClips] = useState(false);


  const fetchProfileAndFollowStatus = useCallback(async (loggedInUser: User | null) => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        throw profileError || new Error('Profile not found');
      }
      setProfile(profileData);

      // Fetch user's zippclips
      await fetchUserZippclips(profileData.id);

      if (loggedInUser && loggedInUser.id !== profileData.id) {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', loggedInUser.id)
          .eq('following_id', profileData.id)
          .single();
        
        if (followError && followError.code !== 'PGRST116') { // Ignore 'No rows found' error
            throw followError;
        }
        setIsFollowing(!!followData);
      }
    } catch (error) {
      if (error instanceof Error)
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      router.push('/home'); // Redirect if profile not found
    } finally {
      setLoading(false);
    }
  }, [username, router, toast]);

  const fetchUserZippclips = useCallback(async (userId: string) => {
    if (!supabase) return;
    
    try {
      setLoadingClips(true);
      const { data: clipsData, error: clipsError } = await supabase
        .from('zippclips')
        .select('id, media_url, media_type, created_at, likes, comments')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(9);

      if (clipsError) {
        console.error('Error fetching zippclips:', clipsError);
        setZippclips([]);
      } else {
        setZippclips(clipsData || []);
      }
    } catch (error) {
      console.error('Error fetching zippclips:', error);
      setZippclips([]);
    } finally {
      setLoadingClips(false);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        toast({
          title: 'Configuration Error',
          description: 'Database connection not available.',
          variant: 'destructive',
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      fetchProfileAndFollowStatus(session?.user ?? null);
    };
    checkUser();
  }, []);
  

  const handleFollow = async () => {
    if (!currentUser) {
        router.push('/login');
        return;
    }
    if (!profile) return;

    if (!supabase) {
      toast({
        title: 'Configuration Error',
        description: 'Database connection not available.',
        variant: 'destructive',
      });
      return;
    }

    setIsFollowLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUser.id, following_id: profile.id });

      if (error) {
        console.error('Follow error:', error);
        toast({ title: 'Error following user', description: error.message, variant: 'destructive' });
      } else {
        setIsFollowing(true);
        // Optimistically update counts, though triggers will handle it
        setProfile(p => p ? { ...p, zippers_count: p.zippers_count + 1 } : null);
        toast({ title: 'Success', description: `You are now following ${profile.full_name}`, variant: 'default' });
      }
    } catch (err) {
      console.error('Follow error:', err);
      toast({ title: 'Error', description: 'Failed to follow user', variant: 'destructive' });
    }
    setIsFollowLoading(false);
  };
  
  const handleUnfollow = async () => {
    if (!currentUser || !profile) return;

    if (!supabase) {
      toast({
        title: 'Configuration Error',
        description: 'Database connection not available.',
        variant: 'destructive',
      });
      return;
    }

    setIsFollowLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id);
        
      if (error) {
        console.error('Unfollow error:', error);
        toast({ title: 'Error unfollowing user', description: error.message, variant: 'destructive' });
      } else {
        setIsFollowing(false);
        // Optimistically update counts
        setProfile(p => p ? { ...p, zippers_count: Math.max(0, p.zippers_count - 1) } : null);
        toast({ title: 'Success', description: `You unfollowed ${profile.full_name}`, variant: 'default' });
      }
    } catch (err) {
      console.error('Unfollow error:', err);
      toast({ title: 'Error', description: 'Failed to unfollow user', variant: 'destructive' });
    }
    setIsFollowLoading(false);
  };


  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!profile) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <p>User not found.</p>
        </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="h-screen bg-black text-white pb-20 overflow-y-auto">
      {/* Dynamic Island */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-32 h-6 bg-black rounded-full"></div>
      </div>

      {/* Header with Navigation */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share2 className="h-5 w-5" />
        </Button>
      </header>

      {/* Cover Image */}
      <div className="relative h-40 w-full">
        <Image
          src={profile.cover_url || "https://picsum.photos/seed/cover/800/300"}
          alt="Cover image"
          fill
          className="object-cover"
        />
      </div>

      <div className="px-4 -mt-8 relative z-10">
        {/* Profile Picture and User Info */}
        <div className="flex items-end gap-3">
          <Avatar className="h-12 w-12 border-2 border-teal-400">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback className="bg-gray-600 text-white font-bold text-xs">
              {profile.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {/* User Info */}
          <div className="flex-1 pb-1">
            <h1 className="text-sm font-bold text-white">{profile.full_name}</h1>
            <p className="text-white/80 text-xs">@{profile.username}</p>
          </div>
        </div>
      </div>
          
      {/* Action Buttons */}
      <div className="px-4">
        <div className="flex items-center gap-2 mt-2">
          {!isOwnProfile && (
            <Button 
              className={`px-2 py-0.5 rounded-full text-xs ${
                isFollowing 
                  ? 'bg-gray-200 text-black hover:bg-gray-300' 
                  : 'bg-teal-500 hover:bg-teal-600 text-white'
              }`}
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : isFollowing ? (
                'Following'
              ) : (
                'Follow'
              )}
            </Button>
          )}
          <Button 
            variant="outline" 
            className="bg-gray-200 text-black hover:bg-gray-300 px-2 py-0.5 rounded-full text-xs"
            onClick={() => {
              if (!currentUser) {
                router.push('/login');
                return;
              }
              if (profile) {
                router.push(`/inbox/${profile.id}`);
              }
            }}
          >
            Message
          </Button>
          <Button variant="ghost" size="icon" className="text-white h-6 w-6">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
          </div>

      {/* Stats */}
      <div className="px-4">
        <div className="flex justify-around w-full mt-1 text-center border border-gray-600 rounded-lg p-1">
          <div>
            <p className="font-bold text-xs">{profile.zipping_count || 0}</p>
            <p className="text-xs text-white/70">zipping</p>
          </div>
          <div className="border-l border-gray-600 h-4 self-center" />
          <div>
            <p className="font-bold text-xs">{profile.zippers_count || 0}</p>
            <p className="text-xs text-white/70">zippers</p>
          </div>
          <div className="border-l border-gray-600 h-4 self-center" />
          <div>
            <p className="font-bold text-xs">{profile.likes_count || 0}</p>
            <p className="text-xs text-white/70">Like</p>
          </div>
        </div>
      </div>
          
      {/* Bio */}
      <div className="px-4">
          {profile.bio && (
          <div className="mt-1 text-center">
            <p className="text-white text-xs">
              {profile.bio} <Heart className="inline w-2.5 h-2.5 text-red-500 fill-current" />
            </p>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="px-4">
        <div className="mt-1 space-y-0.5">
          {profile.website_url && (
            <div className="flex items-center gap-1.5 text-white/80 text-xs">
              <LinkIcon className="w-2.5 h-2.5" />
              <span>{profile.website_url}</span>
            </div>
          )}
          {profile.instagram_url && (
            <div className="flex items-center gap-1.5 text-white/80 text-xs">
              <InstagramIcon className="w-2.5 h-2.5" />
              <span>Instagram</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="zippclip" className="w-full mt-1">
          <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-gray-600">
            <TabsTrigger 
              value="zippclip" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-teal-400 data-[state=active]:shadow-none rounded-none bg-transparent text-white text-xs h-4"
            >
              Zippclip
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-teal-400 data-[state=active]:shadow-none rounded-none bg-transparent text-white text-xs h-4"
            >
              Saved
            </TabsTrigger>
            <TabsTrigger 
              value="private" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-teal-400 data-[state=active]:shadow-none rounded-none bg-transparent text-white text-xs h-4"
            >
              Private
            </TabsTrigger>
            <TabsTrigger 
              value="likes" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-teal-400 data-[state=active]:shadow-none rounded-none bg-transparent text-white text-xs h-4"
            >
              Likes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="zippclip" className="pt-1 pb-20">
            {loadingClips ? (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[9/16] bg-gray-800 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : zippclips.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {zippclips.map((clip) => (
                  <div key={clip.id} className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden">
                    <Image
                      src={clip.media_url}
                      alt="Zippclip"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded-full">
                      <Eye className="w-3 h-3" />
                      <span>{clip.likes || 0}</span>
                    </div>
                  </div>
                ))}
                {/* Add more placeholder items to ensure scrolling */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="aspect-[9/16] bg-gray-800 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/70 text-sm">
                No zippclips yet.
              </div>
            )}
          </TabsContent>
          
            <TabsContent value="saved" className="pb-20">
            <div className="text-center py-8 text-white/70 text-sm">No saved videos.</div>
            </TabsContent>
          
            <TabsContent value="private" className="pb-20">
            <div className="text-center py-8 text-white/70 text-sm">No private videos.</div>
            </TabsContent>
          
            <TabsContent value="likes" className="pb-20">
            <div className="text-center py-8 text-white/70 text-sm">No liked videos.</div>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
