"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Edit2, Trash2, Plus, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS_PER_PAGE = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces (Khớp UserResponseDTO) ---
interface EmployeeResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  joinDate: string; // (Frontend nhận 'joinDate' từ DTO)
  active: boolean;
  role: string;
}

interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  active: boolean;
  password?: string;
}

// --- Component ---
export function EmployeeManagement() {
  const { token } = useAuthStore();
  
  // --- States ---
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: "", email: "", phone: "", position: "", active: true, password: ""
  });
  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching ---
  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    const url = new URL(`${API_URL}/v1/users/employees`);
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    
    // --- SỬA LỖI Ở ĐÂY ---
    // Sắp xếp theo 'createdAt' (tên trường trong Entity)
    url.searchParams.append("sort", "createdAt,desc"); 
    // --- KẾT THÚC SỬA ---

    url.searchParams.append("status", filterStatus); 
    if (searchTerm) url.searchParams.append("search", searchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setEmployees(result.data.content);
        setTotalPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải nhân viên");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
    finally { setIsFetching(false); }
  }, [token, currentPage, searchTerm, filterStatus]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); setFormError(null);
    setFormData({ name: "", email: "", phone: "", position: "", active: true, password: ""});
  }

  // Submit (Tạo/Sửa)
  const handleSubmit = async () => {
    if (!token) return toast.error("Hết hạn đăng nhập.");
    setFormError(null); // Reset lỗi trước

    // --- VALIDATION ---
    if (!formData.name.trim()) return setFormError("Tên không được để trống.");
    if (!formData.email.trim()) return setFormError("Email không được để trống.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) return setFormError("Định dạng email không hợp lệ.");
    if (formData.phone && !/^\d*$/.test(formData.phone.trim())) return setFormError("Số điện thoại chỉ được chứa số.");
    if (!formData.position) return setFormError("Chức vụ là bắt buộc."); // Validate position

    const isEditing = !!editingId;

    let url = "";
    let method = "";
    let requestBody: any = {};

    if (isEditing) {
        // --- LOGIC CẬP NHẬT (PUT) ---
        url = `${API_URL}/v1/users/${editingId}`;
        method = "PUT";
        requestBody = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            position: formData.position, // Gửi position đã chọn
            active: formData.active, // Gửi trạng thái active
        };
        // Không gửi password và role khi cập nhật thông tin user
    } else {
        // --- LOGIC TẠO MỚI (POST) ---
        if (!formData.password || formData.password.length < 6) return setFormError("Mật khẩu (tối thiểu 6 ký tự) là bắt buộc khi tạo mới.");

        url = `${API_URL}/v1/users/employees`; // Endpoint tạo employee
        method = "POST";

        // --- TỰ SUY RA ROLE TỪ POSITION ---
        let roleToSend = "STAFF"; // Mặc định là STAFF
        if (formData.position === "QUAN_TRI_VIEN") {
            roleToSend = "ADMIN";
        }
        // --- KẾT THÚC SUY RA ROLE ---

        requestBody = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: formData.phone.trim() || null,
            position: formData.position, // Gửi position đã chọn
            role: roleToSend, // <-- Gửi role đã suy ra
            // Backend /employees thường tự set active=true, không cần gửi
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

      // API tạo mới (/employees) có thể trả về status SUCCESS trong body
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật nhân viên thành công!" : "Thêm nhân viên thành công!");
        resetForm();
        fetchEmployees();
      } else {
        throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Tạo thất bại"));
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
      setFormError(err.message);
    }
  };
  // Mở form Sửa
  const handleEdit = (employee: EmployeeResponse) => {
    setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || "",
        position: employee.position || "",
        active: employee.active,
        password: "" // Xóa mật khẩu khi sửa
    });
    setEditingId(employee.id);
    setShowForm(true);
    setFormError(null);
  };
  
  // Xóa (Soft Delete)
  const handleDelete = async (id: number) => {
    if (!token || !confirm("Ngừng hoạt động nhân viên này?")) return;
    try {
      const response = await fetch(`${API_URL}/v1/users/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động nhân viên.");
        fetchEmployees();
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // Kích hoạt lại
  const handleReactivate = async (employee: EmployeeResponse) => {
      if (!token || !confirm(`Kích hoạt lại nhân viên "${employee.name}"?`)) return;
      const url = `${API_URL}/v1/users/${employee.id}`;
      const requestBody = { 
          name: employee.name, email: employee.email, phone: employee.phone,
          position: employee.position, active: true 
      };
      try {
        const response = await fetch(url, { method: "PUT", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại thành công!");
          fetchEmployees();
        } else throw new Error(result.message || "Kích hoạt thất bại");
      } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // Xử lý đổi Tab
  const handleTabChange = (newStatus: string) => {
      setFilterStatus(newStatus);
      setCurrentPage(1);
      setSearchTerm("");
      setEmployees([]);
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin nhân viên (ADMIN, STAFF)</p>
        </div>
         <Button onClick={() => { resetForm(); setShowForm(true); setEditingId(null); }} className="gap-2" size="sm"> <Plus size={16} /> Thêm nhân viên </Button>
      </div>

      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}

      {/* --- Form Thêm/Sửa --- */}
      {showForm && (
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Tên nhân viên *" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
              <Input placeholder="Email *" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })}/>
              <Input placeholder="Số điện thoại" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}/>
              
              <Select value={formData.position || ""} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                <SelectTrigger><SelectValue placeholder="Chọn chức vụ *" /></SelectTrigger>
                <SelectContent>
                    {/* <SelectItem value="">-- Chọn chức vụ --</SelectItem> // Đã xóa */}
                    <SelectItem value="QUAN_TRI_VIEN">Quản trị viên</SelectItem>
                    <SelectItem value="NHAN_VIEN_BAN_HANG">Nhân viên Bán hàng</SelectItem>
                    <SelectItem value="NHAN_VIEN_KHO">Nhân viên Kho</SelectItem>
                </SelectContent>
              </Select>
              
              {!editingId && (
                <>
                  <Input placeholder="Mật khẩu (tối thiểu 6 ký tự) *" type="password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })}/>
                 
                </>
              )}
            </div>
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

      {/* --- Bảng Danh sách Nhân viên --- */}
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
            <Input placeholder="Tìm theo tên, email, chức vụ..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-sm"/>
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
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Chức vụ</th>
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
                        <td className="py-2 px-3 text-muted-foreground">{employee.position || "-"}</td>
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