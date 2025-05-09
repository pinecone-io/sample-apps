import { Inter } from 'next/font/google';
import { logger } from '@/services/logger';
import "../global.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "Pinecone - Confluent SDK Example",
  description: "Pinecone - Confluent SDK Example",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (typeof window === 'undefined') {
    logger.serviceStart();
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

if (typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    process.exit(0);
  });
}
