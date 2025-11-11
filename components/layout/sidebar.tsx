"use client";

import { useState } from "react";
import {
  LayoutDashboard, Package, Tag, Layers, ShoppingCart, Users,
  UserCheck, Activity, BarChart3, Menu, X, TicketPercent, 
  Percent, LogOut, Settings, LayoutList, Building 
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore(); // Dùng store (API)

  // --- Danh sách menu đã cập nhật ---
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Sản phẩm", icon: Package },
    { id: "categories", label: "Danh mục", icon: LayoutList },
    { id: "brands", label: "Thương hiệu", icon: Building },
    { id: "variants", label: "Biến thể", icon: Layers },
    { id: "orders", label: "Đơn hàng", icon: ShoppingCart },
    { id: "coupons", label: "Coupons", icon: TicketPercent },
    { id: "promotions", label: "Khuyến mãi (%)", icon: Percent }, // Key đúng
    // (Phần lọc admin/staff)
    { id: "customers", label: "Khách hàng", icon: Users, adminOnly: true },
    { id: "employees", label: "Nhân viên", icon: UserCheck, adminOnly: true },
    
  ];

  // Lọc menu dựa trên quyền (ADMIN/STAFF)
  const filteredMenuItems = menuItems.filter(item => {
      if (!item.adminOnly) return true;
      return user?.roles.includes('ADMIN');
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Nút Hamburger/X cho mobile (CSS Gốc) */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 lg:hidden">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* --- SỬA LẠI CSS <aside> CHO GIỐNG GỐC --- */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:static lg:translate-x-0 transition-transform duration-300 w-64 h-screen bg-card border-r border-border overflow-y-auto z-40 flex flex-col`}
        // Đã sửa:
        // 1. lg:static (Quan trọng nhất - Giống file gốc)
        // 2. w-64 (Rộng 256px - Giống file gốc)
        // 3. bg-card, border-border (Màu theme của bạn - Giống file gốc)
      >
        {/* Logo/Header Sidebar (CSS Gốc: p-6) */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">Quản lý cửa hàng</p>
        </div>

        {/* Danh sách Menu (CSS Gốc: px-4, py-3) */}
        <nav className="space-y-2 px-4 flex-1 mt-4"> {/* Thêm mt-4 */}
          {filteredMenuItems.map((item) => { // Dùng filteredMenuItems
            const Icon = item.icon;
            const isActive = currentPage === item.id; 

            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id); 
                  if (window.innerWidth < 1024) setIsOpen(false); 
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${ // Giữ px-4, py-3
                  isActive
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground" 
                }`}
                title={item.label}
              >
                <Icon size={20} className="shrink-0"/>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Thông tin User (CSS Gốc) */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <img
              src={user?.avatar || "/placeholder.svg"} // Dùng 'user'
              alt={user?.name || "User"} // Dùng 'user'
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Lớp phủ nền mờ (CSS Gốc) */}
      {isOpen && <div className="fixed inset-0 bg-black/50 lg:hidden z-30" onClick={() => setIsOpen(false)} />}
    </>
  );
}