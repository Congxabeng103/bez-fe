"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  Layers,
  ShoppingCart,
  Users,
  UserCheck,
  Activity,
  BarChart3,
  Menu,
  X,
  // --- THÊM 1: Import Icons mới ---
  TicketPercent, // Icon cho Coupon
  Percent,       // Icon cho Khuyến mãi %
  LogOut,        // Icon Đăng xuất (nếu chưa có)
  Settings       // Icon Hồ sơ (nếu chưa có)
} from "lucide-react";
// --- THÊM 2: Import store xác thực ---
import { useAuthStore } from "@/lib/authStore"; // Thay vì useStore

interface SidebarProps {
  currentPage: string; // Trang hiện tại đang active
  onPageChange: (page: string) => void; // Hàm callback để đổi trang
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false); // State quản lý đóng/mở sidebar trên mobile
  // --- THÊM 3: Lấy state từ useAuthStore ---
  const { user, logout } = useAuthStore(); // Lấy user và hàm logout

  // --- THÊM 4: Cập nhật danh sách menu ---
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Sản phẩm", icon: Package }, // Rút gọn tên
    { id: "attributes", label: "Thuộc tính", icon: Tag }, // Rút gọn tên
    { id: "variants", label: "Biến thể", icon: Layers }, // Rút gọn tên
    { id: "orders", label: "Đơn hàng", icon: ShoppingCart }, // Rút gọn tên
    // --- Mục mới ---
    { id: "coupons", label: "Coupons", icon: TicketPercent }, // Mục Coupon
    { id: "promotions", label: "Khuyến mãi (%)", icon: Percent }, // Mục Khuyến mãi %
    // --- (Xóa mục "promotions" cũ) ---
    { id: "customers", label: "Khách hàng", icon: Users }, // Rút gọn tên
    { id: "employees", label: "Nhân viên", icon: UserCheck }, // Rút gọn tên
    { id: "activity", label: "Hoạt động NV", icon: Activity }, // Rút gọn tên
    { id: "analytics", label: "Thống kê", icon: BarChart3 },
  ];

  // Hàm xử lý đăng xuất (không cần thay đổi nhiều)
  const handleLogout = () => {
    logout();
    // Có thể thêm chuyển hướng về trang login ở đây nếu cần
  };

  return (
    <>
      {/* Nút Hamburger/X cho mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden p-1 rounded-md bg-background/50 backdrop-blur-sm" // Style nút
        aria-label={isOpen ? "Đóng menu" : "Mở menu"}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar chính */}
      <aside
        className={`${
          isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full" // Thêm shadow khi mở
        } fixed lg:sticky lg:top-0 lg:translate-x-0 transition-transform duration-300 ease-in-out w-60 h-screen bg-card border-r border-border overflow-y-auto z-40 flex flex-col`} // Giảm width, đổi màu nền
      >
        {/* Logo/Header Sidebar */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Quản lý cửa hàng</p>
        </div>

        {/* Danh sách Menu */}
        <nav className="flex-1 space-y-1 p-3"> {/* Giảm space, padding */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id; // Kiểm tra active

            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id); // Gọi callback đổi trang
                  if (window.innerWidth < 1024) setIsOpen(false); // Tự đóng sidebar trên mobile khi chọn
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${ // Kích thước, font
                  isActive
                    ? "bg-primary text-primary-foreground" // Style active
                    : "text-muted-foreground hover:bg-muted hover:text-foreground" // Style không active
                }`}
                title={item.label} // Tooltip
              >
                <Icon size={18} className="shrink-0"/> {/* Icon nhỏ hơn, không co lại */}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Thông tin User & Nút Logout (đặt cuối sidebar) */}
        <div className="p-3 border-t border-border mt-auto"> {/* Đẩy xuống cuối */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"> {/* Thêm hover */}
            <img
              src={user?.avatar || "/placeholder.svg"} // Lấy avatar từ store mới
              alt={user?.name || "User"}
              className="w-8 h-8 rounded-full object-cover border" // Kích thước nhỏ hơn, thêm border
            />
            <div className="flex-1 text-left min-w-0"> {/* Chống tràn text */}
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            {/* Có thể thêm nút cài đặt hoặc logout trực tiếp ở đây */}
             {/* <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => onPageChange('profile')} title="Hồ sơ">
                <Settings size={16} />
             </Button>
             <Button variant="ghost" size="icon" className="w-8 h-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={handleLogout} title="Đăng xuất">
                 <LogOut size={16} />
             </Button> */}
          </div>
        </div>
      </aside>

      {/* Lớp phủ nền mờ khi sidebar mở trên mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/60 lg:hidden z-30" onClick={() => setIsOpen(false)} />}
    </>
  );
}