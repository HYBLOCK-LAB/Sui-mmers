import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col border-gray-200">
      <main className="flex-1 flex items-center justify-center relative">
        {/* 왼쪽 버튼 - 중앙에 배치 */}
        <div className="absolute left-[300px] top-[400px] transform -translate-y-1/2 z-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Sui-mmers</h1>
            <p className="text-base text-gray-600">Dive into Sui and Move through a fun swimming game!</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="shadow-md">
                <Link href="/lessons">Let's start</Link>
              </Button>
              <Button asChild size="lg" className="shadow-md">
                <Link href="/gameplay">Playgroud</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 오른쪽 로고 - 크게 표시 */}
        <div className="absolute right-[185px] top-[400px] transform -translate-y-1/2">
          <img src="/sui-mmers-logo.png" alt="Sui-mmers Logo" className="h-[70vh] w-auto object-contain" />
        </div>
      </main>
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <div className="px-4 py-6 text-center text-sm text-gray-600">
          Made with care for Sui-mmers - Keep swimming forward!
        </div>
      </footer>
    </div>
  );
}
