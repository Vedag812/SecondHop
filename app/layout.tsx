import type { Metadata } from 'next';
import Script from 'next/script';
import { IBM_Plex_Mono, Libre_Baskerville, Manrope } from 'next/font/google';
import './globals.css';
import './rescue.css';

const sans = Manrope({ variable: '--font-sans-custom', subsets: ['latin'] });
const serif = Libre_Baskerville({
  variable: '--font-serif-custom',
  subsets: ['latin'],
  weight: ['400', '700'],
});
const mono = IBM_Plex_Mono({
  variable: '--font-mono-custom',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'SecondHop · Smarter return commerce',
  description:
    'Shop merchant-owned returns or let your buyer agent find an exact match. Bounded checkout, verified handoff, and recorded recovery.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </head>
      <body className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
