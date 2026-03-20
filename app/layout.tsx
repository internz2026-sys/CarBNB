import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarBnb Admin",
  description: "Admin dashboard for CarBnb - peer-to-peer car rental marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-surface-container-low font-sans text-on-surface">
        {children}
      </body>
    </html>
  );
}
