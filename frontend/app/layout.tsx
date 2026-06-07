import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "block",
  variable: "--font-inter",
});

const interDisplay = localFont({
  src: [
    {
      path: "./fonts/InterDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/InterDisplay-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-inter-display",
});

export const metadata: Metadata = {
  title: "HyperInj",
  description: "HyperInj – AI-powered trading on Injective",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Description no longer than 155 characters */}
        <meta name="description" content="HyperInj – AI Trading on Injective" />
        {/* Product Name */}
        <meta name="product-name" content="HyperInj – AI Trading on Injective" />
        {/* Twitter Card data */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="HyperInj – AI Trading on Injective" />
        <meta
          name="twitter:description"
          content="HyperInj – AI-powered trading on Injective"
        />
        {/* Open Graph data for Facebook */}
        <meta property="og:title" content="HyperInj – AI Trading on Injective" />
        <meta property="og:type" content="Article" />
        <meta
          property="og:description"
          content="HyperInj – AI-powered trading on Injective"
        />
        <meta property="og:site_name" content="HyperInj – AI Trading on Injective" />
      </head>
      <body
        className={`${inter.variable} ${interDisplay.variable} bg-theme-n-8 font-sans text-[0.9375rem] leading-[1.5rem] text-theme-primary antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
