// File: app/admin/layout.tsx (Đã sửa lỗi Hydration)
"use client"

import { useState, useEffect } from "react"; // <-- 1. Import useState, useEffect
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 2. Dùng hook 'useAuthStore()' để component tự re-render khi state thay đổi
  const { user, isAuthenticated } = useAuthStore(); 
  const router = useRouter();

  // 3. State để theo dõi Hydration (Server = false)
  const [isHydrated, setIsHydrated] = useState(false);

  // 4. Chỉ chạy ở Client (sau khi component mount)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isAuthorized = isAuthenticated && user && (
    user.roles.includes('ADMIN') || user.roles.includes('STAFF')
  )

  // 5. Logic chuyển hướng (Chỉ chạy sau khi đã Hydrate)
  useEffect(() => {
    // Nếu chưa hydrate, không làm gì cả
    if (!isHydrated) {
      return; 
    }
    
    // Nếu (sau khi hydrate) user chưa đăng nhập
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin'); // Đẩy về trang Login
      return;
    }
    
    // Nếu (sau khi hydrate) user đã đăng nhập, nhưng là USER (không có quyền)
    if (isAuthenticated && !isAuthorized) {
        router.push('/'); // Đẩy về trang Bán hàng (Trang chủ)
    }
  }, [isHydrated, isAuthenticated, isAuthorized, router]); // <-- 6. Thêm isHydrated

  // 7. Logic Render
  // (Server render 'isHydrated=false' -> Spinner)
  // (Client render lần đầu 'isHydrated=false' -> Spinner)
  // -> Server và Client khớp nhau = Hết lỗi Hydration.
  if (!isHydrated || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Nếu đã Hydrate VÀ có quyền, hiển thị trang admin
  return <>{children}</>
}