
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// The imported GeistSans and GeistMono are objects, not functions.
// They directly provide .variable and .className properties.
// No need to call them like next/font/google or next/font/local.

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
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
          {children}
          <Toaster />
      </body>
    </html>
  );
}
