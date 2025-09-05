'use client';

import { supabase } from './supabase';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'fake_account' | 'violence' | 'copyright' | 'other';
export type ContentType = 'zippclip' | 'comment' | 'profile' | 'message';

export interface Report {
  id: string;
  content_type: ContentType;
  content_id: string;
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocked_user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  created_at: string;
  reason?: string;
}

export interface UserWarning {
  id: string;
  warning_type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  created_at: string;
  expires_at?: string;
}

export async function reportContent(
  contentType: ContentType,
  contentId: string,
  reason: ReportReason,
  description?: string
) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user has already reported this content
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single();

    if (existingReport) {
      throw new Error('You have already reported this content');
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reason,
        description
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error reporting content:', error);
    return { success: false, error: error.message };
  }
}

export async function blockUser(userId: string, reason?: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    if (user.id === userId) {
      throw new Error('Cannot block yourself');
    }

    const { data, error } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: user.id,
        blocked_id: userId,
        reason
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('User is already blocked');
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error blocking user:', error);
    return { success: false, error: error.message };
  }
}

export async function unblockUser(userId: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    return { success: false, error: error.message };
  }
}

export async function getBlockedUsers() {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        id,
        created_at,
        reason,
        profiles:blocked_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const blockedUsers: BlockedUser[] = (data || []).map(block => ({
      id: block.id,
      blocked_user: {
        id: block.profiles.id,
        username: block.profiles.username,
        full_name: block.profiles.full_name,
        avatar_url: block.profiles.avatar_url
      },
      created_at: block.created_at,
      reason: block.reason
    }));

    return { success: true, data: blockedUsers };
  } catch (error: any) {
    console.error('Error fetching blocked users:', error);
    return { success: false, error: error.message };
  }
}

export async function checkIfBlocked(userId: string) {
  try {
    if (!supabase) {
      // Supabase not available - return not blocked instead of throwing
      return { success: true, data: { blocked: false } };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      // User not authenticated - this is normal, just return not blocked
      return { success: true, data: { blocked: false } };
    }

    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Database error - return not blocked instead of throwing
      return { success: true, data: { blocked: false } };
    }

    return { success: true, data: { blocked: !!data } };
  } catch (error: any) {
    // Any other error - return not blocked instead of throwing
    return { success: true, data: { blocked: false } };
  }
}

export async function getUserWarnings() {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_warnings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching warnings:', error);
    return { success: false, error: error.message };
  }
}

export async function acknowledgeWarning(warningId: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_warnings')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', warningId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error acknowledging warning:', error);
    return { success: false, error: error.message };
  }
}

export async function getMyReports() {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return { success: false, error: error.message };
  }
}

// Utility function to get report reason display text
export function getReportReasonText(reason: ReportReason): string {
  const reasonMap: Record<ReportReason, string> = {
    spam: 'Spam',
    harassment: 'Harassment or Bullying',
    inappropriate_content: 'Inappropriate Content',
    fake_account: 'Fake Account',
    violence: 'Violence or Dangerous Content',
    copyright: 'Copyright Infringement',
    other: 'Other'
  };
  return reasonMap[reason] || reason;
}

// Utility function to get content type display text
export function getContentTypeText(contentType: ContentType): string {
  const typeMap: Record<ContentType, string> = {
    zippclip: 'Post',
    comment: 'Comment',
    profile: 'Profile',
    message: 'Message'
  };
  return typeMap[contentType] || contentType;
}
