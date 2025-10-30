"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { useStore } from "@/lib/store"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { currentUser, updateUserProfile, changePassword, logout } = useStore()
  const [mode, setMode] = useState<"profile" | "password">("profile")
  const [name, setName] = useState(currentUser?.name || "")
  const [phone, setPhone] = useState(currentUser?.phone || "")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleUpdateProfile = () => {
    updateUserProfile({ name, phone })
    setMessage("Cập nhật thông tin thành công!")
    setTimeout(() => {
      onClose()
      setMessage("")
    }, 1000)
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu mới không khớp")
      return
    }
    if (changePassword(oldPassword, newPassword)) {
      setMessage("Đổi mật khẩu thành công!")
      setTimeout(() => {
        onClose()
        setMessage("")
      }, 1000)
    } else {
      setMessage("Mật khẩu cũ không chính xác")
    }
  }

  if (!isOpen || !currentUser) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{mode === "profile" ? "Thông tin cá nhân" : "Đổi mật khẩu"}</CardTitle>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "profile" && (
            <>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={currentUser.email} disabled className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Tên</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
              </div>
              <Button onClick={handleUpdateProfile} className="w-full">
                Cập nhật
              </Button>
              <button
                onClick={() => setMode("password")}
                className="text-primary hover:underline text-sm w-full text-center"
              >
                Đổi mật khẩu
              </button>
            </>
          )}

          {mode === "password" && (
            <>
              <Input
                placeholder="Mật khẩu cũ"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <Input
                placeholder="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                placeholder="Xác nhận mật khẩu mới"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button onClick={handleChangePassword} className="w-full">
                Đổi mật khẩu
              </Button>
              <button
                onClick={() => setMode("profile")}
                className="text-primary hover:underline text-sm w-full text-center"
              >
                Quay lại
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

          <Button
            variant="destructive"
            onClick={() => {
              logout()
              onClose()
            }}
            className="w-full"
          >
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
