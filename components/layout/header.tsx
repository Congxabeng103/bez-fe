"use client";

import Link from "next/link";
import { ShoppingCart, Search, Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react"; // 1. Import useEffect
import { useCart } from "@/hooks/use-cart";
// --- 2. SỬA IMPORT AUTH ---
import { useAuthStore } from "@/lib/authStore"; // Dùng Zustand
// ---
import { products } from "@/lib/products";
// (Xóa AuthModal)
import { translations as t } from "@/lib/translations";
import { Button } from "@/components/ui/button"; // <-- Import Button

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // (Xóa)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
const { cart, isLoaded: isCartLoaded } = useCart();  // --- 3. SỬA LOGIC AUTH ---
  // Dùng hook (thay vì getState) để component tự re-render khi đăng nhập/đăng xuất
  const { isAuthenticated: isLoggedIn, user, logout } = useAuthStore(); 
const totalItems = cart.length;  // State 'isLoaded' dùng để tránh lỗi Hydration (Server-side rendering)
  // Server sẽ render (isLoaded=false), Client render (isLoaded=false), 
  // sau đó useEffect chạy (isLoaded=true) và hiện đúng UI
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  // ---

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    // Sửa lỗi 1: Xóa thẻ <></> (fragment) thừa
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">FashionHub</span>
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
                  {/* (Code Search Popup) */}
                </div>
              )}
            </div>

            <Link href="/cart" className="relative p-2 hover:bg-muted rounded-lg transition">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* --- SỬA 4: Logic Auth UI (Xóa 'passHref') --- */}
            {isLoaded && ( 
              <div className="relative">
                {isLoggedIn && user ? (
                  // Nếu ĐÃ ĐĂNG NHẬP (Hiển thị Avatar)
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-2 hover:bg-muted rounded-lg transition flex items-center gap-2"
                  >
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                ) : (
                  // Nếu CHƯA ĐĂNG NHẬP (Hiển thị 2 Nút trên Desktop)
                  <>
                    <div className="hidden sm:flex items-center gap-2">
                      <Link href="/login">
                          <Button variant="ghost" size="sm">{t.login}</Button>
                      </Link>
                      <Link href="/register">
                          <Button size="sm">{t.register}</Button>
                      </Link>
                    </div>
                    
                    {/* Nút Icon User (Chỉ hiển thị trên Mobile khi chưa đăng nhập) */}
                    <Link href="/login" className="sm:hidden p-2 hover:bg-muted rounded-lg transition">
                        <User className="w-5 h-5" />
                    </Link>
                  </>
                )}

                {/* Dropdown Menu (khi đã đăng nhập) */}
                {isUserMenuOpen && isLoggedIn && user && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-border">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      href="/profile" 
                      className="block px-4 py-2 hover:bg-muted transition"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {t.myProfile}
                    </Link>
                    {/* (Các Link Orders, Wishlist...) */}
                    <button
                      onClick={() => {
                        logout()
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition flex items-center gap-2 text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* --- KẾT THÚC SỬA 4 --- */}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-2">
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
      </div>
    </header>
    // --- SỬA 5: XÓA AUTH MODAL ---
    // (Không cần gọi AuthModal ở đây nữa)
  );
}