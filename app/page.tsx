// File: app/page.tsx (Trang chủ Bán hàng - Public)
"use client"

import Link from "next/link";
import { useAuthStore } from "@/lib/authStore"; // Import store

export default function UserHomepage() {
  // Lấy state đồng bộ để biết ai đang đăng nhập
  const { user, logout, isAuthenticated } = useAuthStore.getState();
  
  // Kiểm tra xem user có phải là Admin/Staff không
  const isAuthorizedAdmin = isAuthenticated && user && (
      user.roles.includes('ADMIN') || user.roles.includes('STAFF')
  );

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      fontSize: '1.2rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
        Đây là Trang chủ Bán Hàng (Trang Public)
      </h1>
      
      {isAuthenticated && user ? (
        <p>Chào mừng, {user.name}!</p>
      ) : (
        <p>Nội dung website của bạn sẽ hiển thị ở đây.</p>
      )}
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {isAuthenticated ? (
          <button onClick={logout} style={{ textDecoration: 'underline', color: 'red' }}>
            Đăng xuất
          </button>
        ) : (
          <Link href="/login" style={{ textDecoration: 'underline', color: 'green' }}>
            Đăng nhập
          </Link>
        )}
        
        {/* Nút vào admin chỉ hiện khi có quyền */}
        {isAuthorizedAdmin && (
          <Link href="/admin" style={{ textDecoration: 'underline', color: 'blue' }}>
            Vào trang Quản trị
          </Link>
        )}
      </div>

    </div>
  );
}