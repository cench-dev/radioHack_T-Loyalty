import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { UserProvider } from '@/lib/userStore';
import './globals.css';

export const metadata: Metadata = {
  title: 'Лояльность - Т-Банк',
  description: 'Все выгоды от банка в одном месте',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          <UserProvider>{children}</UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
