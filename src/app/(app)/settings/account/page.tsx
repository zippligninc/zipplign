
'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { downloadUserData, deleteUserAccount, deactivateUserAccount } from '@/lib/account-utils';

const AccountSettingItem = ({
  label,
  href,
  onClick,
  loading,
  destructive,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  destructive?: boolean;
}) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        className={`flex w-full items-center px-4 py-4 text-left transition-colors hover:bg-muted/50 ${
          destructive ? 'text-red-600 hover:text-red-700' : ''
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="flex-1 text-base">{label}</span>
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
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
  const [loading, setLoading] = useState<string | null>(null);

  const handleFeatureClick = (feature: string) => {
    toast({
      title: 'Feature Coming Soon',
      description: `${feature} feature will be available in a future update.`,
    });
  };

  const handleDownloadData = async () => {
    setLoading('download');
    const result = await downloadUserData();
    
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message || 'Data downloaded successfully!',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to download data',
        variant: 'destructive',
      });
    }
    
    setLoading(null);
  };

  const handleDeactivateAccount = async () => {
    if (!confirm('Are you sure you want to deactivate your account? This action can be reversed by logging back in.')) {
      return;
    }

    setLoading('deactivate');
    const result = await deactivateUserAccount();
    
    if (result.success) {
      toast({
        title: 'Account Deactivated',
        description: result.message || 'Your account has been deactivated.',
      });
      router.push('/login');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to deactivate account',
        variant: 'destructive',
      });
    }
    
    setLoading(null);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    setLoading('delete');
    const result = await deleteUserAccount();
    
    if (result.success) {
      toast({
        title: 'Account Deleted',
        description: result.message || 'Your account has been deleted.',
      });
      router.push('/login');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete account',
        variant: 'destructive',
      });
    }
    
    setLoading(null);
  };

  const accountSettings = [
    { label: 'Account Informations', href: '/settings/account/information' },
    { label: 'Password', onClick: () => handleFeatureClick('Password management') },
    { label: 'Passkey', onClick: () => handleFeatureClick('Passkey') },
    { label: 'Switch to Business Account', onClick: () => handleFeatureClick('Business account') },
    { 
      label: 'Download your data', 
      onClick: handleDownloadData,
      loading: loading === 'download'
    },
    { 
      label: 'Deactivate Account', 
      onClick: handleDeactivateAccount,
      loading: loading === 'deactivate'
    },
    { 
      label: 'Delete Account', 
      onClick: handleDeleteAccount,
      loading: loading === 'delete',
      destructive: true
    },
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
                loading={'loading' in item ? item.loading : undefined}
                destructive={'destructive' in item ? item.destructive : undefined}
              />
              {index < accountSettings.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </div>
      </main>
    </div>
  );
}
