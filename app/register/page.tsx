"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" // 1. Import useRouter
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card" // 2. Thêm CardDescription
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/authStore" 
import { ArrowRight, Loader2 } from "lucide-react" // 3. Thêm Loader2
import { Label } from "@/components/ui/label" // 4. Thêm Label
import Link from "next/link" // 5. Thêm Link

// 6. ĐỔI TÊN VÀ XÓA PROPS
export default function RegisterPage() { 
  const { register } = useAuthStore()
  const router = useRouter() // 7. Thêm router
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async () => { 
    // Validate
    if (!email || !password || !name) {
      setMessage("Vui lòng nhập đầy đủ thông tin")
      return
    }
    if (password !== confirmPassword) {
      setMessage("Mật khẩu không khớp")
      return
    }
    if (password.length < 6) {
      setMessage("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }
    
    setLoading(true)
    setMessage("")

    try {
      // Gọi hàm register (async) từ store
      await register(email, password, name) 
      
      // Nếu thành công (không throw lỗi)
      setMessage("Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.");
      setIsSuccess(true); // Đánh dấu thành công

    } catch (error: any) {
      // Bắt lỗi từ store (vd: Email đã tồn tại)
      setMessage(error.message || "Email đã tồn tại hoặc lỗi không xác định")
      setIsSuccess(false);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Đăng ký tài khoản</CardTitle>
          <CardDescription>Tạo tài khoản mới của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Hiển thị thông báo thành công thay vì form */}
          {isSuccess ? (
            <div className="space-y-4">
              <div className="bg-green-100 text-green-800 p-4 rounded text-sm">
                <p className="font-medium mb-1">Đăng ký thành công!</p>
                <p>{message}</p>
              </div>
              <Button onClick={() => router.push('/login')} className="w-full">
                Quay lại đăng nhập
              </Button>
            </div>
          ) : (
            // Hiển thị form đăng ký
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Tên (First + Last)</Label>
                <Input
                  id="name"
                  placeholder="Nhập tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              <Button onClick={handleRegister} className="w-full" disabled={loading}>
                 {loading ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                 {loading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>

              {/* Sửa Link (Bỏ legacyBehavior) */}
              <Link href="/login" className="text-primary hover:underline text-sm w-full text-center block pt-2">
                 Đã có tài khoản? Đăng nhập
              </Link>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  )
}