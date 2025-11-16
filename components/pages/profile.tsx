"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// --- 1. IMPORT COMPONENT UPLOAD ---
// (Hãy đảm bảo đường dẫn này đúng - Giống hệt trang Brand/Product)
import { ImageUpload } from "@/components/store/image-upload"; 

// (Type và API URL Tỉnh/Thành giữ nguyên)
interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward { code: number; name: string; }
const PROVINCE_API_URL = "https://provinces.open-api.vn/api";


export function Profile() {
  // --- 2. BỎ `updateAvatar` ---
  const { user, updateProfile, updatePassword, updateAddress } = useAuthStore();
  
  const [mode, setMode] = useState<"profile" | "password" | "address">("profile");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); 

  // --- 3. SỬA `formData` ĐỂ CHỨA LUÔN AVATAR ---
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    gender: user?.gender || "OTHER",
    dob: user?.dob || "",
    avatar: user?.avatar || "" // <-- THÊM AVATAR VÀO ĐÂY
  });

  // (Các state khác giữ nguyên)
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmationPassword: "" });
  const [streetAddress, setStreetAddress] = useState(user?.streetAddress || "");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // --- 4. SỬA `useEffect` ĐỂ ĐIỀN AVATAR ---
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        gender: user.gender || "OTHER",
        dob: user.dob || "",
        avatar: user.avatar || "" // <-- THÊM VÀO ĐÂY
      });
      setStreetAddress(user.streetAddress || "");
    }
  }, [user]);
  
  // (Các hàm handle change giữ nguyên)
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // (Các useEffect tải địa chỉ - ĐÃ CHUẨN)
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await fetch(`${PROVINCE_API_URL}/p/`);
        const data = await response.json();
        setProvinces(data || []);
        if (user?.provinceCode) {
          const province = data.find((p: Province) => p.code === user.provinceCode);
          if (province) setSelectedProvince(province);
        }
      } catch (error) { toast.error("Lỗi khi tải danh sách tỉnh/thành"); } 
      finally { setIsLoadingProvinces(false); }
    };
    fetchProvinces();
  }, [user?.provinceCode]);

  useEffect(() => {
  if (!selectedProvince) {
    setDistricts([]); 
    setWards([]); 
    // Không reset selection ở đây
    return;
  }

  // **FIX:** Chỉ reset Quận/Phường nếu Tỉnh được chọn khác với Tỉnh của user
  // (Trảng hợp user tự tay đổi Tỉnh)
  if (user?.provinceCode && selectedProvince.code !== user.provinceCode) {
      setSelectedDistrict(null);
      setSelectedWard(null);
  }

  const fetchDistricts = async () => {
    setIsLoadingDistricts(true);
    setDistricts([]); // Chỉ reset danh sách
    setWards([]); // Chỉ reset danh sách
    
    try {
      const response = await fetch(`${PROVINCE_API_URL}/p/${selectedProvince.code}?depth=2`);
      const data = await response.json();
      const newDistricts = data.districts || [];
      setDistricts(newDistricts);

      // **LOGIC QUAN TRỌNG:** Tự động chọn (sẽ chạy sau khi update)
      // Nó sẽ tìm và chọn đúng quận mới từ `user.districtCode`
      if (user?.districtCode && selectedProvince.code === user.provinceCode) {
        const district = newDistricts.find((d: District) => d.code === user.districtCode);
        if (district) setSelectedDistrict(district);
      }
    } catch (error) { toast.error("Lỗi khi tải danh sách quận/huyện"); } 
    finally { setIsLoadingDistricts(false); }
  };
  fetchDistricts();
}, [selectedProvince, user?.provinceCode, user?.districtCode]);

  useEffect(() => {
  if (!selectedDistrict) {
    setWards([]); 
    // Không reset selection ở đây
    return;
  }

  // **FIX:** Chỉ reset Phường nếu Quận được chọn khác với Quận của user
  // (Trường hợp user tự tay đổi Quận)
  if (user?.districtCode && selectedDistrict.code !== user.districtCode) {
      setSelectedWard(null);
  }

  const fetchWards = async () => {
    setIsLoadingWards(true);
    setWards([]); // Chỉ reset danh sách
    
    try {
      const response = await fetch(`${PROVINCE_API_URL}/d/${selectedDistrict.code}?depth=2`);
      const data = await response.json();
      const newWards = data.wards || [];
      setWards(newWards);

      // **LOGIC QUAN TRỌNG:** Tự động chọn (sẽ chạy sau khi update)
      // Nó sẽ tìm và chọn đúng phường mới từ `user.wardCode`
      if (user?.wardCode && selectedDistrict.code === user.districtCode) {
        const ward = newWards.find((w: Ward) => w.code === user.wardCode);
        if (ward) setSelectedWard(ward);
      }
    } catch (error) { toast.error("Lỗi khi tải danh sách phường/xã"); } 
    finally { setIsLoadingWards(false); }
  };
  fetchWards();
}, [selectedDistrict, user?.districtCode, user?.wardCode]);


  // --- 5. SỬA `handleUpdateProfile` ĐỂ GỬI AVATAR (Đã sửa lỗi 'đơ') ---
  const handleUpdateProfile = async () => {
    setError("");
    setMessage("");
    if (!formData.firstName.trim()) {
      setError("Tên là bắt buộc.");
      return; 
    }
    if (!formData.lastName.trim()) {
      setError("Họ (và tên đệm) là bắt buộc.");
      return;
    }
    
    setLoading(true);
    try {
      // (Data_to_submit bây giờ đã có avatar)
      const dataToSubmit = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone || null,
        gender: formData.gender.toUpperCase(),
        dob: formData.dob || null,
        avatar: formData.avatar || null // <-- GỬI AVATAR
      };
      await updateProfile(dataToSubmit); // (authStore đã được cập nhật)
      toast.success("Cập nhật thông tin thành công!");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thất bại.");
      setError(err.message || "Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // (Các hàm handle Password, Address giữ nguyên - đã sửa lỗi 'đơ')
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
      await updatePassword(passwordData);
      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmationPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Mật khẩu cũ không chính xác.");
      setError(err.message || "Mật khẩu cũ không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    setError("");
    setMessage("");
    if (!streetAddress.trim() || !selectedProvince || !selectedDistrict || !selectedWard) {
      setError("Vui lòng điền đầy đủ địa chỉ.");
      return;
    }
    setLoading(true);
    try {
      const addressData = {
        streetAddress: streetAddress.trim(),
        provinceCode: selectedProvince.code,
        provinceName: selectedProvince.name,
        districtCode: selectedDistrict.code,
        districtName: selectedDistrict.name,
        wardCode: selectedWard.code,
        wardName: selectedWard.name,
      };
      await updateAddress(addressData); 
      toast.success("Cập nhật địa chỉ thành công!");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật địa chỉ thất bại.");
      setError(err.message || "Cập nhật địa chỉ thất bại.");
    } finally {
      setLoading(false);
    }
  };
  
  // --- 6. XÓA HÀM `handleAvatarChange` (Không cần nữa) ---


  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- 7. SỬA CARD BÊN TRÁI (HIỂN THỊ TĨNH) --- */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ảnh đại diện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
               {/* Hiển thị `user.avatar` (ảnh đã lưu trong store) 
                 để nó chỉ cập nhật khi `updateProfile` thành công.
               */}
               <img
                  src={user?.avatar || "/placeholder.svg"}
                  alt={user?.name || "Avatar"}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
               />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>
        {/* --- KẾT THÚC 7 --- */}

        {/* Card bên phải (Main Content) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {/* (Các nút Tab giữ nguyên) */}
             <div className="flex gap-2 flex-wrap">
              <Button
                variant={mode === "profile" ? "default" : "outline"}
                onClick={() => { setMode("profile"); setError(""); setMessage(""); }}
                className="flex-1 min-w-[150px]"
              >
                Thông tin cá nhân
              </Button>
              <Button
                variant={mode === "address" ? "default" : "outline"}
                onClick={() => { setMode("address"); setError(""); setMessage(""); }}
                className="flex-1 min-w-[150px]"
              >
                Địa chỉ mặc định
              </Button>
              <Button
                variant={mode === "password" ? "default" : "outline"}
                onClick={() => { setMode("password"); setError(""); setMessage(""); }}
                className="flex-1 min-w-[150px]"
              >
                Đổi mật khẩu
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {/* --- 8. SỬA FORM "THÔNG TIN CÁ NHÂN" --- */}
            {mode === "profile" && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-4">
                
                {/* --- CHUYỂN `ImageUpload` VÀO ĐÂY --- */}
                <div className="space-y-1.5">
                    <Label htmlFor="avatar">Ảnh đại diện</Label>
                    <ImageUpload
                        value={formData.avatar} // Lấy từ state formData
                        onChange={(url) => setFormData(prev => ({ ...prev, avatar: url }))} // Cập nhật state formData
                        label="" // Ẩn label con
                        className="w-24 h-24" // Kích thước nhỏ (giống Brand)
                    />
                </div>
                {/* --- KẾT THÚC CHUYỂN --- */}

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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Giới tính</Label>
                    <Select name="gender" value={formData.gender || "OTHER"} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
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
                    <Input id="dob" name="dob" type="date" value={formData.dob || ""} onChange={handleFormChange} className="mt-1.5"/>
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" name="phone" value={formData.phone || ""} onChange={handleFormChange} placeholder="Nhập số điện thoại" className="mt-1.5"/>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                  Cập nhật thông tin
                </Button>
              </form>
            )}
            {/* --- KẾT THÚC SỬA FORM --- */}


            {/* (Form Địa chỉ - Giữ nguyên) */}
            {mode === "address" && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateAddress(); }} className="space-y-4">
                 <div className="space-y-1.5">
                   <Label htmlFor="province">Tỉnh/Thành phố *</Label>
                   <Select
                     value={selectedProvince?.code.toString() || ""}
                     onValueChange={(value) => {
                       const province = provinces.find(p => p.code === parseInt(value));
                       setSelectedProvince(province || null);
                     }}
                     disabled={isLoadingProvinces}
                   >
                     <SelectTrigger id="province">
                       <SelectValue placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành"} />
                     </SelectTrigger>
                     <SelectContent>
                       {provinces.map(p => (
                         <SelectItem key={p.code} value={p.code.toString()}>{p.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="space-y-1.5">
                   <Label htmlFor="district">Quận/Huyện *</Label>
                   <Select
                     value={selectedDistrict?.code.toString() || ""}
                     onValueChange={(value) => {
                       const district = districts.find(d => d.code === parseInt(value));
                       setSelectedDistrict(district || null);
                     }}
                     disabled={!selectedProvince || isLoadingDistricts}
                   >
                     <SelectTrigger id="district">
                       <SelectValue placeholder={isLoadingDistricts ? "Đang tải..." : "Chọn Quận/Huyện"} />
                     </SelectTrigger>
                     <SelectContent>
                       {districts.map(d => (
                         <SelectItem key={d.code} value={d.code.toString()}>{d.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="space-y-1.5">
                   <Label htmlFor="ward">Phường/Xã *</Label>
                   <Select
                     value={selectedWard?.code.toString() || ""}
                     onValueChange={(value) => {
                       const ward = wards.find(w => w.code === parseInt(value));
                       setSelectedWard(ward || null);
                     }}
                     disabled={!selectedDistrict || isLoadingWards}
                   >
                     <SelectTrigger id="ward">
                       <SelectValue placeholder={isLoadingWards ? "Đang tải..." : "Chọn Phường/Xã"} />
                     </SelectTrigger>
                     <SelectContent>
                       {wards.map(w => (
                         <SelectItem key={w.code} value={w.code.toString()}>{w.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div className="space-y-1.5">
                   <Label htmlFor="streetAddress">Số nhà, tên đường *</Label>
                   <Input
                     id="streetAddress"
                     name="streetAddress"
                     placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
                     value={streetAddress}
                     onChange={(e) => setStreetAddress(e.target.value)}
                   />
                 </div>
 
                 <Button type="submit" className="w-full" disabled={loading}>
                   {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                   Lưu địa chỉ
                 </Button>
              </form>
            )}
            
            {/* (Form Mật khẩu - Giữ nguyên) */}
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