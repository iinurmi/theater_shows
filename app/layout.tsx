import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Helsinki Theater Shows',
  description: 'Weekly theater performance listings for Helsinki, powered by the City of Helsinki Linked Events API.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
