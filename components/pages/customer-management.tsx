"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Edit2, Trash2, Plus, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Sửa: Import TabsList, TabsTrigger

const ITEMS_PER_PAGE = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces (Sửa: Thêm firstName/lastName) ---
interface CustomerResponse {
  id: number;
  name: string; // Vẫn nhận Full Name
  firstName: string; // Dùng để fill Form Sửa
  lastName: string;  // Dùng để fill Form Sửa
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  active: boolean;
  role: string;
}

// --- SỬA 1: Dùng firstName/lastName ---
interface CustomerFormData {
  firstName: string; 
  lastName: string;
  email: string;
  password?: string;
  phone: string | null;
  active: boolean;
}

// --- Component ---
export function CustomerManagement() {
  const { token } = useAuthStore();
  
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // --- SỬA 2: State mặc định ---
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: "", lastName: "", email: "", password: "", phone: null, active: true
  });
  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching (Giữ nguyên) ---
  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    const url = new URL(`${API_URL}/v1/users/customers`);
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "createdAt,desc");
    url.searchParams.append("status", filterStatus);
    if (searchTerm) url.searchParams.append("search", searchTerm);
    
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setCustomers(result.data.content);
        setTotalPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải khách hàng");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
    finally { setIsFetching(false); }
  }, [token, currentPage, searchTerm, filterStatus]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // --- Handlers ---
  // --- SỬA 3: resetForm ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); setFormError(null);
    setFormData({ firstName: "", lastName: "", email: "", password: "", phone: null, active: true });
  }

  // --- SỬA 4: handleSubmit (Gửi đi firstName/lastName) ---
  const handleSubmit = async () => {
    if (!token) return toast.error("Hết hạn đăng nhập.");
    setFormError(null);

    // Validate
    if (!formData.firstName.trim()) return setFormError("Tên là bắt buộc.");
    if (!formData.lastName.trim()) return setFormError("Họ (và tên đệm) là bắt buộc.");
    if (!formData.email.trim()) return setFormError("Email không được để trống.");
    // ... (Validate email, phone)

    const isEditing = !!editingId;
    let url = "";
    let method = "";
    let requestBody: any = {};

    if (isEditing) {
        // --- LOGIC CẬP NHẬT (PUT /v1/users/{id}) ---
        url = `${API_URL}/v1/users/${editingId}`;
        method = "PUT";
        // Gửi UserRequestDTO (không có 'role' và 'password')
        requestBody = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone ? formData.phone.trim() : null,
            active: formData.active,
            // (Backend sẽ tự giữ 'position' là null nếu DTO không có)
        };
    } else {
        // --- LOGIC TẠO MỚI (POST /v1/auth/register) ---
        if (!formData.password || formData.password.length < 6) {
            return setFormError("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        url = `${API_URL}/v1/auth/register`;
        method = "POST";
        // Gửi RegisterRequestDTO
        requestBody = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
        };
    }

    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const result = await response.json();

      if (response.status === 409 || response.status === 400) { 
        setFormError(result.message || (isEditing ? "Cập nhật thất bại" : "Tạo thất bại"));
        toast.error(result.message || (isEditing ? "Cập nhật thất bại" : "Tạo thất bại"));
        return;
      }
       if (!response.ok) {
        throw new Error(result.message || `Lỗi ${response.status}`);
      }

      // (API Register có thể trả về text, không phải JSON 'status')
      // Chúng ta chỉ cần biết nó OK (2xx) là được
      toast.success(isEditing ? "Cập nhật khách hàng thành công!" : "Thêm khách hàng thành công! (Cần kích hoạt email)");
      resetForm();
      fetchCustomers();
      
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
      setFormError(err.message);
    }
  };

  // --- SỬA 5: handleEdit (Tách Full Name) ---
  const handleEdit = (customer: CustomerResponse) => {
    // Tách fullName (Vd: "Đỗ Thành Công") thành lastName ("Đỗ Thành") và firstName ("Công")
    const fullName = customer.name || "";
    const lastSpaceIndex = fullName.lastIndexOf(' ');
    let firstName = "";
    let lastName = "";

    if (lastSpaceIndex === -1) {
        firstName = fullName; // Nếu chỉ có 1 từ
    } else {
        firstName = fullName.substring(lastSpaceIndex + 1);
        lastName = fullName.substring(0, lastSpaceIndex);
    }

    setFormData({
        firstName: firstName,
        lastName: lastName,
        email: customer.email,
        phone: customer.phone || null,
        active: customer.active,
    });
    setEditingId(customer.id);
    setShowForm(true);
    setFormError(null);
  };

  // Xóa (Soft Delete)
  const handleDelete = async (id: number) => { /* ... (Giữ nguyên) ... */ };

  // --- SỬA 6: handleReactivate (Tách Full Name) ---
  const handleReactivate = async (customer: CustomerResponse) => {
      if (!token || !confirm(`Kích hoạt lại khách hàng "${customer.name}"?`)) return;
      const url = `${API_URL}/v1/users/${customer.id}`;

      // Tách fullName
      const fullName = customer.name || "";
      const lastSpaceIndex = fullName.lastIndexOf(' ');
      let firstName = "";
      let lastName = "";
      if (lastSpaceIndex === -1) { firstName = fullName; } 
      else {
          firstName = fullName.substring(lastSpaceIndex + 1);
          lastName = fullName.substring(0, lastSpaceIndex);
      }

      // Gửi UserRequestDTO
      const requestBody = { 
          firstName: firstName,
          lastName: lastName,
          email: customer.email, 
          phone: customer.phone,
          active: true // Set active = true
          // (Không cần gửi position vì đây là Customer)
      };
      try {
        const response = await fetch(url, { method: "PUT", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại thành công!");
          fetchCustomers();
        } else throw new Error(result.message || "Kích hoạt thất bại");
      } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // Xử lý đổi Tab
  const handleTabChange = (newStatus: string) => {
      setFilterStatus(newStatus);
      setCurrentPage(1);
      setSearchTerm("");
      setCustomers([]);
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý khách hàng</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin khách hàng (Vai trò: USER)</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); setEditingId(null); }} className="gap-1.5 self-end sm:self-center" size="sm">
          <Plus size={16} /> Thêm Khách Hàng
        </Button>
      </div>

      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}
      
      {/* --- SỬA 7: Form (Dùng 2 ô tên) --- */}
      {showForm && (
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            
            {/* Sửa: Tách Họ và Tên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastName" className="text-xs text-muted-foreground">Họ (và tên đệm) *</Label>
                <Input id="lastName" placeholder="Vd: Đỗ Thành" value={formData.lastName || ""} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="mt-1.5"/>
              </div>
              <div>
                <Label htmlFor="firstName" className="text-xs text-muted-foreground">Tên *</Label>
                <Input id="firstName" placeholder="Vd: Công" value={formData.firstName || ""} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="mt-1.5"/>
              </div>
            </div>
            {/* Kết thúc Sửa Tên */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="email" className="text-xs text-muted-foreground">Email *</Label>
                 <Input id="email" placeholder="Email" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1.5"/>
               </div>
               <div>
                 <Label htmlFor="phone" className="text-xs text-muted-foreground">Số điện thoại</Label>
                 <Input id="phone" placeholder="Số điện thoại (tùy chọn)" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1.5"/>
               </div>
            </div>

            {/* Trường Mật khẩu (chỉ khi tạo mới) */}
            {!editingId && (
                <div>
                    <Label htmlFor="passwordInput" className="text-xs text-muted-foreground">Mật khẩu * (Ít nhất 6 ký tự)</Label>
                    <Input
                        id="passwordInput"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={formData.password || ""}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="mt-1"
                    />
                </div>
            )}

            {/* Checkbox Active (Chỉ enable khi Sửa) */}
           <div className="flex items-center gap-2">
             <Checkbox
               id="customerActiveForm"
               // Sửa: Khi tạo mới (!editingId), ép checked = false
               // (Vì API /register mặc định isActive=false, cần kích hoạt mail)
               checked={editingId ? formData.active : false} 
               onCheckedChange={(checked) => {
                 // Chỉ cho phép thay đổi khi đang sửa
                 if (editingId) {
                   setFormData({ ...formData, active: Boolean(checked) });
                 }
               }}
               disabled={!editingId} // Vẫn giữ disabled khi tạo mới
             />
             <Label
               htmlFor="customerActiveForm"
               className={`text-sm ${!editingId ? 'text-muted-foreground cursor-not-allowed' : ''}`}
             >
               Đang hoạt động (Chỉ bật khi sửa)
             </Label>
           </div>

            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handleSubmit} className="flex-1">{editingId ? "Cập nhật khách hàng" : "Thêm khách hàng"}</Button>
              <Button variant="outline" onClick={resetForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bảng Danh sách Khách hàng */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách khách hàng</CardTitle>
          <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
              <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
              <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm kiếm theo tên, email hoặc SĐT..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-sm"/>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
           customers.length === 0 ? <div className="text-center py-6 text-muted-foreground">{searchTerm ? "Không tìm thấy." : `Không có khách hàng nào (${filterStatus.toLowerCase()}).`}</div> :
           (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên khách hàng</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Liên hệ</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Tổng đơn</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Tổng chi (₫)</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ngày tham gia</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!customer.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        <td className="py-2 px-3 font-medium text-foreground">{customer.name}</td>
                        <td className="py-2 px-3 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1.5"><Mail size={14} /> <span>{customer.email}</span></div>
                          <div className="flex items-center gap-1.5 mt-1"><Phone size={14} /> <span>{customer.phone || "-"}</span></div>
                        </td>
                        <td className="py-2 px-3 text-right">{customer.totalOrders}</td>
                        <td className="py-2 px-3 text-right">{customer.totalSpent.toLocaleString('vi-VN')}</td>
                        <td className="py-2 px-3 text-muted-foreground">{new Date(customer.joinDate).toLocaleDateString('vi-VN')}</td>
                         <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${customer.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {customer.active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                           <div className="flex gap-1.5 justify-center">
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(customer)}><Edit2 size={14} /></Button>
                              {customer.active ? (
                                <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDelete(customer.id)}><Trash2 size={14} /></Button>
                              ) : (
                                <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivate(customer)}>
                                    <RotateCcw size={14} /> 
                                </Button>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>)}
            </>
           )}
        </CardContent>
      </Card>
    </div>
  )
}