"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // <-- Import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // <-- Import
import { useAuthStore } from "@/lib/authStore"; // <-- Sửa: Dùng store API
import { toast } from "sonner"; // <-- Sửa: Dùng sonner
import { Loader2 } from "lucide-react"; // <-- Import
// --- SỬA 1: Interface (Khớp với authStore) ---
interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dob: string;
}
export function Profile() {
  // --- SỬA 1: Dùng useAuthStore ---
  const { user, updateProfile, updatePassword } = useAuthStore(); // Lấy hàm API
  
  const [mode, setMode] = useState<"profile" | "password">("profile");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- SỬA 2: Thêm state cho các trường form (bao gồm 2 trường mới) ---
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "", // Sửa
    lastName: user?.lastName || "",   // Sửa
    phone: user?.phone || "",
    gender: user?.gender || "OTHER", // Giả sử 'OTHER' là mặc định
    dob: user?.dob || "", // Định dạng YYYY-MM-DD
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmationPassword: "",
  });

  // Cập nhật form nếu 'user' từ store thay đổi
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "", // Sửa
        lastName: user.lastName || "",   // Sửa
        phone: user.phone || "",
        gender: user.gender || "OTHER",
        dob: user.dob || "",
      });
    }
  }, [user]);
  
  // Xử lý thay đổi input chung
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- SỬA 3: Sửa hàm gọi API Cập nhật Thông tin ---
  const handleUpdateProfile = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    // Validate
    if (!formData.firstName.trim()) return setError("Tên là bắt buộc.");
    if (!formData.lastName.trim()) return setError("Họ (và tên đệm) là bắt buộc.");

    try {
      const dataToSubmit = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone || null,
        gender: formData.gender.toUpperCase(),
        dob: formData.dob || null,
      };
      await updateProfile(dataToSubmit); // (Hàm này khớp với AuthStore)
      toast.success("Cập nhật thông tin thành công!");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thất bại.");
      setError(err.message || "Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // --- SỬA 4: Sửa hàm gọi API Đổi mật khẩu ---
  const handleChangePassword = async () => {
    setError("");
    setMessage("");
    if (passwordData.newPassword !== passwordData.confirmationPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    
    setLoading(true);
    try {
      // Gọi hàm updatePassword từ store
      await updatePassword(passwordData);
      toast.success("Đổi mật khẩu thành công!");
      // Reset form mật khẩu
      setPasswordData({ currentPassword: "", newPassword: "", confirmationPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Mật khẩu cũ không chính xác.");
      setError(err.message || "Mật khẩu cũ không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Vẫn giữ check này

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin tài khoản của bạn</p>
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
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex gap-2">
              <Button
                variant={mode === "profile" ? "default" : "outline"}
                onClick={() => { setMode("profile"); setError(""); setMessage(""); }}
                className="flex-1"
              >
                Thông tin cá nhân
              </Button>
              <Button
                variant={mode === "password" ? "default" : "outline"}
                onClick={() => { setMode("password"); setError(""); setMessage(""); }}
                className="flex-1"
              >
                Đổi mật khẩu
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Thông báo Lỗi/Thành công chung */}
            {error && (
              <div className="p-3 rounded text-sm bg-red-100 text-red-800 animate-shake">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 rounded text-sm bg-green-100 text-green-800">
                {message}
              </div>
            )}

            {/* --- FORM 1: THÔNG TIN CÁ NHÂN --- */}
            {mode === "profile" && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled className="bg-muted mt-1.5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="lastName">Họ (và tên đệm) *</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleFormChange} placeholder="Vd: Đỗ Thành" className="mt-1.5"/>
                    </div>
                    <div>
                        <Label htmlFor="firstName">Tên *</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleFormChange} placeholder="Vd: Công" className="mt-1.5"/>
                    </div>
                </div>
                
                {/* --- THÊM 2 TRƯỜNG MỚI --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="gender">Giới tính</Label>
                        <Select name="gender" value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                            <SelectTrigger id="gender" className="mt-1.5">
                                <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MALE">Nam</SelectItem>
                                <SelectItem value="FEMALE">Nữ</SelectItem>
                                <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="dob">Ngày sinh</Label>
                        <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleFormChange} className="mt-1.5"/>
                    </div>
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="Nhập số điện thoại" className="mt-1.5"/>
                </div>
                {/* --- KẾT THÚC THÊM --- */}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                  Cập nhật thông tin
                </Button>
              </form>
            )}

            {/* --- FORM 2: ĐỔI MẬT KHẨU --- */}
            {mode === "password" && (
              <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Mật khẩu cũ</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu cũ"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu mới"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmationPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmationPassword"
                    name="confirmationPassword"
                    type="password"
                    value={passwordData.confirmationPassword}
                    onChange={handlePasswordChange}
                    placeholder="Xác nhận mật khẩu mới"
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                  Đổi mật khẩu
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}