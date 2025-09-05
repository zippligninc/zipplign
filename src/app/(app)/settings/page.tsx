
'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ChevronRight,
  User,
  Lock,
  Shield,
  Wallet,
  Share2,
  Bell,
  Tv,
  History,
  Video,
  Megaphone,
  Play,
  Languages,
  Hourglass,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SettingsItem = ({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
}) => {
  const content = (
    <div className="flex w-full items-center px-4 py-3 text-left">
      <Icon className="mr-4 h-6 w-6 text-muted-foreground" />
      <span className="flex-1 text-base">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:bg-muted/50 transition-colors rounded-lg">
        {content}
      </Link>
    );
  }

  return <button className="w-full hover:bg-muted/50 transition-colors rounded-lg">{content}</button>;
};

const accountItems = [
  { icon: User, label: 'Account', href: '/settings/account' },
  { icon: Lock, label: 'Privacy' },
  { icon: Shield, label: 'Security' },
  { icon: Wallet, label: 'Balance' },
  { icon: Share2, label: 'Share profile' },
];

const contentItems = [
  { icon: Bell, label: 'Notifications' },
  { icon: Tv, label: 'Live' },
  { icon: History, label: 'Activity center' },
  { icon: Video, label: 'Content preference' },
  { icon: Megaphone, label: 'Ads' },
  { icon: Play, label: 'Playback' },
  { icon: Languages, label: 'Language' },
  { icon: Hourglass, label: 'Screen time' },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Settings & Privacy</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="py-4">
          <h2 className="px-4 text-sm font-semibold text-muted-foreground">
            Account
          </h2>
          <div className="mt-2 flex flex-col rounded-lg bg-muted/30">
            {accountItems.map((item, index) => (
              <SettingsItem key={index} icon={item.icon} label={item.label} href={item.href} />
            ))}
          </div>
        </div>
        <div className="py-4">
          <h2 className="px-4 text-sm font-semibold text-muted-foreground">
            Content & Display
          </h2>
          <div className="mt-2 flex flex-col rounded-lg bg-muted/30">
            {contentItems.map((item, index) => (
              <SettingsItem key={index} icon={item.icon} label={item.label} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
