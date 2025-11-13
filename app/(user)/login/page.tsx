// 1. BẮT BUỘC: Dòng này ép Next.js không được build tĩnh trang này
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import LoginForm from "./LoginForm";

// 2. Đây là Server Component (Không có 'use client')
export default function LoginPage() {
  return (
    // 3. Vẫn giữ Suspense để an toàn tuyệt đối
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải trang...</div>}>
      <LoginForm />
    </Suspense>
  )
}