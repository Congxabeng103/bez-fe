import dynamic from 'next/dynamic'

// 1. Import LoginForm theo cách "lười" (Lazy load) và TẮT SSR
const LoginForm = dynamic(() => import('./LoginForm'), {
  ssr: false, // <--- ĐÂY LÀ CHÌA KHÓA VẠN NĂNG
  loading: () => <div className="flex h-screen items-center justify-center">Đang tải form đăng nhập...</div>,
})

// 2. Server Component sạch sẽ
export default function LoginPage() {
  return (
    <div className="w-full">
      {/* Không cần Suspense nữa vì ssr: false đã lo hết rồi */}
      <LoginForm />
    </div>
  )
}