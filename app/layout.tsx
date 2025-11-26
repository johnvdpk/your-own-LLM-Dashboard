import type { Metadata } from 'next';
import { Providers } from '@/components/Providers/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: "AI Chat - OpenRouter",
  description: "Chat with multiple AI models via OpenRouter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}