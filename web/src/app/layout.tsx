import type { Metadata } from 'next';
import { ReactNode, useState } from 'react';
import '@/styles/globals.css';
import '@mysten/dapp-kit/dist/index.css';
import Link from 'next/link';
import { WalletConnect } from '@/components/WalletConnect';
import { Providers } from '@/app/providers';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Sui-mmers',
  description: 'Dive into Sui and Move through a fun swimming game!',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <Providers>
        <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
          <header className="flex flex-row justify-between bg-white items-center p-6">
            <Link href="/" className="flex flex-row gap-3 items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-500 text-lg font-bold text-white shadow-lg">
                SM
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.4em] text-blue-600">Sui-mmers</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button asChild className="bg-gray-200 hover:bg-gray-300 text-gray-800">
                <Link href="/lessons">Lessons</Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/gameplay">Playground</Link>
              </Button>
            </div>
            <WalletConnect />
          </header>
          {children}
        </body>
      </Providers>
    </html>
  );
}
