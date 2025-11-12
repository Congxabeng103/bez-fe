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

  // --- SỬA PHÂN QUYỀN: Cập nhật danh sách menu ---
  const menuItems = [
    // 1. Chỉ ADMIN / MANAGER thấy (Dashboard riêng)
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },

    // 2. Cả 3 vai trò
    { id: "orders", label: "Đơn hàng", icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'STAFF'] },

    // 3. SỬA: Cả 3 vai trò đều được XEM
    // (Việc SỬA/XÓA đã được chặn bên trong trang bằng biến 'canEdit')
    { id: "products", label: "Sản phẩm", icon: Package, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "categories", label: "Danh mục", icon: LayoutList, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "brands", label: "Thương hiệu", icon: Building, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    
    // SỬA: Đã bỏ comment (//) và thêm 'STAFF'
    { id: "variants", label: "Biến thể", icon: Layers, roles: ['ADMIN', 'MANAGER', 'STAFF'] }, 
    
    { id: "coupons", label: "Coupons", icon: TicketPercent, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "promotions", label: "Khuyến mãi (%)", icon: Percent, roles: ['ADMIN', 'MANAGER', 'STAFF'] },

    // 4. Chỉ ADMIN (Quản lý User)
    { id: "customers", label: "Khách hàng", icon: Users, roles: ['ADMIN'] },
    { id: "employees", label: "Nhân viên", icon: UserCheck, roles: ['ADMIN'] },
  ];

  // Lọc menu dựa trên quyền (Sửa logic đọc 'user.roles')
  const filteredMenuItems = menuItems.filter(item => {
    if (!user || !user.roles) return false;

    // --- SỬA LOGIC LỌC ---
    // (Thêm 'ROLE_' để khớp với Spring Security cho chắc chắn)
    const userRoles = user.roles;
    return item.roles.some(requiredRole =>
        userRoles.includes(requiredRole) ||
        userRoles.includes(`ROLE_${requiredRole}`)
    );
    // --- KẾT THÚC SỬA LOGIC LỌC ---
  });
  // --- KẾT THÚC SỬA ---

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
      >
        {/* Logo/Header Sidebar (CSS Gốc: p-6) */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">Quản lý cửa hàng</p>
        </div>

        {/* Danh sách Menu (CSS Gốc: px-4, py-3) */}
        <nav className="space-y-2 px-4 flex-1 mt-4">
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
                <Icon size={20} className="shrink-0" />
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