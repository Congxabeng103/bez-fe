"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/authStore" 
import { ArrowRight, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// (Đây là file /app/register/page.tsx, nó phải là default export)
export default function RegisterPage() { 
  const { register } = useAuthStore()
  const router = useRouter()
  
  // --- SỬA STATE TÊN ---
  const [firstName, setFirstName] = useState("") // Tên
  const [lastName, setLastName] = useState("") // Họ
  // ---
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async () => { 
    // --- SỬA VALIDATE ---
    if (!email || !password || !firstName || !lastName) { // Sửa
      setMessage("Vui lòng nhập đầy đủ Họ, Tên, Email và Mật khẩu")
      return
    }
    // ... (Validate mật khẩu giữ nguyên)
    
    setLoading(true)
    setMessage("")

    try {
      // --- SỬA CÁCH GỌI HÀM ---
      await register(firstName, lastName, email, password) // Gửi 4 tham số
      // ---
      
      setMessage("Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.");
      setIsSuccess(true); 

    } catch (error: any) {
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
          
          {isSuccess ? (
            // --- Giao diện Thành công ---
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
            // --- Form Đăng ký ---
            <>
              {/* --- SỬA LẠI TÊN --- */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-2">
                  <Label htmlFor="firstName">Tên</Label>
                  <Input
                    id="firstName"
                    placeholder="Vd: Công"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Họ (và tên đệm)</Label>
                  <Input
                    id="lastName"
                    placeholder="Vd: Đỗ Thành"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              {/* --- KẾT THÚC SỬA --- */}

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