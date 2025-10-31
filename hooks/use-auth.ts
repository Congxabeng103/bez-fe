// File: hooks/use-auth.ts (Viết lại)
"use client";

import { useAuthStore, AuthenticatedUser } from "@/lib/authStore";
import { useState, useEffect } from "react";

// (Interface User cũ của v0.dev)
export interface User {
  id: string
  email: string
  name: string
  phone: string
  address: string
  city: string
  zipCode: string
  country: string
  createdAt: string
}
export interface AuthState {
  user: User | null
  isLoggedIn: boolean
}
// ---

// Hook này giả lập 'useAuth' của v0.dev
// nhưng sử dụng 'useAuthStore' (Zustand) thật
export function useAuth() {
  const { user, isAuthenticated, login, logout, register } = useAuthStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Giúp tránh lỗi Hydration
    setIsLoaded(true); 
  }, []);

  // Chuyển đổi 'user' của Zustand (10 trường) 
  // sang 'user' của v0.dev (8 trường)
  const v0User = user ? {
    id: String(user.id),
    email: user.email,
    name: user.name,
    phone: user.phone || "",
    address: "", // (Zustand không có trường này)
    city: "",
    zipCode: "",
    country: "",
    createdAt: new Date().toISOString(), // (Dùng ngày giả)
  } : null;

  // (Hàm login/register giả lập để khớp interface)
  const mockLogin = async (email: string, pass: string) => {
    try {
        await login(email, pass);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  };
  const mockRegister = async (email: string, pass: string, name: string) => {
     try {
        // (Tách tên cho authStore)
        const nameParts = name.trim().split(' ');
        const firstName = nameParts.pop() || ""; // Tên
        const lastName = nameParts.join(' '); // Họ
        
        await register(firstName, lastName, email, pass);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  };

  return {
    user: v0User,
    isLoggedIn: isAuthenticated,
    isLoaded: isLoaded,
    login: mockLogin, // (Truyền hàm login thật)
    logout: logout, // (Truyền hàm logout thật)
    register: mockRegister, // (Truyền hàm register thật)
    updateProfile: (updates: Partial<User>) => {
        // (Logic này chưa được hỗ trợ, nhưng giữ để không crash)
        console.warn("updateProfile in useAuth (mock) is not fully implemented");
    },
  };
}