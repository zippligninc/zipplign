import { supabase } from './supabase';

export interface Draft {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  song?: string;
  song_avatar_url?: string;
  filters_applied?: any;
  effects_applied?: any;
  created_at?: string;
  updated_at?: string;
}

export interface DraftResponse {
  success: boolean;
  data?: Draft | Draft[];
  error?: string;
}

/**
 * Save a draft
 */
export async function saveDraft(draft: Omit<Draft, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DraftResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('drafts')
      .insert({
        user_id: user.id,
        ...draft
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Error saving draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to save draft'
    };
  }
}

/**
 * Get user's drafts
 */
export async function getUserDrafts(): Promise<DraftResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    console.error('Error fetching drafts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch drafts'
    };
  }
}

/**
 * Update a draft
 */
export async function updateDraft(draftId: string, updates: Partial<Draft>): Promise<DraftResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('drafts')
      .update(updates)
      .eq('id', draftId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Error updating draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to update draft'
    };
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId: string): Promise<DraftResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete draft'
    };
  }
}

/**
 * Convert draft to zippclip
 */
export async function publishDraft(draftId: string): Promise<DraftResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get the draft
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single();

    if (draftError || !draft) {
      throw new Error('Draft not found');
    }

    // Create zippclip from draft
    const { data: zippclip, error: zippclipError } = await supabase
      .from('zippclips')
      .insert({
        user_id: user.id,
        description: draft.description,
        media_url: draft.media_url,
        media_type: draft.media_type,
        song: draft.song,
        song_avatar_url: draft.song_avatar_url
      })
      .select()
      .single();

    if (zippclipError) {
      throw new Error(zippclipError.message);
    }

    // Delete the draft
    await deleteDraft(draftId);

    return {
      success: true,
      data: zippclip
    };
  } catch (error: any) {
    console.error('Error publishing draft:', error);
    return {
      success: false,
      error: error.message || 'Failed to publish draft'
    };
  }
}
