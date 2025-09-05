// src/app/(app)/inbox/[id]/layout.tsx
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen bg-background">{children}</div>;
}
