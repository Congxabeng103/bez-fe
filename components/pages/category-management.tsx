"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, RotateCcw, XCircle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/store/image-upload";
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
interface CategoryResponse { 
  id: number; 
  name: string; 
  description: string;
  imageUrl: string; 
  active: boolean; 
  productCount: number; 
}
interface CategoryFormData { 
  name: string; 
  description: string;
  imageUrl: string; 
  active: boolean; 
}

type CategoryFormErrors = Partial<Record<keyof CategoryFormData, string>>;

interface DialogState {
  isOpen: boolean;
  action: 'delete' | 'reactivate' | 'permanentDelete' | null;
  category: CategoryResponse | null;
}

// --- Component ---
export function CategoryManagement() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  const isAdmin = roles.includes("ADMIN");

  // --- States ---
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [totalCategoryPages, setTotalCategoryPages] = useState(0);
  // THÊM: State lưu tổng số bản ghi
  const [totalCategories, setTotalCategories] = useState(0);

  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE"); 

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ name: "", description: "", imageUrl: "", active: true });
  
  // State lỗi
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  
  // State dialog
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    action: null,
    category: null,
  });

  // --- API Fetching ---
  const fetchCategories = useCallback(async () => {
    setIsFetching(true);
    const query = new URLSearchParams();
    query.append("page", (categoryPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "name,asc");
    query.append("status", filterStatus);
    if (categorySearchTerm) query.append("search", categorySearchTerm);
    
    try {
      const result = await manualFetchApi(`/v1/categories?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        // CẬP NHẬT: Thêm fallback và setTotalCategories
        setCategories(result.data.content || []);
        setTotalCategoryPages(result.data.totalPages ?? 0);
        setTotalCategories(result.data.totalElements ?? 0); // <-- Lấy tổng số bản ghi
      } else throw new Error(result.message || "Lỗi tải danh mục");
    } catch (err: any) { 
      toast.error(`Lỗi tải danh mục: ${err.message}`); 
    }
    finally { setIsFetching(false); }
  }, [categoryPage, categorySearchTerm, filterStatus]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); 
    setApiError(null);
    setFormErrors({});
    setFormData({ name: "", description: "", imageUrl: "", active: true });
  }

  const validateForm = (): CategoryFormErrors => {
    const newErrors: CategoryFormErrors = {};
    const name = formData.name.trim();
    if (!name) { 
        newErrors.name = "Tên danh mục không được để trống."; 
    } else if (name.length < 3) { 
        newErrors.name = "Tên danh mục phải có ít nhất 3 ký tự."; 
    }
    return newErrors;
  }

  const handleSubmit = async () => {
    if (!canEdit) { 
      toast.error("Bạn không có quyền thực hiện hành động này.");
      return;
    }
    
    setApiError(null);
    const newErrors = validateForm();
    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin.");
      return;
    }
    
    const isEditing = !!editingId;
    const url = isEditing ? `/v1/categories/${editingId}` : `/v1/categories`;
    const method = isEditing ? "PUT" : "POST";
    const requestBody = { ...formData, name: formData.name.trim(), imageUrl: formData.imageUrl || null }; 
    
    try {
      const result = await manualFetchApi(url, {
        method: method,
        body: JSON.stringify(requestBody)
      });

      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật danh mục thành công!" : "Thêm danh mục thành công!");
        resetForm(); 
        fetchCategories(); 
      } else {
        throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
      }
    } catch (err: any) { 
      if (err.message && (err.message.toLowerCase().includes("đã tồn tại") || err.message.toLowerCase().includes("duplicate"))) { 
        setFormErrors({ name: err.message });
        toast.error(err.message);
      } else {
        toast.error(`Lỗi: ${err.message}`); 
        setApiError(err.message);
      }
    }
  };

  const handleEdit = (category: CategoryResponse) => {
    if (!canEdit) { 
      toast.error("Bạn không có quyền sửa.");
      return;
    }
    setFormData({ 
      name: category.name, 
      description: category.description || "", 
      active: category.active, 
      imageUrl: category.imageUrl || ""
    });
    setEditingId(category.id); 
    setShowForm(true); 
    setApiError(null);
    setFormErrors({});
  };
  
  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, category: null });
  };

  const handleConfirmAction = async () => {
    const { action, category } = dialogState;
    if (!category) return;

    try {
      // 1. Ngừng hoạt động
      if (action === 'delete') {
        if (!canEdit) { toast.error("Bạn không có quyền."); return; }
        const result = await manualFetchApi(`/v1/categories/${category.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã ngừng hoạt động danh mục và sản phẩm liên quan."); 
          fetchCategories(); 
        } else throw new Error(result.message || "Xóa thất bại");
      }
      
      // 2. Kích hoạt lại
      else if (action === 'reactivate') {
        if (!canEdit) { toast.error("Bạn không có quyền."); return; }
        const url = `/v1/categories/${category.id}`;
        const requestBody = { 
            name: category.name, 
            description: category.description, 
            imageUrl: category.imageUrl, 
            active: true 
        };
        const result = await manualFetchApi(url, { method: "PUT", body: JSON.stringify(requestBody) });
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại danh mục thành công!");
          fetchCategories(); 
        } else throw new Error(result.message || "Kích hoạt thất bại");
      }
      
      // 3. Xóa vĩnh viễn
      else if (action === 'permanentDelete') {
        if (!isAdmin) { toast.error("Bạn không có quyền."); return; }
        const result = await manualFetchApi(`/v1/categories/${category.id}/permanent`, { method: "DELETE" }); 
        if (result.status === 'SUCCESS') {
          toast.success("Đã xóa vĩnh viễn danh mục.");
          fetchCategories();
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
    setCategoryPage(1); 
    setCategorySearchTerm(""); 
    setCategories([]); 
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Danh mục</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các danh mục sản phẩm</p>
        </div>
        {canEdit && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> 
            <Plus size={16} /> Thêm Danh mục 
          </Button>
        )}
      </div>

      {/* Lỗi API chung */}
      {apiError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{apiError}</div> )}
      
      {/* Form */}
      {showForm && canEdit && ( 
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            
          <div className="space-y-1.5">
                <Label htmlFor="categoryImageUrl" className="block text-sm font-medium text-muted-foreground">
                    Hình ảnh danh mục (URL)
                </Label> 
                <ImageUpload 
                    value={formData.imageUrl || ""} 
                    onChange={(value) => setFormData({ ...formData, imageUrl: value })} 
                    label="" 
                    className="w-24 h-24" 
                />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="categoryName" className={`text-xs ${formErrors.name ? 'text-destructive' : 'text-muted-foreground'}`}>Tên danh mục *</Label>
              <Input 
                id="categoryName"
                placeholder="Tên danh mục" 
                value={formData.name} 
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                }}
                className={`mt-1.5 ${formErrors.name ? "border-destructive" : ""}`} 
              />
              {formErrors.name && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.name}</p>}
            </div>
            
            <Textarea placeholder="Mô tả (tùy chọn)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[60px]"/>
            
            <div className="flex items-center gap-2">
              <Checkbox id="categoryActiveForm" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}/>
              <Label htmlFor="categoryActiveForm" className="text-sm">Đang hoạt động</Label>
            </div>
            
            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handleSubmit} className="flex-1">{editingId ? "Cập nhật" : "Lưu"} danh mục</Button>
              <Button variant="outline" onClick={resetForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Bảng Danh sách --- */}
      <Card className="shadow-sm">
        <CardHeader>
          {/* CẬP NHẬT: Hiển thị số lượng bản ghi */}
          <CardTitle className="text-xl font-semibold">Danh sách Danh mục ({totalCategories})</CardTitle>
          <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
              <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
              <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm theo tên danh mục..." value={categorySearchTerm} onChange={(e) => { setCategorySearchTerm(e.target.value); setCategoryPage(1); }} className="h-9 text-sm"/>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
            categories.length === 0 ? <div className="text-center py-6 text-muted-foreground">{categorySearchTerm ? "Không tìm thấy." : `Không có danh mục nào (${filterStatus.toLowerCase()}).`}</div> :
            (
             <>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead className="bg-muted/30">
                     <tr className="border-b">
                       <th className="text-left py-2.5 px-3 font-semibold text-foreground/80 w-[60px]">Ảnh</th> 
                       <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên Danh mục</th>
                       <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Số SP</th>
                       <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mô tả</th>
                       <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                       {canEdit && (
                         <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[120px]">Hành động</th>
                       )}
                     </tr>
                   </thead>
                   <tbody>
                     {categories.map((cat) => (
                       <tr key={cat.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!cat.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                         
                         <td className="py-2 px-3">
                           <img 
                             src={cat.imageUrl || "/placeholder.svg"} 
                             alt={cat.name} 
                             className="w-10 h-10 object-contain rounded border"
                             onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                           />
                         </td>
                         <td className="py-2 px-3 font-medium text-foreground">{cat.name}</td>
                         <td className="py-2 px-3 text-muted-foreground text-sm text-center">{cat.productCount}</td>
                         <td className="py-2 px-3 text-muted-foreground text-xs truncate max-w-xs">{cat.description || "-"}</td>
                         <td className="py-2 px-3 text-center">
                           <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cat.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                             {cat.active ? "Hoạt động" : "Ngừng HĐ"}
                           </span>
                         </td>
                         
                         {canEdit && (
                           <td className="py-2 px-3">
                             <div className="flex gap-1.5 justify-center">
                               <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(cat)}><Edit2 size={14} /></Button>
                               
                               {cat.active ? (
                                 <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => setDialogState({ isOpen: true, action: 'delete', category: cat })}>
                                   <Trash2 size={14} />
                                 </Button>
                               ) : (
                                 <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => setDialogState({ isOpen: true, action: 'reactivate', category: cat })}>
                                   <RotateCcw size={14} /> 
                                 </Button>
                               )}

                               {!cat.active && cat.productCount === 0 && isAdmin && ( 
                                 <Button 
                                   variant="outline" 
                                   size="icon" 
                                   className="w-7 h-7 text-red-700 border-red-700 hover:bg-red-100/50 dark:text-red-500 dark:border-red-500 dark:hover:bg-red-900/30" 
                                   title="Xóa vĩnh viễn" 
                                   onClick={() => setDialogState({ isOpen: true, action: 'permanentDelete', category: cat })}
                                 >
                                   <XCircle size={14} /> 
                                 </Button>
                               )}
                             </div>
                           </td>
                         )}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               {totalCategoryPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={categoryPage} totalPages={totalCategoryPages} onPageChange={setCategoryPage} /></div>)}
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
                {dialogState.action === 'delete' && `Bạn có chắc muốn ngừng hoạt động "${dialogState.category?.name}"? TẤT CẢ sản phẩm thuộc danh mục này cũng sẽ bị ngừng hoạt động.`}
                {dialogState.action === 'reactivate' && `Bạn có chắc muốn kích hoạt lại "${dialogState.category?.name}"? (Sản phẩm liên quan SẼ KHÔNG tự động kích hoạt lại).`}
                {dialogState.action === 'permanentDelete' && (
                  <span className="text-red-600 font-medium dark:text-red-400">
                    Hành động này KHÔNG THỂ hoàn tác. Danh mục "${dialogState.category?.name}" sẽ bị xóa vĩnh viễn (vì không còn sản phẩm nào).
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