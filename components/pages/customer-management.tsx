"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // (Giữ lại, có thể file khác cần)
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, RotateCcw, Mail, Phone } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { manualFetchApi } from "@/lib/api"; // <-- 1. IMPORT HÀM FETCH CHUNG

const ITEMS_PER_PAGE = 5;
// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"; // (Không cần)

// --- Interfaces ---
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
  // --- SỬA 2: Lấy user và quyền ---
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  // (Chỉ Admin mới có quyền sửa/xóa/kích hoạt)
  const isAdmin = roles.includes("ADMIN");
  // --- KẾT THÚC SỬA 2 ---
  
  // --- States ---
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: "", lastName: "", email: "", password: "", phone: null, active: true
  });
  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching (ĐÃ SỬA DÙNG manualFetchApi) ---
  const fetchCustomers = useCallback(async () => {
    setIsFetching(true);
    
    // 1. Tạo chuỗi query
    const query = new URLSearchParams();
    query.append("page", (currentPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "createdAt,desc");
    query.append("status", filterStatus);
    if (searchTerm) query.append("search", searchTerm);
    
    try {
      // 2. Gọi manualFetchApi
      const result = await manualFetchApi(`/v1/users/customers?${query.toString()}`);
      
      if (result.status === 'SUCCESS' && result.data) {
        setCustomers(result.data.content);
        setTotalPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải khách hàng");
    } catch (err: any) { 
      // Lỗi 403 (Forbidden) sẽ được bắt ở đây nếu BE cấm
      toast.error(`Lỗi: ${err.message}`); 
    }
    finally { setIsFetching(false); }
  }, [currentPage, searchTerm, filterStatus]); // (Đã xóa 'token')

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); setFormError(null);
    setFormData({ firstName: "", lastName: "", email: "", password: "", phone: null, active: true });
  }

  // --- SỬA 4: handleSubmit (Dùng manualFetchApi + Thêm check quyền) ---
  const handleSubmit = async () => {
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
        // --- SỬA: Check quyền Admin khi SỬA ---
        if (!isAdmin) {
          toast.error("Bạn không có quyền sửa thông tin khách hàng.");
          return;
        }
        
        url = `/v1/users/${editingId}`;
        method = "PUT";
        requestBody = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone ? formData.phone.trim() : null,
            active: formData.active,
        };
    } else {
        // (Tạo mới)
        if (!formData.password || formData.password.length < 6) {
            return setFormError("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        url = `/v1/auth/register`; // API này Public
        method = "POST";
        requestBody = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
        };
    }

    try {
      // Dùng manualFetchApi
      const result = await manualFetchApi(url, { 
        method, 
        body: JSON.stringify(requestBody) 
      });

      if (result.status === 'SUCCESS') {
         toast.success(isEditing ? "Cập nhật khách hàng thành công!" : "Thêm khách hàng thành công! (Cần kích hoạt email)");
         resetForm();
         fetchCustomers();
      } else {
         // Lỗi logic (BE trả về 200 nhưng status: 'ERROR')
         throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Tạo thất bại"));
      }
      
    } catch (err: any) {
      // Lỗi 409 (Trùng lặp) hoặc 403 (Không quyền)
      if (err.message && (err.message.toLowerCase().includes("đã tồn tại") || err.message.toLowerCase().includes("duplicate"))) {
          setFormError(err.message);
          toast.error(err.message);
      } else {
          toast.error(`Lỗi: ${err.message}`);
          setFormError(err.message);
      }
    }
  };

  // Mở form Sửa
  const handleEdit = (customer: CustomerResponse) => {
    if (!isAdmin) { // <-- SỬA 5: Check quyền
      toast.error("Bạn không có quyền sửa.");
      return;
    }
    
    // (Logic tách tên của bạn đã đúng)
    const fullName = customer.name || "";
    const lastSpaceIndex = fullName.lastIndexOf(' ');
    let firstName = "";
    let lastName = "";
    if (lastSpaceIndex === -1) { firstName = fullName; } 
    else {
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
  const handleDelete = async (id: number) => { 
    if (!isAdmin) { // <-- SỬA 6: Check quyền
      toast.error("Bạn không có quyền ngừng hoạt động khách hàng.");
      return;
    }
    
    if (!confirm("Ngừng hoạt động khách hàng này?")) return;
    
    try {
      const result = await manualFetchApi(`/v1/users/${id}`, { method: "DELETE" });
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động khách hàng.");
        fetchCustomers();
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
  };

  // Kích hoạt lại
  const handleReactivate = async (customer: CustomerResponse) => {
    if (!isAdmin) { // <-- SỬA 7: Check quyền
      toast.error("Bạn không có quyền kích hoạt lại khách hàng.");
      return;
    }
    
    if (!confirm(`Kích hoạt lại khách hàng "${customer.name}"?`)) return;
    const url = `/v1/users/${customer.id}`;

    // (Logic tách tên của bạn đã đúng)
    const fullName = customer.name || "";
    const lastSpaceIndex = fullName.lastIndexOf(' ');
    let firstName = "";
    let lastName = "";
    if (lastSpaceIndex === -1) { firstName = fullName; } 
    else {
        firstName = fullName.substring(lastSpaceIndex + 1);
        lastName = fullName.substring(0, lastSpaceIndex);
    }

    const requestBody = { 
        firstName: firstName,
        lastName: lastName,
        email: customer.email, 
        phone: customer.phone,
        active: true // Set active = true
    };
    
    try {
      const result = await manualFetchApi(url, { 
        method: "PUT", 
        body: JSON.stringify(requestBody) 
      });
      
      if (result.status === 'SUCCESS') {
        toast.success("Kích hoạt lại thành công!");
        fetchCustomers();
      } else throw new Error(result.message || "Kích hoạt thất bại");
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
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
        {/* --- SỬA 8: Chỉ ADMIN mới được TẠO KHÁCH HÀNG (theo logic của bạn) --- */}
        {/* (Mặc dù API là public, nhưng nghiệp vụ này nên là Admin) */}
        {isAdmin && (
          <Button onClick={() => { resetForm(); setShowForm(true); setEditingId(null); }} className="gap-1.5 self-end sm:self-center" size="sm">
            <Plus size={16} /> Thêm Khách Hàng
          </Button>
        )}
        {/* --- KẾT THÚC SỬA 8 --- */}
      </div>

      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}
      
      {/* Ẩn Form nếu không phải Admin */}
      {showForm && isAdmin && (
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
               checked={editingId ? formData.active : false} 
               onCheckedChange={(checked) => {
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
                      {/* --- SỬA 9: Ẩn cột Hành động nếu không phải Admin --- */}
                      {isAdmin && (
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                      )}
                      {/* --- KẾT THÚC SỬA 9 --- */}
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${customer.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                            {customer.active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td>
                        {/* --- SỬA 10: Ẩn các nút nếu không phải Admin --- */}
                        {isAdmin && (
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
                        )}
                        {/* --- KẾT THÚC SỬA 10 --- */}
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