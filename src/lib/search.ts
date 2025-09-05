import { supabase } from './supabase';

export interface SearchFilters {
  query?: string;
  type?: 'all' | 'users' | 'zippclips' | 'sounds';
  sortBy?: 'recent' | 'popular' | 'zipping';
  timeRange?: 'all' | 'today' | 'week' | 'month';
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
}

export interface SearchResult {
  id: string;
  type: 'user' | 'zippclip' | 'sound';
  title: string;
  description?: string;
  image?: string;
  metadata?: any;
  relevanceScore?: number;
}

export class SearchService {
  static async search(filters: SearchFilters): Promise<SearchResult[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const results: SearchResult[] = [];

    try {
      // Search users
      if (!filters.type || filters.type === 'all' || filters.type === 'users') {
        const userResults = await this.searchUsers(filters);
        results.push(...userResults);
      }

      // Search zippclips
      if (!filters.type || filters.type === 'all' || filters.type === 'zippclips') {
        const zippclipResults = await this.searchZippclips(filters);
        results.push(...zippclipResults);
      }

      // Search sounds (songs)
      if (!filters.type || filters.type === 'all' || filters.type === 'sounds') {
        const soundResults = await this.searchSounds(filters);
        results.push(...soundResults);
      }

      // Sort results by relevance
      return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search failed');
    }
  }

  private static async searchUsers(filters: SearchFilters): Promise<SearchResult[]> {
    if (!filters.query) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio')
      .or(`username.ilike.%${filters.query}%,full_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`)
      .limit(20);

    if (error) {
      console.error('User search error:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.full_name || user.username,
      description: user.bio || `@${user.username}`,
      image: user.avatar_url,
      metadata: { username: user.username },
      relevanceScore: this.calculateRelevanceScore(filters.query!, user.full_name || user.username)
    }));
  }

  private static async searchZippclips(filters: SearchFilters): Promise<SearchResult[]> {
    if (!filters.query) return [];

    let query = supabase
      .from('zippclips')
      .select(`
        id, description, media_url, media_type, created_at, likes, comments,
        profiles!inner(id, username, full_name, avatar_url)
      `)
      .or(`description.ilike.%${filters.query}%`)
      .limit(20);

    // Apply time filter
    if (filters.timeRange && filters.timeRange !== 'all') {
      const timeFilter = this.getTimeFilter(filters.timeRange);
      query = query.gte('created_at', timeFilter);
    }

    // Apply sorting
    if (filters.sortBy === 'popular') {
      query = query.order('likes', { ascending: false });
    } else if (filters.sortBy === 'zipping') {
      // Zipping = recent + high engagement
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Zippclip search error:', error);
      return [];
    }

    return data.map(clip => ({
      id: clip.id,
      type: 'zippclip' as const,
      title: clip.description || 'Untitled Zippclip',
      description: `by @${clip.profiles.username}`,
      image: clip.media_url,
      metadata: {
        mediaType: clip.media_type,
        likes: clip.likes,
        comments: clip.comments,
        createdAt: clip.created_at,
        user: clip.profiles
      },
      relevanceScore: this.calculateRelevanceScore(filters.query!, clip.description || '')
    }));
  }

  private static async searchSounds(filters: SearchFilters): Promise<SearchResult[]> {
    if (!filters.query) return [];

    const { data, error } = await supabase
      .from('zippclips')
      .select('id, song, song_avatar_url, media_url')
      .not('song', 'is', null)
      .ilike('song', `%${filters.query}%`)
      .limit(20);

    if (error) {
      console.error('Sound search error:', error);
      return [];
    }

    // Group by song name to avoid duplicates
    const uniqueSounds = new Map();
    data.forEach(clip => {
      if (clip.song && !uniqueSounds.has(clip.song)) {
        uniqueSounds.set(clip.song, clip);
      }
    });

    return Array.from(uniqueSounds.values()).map(clip => ({
      id: clip.id,
      type: 'sound' as const,
      title: clip.song,
      description: 'Original Sound',
      image: clip.song_avatar_url || clip.media_url,
      metadata: { song: clip.song },
      relevanceScore: this.calculateRelevanceScore(filters.query!, clip.song)
    }));
  }

  private static calculateRelevanceScore(query: string, text: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match gets highest score
    if (textLower === queryLower) return 100;
    
    // Starts with query gets high score
    if (textLower.startsWith(queryLower)) return 80;
    
    // Contains query gets medium score
    if (textLower.includes(queryLower)) return 60;
    
    // Word boundary match gets lower score
    const words = textLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    
    let wordMatches = 0;
    queryWords.forEach(queryWord => {
      if (words.some(word => word.includes(queryWord))) {
        wordMatches++;
      }
    });
    
    return (wordMatches / queryWords.length) * 40;
  }

  private static getTimeFilter(timeRange: string): string {
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  }

  // Get zipping searches
  static async getTrendingSearches(): Promise<string[]> {
    // This would typically come from analytics data
    // For now, return some mock trending searches
    return [
      'dance',
      'comedy',
      'cooking',
      'travel',
      'music',
      'art',
      'fitness',
      'fashion'
    ];
  }

  // Get search suggestions
  static async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);

      if (error) {
        console.error('Search suggestions error:', error);
        return [];
      }

      const suggestions = data.map(user => user.full_name || user.username);
      
      // Add some generic suggestions
      const genericSuggestions = [
        'zipping',
        'new',
        'popular',
        'funny',
        'dance'
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      );

      return [...suggestions, ...genericSuggestions].slice(0, 8);
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }
}
