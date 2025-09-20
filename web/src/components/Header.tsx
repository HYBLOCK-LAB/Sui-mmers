'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from '@/components/WalletConnect';

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <header className={`flex flex-row justify-between items-center p-6 ${isHomePage ? 'bg-transparent' : 'bg-white/80 backdrop-blur-sm'}`}>
      {!isHomePage && (
        <Link href="/" className="flex flex-row gap-3 items-center">
          <img
            src="/sui-mmers-logo-only.png"
            alt="Sui-mmers Logo"
            className="h-12 w-auto"
          />
        </Link>
      )}

      {/* 홈페이지에서는 로고 대신 빈 공간 유지 */}
      {isHomePage && <div className="w-0" />}

      <WalletConnect />
    </header>
  );
}