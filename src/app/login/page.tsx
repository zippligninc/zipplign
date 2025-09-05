
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
                 <div className="mt-8 space-y-4">
                    <Input
                        type="tel"
                        placeholder="Phone number"
                        className="h-11"
                        disabled
                    />
                 </div>
                 <Button className="w-full mt-6" disabled>Log in</Button>
                 <p className="text-center text-muted-foreground text-sm mt-4">Phone login is not yet available.</p>
            </TabsContent>
        </Tabs>
       
        <div className="mt-6 flex justify-between text-sm">
          <Button 
            variant="link" 
            className="p-0 h-auto text-primary"
            onClick={() => {
              toast({
                title: 'Feature Coming Soon',
                description: 'Password reset functionality will be available soon.',
              });
            }}
          >
            Forgot password?
          </Button>
          <Button variant="link" asChild className="p-0 h-auto text-primary">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
