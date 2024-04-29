import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
  
export const metadata: Metadata = {
  title: "Namespace Notes",
  description: "This is a simple multi-tenant RAG application built using Pinecone Serverless, the Vercel AI SDK and OpenAI. It uses namespaces to separate context between workspaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white`}>{children}</body>
    </html>
  );
}
