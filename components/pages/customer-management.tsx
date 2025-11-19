"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, RotateCcw, Mail, Phone, XCircle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
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
interface CustomerResponse {
  id: number;
  name: string; // Full Name
  firstName: string; 
  lastName: string;
  email: string;
  phone: string | null;
  totalOrders: number; // <-- Dùng để kiểm tra xóa
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

type CustomerFormErrors = Partial<Record<keyof CustomerFormData, string>>;

interface DialogState {
  isOpen: boolean;
  action: 'delete' | 'reactivate' | 'permanentDelete' | null;
  customer: CustomerResponse | null;
}

// --- Component ---
export function CustomerManagement() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isAdmin = roles.includes("ADMIN");
  
  // --- States ---
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // THÊM: State lưu tổng số bản ghi
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: "", lastName: "", email: "", password: "", phone: null, active: true
  });
  
  // State lỗi
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // State dialog
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    action: null,
    customer: null,
  });

  // --- API Fetching ---
  const fetchCustomers = useCallback(async () => {
    setIsFetching(true);
    
    const query = new URLSearchParams();
    query.append("page", (currentPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "createdAt,desc");
    query.append("status", filterStatus);
    if (searchTerm) query.append("search", searchTerm);
    
    try {
      const result = await manualFetchApi(`/v1/users/customers?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        // CẬP NHẬT: Thêm fallback và setTotalCustomers
        setCustomers(result.data.content || []);
        setTotalPages(result.data.totalPages ?? 0);
        setTotalCustomers(result.data.totalElements ?? 0); // <-- Lấy tổng số bản ghi
      } else throw new Error(result.message || "Lỗi tải khách hàng");
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
    finally { setIsFetching(false); }
  }, [currentPage, searchTerm, filterStatus]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); 
    setApiError(null);
    setFormErrors({});
    setFormData({ firstName: "", lastName: "", email: "", password: "", phone: null, active: true });
  }

  // Hàm Validate
  const validateForm = (): CustomerFormErrors => {
    const newErrors: CustomerFormErrors = {};
    const { firstName, lastName, email, password } = formData;

    if (!firstName.trim()) newErrors.firstName = "Tên là bắt buộc.";
    if (!lastName.trim()) newErrors.lastName = "Họ (và tên đệm) là bắt buộc.";
    
    if (!email.trim()) {
        newErrors.email = "Email không được để trống.";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim())) {
        newErrors.email = "Địa chỉ email không hợp lệ.";
    }

    if (!editingId) {
        if (!password || password.length < 6) {
            newErrors.password = "Mật khẩu (tối thiểu 6 ký tự) là bắt buộc.";
        }
    }
    return newErrors;
  }
  
  const handleSubmit = async () => {
    setApiError(null);
    setFormErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      toast.error("Vui lòng kiểm tra lại các trường có lỗi.");
      return;
    }

    const isEditing = !!editingId;
    let url = "";
    let method = "";
    let requestBody: any = {};

    if (isEditing) {
        if (!isAdmin) { toast.error("Bạn không có quyền sửa."); return; }
        
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
        url = `/v1/auth/register`; 
        method = "POST";
        requestBody = { 
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
        };
    }

    try {
      const result = await manualFetchApi(url, { 
        method, 
        body: JSON.stringify(requestBody) 
      });

      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật khách hàng thành công!" : "Thêm khách hàng thành công! (Cần kích hoạt email)");
        resetForm();
        fetchCustomers();
      } else {
        throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Tạo thất bại"));
      }
      
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("đã tồn tại") || err.message.toLowerCase().includes("duplicate"))) {
          setFormErrors({ email: err.message });
          toast.error(err.message);
      } else {
          toast.error(`Lỗi: ${err.message}`);
          setApiError(err.message);
      }
    }
  };

  const handleEdit = (customer: CustomerResponse) => {
    if (!isAdmin) {
      toast.error("Bạn không có quyền sửa.");
      return;
    }
    
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
        password: "" 
    });
    setEditingId(customer.id);
    setShowForm(true);
    setApiError(null);
    setFormErrors({});
  };

  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, customer: null });
  };

  const handleConfirmAction = async () => {
    const { action, customer } = dialogState;
    if (!customer || !isAdmin) { toast.error("Hành động không hợp lệ."); closeDialog(); return; };

    try {
      if (action === 'delete') {
        const result = await manualFetchApi(`/v1/users/${customer.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã ngừng hoạt động khách hàng.");
          fetchCustomers();
        } else throw new Error(result.message || "Ngừng hoạt động thất bại");
      } 
      
      else if (action === 'reactivate') {
        const url = `/v1/users/${customer.id}`;
        
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
            firstName: firstName, lastName: lastName,
            email: customer.email, phone: customer.phone,
            active: true 
        };
        const result = await manualFetchApi(url, { method: "PUT", body: JSON.stringify(requestBody) });
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại thành công!");
          fetchCustomers();
        } else throw new Error(result.message || "Kích hoạt thất bại");
      } 
      
      else if (action === 'permanentDelete') {
        const result = await manualFetchApi(`/v1/users/permanent-delete/${customer.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã xóa vĩnh viễn khách hàng.");
          fetchCustomers();
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
        {isAdmin && (
          <Button onClick={() => { resetForm(); setShowForm(true); setEditingId(null); }} className="gap-1.5 self-end sm:self-center" size="sm">
            <Plus size={16} /> Thêm Khách Hàng
          </Button>
        )}
      </div>

      {/* Lỗi API chung */}
      {apiError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{apiError}</div> )}
      
      {/* Form */}
      {showForm && isAdmin && (
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastName" className={`text-xs ${formErrors.lastName ? 'text-destructive' : 'text-muted-foreground'}`}>Họ (và tên đệm) *</Label>
                <Input id="lastName" placeholder="Vd: Đỗ Thành" value={formData.lastName || ""} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={`mt-1.5 ${formErrors.lastName ? 'border-destructive' : ''}`}/>
                {formErrors.lastName && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.lastName}</p>}
              </div>
              <div>
                <Label htmlFor="firstName" className={`text-xs ${formErrors.firstName ? 'text-destructive' : 'text-muted-foreground'}`}>Tên *</Label>
                <Input id="firstName" placeholder="Vd: Công" value={formData.firstName || ""} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={`mt-1.5 ${formErrors.firstName ? 'border-destructive' : ''}`}/>
                {formErrors.firstName && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.firstName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <Label htmlFor="email" className={`text-xs ${formErrors.email ? 'text-destructive' : 'text-muted-foreground'}`}>Email *</Label>
                <Input id="email" placeholder="Email" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`mt-1.5 ${formErrors.email ? 'border-destructive' : ''}`}/>
                {formErrors.email && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.email}</p>}
               </div>
               <div>
                <Label htmlFor="phone" className="text-xs text-muted-foreground">Số điện thoại</Label>
                <Input id="phone" placeholder="Số điện thoại (tùy chọn)" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1.5" disabled={!editingId} />
                {!editingId && <p className="text-xs text-muted-foreground mt-1.5">SĐT chỉ có thể thêm khi sửa.</p>}
               </div>
            </div>

            {!editingId && (
               <div>
                <Label htmlFor="passwordInput" className={`text-xs ${formErrors.password ? 'text-destructive' : 'text-muted-foreground'}`}>Mật khẩu * (Ít nhất 6 ký tự)</Label>
                <Input
                  id="passwordInput" type="password" placeholder="Nhập mật khẩu"
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`mt-1 ${formErrors.password ? 'border-destructive' : ''}`}
                />
                {formErrors.password && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.password}</p>}
               </div>
            )}

            {editingId && (
                <div className="flex items-center gap-2">
                 <Checkbox
                   id="customerActiveForm"
                   checked={formData.active}
                   onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}
                 />
                 <Label htmlFor="customerActiveForm" className="text-sm">Đang hoạt động</Label>
                </div>
            )}

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
          {/* CẬP NHẬT: Hiển thị tổng số bản ghi */}
          <CardTitle className="text-xl font-semibold">Danh sách khách hàng ({totalCustomers})</CardTitle>
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
                        {isAdmin && (
                          <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                        )}
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
                          {isAdmin && (
                            <td className="py-2 px-3">
                              <div className="flex gap-1.5 justify-center">
                                <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(customer)}><Edit2 size={14} /></Button>
                                {customer.active ? (
                                  <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => setDialogState({ isOpen: true, action: 'delete', customer: customer })}>
                                    <Trash2 size={14} />
                                  </Button>
                                ) : (
                                  <>
                                    <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => setDialogState({ isOpen: true, action: 'reactivate', customer: customer })}>
                                      <RotateCcw size={14} /> 
                                    </Button>
                                    
                                    {customer.totalOrders === 0 && (
                                       <Button variant="outline" size="icon" className="w-7 h-7 text-red-700 border-red-700 hover:bg-red-100/50 dark:text-red-500 dark:border-red-500 dark:hover:bg-red-900/30" title="XÓA VĨNH VIỄN" onClick={() => setDialogState({ isOpen: true, action: 'permanentDelete', customer: customer })}>
                                              <XCircle size={14} />
                                       </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
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
                {dialogState.action === 'delete' && `Bạn có chắc muốn ngừng hoạt động KH "${dialogState.customer?.name}"?`}
                {dialogState.action === 'reactivate' && `Bạn có chắc muốn kích hoạt lại KH "${dialogState.customer?.name}"?`}
                {dialogState.action === 'permanentDelete' && (
                  <span className="text-red-600 font-medium dark:text-red-400">
                    Hành động này KHÔNG THỂ hoàn tác. KH "${dialogState.customer?.name}" sẽ bị xóa vĩnh viễn (vì chưa có đơn hàng nào).
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