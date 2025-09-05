import { BottomNav } from '@/components/common/bottom-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <main className="h-full pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
