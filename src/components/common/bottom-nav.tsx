
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZppIcon } from '../icons/zpp-icon';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/discover', icon: Search, label: 'Discover' },
  { href: '/create', icon: ZppIcon, label: 'Create', isCreate: true },
  { href: '/inbox', icon: MessageSquare, label: 'Inbox' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleProtectedLink = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      if (!supabase) {
          toast({
            title: 'Configuration Error',
            description: 'Supabase is not configured properly.',
            variant: 'destructive',
          });
          return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          toast({
            title: 'Login Required',
            description: 'You need to log in to access this page.',
            variant: 'destructive',
          });
          router.push('/login');
      } else {
          router.push(href);
      }
  }


  const hiddenPaths = [
    '/add-friends',
    '/notifications',
    '/profile/edit',
    '/settings',
    '/settings/account',
    '/settings/account/information'
  ];

  if (!isClient || pathname.startsWith('/create') || pathname.startsWith('/inbox/') || hiddenPaths.includes(pathname) || pathname.startsWith('/user/')) {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-t-emerald-800 bg-gradient-to-r from-green-600 to-teal-600/90 backdrop-blur-sm">
      <nav className="flex h-10 items-center justify-around px-1">
        {navItems.map((item) => {
          let href = item.href;
          const isActive = pathname === href;

          const isProtected = item.isCreate || item.href === '/inbox' || item.href === '/profile';

          return (
            <Link
              key={item.href}
              href={href}
              onClick={async (e) => {
                // Let the page handle the auth check.
                if (isProtected) {
                    if (!supabase) {
                        e.preventDefault();
                        toast({
                          title: 'Configuration Error',
                          description: 'Supabase is not configured properly.',
                          variant: 'destructive',
                        });
                        return;
                    }
                    const { data, error } = await supabase.auth.getUser();
                    if (error || !data?.user) {
                        e.preventDefault();
                        router.push('/login');
                    }
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center h-full w-10 gap-0 p-0.5 text-white/80 transition-colors hover:text-white',
                isActive && !item.isCreate && 'text-white'
              )}
            >
              {item.isCreate ? (
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-background text-white shadow-md ring-1 ring-teal-600 transition-transform hover:scale-105">
                    <item.icon className="h-5 w-5 text-primary" />
                 </div>
              ) : (
                <item.icon className="h-4 w-4" fill={isActive ? 'white' : 'none'} />
              )}
              <span className={cn("text-[9px] font-medium", item.isCreate ? "sr-only" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
