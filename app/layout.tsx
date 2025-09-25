import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'ポチッと合コン',
  description: '簡単・気軽に合コンを楽しもう！ポチッと合コンは新しい出会いをサポートします。',
  keywords: '合コン, マッチング, 出会い, 恋活, 婚活',
  authors: [{ name: 'Pochitto Gokon Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="font-ja antialiased bg-gray-50 text-gray-900 overflow-x-hidden">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}