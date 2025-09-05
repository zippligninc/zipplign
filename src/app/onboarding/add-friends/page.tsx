
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const friends: { id: string, name: string, avatarUrl: string }[] = [];

const FriendAvatar = ({ friend, isSelected, onToggle }: { friend: { id: string, name: string, avatarUrl: string }, isSelected: boolean, onToggle: (id: string) => void }) => {
    return (
        <div className="flex flex-col items-center gap-2" onClick={() => onToggle(friend.id)}>
            <div className="relative">
                <Avatar className="w-24 h-24">
                    <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {isSelected && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full text-white p-1">
                        <Check className="h-4 w-4" />
                    </div>
                )}
            </div>
            <span className="font-medium">{friend.name}</span>
        </div>
    )
}

export default function AddFriendsOnboardingPage() {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const router = useRouter();

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    console.log('Selected friends:', selectedFriends);
    router.push('/home');
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background p-6 text-foreground">
      <header className="flex items-center justify-end">
        <Button variant="ghost" asChild>
          <Link href="/home">Skip</Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col pt-8">
        <h1 className="text-3xl font-bold">Connect with<br/>your Friends</h1>

        <div className="mt-8 grid grid-cols-3 gap-x-4 gap-y-6">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <FriendAvatar 
                  key={friend.id}
                  friend={friend} 
                  isSelected={selectedFriends.includes(friend.id)}
                  onToggle={toggleFriend}
              />
            ))
          ) : (
            <p className="col-span-3 text-muted-foreground text-center py-8">No friends to suggest right now. You can add friends later.</p>
          )}
        </div>

        <div className="mt-auto flex justify-center pb-8">
          <Button
            className="w-full max-w-sm h-12 bg-gradient-to-r from-green-400 to-teal-500 text-black font-bold"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}
