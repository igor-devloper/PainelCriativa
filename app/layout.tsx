import type React from "react";
import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/app/_components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QueryClientProvider } from "@/app/_components/query-client-provider";
import { Suspense } from "react";

const mulish = Mulish({
  subsets: ["latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Painel Criativa",
  description: "Painel de solicitações e prestação de contas",
  icons: {
    icon: [
      { rel: "icon", url: "/logo.png" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/favicon-16x16.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        url: "/apple-touch-icon.png",
      },
      { rel: "manifest", url: "/site.webmanifest" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${mulish.className} antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
          }}
        >
          <QueryClientProvider>
            <div className="flex h-full flex-col overflow-hidden">
              <Suspense>
                {children}
                <Analytics />
                <SpeedInsights />
              </Suspense>
            </div>
            <Toaster />
          </QueryClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
