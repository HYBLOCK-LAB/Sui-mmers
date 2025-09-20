'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { WalletConnect } from '@/components/WalletConnect';
import { SuiService } from '@/lib/services/suiService';
import { Button } from '@/components/ui/button';
import { LESSONS } from '@/lib/lessons';

const FIRST_LESSON = LESSONS[1];
const FIRST_CHAPTER = FIRST_LESSON.chapters[0];

const LESSON_GUIDE = `## Preparation
- Connect your wallet and switch to the Sui testnet.
- Deploy the practice package once inside the gameplay console - you can reuse it here.

## Learning flow
- Lesson 1 builds the Swimmer object and the lazy progress system.
- Lesson 2 introduces TunaCan items and PTBs.
- Lesson 3 shares a global registry so everyone can track swimmers.

## Next steps
- Jump into the gameplay console to rehearse each action inside a PTB.
- Extend the Move modules with your own ideas once you feel comfortable.`;

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white border-gray-200 p-8">
      <main className="flex-1 mx-20 py-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">Sui-mmers</h1>
              <p className="text-base text-gray-600">Dive into Sui and Move through a fun swimming game!</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="shadow-md">
                <Link href="/lessons">Let's start</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-48 w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-teal-300 to-purple-500 shadow-xl">
              <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold uppercase tracking-[0.35em] text-white/80">Mock Logo</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200">
        <div className="px-4 py-6 text-center text-sm text-gray-600">
          Made with care for Sui-mmers - Keep swimming forward!
        </div>
      </footer>
    </div>
  );
}
