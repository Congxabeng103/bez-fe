"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/store/image-upload"; 

interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward { code: number; name: string; }
const PROVINCE_API_URL = "https://provinces.open-api.vn/api";

export function Profile() {
  const { user, updateProfile, updatePassword, updateAddress } = useAuthStore();
  
  const [mode, setMode] = useState<"profile" | "password" | "address">("profile");
  const [loading, setLoading] = useState(false); 

  // --- State Form Profile ---
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    gender: user?.gender || "OTHER",
    dob: user?.dob || "",
    avatar: user?.avatar || "" 
  });
  
  const [profileErrors, setProfileErrors] = useState({ firstName: "", lastName: "", phone: "", dob: "" });

  // --- State Password ---
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmationPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState({ currentPassword: "", newPassword: "", confirmationPassword: "" });

  // --- State Address ---
  const [streetAddress, setStreetAddress] = useState(user?.streetAddress || "");
  
  // --- State Địa chính ---
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Cập nhật state khi user thay đổi (Đồng bộ với DB khi F5 hoặc load trang)
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "", // Nếu DB là null thì về rỗng, nếu có thì hiện ra
        gender: user.gender || "OTHER",
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
        avatar: user.avatar || ""
      });
      setStreetAddress(user.streetAddress || "");
    }
  }, [user]);
  
  // --- Handle nhập liệu Profile ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Chặn nhập chữ ở Phone
    if (name === "phone") {
        if (!/^\d*$/.test(value)) return; 
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Xóa lỗi khi nhập lại
    if (profileErrors[name as keyof typeof profileErrors]) {
        setProfileErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name as keyof typeof passwordErrors]) {
        setPasswordErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // --- API Địa chỉ (Giữ nguyên) ---
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
    if (!selectedProvince) { setDistricts([]); setWards([]); return; }
    if (user?.provinceCode && selectedProvince.code !== user.provinceCode) { setSelectedDistrict(null); setSelectedWard(null); }
    const fetchDistricts = async () => {
      setIsLoadingDistricts(true); setDistricts([]); setWards([]); 
      try {
        const response = await fetch(`${PROVINCE_API_URL}/p/${selectedProvince.code}?depth=2`);
        const data = await response.json();
        setDistricts(data.districts || []);
        if (user?.districtCode && selectedProvince.code === user.provinceCode) {
          const district = data.districts?.find((d: District) => d.code === user.districtCode);
          if (district) setSelectedDistrict(district);
        }
      } catch (error) { toast.error("Lỗi khi tải danh sách quận/huyện"); } 
      finally { setIsLoadingDistricts(false); }
    };
    fetchDistricts();
  }, [selectedProvince, user?.provinceCode, user?.districtCode]);

  useEffect(() => {
    if (!selectedDistrict) { setWards([]); return; }
    if (user?.districtCode && selectedDistrict.code !== user.districtCode) { setSelectedWard(null); }
    const fetchWards = async () => {
      setIsLoadingWards(true); setWards([]); 
      try {
        const response = await fetch(`${PROVINCE_API_URL}/d/${selectedDistrict.code}?depth=2`);
        const data = await response.json();
        setWards(data.wards || []);
        if (user?.wardCode && selectedDistrict.code === user.districtCode) {
          const ward = data.wards?.find((w: Ward) => w.code === user.wardCode);
          if (ward) setSelectedWard(ward);
        }
      } catch (error) { toast.error("Lỗi khi tải danh sách phường/xã"); } 
      finally { setIsLoadingWards(false); }
    };
    fetchWards();
  }, [selectedDistrict, user?.districtCode, user?.wardCode]);


  // --- 1. XỬ LÝ CẬP NHẬT PROFILE (LOGIC MỚI: KHÔNG BẮT BUỘC, NHẬP MỚI CHECK) ---
  const handleUpdateProfile = async () => {
    let hasError = false;
    const newErrors = { firstName: "", lastName: "", phone: "", dob: "" };

    const nameRegex = /^[\p{L}\s]+$/u; 

    // Tên: Bắt buộc
    if (!formData.firstName.trim()) {
        newErrors.firstName = "Tên là bắt buộc"; hasError = true;
    } else if (!nameRegex.test(formData.firstName.trim())) {
        newErrors.firstName = "Tên không hợp lệ"; hasError = true;
    }

    // Họ: Bắt buộc
    if (!formData.lastName.trim()) {
        newErrors.lastName = "Họ là bắt buộc"; hasError = true;
    } else if (!nameRegex.test(formData.lastName.trim())) {
        newErrors.lastName = "Họ không hợp lệ"; hasError = true;
    }

    // SĐT: KHÔNG BẮT BUỘC. Nhưng nếu nhập thì phải đúng.
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (formData.phone && formData.phone.trim() !== "") {
        if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = "SĐT không đúng định dạng (10 số)"; hasError = true;
        }
    }

    // Ngày sinh: KHÔNG BẮT BUỘC. Nhưng nếu nhập thì không được là tương lai.
    if (formData.dob) {
        const selected = new Date(formData.dob);
        const now = new Date();
        if (selected > now) {
            newErrors.dob = "Ngày sinh không thể ở tương lai"; hasError = true;
        }
    }

    setProfileErrors(newErrors);
    if (hasError) return; 
    
    setLoading(true);
    try {
      // QUAN TRỌNG: Nếu chuỗi rỗng -> gửi null lên server để xóa dữ liệu cũ
      const dataToSubmit = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone ? formData.phone.trim() : null, // Rỗng -> Null
        gender: formData.gender.toUpperCase(),
        dob: formData.dob || null, // Rỗng -> Null
        avatar: formData.avatar || null
      };
      
      await updateProfile(dataToSubmit);
      toast.success("Cập nhật thông tin thành công!");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thất bại.");
    } finally { setLoading(false); }
  };


  // --- 2. XỬ LÝ ĐỔI MẬT KHẨU ---
  const handleChangePassword = async () => {
    const newErrors = { currentPassword: "", newPassword: "", confirmationPassword: "" };
    let hasError = false;

    if (!passwordData.currentPassword) {
        newErrors.currentPassword = "Vui lòng nhập mật khẩu cũ"; hasError = true;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
        newErrors.newPassword = "MK yếu: Cần 8 ký tự, Hoa, Thường, Số & Ký tự đặc biệt";
        hasError = true;
    }

    if (passwordData.newPassword !== passwordData.confirmationPassword) {
        newErrors.confirmationPassword = "Mật khẩu xác nhận không khớp"; hasError = true;
    }

    setPasswordErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    try {
      await updatePassword(passwordData);
      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmationPassword: "" });
    } catch (err: any) {
      if (err.message?.includes("cũ") || err.message?.includes("current")) {
          setPasswordErrors(prev => ({...prev, currentPassword: "Mật khẩu cũ không chính xác"}));
      } else {
          toast.error(err.message || "Đổi mật khẩu thất bại.");
      }
    } finally { setLoading(false); }
  };


  // --- 3. XỬ LÝ ĐỊA CHỈ (KHÔNG VALIDATE) ---
  const handleUpdateAddress = async () => {
    setLoading(true);
    try {
      const addressData = {
        streetAddress: streetAddress ? streetAddress.trim() : null,
        provinceCode: selectedProvince?.code || null,
        provinceName: selectedProvince?.name || null,
        districtCode: selectedDistrict?.code || null,
        districtName: selectedDistrict?.name || null,
        wardCode: selectedWard?.code || null,
        wardName: selectedWard?.name || null,
      };
      // @ts-ignore
      await updateAddress(addressData); 
      toast.success("Cập nhật địa chỉ thành công!");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật địa chỉ thất bại.");
    } finally { setLoading(false); }
  };
  

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card Avatar */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Ảnh đại diện</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
               <img
                 src={user?.avatar || "/placeholder.svg"}
                 alt={user?.name || "Avatar"}
                 className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                 onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
               />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">{user?.lastName} {user?.firstName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
             <div className="flex gap-2 flex-wrap">
              <Button variant={mode === "profile" ? "default" : "outline"} onClick={() => setMode("profile")} className="flex-1 min-w-[120px]">Thông tin</Button>
              <Button variant={mode === "address" ? "default" : "outline"} onClick={() => setMode("address")} className="flex-1 min-w-[120px]">Địa chỉ</Button>
              <Button variant={mode === "password" ? "default" : "outline"} onClick={() => setMode("password")} className="flex-1 min-w-[120px]">Mật khẩu</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* TAB 1: PROFILE */}
            {mode === "profile" && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-4">
                <div className="space-y-1.5">
                    <Label>Thay đổi Avatar</Label>
                    <ImageUpload value={formData.avatar} onChange={(url) => setFormData(prev => ({ ...prev, avatar: url }))} label="" className="w-20 h-20" />
                </div>
                
                {/* Họ & Tên */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={profileErrors.lastName ? "text-red-500" : ""}>Họ & Tên đệm *</Label>
                    <Input name="lastName" value={formData.lastName} onChange={handleFormChange} className={`mt-1.5 ${profileErrors.lastName ? "border-red-500" : ""}`} />
                    {profileErrors.lastName && <p className="text-xs text-red-500 mt-1">{profileErrors.lastName}</p>}
                  </div>
                  <div>
                    <Label className={profileErrors.firstName ? "text-red-500" : ""}>Tên *</Label>
                    <Input name="firstName" value={formData.firstName} onChange={handleFormChange} className={`mt-1.5 ${profileErrors.firstName ? "border-red-500" : ""}`} />
                    {profileErrors.firstName && <p className="text-xs text-red-500 mt-1">{profileErrors.firstName}</p>}
                  </div>
                </div>
                
                {/* Giới tính & Ngày sinh */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Giới tính</Label>
                    <Select name="gender" value={formData.gender || "OTHER"} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Nam</SelectItem>
                        <SelectItem value="FEMALE">Nữ</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={profileErrors.dob ? "text-red-500" : ""}>Ngày sinh</Label>
                    <Input name="dob" type="date" value={formData.dob || ""} onChange={handleFormChange} className={`mt-1.5 ${profileErrors.dob ? "border-red-500" : ""}`}/>
                    {profileErrors.dob && <p className="text-xs text-red-500 mt-1">{profileErrors.dob}</p>}
                  </div>
                </div>

                {/* Số điện thoại (Không bắt buộc - nhưng validate nếu nhập) */}
                <div>
                  <Label className={profileErrors.phone ? "text-red-500" : ""}>Số điện thoại</Label>
                  <Input name="phone" value={formData.phone || ""} onChange={handleFormChange} placeholder="" className={`mt-1.5 ${profileErrors.phone ? "border-red-500" : ""}`}/>
                  {profileErrors.phone && <p className="text-xs text-red-500 mt-1">{profileErrors.phone}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin mr-2" />} Cập nhật thông tin
                </Button>
              </form>
            )}

            {/* TAB 2: ADDRESS (LINH HOẠT - KHÔNG DẤU *) */}
            {mode === "address" && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateAddress(); }} className="space-y-4">
                 <div className="space-y-1.5">
                   <Label>Tỉnh/Thành phố</Label>
                   <Select value={selectedProvince?.code.toString() || ""} onValueChange={(value) => { 
                       const p = provinces.find(i => i.code === parseInt(value)); 
                       setSelectedProvince(p || null);
                       setSelectedDistrict(null); 
                       setSelectedWard(null); 
                    }} disabled={isLoadingProvinces}>
                     <SelectTrigger><SelectValue placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành"} /></SelectTrigger>
                     <SelectContent>{provinces.map(p => (<SelectItem key={p.code} value={p.code.toString()}>{p.name}</SelectItem>))}</SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-1.5">
                   <Label>Quận/Huyện</Label>
                   <Select value={selectedDistrict?.code.toString() || ""} onValueChange={(value) => { 
                       const d = districts.find(i => i.code === parseInt(value)); 
                       setSelectedDistrict(d || null);
                       setSelectedWard(null);
                    }} disabled={!selectedProvince || isLoadingDistricts}>
                     <SelectTrigger><SelectValue placeholder={isLoadingDistricts ? "Đang tải..." : "Chọn Quận/Huyện"} /></SelectTrigger>
                     <SelectContent>{districts.map(d => (<SelectItem key={d.code} value={d.code.toString()}>{d.name}</SelectItem>))}</SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-1.5">
                   <Label>Phường/Xã</Label>
                   <Select value={selectedWard?.code.toString() || ""} onValueChange={(value) => { 
                       const w = wards.find(i => i.code === parseInt(value)); 
                       setSelectedWard(w || null);
                    }} disabled={!selectedDistrict || isLoadingWards}>
                     <SelectTrigger><SelectValue placeholder={isLoadingWards ? "Đang tải..." : "Chọn Phường/Xã"} /></SelectTrigger>
                     <SelectContent>{wards.map(w => (<SelectItem key={w.code} value={w.code.toString()}>{w.name}</SelectItem>))}</SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-1.5">
                   <Label>Địa chỉ cụ thể</Label>
                   <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Số nhà, tên đường..." />
                 </div>

                 <Button type="submit" className="w-full" disabled={loading}>
                   {loading && <Loader2 size={16} className="animate-spin mr-2" />} Lưu địa chỉ
                 </Button>
              </form>
            )}
            
            {/* TAB 3: PASSWORD (VALIDATE CHẶT) */}
            {mode === "password" && (
              <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4">
                 <div>
                    <Label className={passwordErrors.currentPassword ? "text-red-500" : ""}>Mật khẩu cũ *</Label>
                    <Input name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} className={`mt-1.5 ${passwordErrors.currentPassword ? "border-red-500" : ""}`} />
                    {passwordErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>}
                 </div>
                 <div>
                    <Label className={passwordErrors.newPassword ? "text-red-500" : ""}>Mật khẩu mới *</Label>
                    <Input name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} className={`mt-1.5 ${passwordErrors.newPassword ? "border-red-500" : ""}`} />
                    {passwordErrors.newPassword ? (
                       <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
                    ) : (
                       <p className="text-xs text-muted-foreground mt-1">Ít nhất 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt (!@#_-%...).</p>
                    )}
                 </div>
                 <div>
                    <Label className={passwordErrors.confirmationPassword ? "text-red-500" : ""}>Xác nhận mật khẩu *</Label>
                    <Input name="confirmationPassword" type="password" value={passwordData.confirmationPassword} onChange={handlePasswordChange} className={`mt-1.5 ${passwordErrors.confirmationPassword ? "border-red-500" : ""}`} />
                    {passwordErrors.confirmationPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmationPassword}</p>}
                 </div>
                 <Button type="submit" className="w-full" disabled={loading}>
                   {loading && <Loader2 size={16} className="animate-spin mr-2" />} Đổi mật khẩu
                 </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}