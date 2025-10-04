import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col min-h-0 px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
      <section className="flex flex-1 min-h-0 w-full max-w-6xl mx-auto flex-col md:flex-row items-center justify-center md:justify-between gap-6 md:gap-10 bg-white/95 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        <div className="flex-1 w-full max-w-xl text-center md:text-left space-y-5">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              Sui-mmers
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Dive into Sui and Move through a fun swimming game!
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <Button asChild size="lg" className="h-12 px-12 text-base shadow-md">
              <Link href="/lessons">Let's start</Link>
            </Button>
            <Button asChild size="lg" className="h-12 px-12 text-base shadow-md">
              <Link href="/gameplay">Playgroud</Link>
            </Button>
          </div>
        </div>
        <div className="flex-1 w-full md:w-auto flex justify-center md:justify-end">
          <img
            src="/sui-mmers-logo.png"
            alt="Sui-mmers Logo"
            className="m-auto h-auto max-h-[32vh] w-full max-w-xs sm:max-w-sm md:max-w-md object-contain drop-shadow-lg"
          />
        </div>
      </section>
    </div>
  );
}
