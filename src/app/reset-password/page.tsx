'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { updatePassword, validatePassword } from '@/lib/auth-utils';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (they should be after clicking reset link)
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Invalid Link',
          description: 'This password reset link is invalid or has expired.',
          variant: 'destructive',
        });
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, toast]);

  useEffect(() => {
    // Validate password as user types
    const validation = validatePassword(password);
    setIsValid(validation.valid && password === confirmPassword && password.length > 0);
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      toast({
        title: 'Invalid Password',
        description: 'Please check your password requirements.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message || 'Password updated successfully!',
      });
      router.push('/home');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update password',
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  const passwordValidation = validatePassword(password);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground mt-2">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2 text-sm">
                <p className="font-medium">Password Requirements:</p>
                <div className="space-y-1">
                  {passwordValidation.errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      {error}
                    </div>
                  ))}
                  {passwordValidation.valid && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Password meets all requirements
                    </div>
                  )}
                </div>
                {password !== confirmPassword && confirmPassword && (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-1 h-1 bg-red-600 rounded-full" />
                    Passwords do not match
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={!isValid || loading}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => router.push('/login')}
            >
              Back to Login
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
