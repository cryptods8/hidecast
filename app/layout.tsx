import type { Metadata } from "next";

import "./globals.css";
import "@farcaster/auth-kit/styles.css";

export const metadata: Metadata = {
  title: "Hidecast by ds8",
  description: "Hide your cast behind Reveal button",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-default dark:bg-primary-900 font-inter">{children}</body>
    </html>
  );
}
