
'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const AccountSettingItem = ({
  label,
  href,
  onClick,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
}) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center px-4 py-4 text-left transition-colors hover:bg-muted/50"
      >
        <span className="flex-1 text-base">{label}</span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
    );
  }

  return (
    <Link
      href={href || '#'}
      className="flex w-full items-center px-4 py-4 text-left transition-colors hover:bg-muted/50"
    >
      <span className="flex-1 text-base">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
};

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleFeatureClick = (feature: string) => {
    toast({
      title: 'Feature Coming Soon',
      description: `${feature} feature will be available in a future update.`,
    });
  };

  const accountSettings = [
    { label: 'Account Informations', href: '/settings/account/information' },
    { label: 'Password', onClick: () => handleFeatureClick('Password management') },
    { label: 'Passkey', onClick: () => handleFeatureClick('Passkey') },
    { label: 'Switch to Business Account', onClick: () => handleFeatureClick('Business account') },
    { label: 'Download your data', onClick: () => handleFeatureClick('Data download') },
    { label: 'Deactivate or Delete Account', onClick: () => handleFeatureClick('Account deletion') },
  ];

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Account</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {accountSettings.map((item, index) => (
            <React.Fragment key={item.label}>
              <AccountSettingItem 
                label={item.label} 
                href={'href' in item ? item.href : undefined}
                onClick={'onClick' in item ? item.onClick : undefined}
              />
              {index < accountSettings.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </div>
      </main>
    </div>
  );
}
