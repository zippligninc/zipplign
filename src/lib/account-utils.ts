import { supabase } from './supabase';

export interface AccountResponse {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Download user data
 */
export async function downloadUserData(): Promise<AccountResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch profile data');
    }

    // Fetch user's zippclips
    const { data: zippclips, error: zippclipsError } = await supabase
      .from('zippclips')
      .select('*')
      .eq('user_id', user.id);

    if (zippclipsError) {
      throw new Error('Failed to fetch zippclips data');
    }

    // Fetch user's likes
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id);

    if (likesError) {
      throw new Error('Failed to fetch likes data');
    }

    // Fetch user's comments
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', user.id);

    if (commentsError) {
      throw new Error('Failed to fetch comments data');
    }

    // Fetch user's follows
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id);

    if (followsError) {
      throw new Error('Failed to fetch follows data');
    }

    // Compile user data
    const userData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile,
      zippclips: zippclips || [],
      likes: likes || [],
      comments: comments || [],
      follows: follows || [],
      exported_at: new Date().toISOString(),
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `zipplign-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'User data downloaded successfully!'
    };
  } catch (error: any) {
    console.error('Error downloading user data:', error);
    return {
      success: false,
      error: error.message || 'Failed to download user data'
    };
  }
}

/**
 * Delete user account
 */
export async function deleteUserAccount(): Promise<AccountResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Delete user account (this will cascade delete all related data due to foreign key constraints)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return {
      success: true,
      message: 'Account deleted successfully!'
    };
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete account'
    };
  }
}

/**
 * Deactivate user account (soft delete)
 */
export async function deactivateUserAccount(): Promise<AccountResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Update profile to mark as deactivated
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        bio: 'This account has been deactivated.',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Sign out the user
    await supabase.auth.signOut();

    return {
      success: true,
      message: 'Account deactivated successfully!'
    };
  } catch (error: any) {
    console.error('Error deactivating user account:', error);
    return {
      success: false,
      error: error.message || 'Failed to deactivate account'
    };
  }
}
