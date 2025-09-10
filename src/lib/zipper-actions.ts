// Zipper actions for managing video chains and zipper counts
import { supabase } from './supabase';

export interface ZipperActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Get the zipper count for a video (how many people have "ridden" it)
export async function getZipperCount(zippclipId: string): Promise<ZipperActionResponse> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database connection not available' };
    }

    const { count, error } = await supabase
      .from('zippclips')
      .select('id', { count: 'exact' })
      .eq('parent_zippclip_id', zippclipId);

    if (error) {
      console.error('Error fetching zipper count:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: { zippers: count || 0 } 
    };
  } catch (error) {
    console.error('Error in getZipperCount:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Get the full zipper chain for a video
export async function getZipperChain(zippclipId: string): Promise<ZipperActionResponse> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database connection not available' };
    }

    const chain: any[] = [];
    let currentId = zippclipId;
    let depth = 0;
    const maxDepth = 10; // Prevent infinite loops

    while (currentId && depth < maxDepth) {
      const { data: zippclip, error } = await supabase
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
        .eq('id', currentId)
        .single();

      if (error || !zippclip) {
        break;
      }

      chain.push({
        id: zippclip.id,
        user: {
          username: zippclip.profiles?.username || 'unknown',
          full_name: zippclip.profiles?.full_name || 'Unknown User',
          avatar_url: zippclip.profiles?.avatar_url || null
        },
        description: zippclip.description || '',
        media_url: zippclip.media_url,
        media_type: zippclip.media_type || 'image',
        song: zippclip.song || 'Unknown Song',
        created_at: zippclip.created_at,
        depth: depth
      });

      currentId = zippclip.parent_zippclip_id;
      depth++;
    }

    return { 
      success: true, 
      data: { chain: chain.reverse() } // Reverse to show oldest first
    };
  } catch (error) {
    console.error('Error in getZipperChain:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Get all zippers (children) of a video
export async function getZippers(zippclipId: string, limit: number = 20): Promise<ZipperActionResponse> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database connection not available' };
    }

    const { data, error } = await supabase
      .from('zippclips')
      .select(`
        id,
        description,
        media_url,
        media_type,
        song,
        created_at,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('parent_zippclip_id', zippclipId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching zippers:', error);
      return { success: false, error: error.message };
    }

    const zippers = (data || []).map((zippclip: any) => ({
      id: zippclip.id,
      user: {
        username: zippclip.profiles?.username || 'unknown',
        full_name: zippclip.profiles?.full_name || 'Unknown User',
        avatar_url: zippclip.profiles?.avatar_url || null
      },
      description: zippclip.description || '',
      media_url: zippclip.media_url,
      media_type: zippclip.media_type || 'image',
      song: zippclip.song || 'Unknown Song',
      created_at: zippclip.created_at
    }));

    return { 
      success: true, 
      data: { zippers } 
    };
  } catch (error) {
    console.error('Error in getZippers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Get the original video in a chain (the root)
export async function getOriginalVideo(zippclipId: string): Promise<ZipperActionResponse> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database connection not available' };
    }

    let currentId = zippclipId;
    let depth = 0;
    const maxDepth = 10; // Prevent infinite loops

    while (currentId && depth < maxDepth) {
      const { data: zippclip, error } = await supabase
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
        .eq('id', currentId)
        .single();

      if (error || !zippclip) {
        break;
      }

      // If this video has no parent, it's the original
      if (!zippclip.parent_zippclip_id) {
        return { 
          success: true, 
          data: {
            id: zippclip.id,
            user: {
              username: zippclip.profiles?.username || 'unknown',
              full_name: zippclip.profiles?.full_name || 'Unknown User',
              avatar_url: zippclip.profiles?.avatar_url || null
            },
            description: zippclip.description || '',
            media_url: zippclip.media_url,
            media_type: zippclip.media_type || 'image',
            song: zippclip.song || 'Unknown Song',
            created_at: zippclip.created_at
          }
        };
      }

      currentId = zippclip.parent_zippclip_id;
      depth++;
    }

    return { 
      success: false, 
      error: 'Could not find original video' 
    };
  } catch (error) {
    console.error('Error in getOriginalVideo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
