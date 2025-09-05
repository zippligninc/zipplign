
'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const InfoRow = ({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) => (
  <div>
    <button className="flex w-full items-center justify-between py-4 text-left">
      <span className="text-base font-medium">{label}</span>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{value}</span>
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
    {description && (
      <p className="text-sm text-muted-foreground -mt-2 pb-4">{description}</p>
    )}
  </div>
);

export default function AccountInformationPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Account Informations</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-4">
        <section className="py-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            User Information
          </h2>
          <div className="flex flex-col divide-y divide-border">
            <InfoRow label="Phone number" value="+1201********" />
            <InfoRow label="Email" value="" />
            <InfoRow
              label="Account region"
              value="USA"
              description="Lorem Ipsum is simply dummy text of the printing and typesetting industry."
            />
          </div>
        </section>

        <Separator className="my-4" />

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground">
            Autofill Information
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. Learn more
          </p>
          <div className="mt-4 flex flex-col divide-y divide-border rounded-lg border">
             <InfoRow label="Contact Information" value="Empty" />
          </div>
        </section>
      </main>
    </div>
  );
}
