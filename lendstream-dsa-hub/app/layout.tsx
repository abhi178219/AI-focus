import type { Metadata } from 'next'
import { Onest } from 'next/font/google'
import './globals.css'

const onest = Onest({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'LendStream DSA Hub',
  description: 'Partner portal for DSA-sourced loan leads: pipeline, documents, AI-assisted eligibility assessment.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${onest.variable}`} style={{ background: '#eae9e6' }}>
      <body className="min-h-full font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
