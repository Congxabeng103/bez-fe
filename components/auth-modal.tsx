"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { useStore } from "@/lib/store"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { login, register } = useStore()
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")

  const handleLogin = () => {
    if (!email || !password) {
      setMessage("Vui lòng nhập email và mật khẩu")
      return
    }
    if (login(email, password)) {
      setMessage("Đăng nhập thành công!")
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 500)
    } else {
      setMessage("Email hoặc mật khẩu không chính xác")
    }
  }

  const handleRegister = () => {
    if (!email || !password || !name) {
      setMessage("Vui lòng nhập đầy đủ thông tin")
      return
    }
    if (register(email, password, name)) {
      setMessage("Đăng ký thành công!")
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 500)
    } else {
      setMessage("Email đã tồn tại")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{mode === "login" ? "Đăng nhập" : mode === "register" ? "Đăng ký" : "Quên mật khẩu"}</CardTitle>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "login" && (
            <>
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              <Input
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
              <Button onClick={handleLogin} className="w-full">
                Đăng nhập
              </Button>
              <div className="text-center text-sm space-y-2">
                <button
                  onClick={() => {
                    setMode("forgot")
                    setMessage("")
                  }}
                  className="text-primary hover:underline block w-full"
                >
                  Quên mật khẩu?
                </button>
                <button
                  onClick={() => {
                    setMode("register")
                    setMessage("")
                  }}
                  className="text-primary hover:underline block w-full"
                >
                  Chưa có tài khoản? Đăng ký
                </button>
              </div>
            </>
          )}

          {mode === "register" && (
            <>
              <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              <Input
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
              <Button onClick={handleRegister} className="w-full">
                Đăng ký
              </Button>
              <button
                onClick={() => {
                  setMode("login")
                  setMessage("")
                }}
                className="text-primary hover:underline text-sm w-full text-center"
              >
                Đã có tài khoản? Đăng nhập
              </button>
            </>
          )}

          {mode === "forgot" && (
            <>
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              <Button
                onClick={() => {
                  if (email) {
                    setMessage("Mật khẩu mới đã được gửi đến email của bạn")
                  }
                }}
                className="w-full"
              >
                Gửi mật khẩu mới
              </Button>
              <button
                onClick={() => {
                  setMode("login")
                  setMessage("")
                }}
                className="text-primary hover:underline text-sm w-full text-center"
              >
                Quay lại đăng nhập
              </button>
            </>
          )}

          {message && (
            <div
              className={`p-3 rounded text-sm ${
                message.includes("thành công") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
