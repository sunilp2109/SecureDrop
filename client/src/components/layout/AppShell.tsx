import type { ReactNode } from 'react';
import { Footer, Navbar } from './Navbar';

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="pointer-events-none absolute inset-0 bg-grid bg-[size:64px_64px] opacity-60" />
      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <main className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-12 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
