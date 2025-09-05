import { supabase } from './supabase';

export interface SearchFilters {
  query?: string;
  media_type?: 'image' | 'video' | 'all';
  user_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  min_likes?: number;
  min_views?: number;
  sort_by?: 'recent' | 'popular' | 'trending' | 'likes' | 'views';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  user_id: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  song: string;
  song_avatar_url: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  views: number;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface SearchResponse {
  success: boolean;
  data?: SearchResult[];
  total?: number;
  error?: string;
}

/**
 * Search zippclips with advanced filtering
 */
export async function searchZippclips(filters: SearchFilters = {}): Promise<SearchResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    let query = supabase
      .from('zippclips')
      .select(`
        *,
        profiles!zippclips_user_id_fkey (
          username,
          full_name,
          avatar_url
        )
      `);

    // Apply filters
    if (filters.query) {
      query = query.or(`description.ilike.%${filters.query}%,song.ilike.%${filters.query}%`);
    }

    if (filters.media_type && filters.media_type !== 'all') {
      query = query.eq('media_type', filters.media_type);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.date_range) {
      query = query
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end);
    }

    if (filters.min_likes) {
      query = query.gte('likes', filters.min_likes);
    }

    if (filters.min_views) {
      query = query.gte('views', filters.min_views);
    }

    // Apply sorting
    switch (filters.sort_by) {
      case 'popular':
        query = query.order('likes', { ascending: false });
        break;
      case 'trending':
        // Trending = recent posts with high engagement
        query = query
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('likes', { ascending: false });
        break;
      case 'likes':
        query = query.order('likes', { ascending: false });
        break;
      case 'views':
        query = query.order('views', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || [],
      total: count || 0
    };
  } catch (error: any) {
    console.error('Error searching zippclips:', error);
    return {
      success: false,
      error: error.message || 'Failed to search zippclips'
    };
  }
}

/**
 * Search users
 */
export async function searchUsers(query: string, limit: number = 10): Promise<SearchResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        bio
      `)
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    console.error('Error searching users:', error);
    return {
      success: false,
      error: error.message || 'Failed to search users'
    };
  }
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(limit: number = 10): Promise<SearchResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Extract hashtags from descriptions and count them
    const { data, error } = await supabase
      .from('zippclips')
      .select('description')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      throw new Error(error.message);
    }

    // Process hashtags
    const hashtagCounts: { [key: string]: number } = {};
    data?.forEach(zippclip => {
      const hashtags = zippclip.description?.match(/#\w+/g) || [];
      hashtags.forEach(hashtag => {
        hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
      });
    });

    // Sort by count and return top hashtags
    const trendingHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([hashtag, count]) => ({
        hashtag,
        count,
        id: hashtag // For compatibility with SearchResult interface
      }));

    return {
      success: true,
      data: trendingHashtags as any
    };
  } catch (error: any) {
    console.error('Error getting trending hashtags:', error);
    return {
      success: false,
      error: error.message || 'Failed to get trending hashtags'
    };
  }
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query: string): Promise<SearchResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Get user suggestions
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('username, full_name')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(5);

    if (usersError) {
      throw new Error(usersError.message);
    }

    // Get hashtag suggestions
    const { data: zippclips, error: zippclipsError } = await supabase
      .from('zippclips')
      .select('description')
      .ilike('description', `%#${query}%`)
      .limit(5);

    if (zippclipsError) {
      throw new Error(zippclipsError.message);
    }

    // Extract hashtags
    const hashtags = new Set<string>();
    zippclips?.forEach(zippclip => {
      const matches = zippclip.description?.match(/#\w+/g) || [];
      matches.forEach(hashtag => {
        if (hashtag.toLowerCase().includes(query.toLowerCase())) {
          hashtags.add(hashtag);
        }
      });
    });

    const suggestions = [
      ...(users || []).map(user => ({
        type: 'user',
        value: user.username,
        label: `${user.full_name} (@${user.username})`
      })),
      ...Array.from(hashtags).map(hashtag => ({
        type: 'hashtag',
        value: hashtag,
        label: hashtag
      }))
    ];

    return {
      success: true,
      data: suggestions as any
    };
  } catch (error: any) {
    console.error('Error getting search suggestions:', error);
    return {
      success: false,
      error: error.message || 'Failed to get search suggestions'
    };
  }
}
