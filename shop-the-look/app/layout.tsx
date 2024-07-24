import { ReactNode } from 'react';
import { Fira_Mono } from 'next/font/google';
import { Roboto } from 'next/font/google';
import './styles.css';
import { Analytics } from '@vercel/analytics/react';

const fira_mono = Fira_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400','500','700'],
  variable: '--font-fira_mono',
});

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400','500','700'],
  variable: '--font-roboto',
});

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <title>Shop The Look</title>
        <meta name='description' content='Shop The Look is an outfit inspiration app built with Pinecone, Google Multimodal Embedding Model, and Next.js.' />
      </head>
      <body className={`${fira_mono.variable} ${roboto.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}