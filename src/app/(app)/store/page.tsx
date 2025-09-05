'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ShoppingBag, Star, Heart, Search, Plus, Store, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LogoLarge } from '@/components/common/logo';
import { getPublicStores, searchStores } from '@/lib/store-utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    const result = await getPublicStores(20, 0);
    
    if (result.success) {
      setStores(result.data?.stores || []);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load stores',
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const result = await searchStores(query, 10);
    
    if (result.success) {
      setSearchResults(result.data || []);
    } else {
      toast({
        title: 'Search Error',
        description: result.error || 'Failed to search stores',
        variant: 'destructive',
      });
    }
    
    setIsSearching(false);
  };

  const displayStores = searchQuery ? searchResults : stores;

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      <ShopHeader />
      
      <div className="h-full pt-16 pb-24 flex flex-col">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <LogoLarge className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold">Creator Stores</h1>
              <p className="text-gray-400 text-sm">Discover products and services from creators</p>
            </div>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search stores, products, or services..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            </div>
          ) : displayStores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No stores found' : 'No stores available'}
              </h3>
              <p className="text-gray-400 text-sm">
                {searchQuery 
                  ? 'Try searching with different keywords'
                  : 'Be the first to create a store!'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayStores.map((store) => (
                <div key={store.id} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      {store.profiles?.avatar_url ? (
                        <img 
                          src={store.profiles.avatar_url} 
                          alt={store.business_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Store className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{store.business_name}</h3>
                      <p className="text-gray-400 text-sm">@{store.profiles?.username}</p>
                      {store.description && (
                        <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                          {store.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {store.business_type === 'business' ? 'Business' : 'Individual'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {store.address ? '📍 Local' : '🌐 Online'}
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-teal-600 hover:bg-teal-700"
                      asChild
                    >
                      <Link href={`/store/${store.id}`}>
                        View Store
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-gray-800">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700"
            asChild
          >
            <Link href="/creator-store/setup">
              <Plus className="w-4 h-4 mr-2" />
              Create Your Store
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
