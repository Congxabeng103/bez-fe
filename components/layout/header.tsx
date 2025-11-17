"use client";

import Link from "next/link";
// 1. Thêm 'ShoppingBag'
import { ShoppingCart, Search, Menu, X, User, LogOut, ShoppingBag } from "lucide-react"; 
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
  
  const { cart, isLoaded: isCartLoaded } = useCart(); 
  const { isAuthenticated: isLoggedIn, user, logout } = useAuthStore(); 
  const totalItems = cart.length; 
  
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
                  {/* (Code Search Popup) */}
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
                  // Nếu ĐÃ ĐĂNG NHẬP (Hiển thị Avatar)
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-2 hover:bg-muted rounded-lg transition flex items-center gap-2"
                  >
                    {/* --- SỬA: ĐỒNG BỘ AVATAR --- */}
                    <img
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.name || "Avatar"}
                      className="w-6 h-6 rounded-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    {/* --- KẾT THÚC SỬA --- */}
                  </button>
                ) : (
                  // Nếu CHƯA ĐĂNG NHẬP
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

                {/* Dropdown Menu (khi đã đăng nhập) */}
                {isUserMenuOpen && isLoggedIn && user && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-border">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      href="/profile" 
                      className="block w-full text-left px-4 py-2 hover:bg-muted transition flex items-center gap-2"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" /> 
                      {t.myProfile}
                    </Link>
                    
                    {/* --- SỬA: THÊM LINK "ĐƠN HÀNG CỦA TÔI" --- */}
                    <Link
                      href="/orders" // Link đến trang đơn hàng
                      className="block w-full text-left px-4 py-2 hover:bg-muted transition flex items-center gap-2"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <ShoppingBag className="w-4 h-4" /> 
                      Đơn hàng của tôi
                    </Link>
                    {/* --- KẾT THÚC SỬA --- */}

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
            {/* --- KẾT THÚC Logic Auth UI --- */}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
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
      
      {/* --- SỬA: XÓA THẺ </div> THỪA Ở ĐÂY --- */}
      
    </header>
  );
}