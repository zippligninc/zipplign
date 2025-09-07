'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, UserPlus, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toggleFollow } from '@/lib/social-actions';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_following: boolean;
}

export default function AddFriendsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const checkAuthAndFetchUsers = async () => {
    if (!supabase) {
      toast({
        title: 'Configuration Error',
        description: 'Database connection not available.',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    await fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all users except current user with follow status
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          username, 
          full_name, 
          avatar_url, 
          bio,
          follows!follows_follower_id_fkey (
            following_id
          )
        `)
        .neq('id', currentUser?.id)
        .order('full_name');

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
        return;
      }

      const formattedUsers: User[] = (usersData || []).map(user => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        is_following: user.follows && user.follows.length > 0
      }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    if (!currentUser) return;

    setFollowing(prev => new Set(prev).add(userId));
    
    try {
      const result = await toggleFollow(userId);
      if (result.success) {
        // Update the user's follow status
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, is_following: result.data?.following || false }
            : user
        ));
        
        toast({
          title: result.data?.following ? 'Following' : 'Unfollowed',
          description: result.data?.following 
            ? 'You are now following this user' 
            : 'You are no longer following this user',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update follow status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleMessageUser = (userId: string) => {
    // Navigate to new message page with pre-selected user
    router.push(`/inbox/new?user=${userId}`);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between p-3 sticky top-0 bg-background z-10 border-b">
        <Link href="/inbox">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-base font-bold">Find Friends</h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      <main className="flex-1 px-4">
        {/* Search */}
        <div className="relative mb-4 mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-9 h-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users List */}
        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                  <AvatarFallback>
                    {user.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {user.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user.bio}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMessageUser(user.id)}
                    className="rounded-full"
                  >
                    Message
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={user.is_following ? "secondary" : "default"}
                    onClick={() => handleFollowToggle(user.id)}
                    disabled={following.has(user.id)}
                    className="rounded-full"
                  >
                    {following.has(user.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : user.is_following ? (
                      'Following'
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No users found' : 'No users available'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try searching with a different name or username'
                  : 'There are no other users to follow yet'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}