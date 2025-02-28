'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // 在应用加载时检查并应用保存的主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <html lang="zh">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
