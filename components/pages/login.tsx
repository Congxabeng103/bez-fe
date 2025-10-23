"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// THAY ĐỔI 1: Import hook và file store mới
import { useAuthStore } from "@/lib/authStore" 
import { ArrowRight } from "lucide-react"

interface LoginProps {
  onSuccess: () => void
  onForgotPassword: () => void
  onRegister: () => void
}

export function Login({ onSuccess, onForgotPassword, onRegister }: LoginProps) {
  // THAY ĐỔI 2: Sử dụng hook mới
  const { login } = useAuthStore()
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("admin123")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // THAY ĐỔI 3: Chuyển sang hàm async và dùng try...catch
  const handleLogin = async () => { // <-- Thêm async
    if (!email || !password) {
      setMessage("Vui lòng nhập email và mật khẩu")
      return
    }
    
    setLoading(true)
    setMessage("") // Xóa thông báo cũ

    try {
      // Bỏ setTimeout, gọi thẳng hàm login từ store (đã là async)
      await login(email, password) // <-- Thêm await

      // Nếu 'await' thành công, tiếp tục
      setMessage("Đăng nhập thành công!")
      setTimeout(() => {
        onSuccess()
      }, 500) // Giữ lại delay ngắn để người dùng thấy thông báo

    } catch (error: any) {
      // Nếu 'await' thất bại (store throw Error), nó sẽ nhảy vào 'catch'
      // Lấy message từ Error mà authStore đã throw
      setMessage(error.message || "Email hoặc mật khẩu không chính xác")
    } finally {
      // Luôn chạy sau khi try/catch xong
      setLoading(false)
    }
  }

  // Toàn bộ phần JSX (return) không cần thay đổi
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <p className="text-sm text-muted-foreground">Đăng nhập vào tài khoản quản trị của bạn</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mật khẩu</label>
            <Input
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              disabled={loading}
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded text-sm ${
                message.includes("thành công") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <Button onClick={handleLogin} className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            <ArrowRight size={16} className="ml-2" />
          </Button>

          <div className="space-y-2 text-center text-sm">
            <button onClick={onForgotPassword} className="text-primary hover:underline block w-full" disabled={loading}>
              Quên mật khẩu?
            </button>
            <button onClick={onRegister} className="text-primary hover:underline block w-full" disabled={loading}>
              Chưa có tài khoản? Đăng ký ngay
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}