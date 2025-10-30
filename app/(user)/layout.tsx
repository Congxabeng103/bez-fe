// File: app/(user)/layout.tsx
import type React from "react"
// (Import globals.css đã nằm ở app/layout.tsx)
import { Header } from "@/components/layout/header" // (Import Header v0.dev)
import { Footer } from "@/components/layout/footer" // (Import Footer v0.dev)
// (Bạn không cần import Analytics/Metadata/Geist ở đây)

export default function UserLayout({ // Đổi tên thành UserLayout
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Dán code layout từ file app/layout.tsx (File 149) cũ vào đây
    <div className={`flex flex-col min-h-screen`}>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}