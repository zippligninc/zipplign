
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SignUpEmailPage() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleNext = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
        toast({
            variant: 'destructive',
            title: 'Email Required',
            description: 'Please enter your email address.',
        });
        return;
    }

    if (!emailRegex.test(email.trim())) {
        toast({
            variant: 'destructive',
            title: 'Invalid Email',
            description: 'Please enter a valid email address.',
        });
        return;
    }

    sessionStorage.setItem('signup_email', email.trim().toLowerCase());
    router.push('/signup/password');
  };


  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/signup">
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Back</span>
            </Link>
        </Button>
        <h1 className="text-xl font-semibold">Sign up</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>
      
      <main className="flex-1 px-6 pt-8">
      <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone">Phone</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
          <TabsContent value="phone" className="pt-4">
            <h2 className="text-2xl font-bold">What's your phone number?</h2>
            <p className="text-muted-foreground mt-1">You can log in with this phone number</p>
            
            <div className="mt-8">
                <Input
                    type="tel"
                    placeholder="Phone number"
                    className="h-11"
                    disabled
                />
            </div>
          </TabsContent>
          <TabsContent value="email" className="pt-4">
            <h2 className="text-2xl font-bold">What's your email?</h2>
            <p className="text-muted-foreground mt-1">You can log in with this email</p>
            
            <div className="mt-8">
                <Input
                    type="email"
                    placeholder="Email"
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
          </TabsContent>
        </Tabs>

        <Button className="w-full mt-6" onClick={handleNext}>Next</Button>
      </main>
    </div>
  );
}
