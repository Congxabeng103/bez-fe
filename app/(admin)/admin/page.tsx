// File: app/admin/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link" // <--- 1. IMPORT LINK
import { Sidebar } from "@/components/layout/sidebar"
import { Dashboard } from "@/components/pages/dashboard"
import { ProductManagement } from "@/components/pages/product-management"
import { VariantManagement } from "@/components/pages/variant-management"
import { OrderManagement } from "@/components/pages/order-management"
import { CustomerManagement } from "@/components/pages/customer-management"
import { EmployeeManagement } from "@/components/pages/employee-management"
import { Profile } from "@/components/pages/profile"
import { CategoryManagement } from "@/components/pages/category-management";
import { BrandManagement } from "@/components/pages/brand-management";
import { CouponManagement } from "@/components/pages/coupon-management";
import { PromotionManagement } from "@/components/pages/promotion-management";
import { useAuthStore } from "@/lib/authStore" // (Lưu ý: Kiểm tra lại đường dẫn store của bạn)
// <--- 2. THÊM ICON HOME
import { Settings, LogOut, Home } from "lucide-react" 
import { ProductImageManagement } from "@/components/pages/product-image-management";

export default function AdminDashboardPage() {
  const { user, logout } = useAuthStore()

  const getInitialPage = () => {
    const userRoles = useAuthStore.getState().user?.roles || [];
    const isAdminOrManager =
      userRoles.includes('ADMIN') ||
      userRoles.includes('MANAGER') ||
      userRoles.includes('ROLE_ADMIN') ||
      userRoles.includes('ROLE_MANAGER');

    if (isAdminOrManager) return "dashboard";
    if (userRoles.includes('STAFF') || userRoles.includes('ROLE_STAFF')) return "orders";
    return "dashboard";
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard />;
      case "products": return <ProductManagement />;
      case "categories": return <CategoryManagement />;
      case "brands": return <BrandManagement />;
      case "variants": return <VariantManagement />;
      case "orders": return <OrderManagement />;
      case "coupons": return <CouponManagement />;
      case "promotions": return <PromotionManagement />;
      case "product-images": return <ProductImageManagement />;
      case "customers": return <CustomerManagement />;
      case "employees": return <EmployeeManagement />;
      case "profile": return <Profile />;
      default: return <OrderManagement />; 
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="flex-1 overflow-auto flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-background">
          {/* Bạn có thể để trống hoặc thêm nút "Xem Website" ở đây nếu muốn truy cập nhanh */}
          <div></div> 

          <div className="relative group">
            {/* Nút User Avatar */}
            <button className="flex items-center gap-2 hover:bg-muted p-2 rounded-lg transition-colors">
              {(user?.avatar) ? (
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold select-none">
                  {user?.firstName 
                    ? user.firstName.charAt(0).toUpperCase()
                    : (user?.name ? user.name.trim().split(" ").pop()?.charAt(0).toUpperCase() : "U")
                  }
                </div>
              )}
              <span className="text-sm font-medium">{user?.name}</span>
            </button>

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-0 w-56 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              
              {/* 1. Nút Hồ sơ */}
              <button
                onClick={() => setCurrentPage("profile")}
                className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
              >
                <Settings size={16} />
                Hồ sơ cá nhân
              </button>

              {/* 2. Nút Về trang chủ (MỚI THÊM) */}
              {/* Dùng Link để chuyển trang mượt mà mà không load lại cả app (Client Side Navigation) */}
              <Link 
                href="/" 
                className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2 whitespace-nowrap text-foreground"
              >
                <Home size={16} />
                Về trang bán hàng
              </Link>

              <div className="h-[1px] bg-border my-1"></div> {/* Đường kẻ phân cách */}

              {/* 3. Nút Đăng xuất */}
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 transition-colors text-sm flex items-center gap-2 text-red-500 whitespace-nowrap"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">{renderPage()}</div>
      </main>
    </div>
  )
}