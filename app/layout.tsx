import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";

export const metadata: Metadata = {
  title: "Kisaan Setu | Smarter Markets for Farmers",
  description:
    "Market intelligence and buyer discovery for farmers and FPOs. Explore market prices, compare buyer offers, and plan a better sale.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
