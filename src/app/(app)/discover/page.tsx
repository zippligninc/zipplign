'use client';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, PlayCircle, TrendingUp, MapPin, Hash, Users, Video, Filter, Clock, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Zippclip {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  likes: number;
  description?: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url?: string;
  } | null;
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'users' | 'videos' | 'hashtags'>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [zippingClips, setZippingClips] = useState<Zippclip[]>([]);
  const [nearbyClips, setNearbyClips] = useState<Zippclip[]>([]);
  const [searchResults, setSearchResults] = useState<Zippclip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [trendingHashtags] = useState(['#dance', '#comedy', '#food', '#travel', '#music', '#pets']);
  const { toast } = useToast();

  useEffect(() => {
    fetchZippingClips();
    fetchNearbyClips();
    loadSearchHistory();
  }, []);

  const loadSearchHistory = () => {
    try {
      const savedHistory = localStorage.getItem('zipper_search_history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveToSearchHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('zipper_search_history', JSON.stringify(newHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('zipper_search_history');
  };

  const fetchZippingClips = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await supabase
        .from('zippclips')
        .select(`
          id,
          media_url,
          media_type,
          likes,
          description,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('likes', { ascending: false })
        .limit(20);

      if (error) throw error;
      const formattedClips: Zippclip[] = (data || []).map((clip: any) => ({
        id: clip.id,
        profiles: clip.profiles ? {
          username: clip.profiles.username || 'unknown',
          full_name: clip.profiles.full_name || 'Unknown User',
          avatar_url: clip.profiles.avatar_url || null
        } : null,
        description: clip.description || '',
        song: clip.song || 'Unknown Song',
        likes: Number(clip.likes) || 0,
        comments: Number(clip.comments) || 0,
        saves: Number(clip.saves) || 0,
        shares: Number(clip.shares) || 0,
        media_url: clip.media_url,
        media_type: clip.media_type || 'image',
        song_avatar_url: clip.song_avatar_url || null,
      }));
      setZippingClips(formattedClips);
    } catch (error: any) {
      console.error('Error fetching zipping clips:', error);
      toast({
        title: 'Error',
        description: 'Failed to load zipping content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyClips = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // For now, just fetch recent clips as "nearby"
      // In a real app, you'd use location data
      const { data, error } = await supabase
        .from('zippclips')
        .select(`
          id,
          media_url,
          media_type,
          likes,
          description,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      const formattedClips: Zippclip[] = (data || []).map((clip: any) => ({
        id: clip.id,
        profiles: clip.profiles ? {
          username: clip.profiles.username || 'unknown',
          full_name: clip.profiles.full_name || 'Unknown User',
          avatar_url: clip.profiles.avatar_url || null
        } : null,
        description: clip.description || '',
        song: clip.song || 'Unknown Song',
        likes: Number(clip.likes) || 0,
        comments: Number(clip.comments) || 0,
        saves: Number(clip.saves) || 0,
        shares: Number(clip.shares) || 0,
        media_url: clip.media_url,
        media_type: clip.media_type || 'image',
        song_avatar_url: clip.song_avatar_url || null,
      }));
      setNearbyClips(formattedClips);
    } catch (error: any) {
      console.error('Error fetching nearby clips:', error);
    }
  };

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setShowSearchHistory(false);
    
    // Save to history
    saveToSearchHistory(query.trim());

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await supabase
        .from('zippclips')
        .select(`
          id,
          description,
          media_url,
          media_type,
          likes,
          comments,
          saves,
          shares,
          song,
          song_avatar_url,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`description.ilike.%${query}%,profiles.username.ilike.%${query}%,profiles.full_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      const formattedClips: Zippclip[] = (data || []).map((clip: any) => ({
        id: clip.id,
        profiles: clip.profiles ? {
          username: clip.profiles.username || 'unknown',
          full_name: clip.profiles.full_name || 'Unknown User',
          avatar_url: clip.profiles.avatar_url || null
        } : null,
        description: clip.description || '',
        song: clip.song || 'Unknown Song',
        likes: Number(clip.likes) || 0,
        comments: Number(clip.comments) || 0,
        saves: Number(clip.saves) || 0,
        shares: Number(clip.shares) || 0,
        media_url: clip.media_url,
        media_type: clip.media_type || 'image',
        song_avatar_url: clip.song_avatar_url || null,
      }));
      setSearchResults(formattedClips);
    } catch (error: any) {
      console.error('Error searching clips:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search content',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(hashtag);
    setSearchType('hashtags');
    handleSearch(hashtag);
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    setShowSearchHistory(false);
    handleSearch(query);
  };

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'users': return <Users className="h-4 w-4" />;
      case 'videos': return <Video className="h-4 w-4" />;
      case 'hashtags': return <Hash className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-20 pt-4">
      <div className="container mx-auto px-4">
        {/* Enhanced Search Bar */}
        <div className="relative mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={`Search ${searchType === 'all' ? 'everything' : searchType}...`}
                className="pl-9 pr-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setShowSearchHistory(searchHistory.length > 0 && !searchQuery)}
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>
            
            {/* Search Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  {getSearchTypeIcon(searchType)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Search Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSearchType('all')}>
                  <Search className="mr-2 h-4 w-4" />
                  All Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchType('users')}>
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchType('videos')}>
                  <Video className="mr-2 h-4 w-4" />
                  Videos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchType('hashtags')}>
                  <Hash className="mr-2 h-4 w-4" />
                  Hashtags
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search History Dropdown */}
          {showSearchHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Recent Searches
                </span>
                <Button variant="ghost" size="sm" onClick={clearSearchHistory}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {searchHistory.map((query, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                    onClick={() => handleHistoryClick(query)}
                  >
                    {query}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trending Hashtags */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Zipping Topics
          </h3>
          <div className="flex gap-2 flex-wrap">
            {trendingHashtags.map((hashtag) => (
              <Badge
                key={hashtag}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleHashtagClick(hashtag)}
              >
                {hashtag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trending" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Zipping
            </TabsTrigger>
            <TabsTrigger value="near-you" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Near You
            </TabsTrigger>
            {searchResults.length > 0 && (
              <TabsTrigger value="search" className="flex items-center gap-1">
                <Search className="h-4 w-4" />
                Results ({searchResults.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="trending">
            <VideoGrid clips={zippingClips} loading={loading} />
          </TabsContent>

          <TabsContent value="near-you">
            <VideoGrid clips={nearbyClips} loading={loading} />
          </TabsContent>

          {searchResults.length > 0 && (
            <TabsContent value="search">
              <VideoGrid clips={searchResults} loading={searching} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

const VideoGrid = ({ clips, loading }: { clips: Zippclip[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No content found</p>
      </div>
    );
  }

  return (
  <div className="grid grid-cols-3 gap-0.5 pt-2">
      {clips.map((clip) => (
        <Link key={clip.id} href="/home" className="relative aspect-[9/16] group">
        <Image
            src={clip.media_url}
            alt={`Content by ${clip.profiles?.full_name || 'Unknown'}`}
            fill
            className="object-cover rounded-sm"
          />
          
          {/* Video indicator */}
          {clip.media_type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle className="h-8 w-8 text-white opacity-80" />
            </div>
          )}
          
          {/* Likes overlay */}
          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
            <div className="flex items-center gap-1">
              <span>❤️</span>
              <span>{clip.likes}</span>
            </div>
          </div>

          {/* User info overlay */}
          <div className="absolute top-1 left-1 right-1">
            <div className="flex items-center gap-1 text-white text-xs">
              <div className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                {clip.profiles?.avatar_url && (
                  <Image 
                    src={clip.profiles.avatar_url} 
                    alt="" 
                    width={16} 
                    height={16}
          className="object-cover"
        />
                )}
              </div>
              <span className="truncate">{clip.profiles?.username || 'Unknown'}</span>
            </div>
      </div>
        </Link>
    ))}
  </div>
);
};