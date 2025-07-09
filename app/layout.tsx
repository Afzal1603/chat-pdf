import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AIProvider } from "@/components/element/AIProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/element/Providers";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Intelidocs",
  description: "AI-powered PDF chat platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <Providers>
        <html lang="en">
          <head>
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap"
              rel="stylesheet"
            />
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {children}
          </body>
        </html>
        <Toaster />
      </Providers>
    </ClerkProvider>
  );
}
