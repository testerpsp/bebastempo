import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import '@rainbow-me/rainbowkit/styles.css';

export const metadata: Metadata = {
  title: "Tempo DEX 🚀",
  description: "Swap stablecoins on Tempo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}