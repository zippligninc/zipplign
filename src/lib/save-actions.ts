import { supabase } from './supabase';

export interface SaveActionResponse {
  success: boolean;
  data?: {
    saved: boolean;
    saves: number;
    count?: number;
  };
  error?: string;
}

/**
 * Toggle save status for a zippclip
 */
export async function toggleSave(zippclipId: string): Promise<SaveActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if already saved
    const { data: existingSave, error: checkError } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('zippclip_id', zippclipId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(checkError.message);
    }

    const isCurrentlySaved = !!existingSave;

    if (isCurrentlySaved) {
      // Unsave
      const { error: deleteError } = await supabase
        .from('saves')
        .delete()
        .eq('user_id', user.id)
        .eq('zippclip_id', zippclipId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Get updated save count
      const { data: zippclip, error: fetchError } = await supabase
        .from('zippclips')
        .select('saves')
        .eq('id', zippclipId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      return {
        success: true,
        data: {
          saved: false,
          saves: zippclip?.saves || 0
        }
      };
    } else {
      // Save
      const { error: insertError } = await supabase
        .from('saves')
        .insert({
          user_id: user.id,
          zippclip_id: zippclipId
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Get updated save count
      const { data: zippclip, error: fetchError } = await supabase
        .from('zippclips')
        .select('saves')
        .eq('id', zippclipId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      return {
        success: true,
        data: {
          saved: true,
          saves: zippclip?.saves || 0
        }
      };
    }
  } catch (error: any) {
    console.error('Error in toggleSave:', error);
    return {
      success: false,
      error: error.message || 'Failed to toggle save status'
    };
  }
}

/**
 * Check if user has saved a zippclip
 */
export async function checkIsSaved(zippclipId: string): Promise<SaveActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      // User not authenticated - return not saved
      return { success: true, data: { saved: false, saves: 0 } };
    }

    const { data: save, error } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('zippclip_id', zippclipId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Database error - return not saved instead of throwing
      return { success: true, data: { saved: false, saves: 0 } };
    }

    return { success: true, data: { saved: !!save, saves: 0 } };
  } catch (error: any) {
    // Any other error - return not saved instead of throwing
    return { success: true, data: { saved: false, saves: 0 } };
  }
}

/**
 * Get save count for a zippclip
 */
export async function getSaveCount(zippclipId: string): Promise<SaveActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { count, error } = await supabase
      .from('saves')
      .select('id', { count: 'exact' })
      .eq('zippclip_id', zippclipId);

    if (error) {
      // Gracefully fall back without noisy logs
      return { success: true, data: { saved: false, saves: 0, count: 0 } as any };
    }

    const value = count || 0;
    // Return both legacy `saves` and new `count` to satisfy all callers
    return { success: true, data: { saved: false, saves: value, count: value } as any };
  } catch (error: any) {
    return { success: true, data: { saved: false, saves: 0, count: 0 } as any };
  }
}
