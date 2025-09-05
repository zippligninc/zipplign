
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordReset } from '@/lib/auth-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'Database connection not available. Please check your configuration.',
      });
      setLoading(false);
      return;
    }

    try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Login Successful!',
        description: "Welcome back!",
      });
      router.push('/home');
      router.refresh();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setResetLoading(true);
    const result = await sendPasswordReset(resetEmail);
    
    if (result.success) {
      toast({
        title: 'Email Sent',
        description: result.message || 'Password reset email sent!',
      });
      setShowResetForm(false);
      setResetEmail('');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to send reset email',
        variant: 'destructive',
      });
    }
    
    setResetLoading(false);
  };

  const handlePhoneLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your phone number.',
        variant: 'destructive',
      });
      return;
    }

    setPhoneLoading(true);

    try {
      if (!showOTP) {
        // Send OTP
        const { error } = await supabase.auth.signInWithOtp({
          phone: phoneNumber,
        });

        if (error) {
          throw error;
        }

        setShowOTP(true);
        toast({
          title: 'Code Sent',
          description: 'Verification code sent to your phone!',
        });
      } else {
        // Verify OTP
        const { error } = await supabase.auth.verifyOtp({
          phone: phoneNumber,
          token: otpCode,
          type: 'sms',
        });

        if (error) {
          throw error;
        }

        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        router.push('/home');
      }
    } catch (error: any) {
      console.error('Phone login error:', error);
      toast({
        title: 'Login Error',
        description: error.message || 'Failed to login with phone number.',
        variant: 'destructive',
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-semibold">Log in</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 px-6 pt-8">
        <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone">Phone</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
                 <form onSubmit={handleLogin}>
                    <div className="mt-8 space-y-4">
                        <div>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email"
                                className="h-11"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                className="h-11 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                            </Button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full mt-6" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log in'}
                    </Button>
                </form>
            </TabsContent>
            <TabsContent value="phone">
                <form onSubmit={handlePhoneLogin} className="mt-8 space-y-4">
                    <Input
                        type="tel"
                        placeholder="Phone number (e.g., +1234567890)"
                        className="h-11"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                    />
                    {showOTP && (
                        <Input
                            type="text"
                            placeholder="Enter verification code"
                            className="h-11"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            maxLength={6}
                            required
                        />
                    )}
                </form>
                <Button 
                    className="w-full mt-6" 
                    onClick={handlePhoneLogin}
                    disabled={phoneLoading}
                >
                    {phoneLoading ? 'Sending...' : showOTP ? 'Verify Code' : 'Send Code'}
                </Button>
                {showOTP && (
                    <Button 
                        variant="link" 
                        className="w-full mt-2 text-sm"
                        onClick={() => {
                            setShowOTP(false);
                            setOtpCode('');
                        }}
                    >
                        Change phone number
                    </Button>
                )}
            </TabsContent>
        </Tabs>
       
        <div className="mt-6 flex justify-between text-sm">
          <Button 
            variant="link" 
            className="p-0 h-auto text-primary"
            onClick={() => setShowResetForm(true)}
          >
            Forgot password?
          </Button>
          <Button variant="link" asChild className="p-0 h-auto text-primary">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </main>

      {/* Password Reset Modal */}
      {showResetForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reset Password</h2>
            <p className="text-muted-foreground mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="h-11"
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetEmail('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
