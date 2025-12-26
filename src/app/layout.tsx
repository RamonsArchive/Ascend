import LocalFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import GlobalNav from "@/src/components/globalComponents/GlobalNav";

const lexend = LocalFont({
  src: "./fonts/Inter/Inter-VariableFont_opsz,wght.woff2",
  variable: "--font-lexend",
  weight: "100 900", // This tells Next.js it supports all weights
  display: "swap",
  preload: true,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lexend.variable} antialiased`}>
        <GlobalNav />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
