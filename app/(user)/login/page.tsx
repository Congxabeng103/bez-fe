"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" 
// CHÚ Ý: Tuyệt đối KHÔNG import useSearchParams từ next/navigation ở đây
import { useAuthStore } from "@/lib/authStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2, ShieldCheck, Store } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Label } from "@/components/ui/label" 

export default function Login() {
  const { login } = useAuthStore()
  const router = useRouter()
  
  // KHÔNG dùng useSearchParams() ở đây -> Tránh lỗi build Prerender

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

      // --- GIẢI PHÁP FIX LỖI BUILD ---
      // Chỉ lấy param khi code đã chạy dưới browser (sau khi bấm nút)
      // Next.js Build sẽ không quét thấy đoạn này
      let redirectUrl = null;
      if (typeof window !== "undefined") {
         const params = new URLSearchParams(window.location.search);
         redirectUrl = params.get('redirect');
      }
      // -------------------------------

      if (user && (user.roles.includes('ADMIN') || user.roles.includes('STAFF') || user.roles.includes('MANAGER'))) {
        if (redirectUrl) {
            router.push(redirectUrl); 
            return;
        }
        setLoginStep('choice')
        setLoading(false)
      } else {
        router.push('/') 
      }

    } catch (error: any) {
      setMessage(error.message || "Email hoặc mật khẩu không chính xác")
      toast.error(error.message || "Email hoặc mật khẩu không chính xác")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      {/* Không cần Suspense nữa vì không dùng hook gây lỗi */}
      
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