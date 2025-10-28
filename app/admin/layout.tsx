// File: app/admin/layout.tsx (SỬA LẠI)
"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/authStore"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated } = useAuthStore.getState() // Lấy state đồng bộ
  const router = useRouter()

  const isAuthorized = isAuthenticated && user && (
    user.roles.includes('ADMIN') || user.roles.includes('STAFF')
  )

  useEffect(() => {
    // Nếu chưa đăng nhập
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin'); // <-- SỬA: Đẩy về trang Login
      return;
    }
    
    // Nếu đã đăng nhập, nhưng là USER (không có quyền)
    if (isAuthenticated && !isAuthorized) {
        router.push('/'); // Đẩy về trang Bán hàng (Trang chủ)
    }
  }, [isAuthenticated, isAuthorized, router])

  // Nếu đang loading (chưa xác định) hoặc đang chuyển hướng
  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Nếu có quyền (ADMIN/STAFF), hiển thị trang admin
  return <>{children}</>
}