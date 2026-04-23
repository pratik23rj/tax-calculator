import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tax Calculator",
  description: "Responsive in-hand salary calculator for India's old and new tax regimes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50 antialiased">{children}</body>
    </html>
  );
}
