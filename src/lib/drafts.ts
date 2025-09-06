import { supabase } from './supabase';

export interface Draft {
  id: string;
  user_id: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  description?: string;
  song?: string;
  song_avatar_url?: string;
  location_data?: any;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDraftData {
  media_url?: string;
  media_type?: 'image' | 'video';
  description?: string;
  song?: string;
  song_avatar_url?: string;
  spotify_preview_url?: string | null;
  location_data?: any;
  is_public?: boolean;
}

export class DraftService {
  static async createDraft(data: CreateDraftData): Promise<Draft | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: draft, error } = await supabase
      .from('drafts')
      .insert({
        user_id: user.id,
        ...data
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create draft: ${error.message}`);
    }

    return draft;
  }

  static async updateDraft(draftId: string, data: Partial<CreateDraftData>): Promise<Draft | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: draft, error } = await supabase
      .from('drafts')
      .update(data)
      .eq('id', draftId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update draft: ${error.message}`);
    }

    return draft;
  }

  static async getUserDrafts(): Promise<Draft[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: drafts, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch drafts: ${error.message}`);
    }

    return drafts || [];
  }

  static async getDraft(draftId: string): Promise<Draft | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: draft, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch draft: ${error.message}`);
    }

    return draft;
  }

  static async deleteDraft(draftId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete draft: ${error.message}`);
    }
  }

  static async publishDraft(draftId: string): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the draft
    const draft = await this.getDraft(draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Create the zippclip
    const { data: zippclip, error: insertError } = await supabase
      .from('zippclips')
      .insert({
        user_id: user.id,
        media_url: draft.media_url,
        media_type: draft.media_type,
        description: draft.description,
        song: draft.song,
        song_avatar_url: draft.song_avatar_url,
        draft_id: draft.id
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Failed to publish draft: ${insertError.message}`);
    }

    // Delete the draft after successful publication
    await this.deleteDraft(draftId);

    return zippclip.id;
  }
}
