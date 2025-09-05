
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function SignUpNicknamePage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const maxLength = 30;
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup_email');
    const storedPassword = sessionStorage.getItem('signup_password');
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
    } else {
      // If data is missing, send user back to the start of the flow
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "Please restart the signup process.",
      });
      router.push('/signup');
    }
  }, [router, toast]);

  const handleSignUp = async () => {
    if (!nickname.trim()) {
        toast({
            variant: "destructive",
            title: "Nickname Required",
            description: "Please enter a nickname to continue.",
        });
        return;
    }

    if (nickname.trim().length < 3) {
        toast({
            variant: "destructive",
            title: "Nickname Too Short",
            description: "Nickname must be at least 3 characters long.",
        });
        return;
    }

    if (!supabase) {
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'Database connection not available. Please check your configuration.',
      });
      return;
    }

    setLoading(true);

    try {
      // Generate a unique username
      const baseUsername = nickname.toLowerCase().trim().replace(/\s+/g, '_');
      let finalUsername = baseUsername;
      
      // Check if username already exists and make it unique if needed
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', baseUsername)
        .single();
        
      if (existingUser) {
        // Add random number to make username unique
        finalUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nickname.trim(),
            username: finalUsername,
          },
        },
      });

      if (error) {
        console.error('Signup error details:', error);
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message || 'An error occurred during signup',
        });
      } else {
        console.log('Signup successful:', data);
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        // Clean up password from session storage for security
        sessionStorage.removeItem('signup_password');
        router.push('/signup/check-email');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Sign Up Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/signup/password">
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Sign up</h1>
        <Button asChild variant="ghost" className="text-primary">
           <Link href="/home">Skip</Link>
        </Button>
      </header>

      <main className="flex-1 px-6 pt-8">
        <h2 className="text-2xl font-bold">Create nickname</h2>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Your nickname is a unique name that you can use to log in and will be displayed on your profile.
        </p>

        <div className="mt-8 relative">
          <Input
            type="text"
            placeholder="Add your nickname"
            className="h-11"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={maxLength}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {nickname.length}/{maxLength}
          </div>
        </div>

        <Button
          onClick={handleSignUp}
          className="w-full mt-6"
          disabled={!nickname || loading || !email || !password}
        >
          {loading ? 'Signing up...' : 'Sign up'}
        </Button>
      </main>
    </div>
  );
}
