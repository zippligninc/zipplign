
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ChevronRight,
  Contact,
  QrCode,
  Search,
  Share,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const suggestedAccounts: { name: string; handle: string; avatarUrl: string }[] = [
    { name: 'MotionMakers', handle: '@motionmakers', avatarUrl: 'https://picsum.photos/seed/sugg1/128/128' },
    { name: 'DanceFever', handle: '@dancefever', avatarUrl: 'https://picsum.photos/seed/sugg2/128/128' },
    { name: 'ComedyCentral', handle: '@comedycentral', avatarUrl: 'https://picsum.photos/seed/sugg3/128/128' },
    { name: 'FoodieFiesta', handle: '@foodiefiesta', avatarUrl: 'https://picsum.photos/seed/sugg4/128/128' },
];

export default function AddFriendsPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-3 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-bold">Add Friends</h1>
        <Button variant="ghost" size="icon">
          <QrCode className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 px-4 overflow-y-auto pb-20">
        <Tabs defaultValue="suggested" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">Friends 0</TabsTrigger>
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
          </TabsList>
          <TabsContent value="suggested" className="pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-9 bg-muted border-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center w-full p-2 text-left hover:bg-muted rounded-lg cursor-pointer">
                <div className="p-1.5 bg-green-500/20 rounded-full mr-3">
                  <Contact className="h-5 w-5 text-green-500" />
                </div>
                <span className="flex-1 font-medium text-xs">Contacts</span>
                <span className="text-muted-foreground mr-2 text-xs">40</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center w-full p-2 text-left hover:bg-muted rounded-lg">
                <div className="p-1.5 bg-blue-600/20 rounded-full mr-3">
                  <FacebookIcon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="flex-1 font-medium text-xs">Facebook Friends</span>
                <Button size="sm" className="px-4">
                  Find
                </Button>
              </div>
              <div className="flex items-center w-full p-2 text-left hover:bg-muted rounded-lg cursor-pointer">
                <div className="p-1.5 bg-blue-400/20 rounded-full mr-3">
                  <Share className="h-5 w-5 text-blue-400" />
                </div>
                <span className="flex-1 font-medium text-xs">Invite friend</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xs font-semibold text-muted-foreground px-2">
                Suggested accounts
              </h2>
              <div className="mt-2 space-y-1">
                {suggestedAccounts.length > 0 ? (
                  suggestedAccounts.map((account, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 rounded-lg"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={account.avatarUrl}
                          alt={account.name}
                        />
                        <AvatarFallback>
                          {account.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-xs">{account.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.handle}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" className="px-3">
                          Remove
                        </Button>
                        <Button size="sm" className="px-3">Zippback</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No suggested accounts.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
