'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createDirectConversation } from '@/lib/messaging';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export default function NewMessagePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get('user');

  useEffect(() => {
    checkAuthAndFetchUsers();
  }, []);

  useEffect(() => {
    // Auto-start conversation if user is preselected
    if (preselectedUserId && users.length > 0) {
      const preselectedUser = users.find(user => user.id === preselectedUserId);
      if (preselectedUser) {
        handleStartConversation(preselectedUserId);
      }
    }
  }, [preselectedUserId, users]);

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
      // Get all users except current user
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
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

      setUsers(usersData || []);
      setFilteredUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (userId: string) => {
    if (!currentUser) return;

    setCreating(userId);
    try {
      const result = await createDirectConversation(userId);
      if (result.success && result.data) {
        toast({
          title: 'Conversation Started',
          description: 'You can now start messaging!',
        });
        router.push(`/inbox/${result.data.id}`);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to start conversation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-20">
      {/* Header */}
      <header className="flex items-center justify-between p-3 sticky top-0 bg-background z-10 border-b">
        <Link href="/inbox">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-base font-bold">New Message</h1>
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
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleStartConversation(user.id)}
                  disabled={creating === user.id}
                  className="rounded-full"
                >
                  {creating === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Message'
                  )}
                </Button>
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
                  : 'There are no other users to message yet'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
