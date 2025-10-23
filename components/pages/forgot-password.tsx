"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { ArrowRight } from "lucide-react"

interface ForgotPasswordProps {
  onLogin: () => void
}

export function ForgotPassword({ onLogin }: ForgotPasswordProps) {
  const { resetPassword } = useStore()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = () => {
    if (!email) {
      setMessage("Vui lòng nhập email")
      return
    }
    setLoading(true)
    setTimeout(() => {
      if (resetPassword(email)) {
        setMessage("Mật khẩu mới đã được gửi đến email của bạn")
        setSent(true)
      } else {
        setMessage("Email không tồn tại trong hệ thống")
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
          <p className="text-sm text-muted-foreground">Nhập email để nhận mật khẩu mới</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sent ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
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
                {loading ? "Đang xử lý..." : "Gửi mật khẩu mới"}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-100 text-green-800 p-4 rounded text-sm">
                <p className="font-medium mb-2">Thành công!</p>
                <p>
                  Mật khẩu mới đã được gửi đến email: <strong>{email}</strong>
                </p>
                <p className="mt-2 text-xs">Vui lòng kiểm tra email của bạn để lấy mật khẩu mới.</p>
              </div>
              <Button onClick={onLogin} className="w-full">
                Quay lại đăng nhập
              </Button>
            </div>
          )}

          <button
            onClick={onLogin}
            className="text-primary hover:underline text-sm w-full text-center"
            disabled={loading}
          >
            Quay lại đăng nhập
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
