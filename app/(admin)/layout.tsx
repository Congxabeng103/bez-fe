"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Thêm toast để thông báo lỗi

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // --- SỬA LOGIC PHÂN QUYỀN ---
  // Thêm "ROLE_MANAGER" và "ROLE_STAFF" để khớp với Spring Security
  const isAuthorized =
    isAuthenticated &&
    user &&
    user.roles && // Thêm kiểm tra 'user.roles' tồn tại cho an toàn
    (user.roles.includes("ADMIN") ||
     user.roles.includes("STAFF") ||
     user.roles.includes("MANAGER")); // Thêm
  // --- KẾT THÚC SỬA ---

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, đá về trang login
      router.push("/login?redirect=/admin");
      return;
    }

    if (isAuthenticated && !isAuthorized) {
      // Nếu đã đăng nhập nhưng không phải 1 trong các vai trò trên
      // (ví dụ: là 'USER'), đá về trang chủ
      toast.error("Bạn không có quyền truy cập trang này.");
      router.push("/");
    }
  }, [isHydrated, isAuthenticated, isAuthorized, router]); // (Đã xóa 'user' khỏi dependencies để tránh re-render không cần thiết)

  
  // --- SỬA LOGIC HIỂN THỊ ---

  if (!isHydrated) {
    // Trường hợp 1: Chờ Hydration (để lấy state từ localStorage)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (isAuthenticated && !isAuthorized)) {
    // Trường hợp 2: Chưa đăng nhập HOẶC không có quyền
    // (Hiển thị loading trong khi chờ useEffect redirect)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Trường hợp 3: Đã Hydrate, đã đăng nhập VÀ có quyền
  // (Đây là trường hợp duy nhất render children)
  return <>{children}</>;
}