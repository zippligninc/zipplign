
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function SignUpPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const checks = {
    length: password.length >= 8 && password.length <= 20,
    letterAndNumber: /(?=.*[a-zA-Z])(?=.*[0-9])/.test(password),
    specialChar: /[#?!@$%^&*-]/.test(password),
  };
  
  const allChecksPassed = Object.values(checks).every(Boolean);

  const handleNext = () => {
    if (allChecksPassed) {
        sessionStorage.setItem('signup_password', password);
        router.push('/signup/nickname');
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/signup/email">
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Sign up</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 px-6 pt-8">
        <h2 className="text-2xl font-bold">Create Password</h2>
        <p className="text-muted-foreground mt-1">Your password must have at least:</p>

        <div className="relative mt-8">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Your password"
            className="h-11 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <div className="mt-4 space-y-2 text-sm">
          <div className={cn("flex items-center gap-2", checks.length ? 'text-primary' : 'text-muted-foreground')}>
            <Check className="h-4 w-4" />
            <span>8 Characters (20 max)</span>
          </div>
          <div className={cn("flex items-center gap-2", checks.letterAndNumber ? 'text-primary' : 'text-muted-foreground')}>
            <Check className="h-4 w-4" />
            <span>1 letter and 1 number</span>
          </div>
          <div className={cn("flex items-center gap-2", checks.specialChar ? 'text-primary' : 'text-muted-foreground')}>
            <Check className="h-4 w-4" />
            <span>1 special character | Example: # ? $ ! &</span>
          </div>
        </div>

        <Button onClick={handleNext} className="w-full mt-6" disabled={!allChecksPassed}>
          Next
        </Button>
      </main>
    </div>
  );
}
