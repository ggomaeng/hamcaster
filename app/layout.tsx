import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/react";

const kanit = Kanit({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Hamcaster",
  description:
    "Retrieve ham-chain data of users who interacted with a given cast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={kanit.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
