"use client"

// --- TẤT CẢ IMPORT GỐC CỦA BẠN ---
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/authStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2, ShieldCheck, Store } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Label } from "@/components/ui/label"

// --- 1. IMPORT THÊM SUSPENSE (BẮT BUỘC) ---
import { Suspense } from "react"

// --- 2. ĐÂY LÀ COMPONENT LOGIN GỐC CỦA BẠN (ĐỔI TÊN & BỎ EXPORT DEFAULT) ---
// (Component này chứa logic chính và hook useSearchParams)
function LoginContent() {
  const { login } = useAuthStore()
  const router = useRouter()
  // Hook useSearchParams giờ đã an toàn khi nằm bên trong Suspense
  const searchParams = useSearchParams()

  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("admin123")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const [loginStep, setLoginStep] = useState<'form' | 'choice'>('form')

  const handleLogin = async () => {
    setLoading(true)
    setMessage("")

    try {
      await login(email, password)
      const user = useAuthStore.getState().user
      toast.success(`Chào mừng trở lại, ${user?.name}!`)

      const redirectUrl = searchParams.get('redirect') // Lấy URL (vd: /admin)

      if (user && (user.roles.includes('ADMIN') || user.roles.includes('STAFF') || user.roles.includes('MANAGER'))) {
        // 2a. Nếu là Admin/Staff VÀ bị đá từ /admin ra:
        if (redirectUrl) {
          router.push(redirectUrl); // Tự động quay lại /admin
          return;
        }
        // 2b. Nếu là Admin/Staff (tự đăng nhập): Hiển thị lựa chọn
        setLoginStep('choice')
        setLoading(false)
      } else {
        // 2c. Nếu là User -> Tự động vào trang bán hàng
        router.push('/') // Chuyển về trang chủ (/)
      }

    } catch (error: any) {
      setMessage(error.message || "Email hoặc mật khẩu không chính xác")
      toast.error(error.message || "Email hoặc mật khẩu không chính xác")
      setLoading(false)
    }
  }

  // --- PHẦN JSX GỐC CỦA BẠN (GIỮ NGUYÊN) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">

      {/* Bước 1: Hiển thị Form Đăng nhập */}
      {loginStep === 'form' && (
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>Đăng nhập vào tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="admin@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email" disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                placeholder="Nhập mật khẩu" value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password" disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {message && (
              <div className="p-3 rounded text-sm bg-red-100 text-red-800">
                {message}
              </div>
            )}

            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            <div className="space-y-2 text-center text-sm">
              <Link href="/forgot-password" className="text-primary hover:underline block w-full">
                Quên mật khẩu?
              </Link>
              <Link href="/register" className="text-primary hover:underline block w-full">
                Chưa có tài khoản? Đăng ký ngay
              </Link>
              <Link href="/" className="text-muted-foreground hover:underline block w-full pt-2">
                Quay về trang chủ
              </Link>
            </div>

          </CardContent>
        </Card>
      )}

      {/* Bước 2: Hiển thị Lựa chọn cho Admin/Staff */}
      {loginStep === 'choice' && (
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Đăng nhập thành công!</CardTitle>
            <CardDescription>Bạn muốn truy cập trang nào?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => router.push('/admin')} className="gap-2">
              <ShieldCheck size={16} />
              Vào trang Quản trị (Admin)
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="gap-2">
              <Store size={16} />
              Xem trang Bán hàng (Homepage)
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

// --- 3. TẠO COMPONENT BỌC BÊN NGOÀI (EXPORT DEFAULT) ---
// (Đây là component mà Next.js sẽ render)
export default function LoginPage() {
  return (
    // Bọc component chính trong Suspense để fix lỗi build
    <Suspense fallback={<div>Đang tải trang...</div>}>
      <LoginContent />
    </Suspense>
  )
}