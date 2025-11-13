"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/authStore"

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2, ShieldCheck, Store } from "lucide-react"
import { toast } from "sonner"

// --- COMPONENT CON: XỬ LÝ LOGIC FORM ---
function LoginFormContent() {
  const { login } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("admin123")
  
  // State quản lý lỗi và trạng thái
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [loginStep, setLoginStep] = useState<'form' | 'choice'>('form')

  // Hàm xử lý đăng nhập chuẩn
  const handleLogin = async () => {
    // 1. Reset lỗi cũ
    setMessage("")
    
    // 2. Làm sạch dữ liệu (Trim space rác đầu/cuối)
    const cleanEmail = email.trim()
    const cleanPassword = password.trim()

    // 3. Cập nhật lại state để UI hiển thị giá trị sạch (UX tốt hơn)
    setEmail(cleanEmail)
    // Lưu ý: Với password thường không set lại trực tiếp để tránh lộ độ dài thật nếu đang gõ dở, 
    // nhưng ở đây ta dùng biến cleanPassword để gửi đi là đủ an toàn logic.

    // 4. Validate cơ bản
    if (!cleanEmail || !cleanPassword) {
      const msg = "Vui lòng nhập đầy đủ Email và Mật khẩu."
      setMessage(msg)
      toast.warning(msg)
      return
    }

    setLoading(true)

    try {
      // Gửi dữ liệu đã làm sạch
      await login(cleanEmail, cleanPassword)
      
      const user = useAuthStore.getState().user
      toast.success(`Chào mừng trở lại, ${user?.name || 'bạn'}!`)

      // Kiểm tra quyền hạn để điều hướng
      const redirectUrl = searchParams.get('redirect')
      const isAdminOrStaff = user?.roles && (user.roles.includes('ADMIN') || user.roles.includes('STAFF') || user.roles.includes('MANAGER'))

      if (isAdminOrStaff) {
        if (redirectUrl) {
          router.push(redirectUrl)
          return
        }
        // Nếu là admin nhưng không có redirect cụ thể -> Cho chọn trang
        setLoginStep('choice')
      } else {
        // User thường -> Về trang chủ
        router.push('/')
      }

    } catch (error: unknown) {
      let errorMessage = "Email hoặc mật khẩu không chính xác"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Hàm handle phím Enter cho tiện dụng
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <>
      {loginStep === 'form' && (
        <Card className="w-full max-w-md shadow-lg animate-fade-in border-border/50">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight">Đăng nhập hệ thống</CardTitle>
            <CardDescription>Nhập thông tin tài khoản để tiếp tục</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                disabled={loading}
                onKeyDown={handleKeyDown}
                className="bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-primary hover:underline font-medium"
                  tabIndex={-1} // Tránh tab focus vào link này khi đang nhập liệu nhanh
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                disabled={loading}
                onKeyDown={handleKeyDown}
                className="bg-background"
              />
            </div>

            {message && (
              <div className="p-3 rounded-md text-sm bg-destructive/10 text-destructive font-medium animate-in slide-in-from-top-1">
                {message}
              </div>
            )}

            <Button onClick={handleLogin} className="w-full mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Đăng nhập <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>

            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">Chưa có tài khoản? </span>
              <Link href="/register" className="text-primary hover:underline font-medium">
                Đăng ký ngay
              </Link>
            </div>
            
            <div className="text-center pt-1">
                <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    &larr; Quay về trang chủ
                </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {loginStep === 'choice' && (
        <Card className="w-full max-w-md shadow-lg animate-fade-in border-primary/20">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl text-primary">Đăng nhập thành công!</CardTitle>
            <CardDescription>Vui lòng chọn trang bạn muốn truy cập</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push('/admin')} 
              className="w-full h-12 text-base gap-2 shadow-md"
            >
              <ShieldCheck size={20} />
              Trang Quản Trị (Admin)
            </Button>
            
            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink-0 mx-2 text-xs text-muted-foreground">HOẶC</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => router.push('/')} 
              className="w-full h-12 text-base gap-2 border-primary/30 hover:bg-primary/5"
            >
              <Store size={20} />
              Trang Bán Hàng
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}

// --- COMPONENT CHA: EXPORT DEFAULT ---
export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Đang tải...</span>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  )
}