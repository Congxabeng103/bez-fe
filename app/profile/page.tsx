"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"

export function Profile() {
  const { currentUser, updateUserProfile, changePassword } = useStore()
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
      setMessage("")
    }, 2000)
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu mới không khớp")
      return
    }
    if (changePassword(oldPassword, newPassword)) {
      setMessage("Đổi mật khẩu thành công!")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        setMessage("")
      }, 2000)
    } else {
      setMessage("Mật khẩu cũ không chính xác")
    }
  }

  if (!currentUser) return null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ảnh đại diện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img
                src={currentUser.avatar || "/placeholder.svg"}
                alt={currentUser.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">{currentUser.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex gap-2">
              <Button
                variant={mode === "profile" ? "default" : "outline"}
                onClick={() => setMode("profile")}
                className="flex-1"
              >
                Thông tin cá nhân
              </Button>
              <Button
                variant={mode === "password" ? "default" : "outline"}
                onClick={() => setMode("password")}
                className="flex-1"
              >
                Đổi mật khẩu
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "profile" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input value={currentUser.email} disabled className="bg-muted" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tên</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên của bạn" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
                </div>
                <Button onClick={handleUpdateProfile} className="w-full">
                  Cập nhật thông tin
                </Button>
              </>
            )}

            {mode === "password" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Mật khẩu cũ</label>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cũ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu mới</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                  />
                </div>
                <Button onClick={handleChangePassword} className="w-full">
                  Đổi mật khẩu
                </Button>
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
    </div>
  )
}
