import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NewsFlow',
  description: 'Your team\'s unified news feed — AI-tagged, personalised, real-time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-stone-50">
      <body className={`${inter.className} min-h-full antialiased`}>
        {children}
      </body>
    </html>
  )
}
