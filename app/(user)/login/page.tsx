import { Suspense } from "react"
import LoginForm from "./LoginForm"

// Đây là Server Component (Không có 'use client')
export default function LoginPage() {
  return (
    // Suspense ở đây sẽ chặn đứng mọi lỗi build liên quan đến useSearchParams
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải trang đăng nhập...</div>}>
      <LoginForm />
    </Suspense>
  )
}