'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ShoppingBag, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ZippLineLogo } from '@/components/common/zippline-logo';

const navItems = [
    { href: '/events', label: 'Events' },
    { href: '/zippers', label: 'Zippers' },
    { href: '/store', label: 'Store' },
    { href: '/home', label: 'For You' },
    { href: '/live', label: 'Live' },
];

function ShopHeader() {
    const pathname = usePathname();
    return (
        <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 text-white">
            <div className="flex items-center gap-4 pl-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'text-xs font-medium transition-colors',
                            pathname === item.href
                                ? 'text-white border-b-2 border-white pb-0.5'
                                : 'text-white/60 hover:text-white/90'
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/80 hover:bg-transparent hover:text-white" asChild>
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Link>
            </Button>
        </header>
    );
}

export default function ShopPage() {
  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <ShopHeader />
      
      <div className="h-full pt-16 pb-24 flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <ZippLineLogo className="w-20 h-20 mx-auto mb-6" />
            <ShoppingBag className="w-16 h-16 mx-auto text-teal-400 mb-4" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Zipplign Shop</h1>
          <p className="text-gray-400 mb-8">
            Discover exclusive merchandise, digital products, and premium features for Zippers.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <Star className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
              <h3 className="font-semibold mb-1">Premium Features</h3>
              <p className="text-xs text-gray-400">Unlock advanced tools</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <Heart className="w-8 h-8 mx-auto text-red-400 mb-2" />
              <h3 className="font-semibold mb-1">Merchandise</h3>
              <p className="text-xs text-gray-400">Zipplign branded items</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button className="w-full bg-teal-600 hover:bg-teal-700">
              Browse Premium Features
            </Button>
            <Button variant="outline" className="w-full border-teal-600 text-teal-400 hover:bg-teal-600/10">
              View Merchandise
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            Coming Soon - Shop functionality will be available soon!
          </p>
        </div>
      </div>
    </div>
  );
}
