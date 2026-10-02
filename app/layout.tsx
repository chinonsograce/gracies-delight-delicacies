import type { Metadata } from "next";
import "./globals.css";
import { BRAND, TAGLINE } from '@/lib/catalog';

export const metadata: Metadata = {
  title: BRAND,
  description: TAGLINE,
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
