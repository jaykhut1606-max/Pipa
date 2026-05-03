import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: "Pippa — Understand your baby", template: "%s · Pippa" },
  description:
    "AI scans for cries, diapers, and rashes. Built with pediatricians. Helps new parents decide between 'all is well' and 'call the doctor.'",
  keywords: [
    "baby app",
    "newborn",
    "baby tracker",
    "cry analyzer",
    "diaper rash app",
    "parenting AI",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://pippa.app"),
  openGraph: {
    title: "Pippa — Understand your baby",
    description: "AI scans for cries, diapers, and rashes.",
    images: ["/og.png"],
    locale: "en_US",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Pippa" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5A983",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
