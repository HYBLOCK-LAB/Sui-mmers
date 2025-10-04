import type { Metadata } from 'next';
import { ReactNode } from 'react';
import '@/styles/globals.css';
import '@mysten/dapp-kit/dist/index.css';
import { Header } from '@/components/Header';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'Sui-mmers',
  description: 'Dive into Sui and Move through a fun swimming game!',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <Providers>
        <body className="min-h-screen flex flex-col text-gray-900 antialiased bg-gradient-to-b from-white via-web3-50/15 to-white">
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="w-full px-0 pb-6">
            <div className="w-full border-t border-web3-100/40 bg-white/92 px-4 py-3 text-center text-xs sm:text-sm text-web3-700">
              <p>Made with care for Sui-mmers - Keep swimming forward!</p>
              <p>© 2025 HYBLOCK. All Rights Reserved.</p>
            </div>
          </footer>
        </body>
      </Providers>
    </html>
  );
}
