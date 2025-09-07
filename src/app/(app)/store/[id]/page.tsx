'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

type Store = {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_public?: boolean | null;
  owner_id?: string | null;
  profiles?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = (params?.id as string) || '';
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStore = async () => {
      try {
        if (!supabase || !storeId) {
          setNotFound(true);
          return;
        }
        const { data, error } = await supabase
          .from('creator_stores')
          .select(
            `id, name, description, logo_url, is_public, owner_id,
             profiles:owner_id ( id, username, full_name, avatar_url )`
          )
          .eq('id', storeId)
          .single();

        if (error || !data) {
          setNotFound(true);
          return;
        }
        if (isMounted) setStore(data as Store);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStore();
    return () => {
      isMounted = false;
    };
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-white">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading store...
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-white gap-3">
        <p className="text-sm">Store not found.</p>
        <Button variant="outline" onClick={() => router.push('/store')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stores
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black text-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-lg font-semibold">{store.name}</h1>
        <div className="w-10" />
      </header>

      <main className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          {store.logo_url ? (
            // Bypass optimizer for Supabase images to avoid dev 500s
            <img
              src={store.logo_url}
              alt={store.name}
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
            />
          ) : (
            <div className="w-14 h-14 rounded-md bg-gray-800" />
          )}
          <div>
            <p className="text-sm text-white/90">By {store.profiles?.full_name || store.profiles?.username || 'Unknown'}</p>
          </div>
        </div>

        {store.description && (
          <p className="text-sm text-white/80 whitespace-pre-wrap">{store.description}</p>
        )}
      </main>
    </div>
  );
}


