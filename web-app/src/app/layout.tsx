import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S+FTLMS",
  description:
    "S+FTLMS - Scheduler and Faculty Teaching Load Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
