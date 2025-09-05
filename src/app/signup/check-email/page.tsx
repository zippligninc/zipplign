
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function CheckEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup_email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email, maybe redirect to signup start
      router.push('/signup');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center text-center">
        <MailCheck className="h-20 w-20 text-primary" />
        <h1 className="mt-6 text-3xl font-bold">Check your email</h1>
        <p className="mt-3 text-muted-foreground">
          We've sent a confirmation link to <span className="font-bold text-foreground">{email}</span>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please click the link in the email to activate your account.
        </p>
        <Button asChild className="mt-8 w-full">
          <Link href="/login">
            Go to Login
          </Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Didn't receive the email? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
}
