"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { ArrowRight } from "lucide-react"

interface RegisterProps {
  onSuccess: () => void
  onLogin: () => void
}

export function Register({ onSuccess, onLogin }: RegisterProps) {
  const { register } = useStore()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = () => {
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
    setTimeout(() => {
      if (register(email, password, name)) {
        setMessage("Đăng ký thành công!")
        setTimeout(() => {
          onSuccess()
        }, 500)
      } else {
        setMessage("Email đã tồn tại")
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Đăng ký</CardTitle>
          <p className="text-sm text-muted-foreground">Tạo tài khoản quản trị mới</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên</label>
            <Input
              placeholder="Nhập tên của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              placeholder="Nhập email"
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Xác nhận mật khẩu</label>
            <Input
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
            {loading ? "Đang đăng ký..." : "Đăng ký"}
            <ArrowRight size={16} className="ml-2" />
          </Button>

          <button
            onClick={onLogin}
            className="text-primary hover:underline text-sm w-full text-center"
            disabled={loading}
          >
            Đã có tài khoản? Đăng nhập
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
