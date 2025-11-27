"use client";

import { useState } from "react";
import {
  LayoutDashboard, Package, Layers, ShoppingCart, Users,
  UserCheck, Menu, X, TicketPercent,
  Percent, LogOut, LayoutList, Building, Images
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();

  // --- CẤU HÌNH MENU & PHÂN QUYỀN ---
  const menuItems = [
    // Dashboard: Chỉ cấp quản lý xem báo cáo
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
    
    // Nghiệp vụ bán hàng: Cả 3 đều cần
    { id: "orders", label: "Đơn hàng", icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "products", label: "Sản phẩm", icon: Package, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "categories", label: "Danh mục", icon: LayoutList, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "brands", label: "Thương hiệu", icon: Building, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "variants", label: "Biến thể", icon: Layers, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "product-images", label: "Quản lý Ảnh SP", icon: Images, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "coupons", label: "Coupons", icon: TicketPercent, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { id: "promotions", label: "Khuyến mãi (%)", icon: Percent, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    
    // Khách hàng: Staff cần truy cập để tạo/sửa thông tin khách khi bán
    { id: "customers", label: "Khách hàng", icon: Users, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    
    // Nhân viên: Manager cần truy cập để quản lý Staff
    { id: "employees", label: "Nhân viên", icon: UserCheck, roles: ['ADMIN', 'MANAGER'] },
  ];

  // --- LOGIC LỌC MENU THEO QUYỀN ---
  const filteredMenuItems = menuItems.filter(item => {
    if (!user || !user.roles) return false;
    const userRoles = user.roles;
    
    // Kiểm tra xem User có ít nhất 1 role khớp với yêu cầu của menu không
    // Hỗ trợ cả định dạng "ADMIN" và "ROLE_ADMIN"
    return item.roles.some(requiredRole =>
      userRoles.includes(requiredRole) ||
      userRoles.includes(`ROLE_${requiredRole}`)
    );
  });

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        logout();
    }
  };

  // Helper hiển thị Avatar chữ cái
  const getInitial = () => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    if (user?.name) return user.name.trim().split(" ").pop()?.charAt(0).toUpperCase();
    return "A"; 
  };

  return (
    <>
      {/* Nút Hamburger cho mobile */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-background border rounded-md shadow-sm">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 lg:hidden z-40" onClick={() => setIsOpen(false)} />}

      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:static lg:translate-x-0 transition-transform duration-300 w-64 h-screen bg-card border-r border-border overflow-y-auto z-50 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border shrink-0">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
             <LayoutDashboard className="w-8 h-8"/> BezBe
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Quản trị hệ thống</p>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1 px-4 py-4 flex-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={item.label}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? "" : "group-hover:text-foreground"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0">
            <div className="flex items-center gap-3 mb-4">
                {user?.avatar ? (
                    <img
                    src={user.avatar}
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold border border-border shrink-0 select-none">
                        {getInitial()}
                    </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
            </div>

            <button 
                onClick={handleLogout} 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
            >
                <LogOut size={18} />
                Đăng xuất
            </button>
        </div>
      </aside>
    </>
  );
}