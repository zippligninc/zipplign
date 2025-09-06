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
 * Uses direct SQL update instead of database function
 */
export async function incrementZippclipViews(zippclipId: string): Promise<ViewTrackingResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Try to get the current view count (with fallback if column doesn't exist)
    let currentViews = 0;
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('zippclips')
        .select('views')
        .eq('id', zippclipId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current views:', fetchError);
        // If views column doesn't exist, return success with 0 views
        if (fetchError.message.includes('column "views" does not exist')) {
          return { success: true, data: { views: 0 } };
        }
        return { success: false, error: fetchError.message };
      }

      currentViews = currentData?.views || 0;
    } catch (error) {
      // If there's any error (like column doesn't exist), just return 0 views
      console.log('Views column may not exist yet, returning 0 views');
      return { success: true, data: { views: 0 } };
    }

    const newViews = currentViews + 1;

    // Update the view count
    const { data, error } = await supabase
      .from('zippclips')
      .update({ views: newViews })
      .eq('id', zippclipId)
      .select('views')
      .single();

    if (error) {
      console.error('Error incrementing views:', error);
      // If views column doesn't exist, return success with current count
      if (error.message.includes('column "views" does not exist')) {
        return { success: true, data: { views: currentViews } };
      }
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: { views: data?.views || newViews } 
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
      // Only log meaningful errors
      if (error.message) {
        console.error('Error fetching views:', error.message);
      }
      // If views column doesn't exist, return 0 views
      if (error.message && error.message.includes('column "views" does not exist')) {
        return { success: true, data: { views: 0 } };
      }
      // For any other error, return 0 views gracefully
      return { success: true, data: { views: 0 } };
    }

    return { 
      success: true, 
      data: { views: data?.views || 0 } 
    };
  } catch (error: any) {
    console.error('Error in getZippclipViews:', error);
    // If there's any error (like column doesn't exist), return 0 views
    return { 
      success: true, 
      data: { views: 0 } 
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
