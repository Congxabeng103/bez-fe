"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar" // Component Sidebar (cần cập nhật menu)
import { Dashboard } from "@/components/pages/dashboard"
import { ProductManagement } from "@/components/pages/product-management"
import { AttributeManagement } from "@/components/pages/attribute-management"
import { VariantManagement } from "@/components/pages/variant-management"
// --- SỬA 1: Import 2 component mới ---
import { CouponManagement } from "@/components/pages/coupon-management"; // Component quản lý Coupon
import { PromotionManagement } from "@/components/pages/promotion-management"; // Component quản lý KM %
// --- (Bỏ import PromotionManagement cũ) ---
import { OrderManagement } from "@/components/pages/order-management"
import { CustomerManagement } from "@/components/pages/customer-management"
import { EmployeeManagement } from "@/components/pages/employee-management"
import { ActivityTracking } from "@/components/pages/activity-tracking"
import { Analytics } from "@/components/pages/analytics"
import { Profile } from "@/components/pages/profile"
import { useAuthStore } from "@/lib/authStore" // Store xác thực
import { Settings, LogOut } from "lucide-react" // Icons
import { Login } from "@/components/pages/login" // Component Login
import { Register } from "@/components/pages/register" // Component Register
import { ForgotPassword } from "@/components/pages/forgot-password" // Component ForgotPassword

export default function Home() {
  // Lấy trạng thái xác thực từ store
  const { user, isAuthenticated, logout } = useAuthStore()
  // State lưu trang hiện tại đang hiển thị
  const [currentPage, setCurrentPage] = useState("dashboard")
  // State quản lý trang xác thực (login/register/forgot)
  const [authPage, setAuthPage] = useState<"login" | "register" | "forgot">("login")

  // --- SỬA 2: Cập nhật hàm renderPage ---
  // Hàm này quyết định component nào sẽ được render dựa trên state 'currentPage'
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard />;
      case "products": return <ProductManagement />;
      case "attributes": return <AttributeManagement />;
      case "variants": return <VariantManagement />;
      // --- Thêm 2 case mới ---
      case "coupons": // Khi currentPage là "coupons"
        return <CouponManagement />; // Render component Coupon
      case "promotions": // Khi currentPage là "promotions-percentage"
        return <PromotionManagement />; // Render component KM %
      // --- (Bỏ case "promotions" cũ) ---
      case "orders": return <OrderManagement />;
      case "customers": return <CustomerManagement />;
      case "employees": return <EmployeeManagement />;
      case "activity": return <ActivityTracking />;
      case "analytics": return <Analytics />;
      case "profile": return <Profile />;
      default: // Mặc định hiển thị Dashboard
        return <Dashboard />;
    }
  }

  // Nếu chưa đăng nhập (isAuthenticated là false)
  if (!isAuthenticated) {
    // Hiển thị component Login, Register, hoặc ForgotPassword tùy theo state 'authPage'
    if (authPage === "login") {
      return (
        <Login
          onSuccess={() => {}} // Store tự xử lý sau khi login thành công
          onForgotPassword={() => setAuthPage("forgot")} // Chuyển sang trang quên mật khẩu
          onRegister={() => setAuthPage("register")} // Chuyển sang trang đăng ký
        />
      )
    } else if (authPage === "register") {
      return <Register onSuccess={() => {}} onLogin={() => setAuthPage("login")} />
    } else if (authPage === "forgot") {
      return <ForgotPassword onLogin={() => setAuthPage("login")} />
    }
    // (Có thể thêm fallback UI ở đây nếu authPage không hợp lệ)
     return <div>Đang tải trang xác thực...</div>; // Hoặc null
  }

  // Nếu đã đăng nhập (isAuthenticated là true), hiển thị layout Admin
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar nhận state trang hiện tại và hàm để thay đổi trang */}
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Phần nội dung chính */}
      <main className="flex-1 overflow-auto flex flex-col h-screen"> {/* Thêm h-screen */}
        {/* Header (Thanh trên cùng) */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b bg-background sticky top-0 z-20"> {/* Sticky header */}
          <div>{/* Có thể thêm breadcrumbs hoặc tiêu đề trang ở đây */}</div>
          {/* Thông tin user và dropdown menu */}
          <div className="relative group">
            <button className="flex items-center gap-2 hover:bg-muted p-1.5 sm:p-2 rounded-lg transition-colors">
              <img
                src={user?.avatar || "/placeholder.svg"} // Lấy avatar từ state user (nếu có)
                alt={user?.name || "User"} // Lấy tên từ state user (nếu có)
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border" // Thêm border
              />
              <span className="text-sm font-medium hidden sm:inline">{user?.name}</span> {/* Ẩn tên trên mobile */}
            </button>
            {/* Dropdown menu (hiện khi hover) */}
            <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={() => setCurrentPage("profile")} // Chuyển sang trang Profile
                className="w-full text-left px-4 py-2 hover:bg-muted rounded-t-lg transition-colors text-sm flex items-center gap-2"
              >
                <Settings size={16} /> Hồ sơ cá nhân
              </button>
              <button
                onClick={logout} // Gọi hàm logout từ store
                className="w-full text-left px-4 py-2 hover:bg-muted rounded-b-lg transition-colors text-sm flex items-center gap-2 text-red-600 dark:text-red-500" // Màu đỏ
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
        {/* Phần nội dung trang (được render bởi hàm renderPage) */}
        <div className="flex-1 overflow-auto"> {/* Container scroll nội dung */}
            {renderPage()}
        </div>
      </main>
    </div>
  )
}