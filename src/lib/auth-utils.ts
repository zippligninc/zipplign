import { supabase } from './supabase';

export interface AuthResponse {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<AuthResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Password reset email sent! Check your inbox.'
    };
  } catch (error: any) {
    console.error('Error sending password reset:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email'
    };
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Password updated successfully!'
    };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return {
      success: false,
      error: error.message || 'Failed to update password'
    };
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 72) {
    errors.push('Password must be less than 72 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
