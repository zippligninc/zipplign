'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoLarge } from '@/components/common/logo';

const navItems = [
    { href: '/events', label: 'Events' },
    { href: '/zippers', label: 'Zippers' },
    { href: '/store', label: 'Store' },
    { href: '/home', label: 'For You' },
    { href: '/live', label: 'Live' },
];

function EventsHeader() {
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

export default function EventsPage() {
  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <EventsHeader />
      
      <div className="h-full pt-16 pb-24 flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <LogoLarge className="w-20 h-20 mx-auto mb-6" />
            <Calendar className="w-16 h-16 mx-auto text-teal-400 mb-4" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Zipplign Events</h1>
          <p className="text-gray-400 mb-8">
            Discover and join exciting events, meetups, and live performances by Zippers in your area. Powered by MyEventAdvisor.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <MapPin className="w-8 h-8 mx-auto text-green-400 mb-2" />
              <h3 className="font-semibold mb-1">Local Events</h3>
              <p className="text-xs text-gray-400">Find events near you</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-blue-400 mb-2" />
              <h3 className="font-semibold mb-1">Community</h3>
              <p className="text-xs text-gray-400">Connect with Zippers</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={() => window.open('https://www.myeventadvisor.com/events', '_blank')}
            >
              Browse Upcoming Events
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-teal-600 text-teal-400 hover:bg-teal-600/10"
              onClick={() => window.open('https://www.myeventadvisor.com/create-event', '_blank')}
            >
              Create New Event
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            Events powered by <a href="https://www.myeventadvisor.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline">MyEventAdvisor</a>
          </p>
        </div>
      </div>
    </div>
  );
}
