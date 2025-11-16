"use client";

// 1. Import component "Profile" mà bạn đã tạo
import { Profile } from "@/components/pages/profile";

export default function UserProfilePage() {
  
  // 2. Render component đó bên trong một layout chung
  // (Tôi dùng layout container giống Header/Cart của bạn)
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* 3. Dán component Profile của bạn vào đây */}
        <Profile />

      </div>
    </div>
  );
}