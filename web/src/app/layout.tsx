import type { Metadata } from 'next'
import { ReactNode } from 'react'
import '@/styles/globals.css'
import '@mysten/dapp-kit/dist/index.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Sui-mmers',
  description: 'Learn Move & Sui through interactive gameplay experiences.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
