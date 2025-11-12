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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { manualFetchApi } from "@/lib/api"; // <-- 1. IMPORT HÀM FETCH CHUNG

const ITEMS_PER_PAGE = 5;

// --- Interfaces (Đã bỏ 'position') ---
interface EmployeeResponse {
  id: number;
  name: string; // Full Name
  email: string;
  phone: string;
  joinDate: string; 
  active: boolean;
  role: string;
}

interface EmployeeFormData {
  firstName: string; 
  lastName: string;
  email: string;
  phone: string;
  active: boolean;
  password?: string;
  role: string; // <-- Đổi 'position' thành 'role'
}

// --- Component ---
export function EmployeeManagement() {
  // --- SỬA 2: Lấy user và quyền ---
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  // (Chỉ Admin mới có quyền truy cập trang này)
  const isAdmin = roles.includes("ADMIN");
  // --- KẾT THÚC SỬA 2 ---
  
  // --- States ---
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // --- SỬA 3: State mặc định (Bỏ 'position', dùng 'role') ---
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "", lastName: "", email: "", phone: "", 
    active: true, password: "", role: "STAFF" // Mặc định tạo STAFF
  });
  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching (Đã sửa dùng manualFetchApi) ---
  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return; // Nếu không phải Admin, không fetch
    
    setIsFetching(true);
    const url = new URL(`/v1/users/employees`, "http://dummybase.com"); // (Base URL chỉ để tạo object)
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "createdAt,desc"); 
    url.searchParams.append("status", filterStatus); 
    if (searchTerm) url.searchParams.append("search", searchTerm);
    
    try {
      const result = await manualFetchApi(url.pathname + url.search);
      if (result.status === 'SUCCESS' && result.data) {
        setEmployees(result.data.content);
        setTotalPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải nhân viên");
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
    finally { setIsFetching(false); }
  }, [isAdmin, currentPage, searchTerm, filterStatus]); // (Thêm 'isAdmin')

  useEffect(() => { 
    // Chỉ fetch khi là Admin
    if (isAdmin) {
      fetchEmployees(); 
    }
  }, [fetchEmployees, isAdmin]);

  // --- Handlers ---
  // --- SỬA 5: resetForm (Bỏ 'position', dùng 'role') ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); setFormError(null);
    setFormData({ firstName: "", lastName: "", email: "", phone: "", active: true, password: "", role: "STAFF" });
  }

  // --- SỬA 6: handleSubmit (Bỏ 'position', dùng 'role') ---
  const handleSubmit = async () => {
    if (!isAdmin) { // (Bảo vệ lần nữa)
      toast.error("Bạn không có quyền thực hiện hành động này.");
      return;
    }
    setFormError(null);

    // Validate
    if (!formData.firstName.trim()) return setFormError("Tên là bắt buộc.");
    if (!formData.lastName.trim()) return setFormError("Họ (và tên đệm) là bắt buộc.");
    if (!formData.email.trim()) return setFormError("Email không được để trống.");
    if (!formData.role) return setFormError("Vai trò là bắt buộc.");

    const isEditing = !!editingId;
    let url = "";
    let method = "";
    let requestBody: any = {};

    if (isEditing) {
        // --- LOGIC CẬP NHẬT (PUT) ---
        url = `/v1/users/${editingId}`;
        method = "PUT";
        // Gửi đi DTO (UserRequestDTO) - Không có 'role'
        requestBody = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            active: formData.active,
            // (Không gửi role khi cập nhật)
        };
    } else {
        // --- LOGIC TẠO MỚI (POST) ---
        if (!formData.password || formData.password.length < 6) return setFormError("Mật khẩu (tối thiểu 6 ký tự) là bắt buộc.");
        
        url = `/v1/users/employees`;
        method = "POST";

        // Gửi đi DTO (EmployeeRequestDTO) - Có 'role'
        requestBody = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: formData.phone.trim() || null,
            role: formData.role, // <-- Gửi 'role'
        };
    }

    try {
      const result = await manualFetchApi(url, { 
        method, 
        body: JSON.stringify(requestBody) 
      });

      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật nhân viên thành công!" : "Thêm nhân viên thành công!");
        resetForm();
        fetchEmployees();
      } else {
        throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Tạo thất bại"));
      }
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("đã tồn tại") || err.message.toLowerCase().includes("duplicate"))) {
          setFormError(err.message);
          toast.error(err.message);
      } else {
          toast.error(`Lỗi: ${err.message}`);
          setFormError(err.message);
      }
    }
  };

  // --- SỬA 7: handleEdit (Bỏ 'position', dùng 'role') ---
  const handleEdit = (employee: EmployeeResponse) => {
    if (!isAdmin) return; // (Bảo vệ lần nữa)
    
    // Tách fullName
    const fullName = employee.name || "";
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
        email: employee.email,
        phone: employee.phone || "",
        active: employee.active,
        password: "", 
        role: employee.role // <-- Lưu lại role
    });
    setEditingId(employee.id);
    setShowForm(true);
    setFormError(null);
  };
  
  // Xóa (Soft Delete)
  const handleDelete = async (id: number) => { 
    if (!isAdmin) return; // (Bảo vệ)
    if (!confirm("Ngừng hoạt động nhân viên này?")) return;
    
    try {
      const result = await manualFetchApi(`/v1/users/${id}`, { method: "DELETE" });
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động nhân viên.");
        fetchEmployees();
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
  };
  
  // --- SỬA 8: handleReactivate (Bỏ 'position') ---
  const handleReactivate = async (employee: EmployeeResponse) => {
      if (!isAdmin) return; // (Bảo vệ)
      if (!confirm(`Kích hoạt lại nhân viên "${employee.name}"?`)) return;
      const url = `/v1/users/${employee.id}`;

      // Tách fullName
      const fullName = employee.name || "";
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
          email: employee.email, 
          phone: employee.phone,
          active: true // Set active = true
          // (Không gửi position)
      };
      
      try {
        const result = await manualFetchApi(url, { 
          method: "PUT", 
          body: JSON.stringify(requestBody) 
        });
        
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại thành công!");
          fetchEmployees();
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
    setEmployees([]);
  };

  // --- JSX ---
  
  // --- SỬA 9: Nếu không phải Admin, hiển thị "Từ chối" ---
  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 space-y-6 text-center">
         <h1 className="text-2xl sm:text-3xl font-bold text-destructive">Truy cập bị từ chối</h1>
         <p className="text-muted-foreground">Bạn không có quyền 'ADMIN' để xem trang này.</p>
      </div>
    )
  }
  // --- KẾT THÚC SỬA 9 ---

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin nhân viên (ADMIN, MANAGER, STAFF)</p>
        </div>
         <Button onClick={() => { resetForm(); setShowForm(true); setEditingId(null); }} className="gap-2" size="sm"> <Plus size={16} /> Thêm nhân viên </Button>
      </div>

      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}

      {/* --- SỬA 10: Form (Thay 'position' bằng 'role') --- */}
      {showForm && (
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            
            {/* Tách Họ và Tên */}
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
                 <Input id="email" placeholder="Email *" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1.5"/>
               </div>
               <div>
                 <Label htmlFor="phone" className="text-xs text-muted-foreground">Số điện thoại</Label>
                 <Input id="phone" placeholder="Số điện thoại" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1.5"/>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="role" className="text-xs text-muted-foreground">Vai trò *</Label>
                    {/* Khi Sửa, không cho đổi Role */}
                    {editingId ? (
                        <Input 
                            id="role" 
                            value={formData.role} 
                            disabled 
                            className="mt-1.5 bg-muted/50"
                        />
                    ) : (
                        // Khi Tạo mới, cho phép chọn
                        <Select value={formData.role || "STAFF"} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                            <SelectTrigger id="role" className="mt-1.5"><SelectValue placeholder="Chọn vai trò *" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STAFF">Nhân viên (STAFF)</SelectItem>
                                <SelectItem value="MANAGER">Quản lý (MANAGER)</SelectItem>
                                <SelectItem value="ADMIN">Quản trị viên (ADMIN)</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
                
                {!editingId && (
                    <div>
                        <Label htmlFor="password" className="text-xs text-muted-foreground">Mật khẩu *</Label>
                        <Input id="password" placeholder="Mật khẩu (tối thiểu 6 ký tự) *" type="password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="mt-1.5"/>
                    </div>
                )}
            </div>

            {/* Checkbox Active (Chỉ enable khi Sửa) */}
            {editingId && (
                <div className="flex items-center gap-2">
                    <Checkbox id="empActiveForm" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}/>
                    <Label htmlFor="empActiveForm" className="text-sm">Đang hoạt động</Label>
                </div>
            )}
            
            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handleSubmit} className="flex-1">{editingId ? "Cập nhật nhân viên" : "Tạo mới nhân viên"}</Button>
              <Button variant="outline" onClick={resetForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* --- KẾT THÚC SỬA FORM --- */}

      {/* --- Bảng Danh sách Nhân viên (Sửa 'position' thành 'role') --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách nhân viên</CardTitle>
          <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
              <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
              <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm theo tên, email, vai trò..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-sm"/>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
           employees.length === 0 ? <div className="text-center py-6 text-muted-foreground">{searchTerm ? "Không tìm thấy." : `Không có nhân viên nào (${filterStatus.toLowerCase()}).`}</div> :
           (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên nhân viên</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Liên hệ</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Vai trò</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ngày tham gia</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!employee.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        <td className="py-2 px-3 font-medium text-foreground">{employee.name}</td>
                        <td className="py-2 px-3 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1.5"><Mail size={14} /> <span>{employee.email}</span></div>
                          <div className="flex items-center gap-1.5 mt-1"><Phone size={14} /> <span>{employee.phone || "-"}</span></div>
                        </td>
                        {/* Sửa 'position' thành 'role' */}
                        <td className="py-2 px-3 font-medium">{employee.role}</td> 
                        <td className="py-2 px-3 text-muted-foreground">{new Date(employee.joinDate).toLocaleDateString('vi-VN')}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${employee.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                            {employee.active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                           <div className="flex gap-1.5 justify-center">
                             <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(employee)}><Edit2 size={14} /></Button>
                             {employee.active ? (
                               <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDelete(employee.id)}><Trash2 size={14} /></Button>
                             ) : (
                               <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivate(employee)}>
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