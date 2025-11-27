"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Edit2, Trash2, Plus, RotateCcw, XCircle, Eye } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { manualFetchApi } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 5;

// --- Interfaces ---
interface EmployeeResponse {
  id: number;
  name: string;
  firstName?: string; // Dữ liệu chuẩn từ API
  lastName?: string;  // Dữ liệu chuẩn từ API
  email: string;
  phone: string | null;
  joinDate: string; 
  active: boolean;
  role: string;
  activityCount: number;
}

interface EmployeeFormData {
  firstName: string; 
  lastName: string;
  email: string;
  phone: string | null;
  active: boolean;
  password?: string;
  role: string;
}

type EmployeeFormErrors = Partial<Record<keyof EmployeeFormData, string>>;

interface DialogState {
  isOpen: boolean;
  action: 'delete' | 'reactivate' | 'permanentDelete' | null;
  employee: EmployeeResponse | null;
}

// --- Component ---
export function EmployeeManagement() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  
  // --- PHÂN QUYỀN ---
  const isAdmin = roles.includes("ADMIN");
  const isManager = roles.includes("MANAGER");
  // Cho phép truy cập nếu là Admin hoặc Manager
  const canAccess = isAdmin || isManager;

  // --- Helpers kiểm tra quyền ---
  const canModifyUser = (targetRole: string) => {
    if (isAdmin) return true; // Admin sửa được hết
    if (isManager && targetRole === "STAFF") return true; // Manager chỉ sửa Staff
    return false; 
  };

  const canHardDelete = () => isAdmin; // Chỉ Admin mới được xóa cứng

  // --- States ---
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "", lastName: "", email: "", phone: null, 
    active: true, password: "", role: "STAFF"
  });
  
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false, action: null, employee: null,
  });

  // --- API Fetching ---
  const fetchEmployees = useCallback(async () => {
    if (!canAccess) return;
    setIsFetching(true);
    
    const query = new URLSearchParams();
    query.append("page", (currentPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "createdAt,desc"); 
    query.append("status", filterStatus); 
    if (searchTerm) query.append("search", searchTerm);
    
    try {
      const result = await manualFetchApi(`/v1/users/employees?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        setEmployees(result.data.content || []);
        setTotalPages(result.data.totalPages ?? 0);
        setTotalEmployees(result.data.totalElements ?? 0);
      } else throw new Error(result.message || "Lỗi tải nhân viên");
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
    finally { setIsFetching(false); }
  }, [canAccess, currentPage, searchTerm, filterStatus]);

  useEffect(() => { 
    if (canAccess) { fetchEmployees(); }
  }, [fetchEmployees, canAccess]);

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); setIsViewOnlyMode(false);
    setApiError(null); setFormErrors({});
    setFormData({ firstName: "", lastName: "", email: "", phone: null, active: true, password: "", role: "STAFF" });
  }
  
  const validateForm = (): EmployeeFormErrors => {
    const newErrors: EmployeeFormErrors = {};
    const { firstName, lastName, email, role, password, phone } = formData;
    
    if (!firstName.trim()) newErrors.firstName = "Tên là bắt buộc.";
    if (!lastName.trim()) newErrors.lastName = "Họ (và tên đệm) là bắt buộc.";
    
    if (!email.trim()) {
        newErrors.email = "Email không được để trống.";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim())) {
        newErrors.email = "Địa chỉ email không hợp lệ.";
    }
    
    if (!role) newErrors.role = "Vai trò là bắt buộc.";

    // --- VALIDATE PHONE (Không bắt buộc, nhưng nhập phải đúng) ---
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (phone && phone.trim() !== "") {
        if (!phoneRegex.test(phone.trim())) {
            newErrors.phone = "SĐT không đúng định dạng (10 số).";
        }
    }

    // --- VALIDATE PASSWORD (Khi tạo mới) ---
    if (!editingId && !isViewOnlyMode) {
        // Regex: Tối thiểu 8 ký tự, 1 Hoa, 1 Thường, 1 Số, 1 Ký tự đặc biệt
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
        
        if (!password) {
            newErrors.password = "Mật khẩu là bắt buộc.";
        } else if (!passwordRegex.test(password)) {
             newErrors.password = "MK yếu: Cần 8 ký tự, Hoa, Thường, Số & Ký tự ĐB.";
        }
    }
    return newErrors;
  }

  const handleSubmit = async () => {
    if (isViewOnlyMode) { resetForm(); return; } 
    if (!canAccess) { toast.error("Bạn không có quyền."); return; }
    
    setApiError(null);
    setFormErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      toast.error("Vui lòng kiểm tra lại các trường có lỗi.");
      return;
    }

    const isEditing = !!editingId;
    
    // Check quyền: Manager không được tạo Admin/Manager
    if (isManager && formData.role !== 'STAFF' && !isEditing) {
        toast.error("Manager chỉ được tạo Staff.");
        return;
    }

    let url = "";
    let method = "";
    let requestBody: any = {};

    if (isEditing) {
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
        url = `/v1/users/employees`;
        method = "POST";
        requestBody = { 
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: formData.phone ? formData.phone.trim() : null,
            role: formData.role,
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
      const errorMsg = err.message || "";
      
      // --- XỬ LÝ LỖI TỪ BACKEND ---
      if (errorMsg.toLowerCase().includes("email") || errorMsg.toLowerCase().includes("đã tồn tại")) {
          setFormErrors(prev => ({ ...prev, email: errorMsg }));
          toast.error("Email đã tồn tại.");
      } 
      else if (errorMsg.toLowerCase().includes("số điện thoại") || errorMsg.toLowerCase().includes("phone")) {
          setFormErrors(prev => ({ ...prev, phone: errorMsg }));
          toast.error("Số điện thoại đã được sử dụng.");
      } 
      else {
          toast.error(`Lỗi: ${errorMsg}`);
          setApiError(errorMsg);
      }
    }
  };

  const handleEdit = (employee: EmployeeResponse, viewOnly: boolean = false) => {
    const canEdit = canModifyUser(employee.role);
    const isViewMode = viewOnly || !canEdit;

    setFormData({
        firstName: employee.firstName || "", 
        lastName: employee.lastName || "",
        email: employee.email,
        phone: employee.phone || null,
        active: employee.active,
        password: "", 
        role: employee.role
    });
    setEditingId(employee.id);
    setIsViewOnlyMode(isViewMode);
    setShowForm(true);
    setApiError(null);
    setFormErrors({});
  };
  
  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, employee: null });
  };

  const handleConfirmAction = async () => {
    const { action, employee } = dialogState;
    if (!employee || !canAccess) { toast.error("Hành động không hợp lệ."); closeDialog(); return; };

    if ((action === 'delete' || action === 'reactivate') && !canModifyUser(employee.role)) {
         toast.error("Bạn không có quyền thao tác trên user này."); closeDialog(); return;
    }
    if (action === 'permanentDelete' && !canHardDelete()) {
         toast.error("Chỉ Admin mới được xóa vĩnh viễn."); closeDialog(); return;
    }

    try {
      if (action === 'delete') {
        const result = await manualFetchApi(`/v1/users/${employee.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã ngừng hoạt động nhân viên.");
          fetchEmployees();
        } else throw new Error(result.message || "Ngừng hoạt động thất bại");
      } 
      
      else if (action === 'reactivate') {
        const url = `/v1/users/${employee.id}`;
        const requestBody = { 
            firstName: employee.firstName || "", 
            lastName: employee.lastName || "",
            email: employee.email, 
            phone: employee.phone,
            active: true
        };
        const result = await manualFetchApi(url, { method: "PUT", body: JSON.stringify(requestBody) });
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại thành công!");
          fetchEmployees();
        } else throw new Error(result.message || "Kích hoạt thất bại");
      } 
      
      else if (action === 'permanentDelete') {
        const result = await manualFetchApi(`/v1/users/permanent-delete/${employee.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã xóa vĩnh viễn nhân viên.");
          fetchEmployees();
        } else throw new Error(result.message || "Xóa vĩnh viễn thất bại");
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      closeDialog();
    }
  };
  
  const handleTabChange = (newStatus: string) => { 
    setFilterStatus(newStatus);
    setCurrentPage(1);
    setSearchTerm("");
    setEmployees([]);
  };

  // --- JSX ---
  if (!canAccess) {
    return (
      <div className="p-4 sm:p-6 space-y-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-destructive">Truy cập bị từ chối</h1>
        <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
          <p className="text-sm text-muted-foreground mt-1">
             {isAdmin ? "Toàn quyền quản trị hệ thống" : "Quản lý nhân viên cấp dưới (Staff)"}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); setEditingId(null); }} className="gap-2" size="sm"> 
            <Plus size={16} /> Thêm nhân viên 
        </Button>
      </div>

      {apiError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{apiError}</div> )}

      {/* --- Form Modal/Inline --- */}
      {showForm && (
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
                {isViewOnlyMode ? "Thông tin chi tiết" : (editingId ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastName" className={`text-xs ${formErrors.lastName ? 'text-destructive' : 'text-muted-foreground'}`}>Họ (và tên đệm) *</Label>
                <Input id="lastName" disabled={isViewOnlyMode} placeholder="Vd: Đỗ Thành" value={formData.lastName || ""} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={`mt-1.5 ${formErrors.lastName ? 'border-destructive' : ''}`}/>
                {formErrors.lastName && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.lastName}</p>}
              </div>
              <div>
                <Label htmlFor="firstName" className={`text-xs ${formErrors.firstName ? 'text-destructive' : 'text-muted-foreground'}`}>Tên *</Label>
                <Input id="firstName" disabled={isViewOnlyMode} placeholder="Vd: Công" value={formData.firstName || ""} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={`mt-1.5 ${formErrors.firstName ? 'border-destructive' : ''}`}/>
                {formErrors.firstName && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.firstName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                {/* Cập nhật Label: Thêm dòng thông báo không thể sửa */}
                <Label htmlFor="email" className={`text-xs ${formErrors.email ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Email * {editingId ? "(Không thể sửa)" : ""}
                </Label>
                
                {/* Cập nhật Input: Thêm điều kiện disabled và style background */}
                <Input 
                    id="email" 
                    // Disabled khi: Đang xem chi tiết HOẶC Đang chỉnh sửa (!!editingId)
                    disabled={isViewOnlyMode || !!editingId} 
                    placeholder="Email *" 
                    type="email" 
                    value={formData.email || ""} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    // Thêm class 'bg-muted/50' nếu đang sửa để làm xám ô input
                    className={`mt-1.5 ${formErrors.email ? 'border-destructive' : ''} ${editingId ? 'bg-muted/50' : ''}`}
                />
                
                {formErrors.email && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.email}</p>}
               </div>
               <div>
                <Label htmlFor="phone" className={`text-xs ${formErrors.phone ? 'text-destructive' : 'text-muted-foreground'}`}>Số điện thoại</Label>
                <Input 
                    id="phone" 
                    disabled={isViewOnlyMode} 
                    placeholder="Số điện thoại (tùy chọn)" 
                    value={formData.phone || ""} 
                    onChange={(e) => {
                        const val = e.target.value;
                        if (!/^\d*$/.test(val)) return; // Chặn chữ
                        setFormData({ ...formData, phone: val });
                    }} 
                    className={`mt-1.5 ${formErrors.phone ? 'border-destructive' : ''}`}
                />
                {formErrors.phone ? (
                    <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.phone}</p>
                ) : (
                    !isViewOnlyMode && <p className="text-xs text-muted-foreground mt-1.5">SĐT không bắt buộc, nếu nhập phải đủ 10 số.</p>
                )}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <Label htmlFor="role" className={`text-xs ${formErrors.role ? 'text-destructive' : 'text-muted-foreground'}`}>Vai trò * {editingId ? "(Không thể sửa)" : ""}</Label>
                {editingId || isViewOnlyMode ? (
                    <Input id="role" value={formData.role} disabled className="mt-1.5 bg-muted/50"/>
                ) : (
                    <Select value={formData.role || "STAFF"} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger id="role" className={`mt-1.5 ${formErrors.role ? 'border-destructive' : ''}`}><SelectValue placeholder="Chọn vai trò *" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STAFF">Nhân viên (STAFF)</SelectItem>
                            {isAdmin && <SelectItem value="MANAGER">Quản lý (MANAGER)</SelectItem>}
                            {isAdmin && <SelectItem value="ADMIN">Quản trị viên (ADMIN)</SelectItem>}
                        </SelectContent>
                    </Select>
                )}
                {formErrors.role && !editingId && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.role}</p>}
               </div>
               
               {/* Mật khẩu: Chỉ hiện khi tạo mới và không phải chế độ xem */}
               {!editingId && !isViewOnlyMode && (
                   <div>
                    <Label htmlFor="password" className={`text-xs ${formErrors.password ? 'text-destructive' : 'text-muted-foreground'}`}>Mật khẩu *</Label>
                    <Input id="password" placeholder="Nhập mật khẩu" type="password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`mt-1.5 ${formErrors.password ? 'border-destructive' : ''}`}/>
                    {formErrors.password && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.password}</p>}
                   </div>
               )}
            </div>

            {/* Chỉ hiện checkbox Active khi sửa */}
            {editingId && (
               <div className="flex items-center gap-2">
                   <Checkbox id="empActiveForm" disabled={isViewOnlyMode} checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}/>
                   <Label htmlFor="empActiveForm" className="text-sm">Đang hoạt động</Label>
               </div>
            )}
            
            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handleSubmit} className="flex-1" variant={isViewOnlyMode ? "secondary" : "default"}>
                  {isViewOnlyMode ? "Đóng" : (editingId ? "Cập nhật nhân viên" : "Tạo mới nhân viên")}
              </Button>
              {!isViewOnlyMode && <Button variant="outline" onClick={resetForm} className="flex-1">Hủy</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Bảng Danh sách Nhân viên --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách nhân viên ({totalEmployees})</CardTitle>
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
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Hoạt động</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ngày tham gia</th>
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => {
                        const canEdit = canModifyUser(employee.role);
                        return (
                        <tr key={employee.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!employee.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                          <td className="py-2 px-3 font-medium text-foreground">{employee.name}</td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">
                            <div className="flex items-center gap-1.5"><Mail size={14} /> <span>{employee.email}</span></div>
                            <div className="flex items-center gap-1.5 mt-1"><Phone size={14} /> <span>{employee.phone || "-"}</span></div>
                          </td>
                          <td className="py-2 px-3 font-medium">{employee.role}</td> 
                          <td className="py-2 px-3 text-center text-muted-foreground">{employee.activityCount}</td>
                          <td className="py-2 px-3 text-muted-foreground">{new Date(employee.joinDate).toLocaleDateString('vi-VN')}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${employee.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                              {employee.active ? "Hoạt động" : "Ngừng HĐ"}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                             <div className="flex gap-1.5 justify-center">
                              {canEdit ? (
                                  <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(employee, false)}><Edit2 size={14} /></Button>
                              ) : (
                                  <Button variant="ghost" size="icon" className="w-7 h-7" title="Chi tiết" onClick={() => handleEdit(employee, true)}><Eye size={14} /></Button>
                              )}

                              {employee.active ? (
                                canEdit && (
                                    <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => setDialogState({ isOpen: true, action: 'delete', employee: employee })}>
                                      <Trash2 size={14} />
                                    </Button>
                                )
                              ) : (
                                <>
                                  {canEdit && (
                                      <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => setDialogState({ isOpen: true, action: 'reactivate', employee: employee })}>
                                        <RotateCcw size={14} /> 
                                      </Button>
                                  )}
                                  {employee.activityCount === 0 && canHardDelete() && (
                                     <Button variant="outline" size="icon" className="w-7 h-7 text-red-700 border-red-700 hover:bg-red-100/50 dark:text-red-500 dark:border-red-500 dark:hover:bg-red-900/30" title="XÓA VĨNH VIỄN" onClick={() => setDialogState({ isOpen: true, action: 'permanentDelete', employee: employee })}>
                                                <XCircle size={14} />
                                     </Button>
                                  )}
                                </>
                              )}
                             </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>)}
              </>
            )}
        </CardContent>

        {/* Dialog Xác nhận */}
        <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogState.action === 'delete' && "Xác nhận ngừng hoạt động?"}
                {dialogState.action === 'reactivate' && "Xác nhận kích hoạt lại?"}
                {dialogState.action === 'permanentDelete' && "Xác nhận XÓA VĨNH VIỄN?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dialogState.action === 'delete' && `Bạn có chắc muốn ngừng hoạt động NV "${dialogState.employee?.name}"?`}
                {dialogState.action === 'reactivate' && `Bạn có chắc muốn kích hoạt lại NV "${dialogState.employee?.name}"?`}
                {dialogState.action === 'permanentDelete' && (
                  <span className="text-red-600 font-medium dark:text-red-400">
                    Hành động này KHÔNG THỂ hoàn tác. NV "${dialogState.employee?.name}" sẽ bị xóa vĩnh viễn (vì không có lịch sử hoạt động).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDialog}>Hủy</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleConfirmAction}
                  variant={ (dialogState.action === 'delete' || dialogState.action === 'permanentDelete') ? "destructive" : "default" }
                >
                  {dialogState.action === 'delete' && "Xác nhận ngừng HĐ"}
                  {dialogState.action === 'reactivate' && "Xác nhận kích hoạt"}
                  {dialogState.action === 'permanentDelete' && "Xóa vĩnh viễn"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
      </Card>
    </div>
  )
}