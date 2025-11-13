"use client"

// 1. Import 'Suspense' từ React
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation" 
import { useAuthStore } from "@/lib/authStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2, ShieldCheck, Store } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Label } from "@/components/ui/label" 

// 2. Tách toàn bộ logic của bạn ra một component con (KHÔNG export default)
// Component này sẽ chứa các hook "động" như useSearchParams
function LoginFormContent() {
  const { login } = useAuthStore()
  const router = useRouter()
  // useSearchParams nằm an toàn bên trong component con này
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
        if (redirectUrl) {
            router.push(redirectUrl); // Tự động quay lại /admin
            return;
        }
        setLoginStep('choice')
        setLoading(false)
      } else {
        router.push('/') // Chuyển về trang chủ (/)
      }

    } catch (error) { // 3. Sửa lỗi 'error: any' thành 'error: unknown' (an toàn)
      let errorMessage = "Email hoặc mật khẩu không chính xác";
      
      // Kiểm tra kiểu dữ liệu của lỗi
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setMessage(errorMessage)
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  return (
    // 4. Return toàn bộ JSX của bạn (không cần bọc trong div cha)
    <>
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
    </>
  )
}


// 5. Component cha (export default) bây giờ chỉ làm 1 việc: Bọc Suspense
export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      
      {/* Bọc component con trong Suspense.
        Next.js sẽ thấy điều này và biết rằng LoginFormContent cần chờ
        dữ liệu (searchParams) trước khi hiển thị.
      */}
      <Suspense fallback={
        // Fallback: Hiển thị 1 icon loading đơn giản trong lúc chờ
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <LoginFormContent />
      </Suspense>

    </div>
  )
}