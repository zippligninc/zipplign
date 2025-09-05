
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const interests = [
  'Comedy',
  'Love and Dating',
  'Learning',
  'Sports',
  'Games',
  'Life Hacks',
  'Technology',
  'Family',
  'Foods',
  'Health',
  'Animals',
  'DIY',
  'Travel',
  'Fashion',
  'Beauty',
];

export default function InterestsPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const router = useRouter();

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    // Here you would typically save the user's interests
    console.log('Selected interests:', selectedInterests);
    router.push('/onboarding/add-friends');
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background p-6 text-foreground">
      <header className="flex items-center justify-end">
        <Button variant="ghost" asChild>
            <Link href="/home">Skip</Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col pt-8">
        <h1 className="text-3xl font-bold">Select your Interest</h1>
        <p className="mt-2 text-muted-foreground">
          Get personalized content recommendations
        </p>

        <div className="relative mt-8">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search" className="h-12 pl-10" />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {interests.map((interest) => (
            <Button
              key={interest}
              variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
              className={cn(
                'rounded-full px-5 py-3 h-auto',
                selectedInterests.includes(interest) && 'bg-gradient-to-r from-green-400 to-teal-500 border-none text-black'
              )}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Button>
          ))}
        </div>

        <div className="mt-auto flex justify-center pb-8">
          <Button 
            className="w-full max-w-sm h-12 bg-gradient-to-r from-green-400 to-teal-500 text-black font-bold"
            onClick={handleNext}
            disabled={selectedInterests.length === 0}
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}
