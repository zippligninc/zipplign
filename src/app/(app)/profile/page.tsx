
'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenSquare, UserPlus, Plus, Loader2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  cover_url: string;
  zipping_count: number;
  zippers_count: number;
  likes_count: number;
} | null;

type Zippclip = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
}

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [zippclips, setZippclips] = useState<Zippclip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClips, setLoadingClips] = useState(true);

  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfileData = useCallback(async (user: User) => {
    try {
      console.log('Fetching profile data for user:', user.id);
      setLoading(true);
      setLoadingClips(true);
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', user.id)
        .single();

      console.log('Profile data result:', { profileData, profileError });

      if (profileError && profileError.status !== 406) {
        console.error('Profile error:', profileError);
        throw profileError;
      }
      
      if (profileData) {
        setProfile(profileData);
      } else {
        // Create default profile if none exists
        const defaultProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: user.user_metadata?.avatar_url || '',
          bio: '',
          cover_url: '',
          zipping_count: 0,
          zippers_count: 0,
          likes_count: 0
        };
        setProfile(defaultProfile);
      }
      
      // Fetch zippclips
      const { data: clipsData, error: clipsError } = await supabase
        .from('zippclips')
        .select('id, media_url, media_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Clips data result:', { clipsData, clipsError });

      if (clipsError) {
        console.error('Clips error:', clipsError);
        throw clipsError;
      }
      
      if (clipsData) {
        setZippclips(clipsData);
      } else {
        setZippclips([]);
      }

    } catch (error) {
      console.error('Error in fetchProfileData:', error);
      if (error instanceof Error) {
        toast({ title: "Error loading profile", description: error.message, variant: "destructive" });
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
      setLoadingClips(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfileData(session.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        setLoading(false);
        setLoadingClips(false);
      }
    };
    
    checkUser();
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Profile loading timeout reached');
      setLoading(false);
      setLoadingClips(false);
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [fetchProfileData, router]);


  const handleFeatureClick = (featureName: string) => {
    toast({
      title: `${featureName} Coming Soon`,
      description: `The ${featureName.toLowerCase()} feature is currently under development.`,
      duration: 3000,
    });
  };
  
  const handleCoverEditClick = () => {
    coverFileInputRef.current?.click();
  };

  const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    let { error: uploadError } = await supabase.storage.from('zippclips').upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Error uploading cover photo', description: uploadError.message, variant: 'destructive' });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('zippclips').getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ cover_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
       toast({ title: 'Error updating cover photo', description: updateError.message, variant: 'destructive' });
    } else {
      setProfile(prev => prev ? { ...prev, cover_url: publicUrl } : null);
      toast({
        title: "Cover Photo Updated",
        description: "Your new cover photo is now being displayed.",
      });
    }
  };

  if (loading) {
      return (
          <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
      )
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground pb-20">
        <div className="relative h-20 w-full">
          <Image
              src={profile?.cover_url || "https://picsum.photos/seed/cover-profile/800/200"}
              alt="Cover image"
              fill
              className="object-cover"
              data-ai-hint="group friends outdoors"
          />
            <div className="absolute inset-0 bg-black/40" />
            <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end p-2 text-white">
                <input
                    type="file"
                    ref={coverFileInputRef}
                    onChange={handleCoverFileChange}
                    className="hidden"
                    accept="image/*"
                    disabled={!profile}
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCoverEditClick} disabled={!profile}>
                    <PenSquare className="h-4 w-4" />
                </Button>
            </header>
        </div>

      <div className="container mx-auto px-4">
        <div className="flex items-start gap-3 -mt-8">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-background">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name || 'User'} />
                <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
                <Button size="icon" className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 border-2 border-background h-6 w-6" asChild>
                  <Link href="/create">
                    <Plus className="h-3 w-3 text-primary-foreground" />
                  </Link>
                </Button>
            </div>
            <div className="pt-10 flex-1">
              <h1 className="text-base font-bold">{profile?.full_name || 'New User'}</h1>
              <p className="text-xs text-muted-foreground">@{profile?.username || 'username'}</p>
            </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="flex-1">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleFeatureClick('Share Profile')}>Share profile</Button>
            <Button variant="secondary" size="icon" className="h-7 w-7" asChild>
                <Link href="/add-friends">
                    <UserPlus className="h-4 w-4" />
                </Link>
            </Button>
        </div>

        <div className="flex justify-around w-full mt-3 text-center border border-border rounded-lg p-1.5">
            <div>
                <p className="font-bold text-xs">{profile?.zipping_count ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">zipping</p>
            </div>
            <div className="border-l border-border h-5 self-center" />
            <div>
                <p className="font-bold text-xs">{profile?.zippers_count ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">zippers</p>
            </div>
            <div className="border-l border-border h-5 self-center" />
            <div>
                <p className="font-bold text-xs">{profile?.likes_count ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Like</p>
            </div>
        </div>
        
        {profile?.bio ? (
          <p className="mt-2 text-xs">{profile.bio}</p>
        ) : (
          <Button variant="secondary" className="mt-2 h-6 text-xs px-2" asChild>
              <Link href="/profile/edit">+ Add bio</Link>
          </Button>
        )}


        <Tabs defaultValue="zippclip" className="w-full mt-3">
          <TabsList className="grid w-full grid-cols-5 bg-transparent border-b">
            <TabsTrigger value="zippclip" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent text-xs h-8">Zippclip</TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent text-xs h-8">Saved</TabsTrigger>
            <TabsTrigger value="drafts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent text-xs h-8">Drafts</TabsTrigger>
            <TabsTrigger value="private" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent text-xs h-8">Private</TabsTrigger>
            <TabsTrigger value="likes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent text-xs h-8">Likes</TabsTrigger>
          </TabsList>
          <TabsContent value="zippclip" className="pt-2">
            {loadingClips ? (
              <div className="grid grid-cols-3 gap-0.5">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[9/16]" />)}
              </div>
            ) : zippclips.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {zippclips.map(clip => (
                    <div key={clip.id} className="relative aspect-[9/16] bg-muted">
                        <Image src={clip.media_url} alt="Zippclip" fill className="object-cover" />
                        {clip.media_type === 'video' && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <PlayCircle className="w-8 h-8 text-white/80" />
                            </div>
                        )}
                    </div>
                  ))}
                </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground flex flex-col items-center justify-center">
                  <div className="w-24 h-24 flex items-center justify-center">
                     <svg width="180" height="180" viewBox="0 0 244 245" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <path d="M211.53 189.654C223.141 182.102 238.163 187.359 237.56 200.7L233.123 211.393C231.11 215.931 226.541 218.665 221.724 218.665H22.4799C16.9239 218.665 12.3599 213.627 12.8799 208.115L17.7599 157.17C18.6319 148.077 26.2399 141.665 35.3999 141.665H92.0599C94.5113 141.665 96.8833 140.941 98.8899 139.605L118.81 126.336C123.36 123.321 129.2 123.642 133.39 127.022L161.41 149.027C163.663 150.722 166.368 151.665 169.16 151.665H202.98C209.61 151.665 214.53 158.077 211.53 164.214V189.654Z" fill="hsl(var(--muted-foreground))" fillOpacity="0.2"/>
                        <path d="M129.98 126.665C136.61 126.665 141.98 121.293 141.98 114.665V25.6648C141.98 19.0368 136.61 13.6648 129.98 13.6648H69.9799C63.3499 13.6648 57.9799 19.0368 57.9799 25.6648V114.665C57.9799 121.293 63.3499 126.665 69.9799 126.665H129.98Z" fill="hsl(var(--muted-foreground))"  fillOpacity="0.5" stroke="hsl(var(--border))" strokeWidth="2"/>
                        <path d="M109.98 103.665C113.844 103.665 116.98 100.529 116.98 96.6648V56.6648C116.98 52.8008 113.844 49.6648 109.98 49.6648L95.5399 43.6648C94.6199 43.2878 93.5799 43.5168 92.9199 44.2088L85.9099 51.6648C85.2599 52.3338 85.3199 53.3988 86.0199 53.9928L94.7599 60.5928C95.4299 61.1078 95.8399 61.8958 95.7399 62.7218L94.9799 69.2138C94.5799 72.8258 97.4399 75.9268 101.06 76.0528L109.98 76.3328V103.665Z" fill="hsl(var(--muted-foreground))" stroke="hsl(var(--background))" strokeWidth="1.5"/>
                        <path d="M79.9799 58.6648L109.98 49.6648V76.3318L101.06 76.0518C97.4399 75.9258 94.5799 72.8248 94.9799 69.2128L95.7399 62.7208C95.8399 61.8948 95.4299 61.1068 94.7599 60.5918L86.0199 53.9918C85.3199 53.3978 85.2599 52.3328 85.9099 51.6638L79.9799 58.6648Z" stroke="hsl(var(--muted))" strokeWidth="2"/>
                    </svg>
                  </div>
                  <p className="mt-3 font-semibold text-xs">Upload your first Zippclip</p>
                  <p className="text-xs text-muted-foreground mt-1">Your Zippclips will appear here</p>
                  <Button className="mt-3" size="sm" asChild>
                    <Link href="/create">Upload</Link>
                  </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="saved">
            <div className="text-center py-8 text-muted-foreground text-xs">No saved videos.</div>
          </TabsContent>
          <TabsContent value="drafts">
            <div className="text-center py-8">
              <Button variant="outline" size="sm" asChild>
                <Link href="/drafts">View Drafts</Link>
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="private">
            <div className="text-center py-8 text-muted-foreground text-xs">No private videos.</div>
          </TabsContent>
          <TabsContent value="likes">
              <div className="text-center py-8 text-muted-foreground text-xs">No liked videos.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
