"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" // 1. Import useRouter
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card" // 2. Thêm CardDescription
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/authStore"
import { ArrowRight, Mail, Loader2, ArrowLeft } from "lucide-react" // 3. Thêm Loader2, ArrowLeft
import { Label } from "@/components/ui/label"
import Link from "next/link" // 4. Thêm Link

// 5. Đổi tên và xóa props, dùng 'export default'
export default function ForgotPasswordPage() { 
  const { resetPassword } = useAuthStore()
  const router = useRouter() // 6. Dùng router
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async () => {
    if (!email || !email.includes('@')) {
      setMessage("Vui lòng nhập email hợp lệ")
      return
    }
    setLoading(true)
    setMessage("")

    try {
      await resetPassword(email)
      setMessage("Yêu cầu đã được gửi thành công.")
      setSent(true)
    } catch (error: any) {
      setMessage(error.message || "Email không tồn tại trong hệ thống")
      setSent(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <Mail size={32} className="mx-auto text-primary"/>
          <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
          <CardDescription>Nhập email để nhận hướng dẫn đặt lại mật khẩu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sent ? (
            // --- Giao diện Form ---
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  disabled={loading}
                />
              </div>

              {message && (
                <div
                  className={`p-3 rounded text-sm ${
                    message.includes("gửi") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {message}
                </div>
              )}

              <Button onClick={handleReset} className="w-full" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin mr-2"/> : null}
                {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
              </Button>
            </>
          ) : (
            // --- Giao diện Đã Gửi Thành Công ---
            <div className="space-y-4">
              <div className="bg-green-100 text-green-800 p-4 rounded text-sm flex items-start gap-3">
                  <Mail size={24} className="flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="font-semibold mb-1">Yêu cầu đã được gửi!</p>
                    <p className="text-sm">
                        Vui lòng kiểm tra hộp thư đến (cả spam) của email: <strong>{email}</strong> để lấy hướng dẫn.
                    </p>
                  </div>
              </div>
              <Button onClick={() => router.push('/login')} className="w-full">
                Quay lại đăng nhập
              </Button>
            </div>
          )}

          {/* 7. Sửa: Dùng <Link> thay vì button onClick */}
          {!sent && (
            <Link href="/login" className="text-primary hover:underline text-sm w-full text-center block pt-2">
                Quay lại đăng nhập
            </Link>
          )}

        </CardContent>
      </Card>
    </div>
  )
}