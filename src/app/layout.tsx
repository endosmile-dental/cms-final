import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "./auth";
import { SessionProvider } from "next-auth/react";
import { ReduxProvider } from "./redux/providers";
import ReactQueryProvider from "./react-query/providers";
import { ThemeProvider } from "@/app/components/ThemeProvider";
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
  title: "Clims",
  description: "Created by MJ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth(); // Get server-side session

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen overflow-x-hidden`}
        suppressHydrationWarning
      >
        <SessionProvider session={session}>
          <ReactQueryProvider>
            <ReduxProvider>
              <ThemeProvider>
                <div className="min-h-screen bg-background text-foreground">
                  {children}
                </div>
              </ThemeProvider>
            </ReduxProvider>
          </ReactQueryProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
