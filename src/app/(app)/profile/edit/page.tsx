
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { ArrowLeft, Camera, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchProfile = useCallback(async (user: User) => {
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, username, bio, avatar_url`)
        .eq('id', user.id)
        .single();
      
      if (error && status !== 406) throw error;
      
      if (data) {
        setName(data.full_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error)
        toast({ title: 'Error loading profile data', description: error.message, variant: 'destructive'});
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        router.push('/login');
      }
    };
    checkUser();
  }, [fetchProfile, router]);


  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Error uploading avatar', description: uploadError.message, variant: 'destructive' });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(publicUrl);
    toast({ title: 'Avatar updated!', description: 'Save your profile to make it permanent.' });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      username,
      bio,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (error) {
       toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Profile Saved',
        description: 'Your changes have been successfully saved.',
      });
      router.push('/profile');
      router.refresh(); // Refresh the profile page to show new data
    }
    setLoading(false);
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Edit profile</h1>
        <Button variant="ghost" size="icon" onClick={handleSave} disabled={loading}>
          <Check className="h-6 w-6 text-primary" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={loading}
            />
            <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
              <AvatarImage src={avatarUrl ?? undefined} alt="Profile preview" />
               <AvatarFallback>{name.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
             <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-background">
                <Camera className="h-4 w-4 text-primary-foreground" />
             </div>
          </div>
          <Button variant="link" className="mt-2 text-primary" onClick={handleAvatarClick} disabled={loading}>
            Change photo
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-4">
            About you
          </h3>
          <div className="rounded-lg bg-muted/30">
            <div className="grid w-full items-center gap-1.5 px-4 py-3">
              <Label htmlFor="name" className="text-muted-foreground">Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="border-none p-0 focus-visible:ring-0 h-auto text-base bg-transparent" />
            </div>
            <Separator />
            <div className="grid w-full items-center gap-1.5 px-4 py-3">
              <Label htmlFor="username" className="text-muted-foreground">Username</Label>
              <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} className="border-none p-0 focus-visible:ring-0 h-auto text-base bg-transparent" />
            </div>
            <Separator />
            <div className="grid w-full items-center gap-1.5 px-4 py-3">
              <Label htmlFor="bio" className="text-muted-foreground">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} disabled={loading} placeholder="Add your bio" className="border-none p-0 focus-visible:ring-0 text-base bg-transparent resize-none" />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-4">
            Social
          </h3>
          <div className="rounded-lg bg-muted/30">
            <div className="px-4 py-3">
              <Label className="text-muted-foreground">Instagram</Label>
              <Input className="border-none p-0 focus-visible:ring-0 h-auto text-base bg-transparent" placeholder="Add Instagram profile" disabled={loading}/>
            </div>
            <Separator />
            <div className="px-4 py-3">
              <Label className="text-muted-foreground">YouTube</Label>
              <Input className="border-none p-0 focus-visible:ring-0 h-auto text-base bg-transparent" placeholder="Add YouTube profile" disabled={loading}/>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
