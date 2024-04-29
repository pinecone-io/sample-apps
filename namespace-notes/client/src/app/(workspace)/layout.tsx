"use client";

import Sidenav from '@/components/ui/sidenav';
import { WorkspaceChatProvider } from '../../lib/hooks/workspace-chat-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceChatProvider>
      <div className="flex h-screen bg-white">
        <Sidenav />
        <main className="flex-1 p-4 overflow-auto ">{children}</main>
      </div>
    </WorkspaceChatProvider>
  );
}