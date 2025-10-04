'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const headerStyles = isHomePage
    ? 'bg-white/80 backdrop-blur-sm border-b border-web3-100/40'
    : 'bg-white/90 backdrop-blur-sm border-b border-web3-100/60';

  return (
    <header
      className={`flex flex-row justify-between items-center px-6 py-4 shadow-sm transition-colors ${headerStyles}`}
    >
      <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
        <img
          src="/sui-mmers-logo-only.png"
          alt="Sui-mmers Logo"
          className="h-10 w-auto sm:h-12"
        />
        <span className={`text-lg sm:text-xl font-semibold tracking-tight ${isHomePage ? 'text-web3-500' : 'text-web3-600'}`}>
          Sui-mmers
        </span>
      </Link>

      <WalletConnect />
    </header>
  );
}
