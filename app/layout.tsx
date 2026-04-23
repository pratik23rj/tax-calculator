import type { Metadata } from "next";

import "./globals.css";

const themeScript = `
  (function () {
    try {
      var saved = window.localStorage.getItem("tax-theme");
      var preferred =
        saved === "light" || saved === "dark"
          ? saved
          : window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark";
      document.documentElement.dataset.theme = preferred;
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
