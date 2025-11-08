import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

// 1. THAY ĐỔI IMPORT NÀY
// Xóa: import { Toaster } from "@/components/ui/toaster";
// Thêm:
import { Toaster } from "@/components/ui/sonner"; // (Hoặc "sonner" nếu bạn cài trực tiếp)

import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BAZ Shop",
  description: "Created with v0",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}

        {/* 2. THÊM CÁC THUỘC TÍNH NÀY */}
          <Toaster richColors position="top-right" duration={1500} />
        <Analytics />
      </body>
    </html>
  );
}