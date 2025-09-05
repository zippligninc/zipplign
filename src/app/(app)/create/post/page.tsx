
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, UserPlus, MapPin, ChevronRight, Save, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const OptionButton = ({ icon: Icon, label, value, onClick }: { icon: React.ElementType, label: string, value: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full text-left py-3 px-4 hover:bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{value}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
    </button>
);


export default function PostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [media, setMedia] = useState<{type: 'image' | 'video', url: string} | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [zippReference, setZippReference] = useState<any>(null);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);

  useEffect(() => {
    const checkUserAndMedia = async () => {
      if (!supabase) {
        toast({ 
          title: 'Connection Error', 
          description: 'Database connection not available. Please check your configuration.', 
          variant: 'destructive'
        });
        router.push('/login');
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          toast({ 
            title: 'Authentication Error', 
            description: 'Failed to verify your session. Please log in again.', 
            variant: 'destructive'
          });
          router.push('/login');
          return;
        }

        if (!session?.user) {
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/login');
        return;
      }

      // Check for Zipp reference (when joining a line)
      const zippRef = sessionStorage.getItem('zipp_reference');
      if (zippRef) {
        try {
          const ref = JSON.parse(zippRef);
          setZippReference(ref);
          setCaption(`Responding to @${ref.user}: ${ref.description.substring(0, 50)}...`);
          toast({
            title: 'Joining the Line!',
            description: `Creating response to @${ref.user}'s Zippclip`,
          });
        } catch (error) {
          console.error('Error parsing zipp reference:', error);
        }
      }

      // Check for selected music
      const music = sessionStorage.getItem('selectedMusic');
      if (music) {
        try {
          setSelectedMusic(JSON.parse(music));
        } catch (error) {
          console.error('Error parsing selected music:', error);
        }
      }

      const image = sessionStorage.getItem('capturedImage');
      const video = sessionStorage.getItem('capturedVideo');

      if (image) {
        setMedia({ type: 'image', url: image });
      } else if (video) {
        setMedia({ type: 'video', url: video });
      } else {
        // Redirect if no media is found after a short delay
        setTimeout(() => {
            if (!sessionStorage.getItem('capturedImage') && !sessionStorage.getItem('capturedVideo')) {
              toast({ title: 'No media found', description: 'Please capture or upload media first.', variant: 'destructive'});
              router.push('/create');
            }
        }, 500);
      }
    };
    checkUserAndMedia();
  }, [router, toast]);

  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataurl: string) => {
      const arr = dataurl.split(',');
      if (arr.length < 2) {
          throw new Error('Invalid data URL');
      }
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch || mimeMatch.length < 2) {
          throw new Error('Could not parse MIME type from data URL');
      }
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type:mime});
  }

  // Zipplign Core Feature: Validate video duration
  const validateVideoDuration = (videoBlob: Blob): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        const duration = video.duration;
        if (duration > 180) { // 3 minutes
          toast({
            title: "Video Too Long",
            description: "Zippclips must be 3 minutes or less",
            variant: "destructive"
          });
          resolve(false);
        } else if (duration < 1) { // Less than 1 second
          toast({
            title: "Video Too Short",
            description: "Please record a longer video",
            variant: "destructive"
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => {
        toast({
          title: "Invalid Video",
          description: "Could not process video file",
          variant: "destructive"
        });
        resolve(false);
      };
      video.src = URL.createObjectURL(videoBlob);
    });
  };

  const handlePost = async () => {
    setLoading(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.id) {
            throw new Error('User not authenticated. Please log in again.');
        }

        if (!media) {
            throw new Error('No media to post. Please go back and select media.');
        }

        const blob = dataURLtoBlob(media.url);
        
        // Zipplign Core Feature: Validate video duration before upload
        if (media.type === 'video') {
          const isValidDuration = await validateVideoDuration(blob);
          if (!isValidDuration) {
            setLoading(false);
            return;
          }
        }
        
        const fileExt = blob.type.split('/')[1];
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('zippclips')
            .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error(`Storage Error: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('zippclips')
            .getPublicUrl(filePath);

        if (!publicUrl) {
            throw new Error('Could not get public URL for the uploaded file.');
        }

        // Insert into zippclips table
        const { error: insertError } = await supabase.from('zippclips').insert({
             media_url: publicUrl,
             media_type: media.type,
             description: caption || '',
             song: selectedMusic ? `${selectedMusic.title} - ${selectedMusic.artist}` : 'Original Sound',
             song_avatar_url: selectedMusic ? selectedMusic.image : ''
        });

        if (insertError) {
            console.error('Insert Error:', JSON.stringify(insertError, null, 2));
            throw new Error(`Database Error: ${insertError.message}`);
        }

        const successMessage = zippReference 
          ? `Successfully joined @${zippReference.user}'s line!`
          : "Your content is now live for your friends to see.";
          
        toast({
            title: "Zippclip Posted!",
            description: successMessage,
        });
        
        // Clear the saved media and zipp reference
        sessionStorage.removeItem('capturedImage');
        sessionStorage.removeItem('capturedVideo');
        sessionStorage.removeItem('zipp_reference');
        
        router.push('/profile');
        router.refresh();
    } catch (error) {
        console.error('Error posting:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({
            title: "Error Posting Zippclip",
            description: errorMessage,
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };
  
  const showComingSoon = (feature: string) => {
    toast({
        title: `${feature} feature is coming soon!`,
        duration: 2000,
    });
  }

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      <header className="flex w-full items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Post</h1>
        <div className="w-9" />
      </header>
      
      <main className="flex-1 flex flex-col p-4 gap-4">
        {/* Zipplign Line Reference Indicator */}
        {zippReference && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">Z</span>
              </div>
              <span className="text-sm font-medium text-blue-700">Joining the Line</span>
            </div>
            <p className="text-xs text-blue-600">
              Responding to <span className="font-semibold">@{zippReference.user}</span>: 
              "{zippReference.description.substring(0, 100)}..."
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Song: {zippReference.song}
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <Textarea
            placeholder="Write a caption..."
            className="flex-1 h-32 text-base resize-none"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={loading}
          />
          <div className="relative w-24 h-32 rounded-md overflow-hidden bg-muted">
            {media?.type === 'image' && media.url && (
              <Image src={media.url} alt="Preview" fill className="object-cover" />
            )}
            {media?.type === 'video' && media.url && (
              <video src={media.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            )}
            {!media && (
                <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}
          </div>
        </div>
        
        {/* Music Display */}
        {selectedMusic && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Image
                src={selectedMusic.image}
                alt={selectedMusic.title}
                width={40}
                height={40}
                className="rounded-md"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700">{selectedMusic.title}</p>
                <p className="text-xs text-green-600">{selectedMusic.artist}</p>
                <p className="text-xs text-green-500">{selectedMusic.duration}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMusic(null);
                  sessionStorage.removeItem('selectedMusic');
                }}
                className="text-green-600 hover:text-green-700"
              >
                Remove
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex flex-col bg-muted/50 rounded-lg">
            <OptionButton icon={UserPlus} label="Tag people" value="" onClick={() => showComingSoon('Tagging')} />
            <Separator />
            <OptionButton icon={MapPin} label="Add location" value="" onClick={() => showComingSoon('Location')} />
        </div>
      </main>

      <footer className="w-full p-4 border-t flex gap-3">
        <Button variant="outline" className="flex-1 h-12 text-base" onClick={() => showComingSoon('Drafts')} disabled={loading}>
            <Save className="w-5 h-5 mr-2" />
            Drafts
        </Button>
        <Button className="flex-1 h-12 text-base" onClick={handlePost} disabled={loading || !media}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {loading ? 'Posting...' : 'Post'}
        </Button>
      </footer>
    </div>
  );
}
