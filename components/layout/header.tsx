"use client";

import Link from "next/link";
// 1. THÊM IMPORT LayoutDashboard
import { ShoppingCart, Search, Menu, X, User, LogOut, ShoppingBag, LayoutDashboard } from "lucide-react"; 
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuthStore } from "@/lib/authStore";
import { products } from "@/lib/products";
import { translations as t } from "@/lib/translations";
import { Button } from "@/components/ui/button";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [avatarError, setAvatarError] = useState(false); 

  const { cart, isLoaded: isCartLoaded } = useCart(); 
  const { isAuthenticated: isLoggedIn, user, logout } = useAuthStore(); 
  const totalItems = cart.length; 
  
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user]);

  // 2. LOGIC KIỂM TRA QUYỀN TRUY CẬP ADMIN
  // Kiểm tra xem user có role nào chứa chữ ADMIN, MANAGER hoặc STAFF không
  const canAccessAdmin = user?.roles?.some(role => 
    role.includes('ADMIN') || role.includes('MANAGER') || role.includes('STAFF')
  );

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">BezShop</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary transition">
              {t.home}
            </Link>
            <Link href="/products" className="text-foreground hover:text-primary transition">
              {t.shop}
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary transition">
              {t.about}
            </Link>
            <Link href="/contact" className="text-foreground hover:text-primary transition">
              {t.contact}
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                <Search className="w-5 h-5" />
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-50">
                   {/* Code Search Popup */}
                </div>
              )}
            </div>

            <Link href="/cart" className="relative p-2 hover:bg-muted rounded-lg transition">
              <ShoppingCart className="w-5 h-5" />
              {isLoaded && isCartLoaded && totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* --- Logic Auth UI --- */}
            {isLoaded && ( 
              <div className="relative">
                {isLoggedIn && user ? (
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-1 hover:bg-muted rounded-full transition flex items-center gap-2"
                  >
                    {/* --- START: AVATAR LOGIC --- */}
                    {user.avatar && !avatarError ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "User"}
                        className="w-8 h-8 rounded-full object-cover border border-border"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold border border-border text-sm select-none">
                        {/* LOGIC MỚI: Dùng firstName nếu có */}
                        {user.firstName 
                          ? user.firstName.charAt(0).toUpperCase()
                          : (user.name ? user.name.trim().split(" ").pop()?.charAt(0).toUpperCase() : "U")
                        }
                      </div>
                    )}
                    {/* --- END: AVATAR LOGIC --- */}
                  </button>
                ) : (
                  <>
                    <div className="hidden sm:flex items-center gap-2">
                      <Link href="/login">
                          <Button variant="ghost" size="sm">{t.login}</Button>
                      </Link>
                      <Link href="/register">
                          <Button size="sm">{t.register}</Button>
                      </Link>
                    </div>
                    <Link href="/login" className="sm:hidden p-2 hover:bg-muted rounded-lg transition">
                        <User className="w-5 h-5" />
                    </Link>
                  </>
                )}

                {isUserMenuOpen && isLoggedIn && user && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30">
                      <p className="font-semibold truncate">{user.name || user.firstName}</p> 
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                        
                        {/* 3. HIỂN THỊ NÚT ADMIN NẾU CÓ QUYỀN */}
                        {canAccessAdmin && (
                          <Link
                            href="/admin"
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 rounded-md transition flex items-center gap-2 text-sm font-medium"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Trang quản trị
                          </Link>
                        )}

                        <Link
                        href="/profile" 
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition flex items-center gap-2 text-sm"
                        onClick={() => setIsUserMenuOpen(false)}
                        >
                        <User className="w-4 h-4" /> 
                        {t.myProfile}
                        </Link>
                        
                        <Link
                        href="/orders"
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition flex items-center gap-2 text-sm"
                        onClick={() => setIsUserMenuOpen(false)}
                        >
                        <ShoppingBag className="w-4 h-4" /> 
                        Đơn hàng của tôi
                        </Link>

                        <div className="h-px bg-border my-1" />

                        <button
                        onClick={() => {
                            logout()
                            setIsUserMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 rounded-md transition flex items-center gap-2 text-sm"
                        >
                        <LogOut className="w-4 h-4" />
                        {t.logout}
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="md:hidden pb-4 px-4 flex flex-col gap-2">
          <Link href="/" className="px-4 py-2 hover:bg-muted rounded transition">
            {t.home}
          </Link>
          <Link href="/products" className="px-4 py-2 hover:bg-muted rounded transition">
            {t.shop}
          </Link>
          <Link href="/about" className="px-4 py-2 hover:bg-muted rounded transition">
            {t.about}
          </Link>
          <Link href="/contact" className="px-4 py-2 hover:bg-muted rounded transition">
            {t.contact}
          </Link>
        </nav>
      )}
    </header>
  );
}