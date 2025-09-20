import type { Metadata } from 'next';
import { ReactNode, useState } from 'react';
import '@/styles/globals.css';
import '@mysten/dapp-kit/dist/index.css';
import { Header } from '@/components/Header';
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
        <body className="min-h-screen text-gray-900 antialiased">
          <Header />
          {children}
        </body>
      </Providers>
    </html>
  );
}
