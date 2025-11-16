"use client";

import { useState } from "react";
import {
    LayoutDashboard, Package, Tag, Layers, ShoppingCart, Users,
    UserCheck, Menu, X, TicketPercent,
    Percent, LogOut, Settings, LayoutList, Building, Images
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { UserCheck as UserPlaceholderIcon } from "lucide-react"; // Đảm bảo UserCheck được import cho fallback icon

interface SidebarProps {
    currentPage: string;
    onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuthStore();

    // --- SỬA PHÂN QUYỀN: Cập nhật danh sách menu ---
    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
        { id: "orders", label: "Đơn hàng", icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { id: "products", label: "Sản phẩm", icon: Package, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { id: "categories", label: "Danh mục", icon: LayoutList, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { id: "brands", label: "Thương hiệu", icon: Building, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { id: "variants", label: "Biến thể", icon: Layers, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { id: "product-images", label: "Quản lý Ảnh SP", icon: Images, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { id: "coupons", label: "Coupons", icon: TicketPercent, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { id: "promotions", label: "Khuyến mãi (%)", icon: Percent, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
        { id: "customers", label: "Khách hàng", icon: Users, roles: ['ADMIN'] },
        { id: "employees", label: "Nhân viên", icon: UserCheck, roles: ['ADMIN'] },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (!user || !user.roles) return false;
        const userRoles = user.roles;
        return item.roles.some(requiredRole =>
            userRoles.includes(requiredRole) ||
            userRoles.includes(`ROLE_${requiredRole}`)
        );
    });

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            {/* Nút Hamburger/X cho mobile */}
            <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 lg:hidden">
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside
                className={`${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } fixed lg:static lg:translate-x-0 transition-transform duration-300 w-64 h-screen bg-card border-r border-border overflow-y-auto z-40 flex flex-col`}
            >
                {/* Logo/Header Sidebar */}
                <div className="p-6 border-b border-border">
                    <h1 className="text-2xl font-bold text-foreground">Admin</h1>
                    <p className="text-sm text-muted-foreground">Quản lý cửa hàng</p>
                </div>

                {/* Danh sách Menu */}
                <nav className="space-y-2 px-4 flex-1 mt-4">
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
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
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

                {/* Thông tin User */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                        
                        {/* --- LOGIC AVATAR VÀ FALLBACK --- */}
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name || "User"}
                                // FIX: Dùng object-cover để lấp đầy khung hình (như bạn yêu cầu)
                                className="w-10 h-10 rounded-full object-cover shrink-0" 
                            />
                        ) : (
                            // Fallback: Hiển thị chữ cái đầu nếu không có avatar
                            <div 
                                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0"
                            >
                                {user?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                        {/* --- KẾT THÚC LOGIC AVATAR --- */}

                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-foreground">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
                
            </aside>

            {/* Lớp phủ nền mờ (Mobile) */}
            {isOpen && <div className="fixed inset-0 bg-black/50 lg:hidden z-30" onClick={() => setIsOpen(false)} />}
        </>
    );
}