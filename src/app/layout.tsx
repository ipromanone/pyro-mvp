import { ThemeProvider } from '../components/ThemeProvider';
import './globals.css';

export const metadata = {
  title: 'Pyro - Оптовые поставки пиротехники',
  description: 'B2B платформа для закупки пиротехники и товаров для праздника',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}