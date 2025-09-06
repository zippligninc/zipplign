'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForToken } from '@/lib/spotify';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to Spotify...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage('Spotify authorization was denied or failed');
          toast({
            title: 'Spotify Connection Failed',
            description: 'Unable to connect to Spotify. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          return;
        }

        setMessage('Exchanging authorization code...');

        // Exchange code for access token
        const tokenData = await exchangeCodeForToken(code);
        
        if (!tokenData) {
          setStatus('error');
          setMessage('Failed to get access token');
          return;
        }

        setMessage('Saving Spotify credentials...');

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setStatus('error');
          setMessage('User not authenticated');
          return;
        }

        // Save Spotify tokens to user profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            spotify_access_token: tokenData.access_token,
            spotify_refresh_token: tokenData.refresh_token,
            spotify_connected: true,
            spotify_connected_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error saving Spotify tokens:', updateError);
          setStatus('error');
          setMessage('Failed to save Spotify connection');
          return;
        }

        setStatus('success');
        setMessage('Successfully connected to Spotify!');

        toast({
          title: 'Spotify Connected!',
          description: 'You can now browse and add music from Spotify to your posts.',
        });

        // Redirect to create page after a short delay
        setTimeout(() => {
          router.push('/create');
        }, 2000);

      } catch (error) {
        console.error('Spotify callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        
        toast({
          title: 'Connection Error',
          description: 'Something went wrong while connecting to Spotify.',
          variant: 'destructive',
        });
      }
    };

    handleCallback();
  }, [searchParams, router, toast]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          {status === 'loading' && (
            <Loader2 className="h-16 w-16 mx-auto text-teal-400 animate-spin mb-4" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
          )}
          {status === 'error' && (
            <XCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-4">
          {status === 'loading' && 'Connecting to Spotify'}
          {status === 'success' && 'Spotify Connected!'}
          {status === 'error' && 'Connection Failed'}
        </h1>
        
        <p className="text-gray-400 mb-8">
          {message}
        </p>

        {status === 'success' && (
          <p className="text-sm text-gray-500">
            Redirecting to create page...
          </p>
        )}

        {status === 'error' && (
          <button
            onClick={() => router.push('/create')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Create Page
          </button>
        )}
      </div>
    </div>
  );
}
