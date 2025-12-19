import LocalFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";

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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
