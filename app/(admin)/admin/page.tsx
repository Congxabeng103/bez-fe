// File: app/admin/page.tsx (TẠO MỚI)
"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar" // 1. Import Sidebar
// --- 2. Sửa đường dẫn Import (Giả sử các trang của bạn nằm ở đây) ---
import { Dashboard } from "@/components/pages/dashboard"
import { ProductManagement } from "@/components/pages/product-management"
import { AttributeManagement } from "@/components/pages/attribute-management"
import { VariantManagement } from "@/components/pages/variant-management"
import { OrderManagement } from "@/components/pages/order-management"
import { CustomerManagement } from "@/components/pages/customer-management"
import { EmployeeManagement } from "@/components/pages/employee-management"
import { Profile } from "@/components/pages/profile" // (Profile cũng nên nằm ở đây)
import { CategoryManagement } from "@/components/pages/category-management";
import { BrandManagement } from "@/components/pages/brand-management";
import { CouponManagement } from "@/components/pages/coupon-management";
import { PromotionManagement } from "@/components/pages/promotion-management";
import { useAuthStore } from "@/lib/authStore"
import { Settings, LogOut } from "lucide-react"

export default function AdminDashboardPage() {
  const { user, logout } = useAuthStore()
  const [currentPage, setCurrentPage] = useState("dashboard")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard />;
      case "products": return <ProductManagement />;
      case "categories": return <CategoryManagement />;
      case "brands": return <BrandManagement />;
      case "attributes": return <AttributeManagement />;
      case "variants": return <VariantManagement />;
      case "orders": return <OrderManagement />;
      case "coupons": return <CouponManagement />;
      case "promotions": // Giữ nguyên "promotions"
        return <PromotionManagement />;
      case "customers": return <CustomerManagement />;
      case "employees": return <EmployeeManagement />;
      case "profile": return <Profile />;
      default:
        return <Dashboard />;
    }
  }

 // --- LAYOUT ADMIN (Sử dụng CSS của file gốc) ---
 return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {/* 1. Thẻ <main> (Đã sửa lỗi, không có 'h-screen') */}
      <main className="flex-1 overflow-auto flex flex-col"> 
        
        {/* 2. Header (CSS Gốc: p-4) */}
        <div className="flex justify-between items-center p-4 border-b bg-background">
          <div></div> {/* Div rỗng để căn phải */}
          
          <div className="relative group">
            <button className="flex items-center gap-2 hover:bg-muted p-2 rounded-lg transition-colors">
              <img
                src={user?.avatar || "/placeholder.svg"}
                alt={user?.name || "User"}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium">{user?.name}</span>
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-0 w-48 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={() => setCurrentPage("profile")}
                className="w-full text-left px-4 py-2 hover:bg-muted rounded-t-lg transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
              >
                <Settings size={16} />
                Hồ sơ cá nhân
              </button>
              <button
                onClick={logout} // Hàm logout (sẽ sửa ở store)
                className="w-full text-left px-4 py-2 hover:bg-muted rounded-b-lg transition-colors text-sm flex items-center gap-2 text-red-600 whitespace-nowrap"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        
        {/* 3. Nội dung (CSS Gốc) */}
        <div className="flex-1 overflow-auto">{renderPage()}</div>
      </main>
    </div>
  )
}