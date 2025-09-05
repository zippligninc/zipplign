import { supabase } from './supabase';

export interface ViewTrackingResponse {
  success: boolean;
  data?: {
    views: number;
  };
  error?: string;
}

/**
 * Increment view count for a zippclip
 * Uses the database function for atomic updates
 */
export async function incrementZippclipViews(zippclipId: string): Promise<ViewTrackingResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase.rpc('increment_zippclip_views', {
      zippclip_id: zippclipId
    });

    if (error) {
      console.error('Error incrementing views:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: { views: data || 0 } 
    };
  } catch (error: any) {
    console.error('Error in incrementZippclipViews:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to increment views' 
    };
  }
}

/**
 * Get current view count for a zippclip
 */
export async function getZippclipViews(zippclipId: string): Promise<ViewTrackingResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('zippclips')
      .select('views')
      .eq('id', zippclipId)
      .single();

    if (error) {
      console.error('Error fetching views:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: { views: data?.views || 0 } 
    };
  } catch (error: any) {
    console.error('Error in getZippclipViews:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch views' 
    };
  }
}

/**
 * Format view count for display (e.g., 1.2K, 1.5M)
 */
export function formatViewCount(views: number): string {
  if (views < 1000) {
    return views.toString();
  } else if (views < 1000000) {
    return (views / 1000).toFixed(1) + 'K';
  } else {
    return (views / 1000000).toFixed(1) + 'M';
  }
}
