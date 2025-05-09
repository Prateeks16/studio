import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = GeistSans({
  variable: '--font-geist-sans',
});

const geistMono = GeistMono({
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'PayRight - Subscription Management',
  description: 'Manage your subscriptions effectively with PayRight.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
          <Toaster />
      </body>
    </html>
  );
}
