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
interface BrandResponse { 
  id: number; 
  name: string; 
  description: string;
  imageUrl: string; 
  active: boolean; 
  productCount: number; 
}
interface BrandFormData { 
  name: string; 
  description: string;
  imageUrl: string; 
  active: boolean; 
}

type BrandFormErrors = Partial<Record<keyof BrandFormData, string>>;

interface DialogState {
  isOpen: boolean;
  action: 'delete' | 'reactivate' | 'permanentDelete' | null;
  brand: BrandResponse | null;
}

// --- Component ---
export function BrandManagement() { 
  // --- Lấy user và quyền ---
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  const isAdmin = roles.includes("ADMIN");

  // --- States ---
  const [brands, setBrands] = useState<BrandResponse[]>([]); 
  const [brandPage, setBrandPage] = useState(1); 
  const [totalBrandPages, setTotalBrandPages] = useState(0); 
  // THÊM: State lưu tổng số bản ghi
  const [totalBrands, setTotalBrands] = useState(0); 

  const [brandSearchTerm, setBrandSearchTerm] = useState(""); 
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE"); 

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({ name: "", description: "", imageUrl: "", active: true }); 
  
  // State lỗi
  const [formErrors, setFormErrors] = useState<BrandFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  
  // State dialog
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    action: null,
    brand: null,
  });

  // --- API Fetching ---
  const fetchBrands = useCallback(async () => { 
    setIsFetching(true);
    const query = new URLSearchParams();
    query.append("page", (brandPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "name,asc");
    query.append("status", filterStatus);
    if (brandSearchTerm) query.append("search", brandSearchTerm);

    try {
      const result = await manualFetchApi(`/v1/brands?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        // CẬP NHẬT: Thêm fallback an toàn và setTotalBrands
        setBrands(result.data.content || []); 
        setTotalBrandPages(result.data.totalPages ?? 0); 
        setTotalBrands(result.data.totalElements ?? 0); // <-- Lấy tổng số bản ghi
      } else throw new Error(result.message || "Lỗi tải thương hiệu"); 
    } catch (err: any) { 
      toast.error(`Lỗi tải thương hiệu: ${err.message}`); 
    } 
    finally { setIsFetching(false); }
  }, [brandPage, brandSearchTerm, filterStatus]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]); 

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); 
    setApiError(null);
    setFormErrors({});
    setFormData({ name: "", description: "", imageUrl: "", active: true });
  }

  const validateForm = (): BrandFormErrors => {
    const newErrors: BrandFormErrors = {};
    const name = formData.name.trim();
    if (!name) { 
        newErrors.name = "Tên thương hiệu không được để trống."; 
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
    const url = isEditing ? `/v1/brands/${editingId}` : `/v1/brands`;
    const method = isEditing ? "PUT" : "POST";
    const requestBody = { ...formData, name: formData.name.trim(), imageUrl: formData.imageUrl || null }; 
    
    try {
      const result = await manualFetchApi(url, {
        method: method,
        body: JSON.stringify(requestBody)
      });

      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật thương hiệu thành công!" : "Thêm thương hiệu thành công!");
        resetForm(); 
        fetchBrands(); 
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

  const handleEdit = (brand: BrandResponse) => {
    if (!canEdit) { 
      toast.error("Bạn không có quyền sửa.");
      return;
    }
    setFormData({ 
      name: brand.name, 
      description: brand.description || "", 
      active: brand.active,
      imageUrl: brand.imageUrl || ""
    });
    setEditingId(brand.id); 
    setShowForm(true); 
    setApiError(null);
    setFormErrors({});
  };
  
  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, brand: null });
  };

  const handleConfirmAction = async () => {
    const { action, brand } = dialogState;
    if (!brand) return;

    try {
      // 1. Ngừng hoạt động
      if (action === 'delete') {
        if (!canEdit) { toast.error("Bạn không có quyền."); return; }
        const result = await manualFetchApi(`/v1/brands/${brand.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã ngừng hoạt động thương hiệu và sản phẩm liên quan."); 
          fetchBrands(); 
        } else throw new Error(result.message || "Xóa thất bại");
      }
      
      // 2. Kích hoạt lại
      else if (action === 'reactivate') {
        if (!canEdit) { toast.error("Bạn không có quyền."); return; }
        const url = `/v1/brands/${brand.id}`;
        const requestBody = { 
            name: brand.name, 
            description: brand.description, 
            imageUrl: brand.imageUrl, 
            active: true 
        };
        const result = await manualFetchApi(url, { method: "PUT", body: JSON.stringify(requestBody) });
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại thương hiệu thành công!");
          fetchBrands(); 
        } else throw new Error(result.message || "Kích hoạt thất bại");
      }
      
      // 3. Xóa vĩnh viễn
      else if (action === 'permanentDelete') {
        if (!isAdmin) { toast.error("Bạn không có quyền."); return; }
        const result = await manualFetchApi(`/v1/brands/${brand.id}/permanent`, { method: "DELETE" }); 
        if (result.status === 'SUCCESS') {
          toast.success("Đã xóa vĩnh viễn thương hiệu.");
          fetchBrands();
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
    setBrandPage(1); 
    setBrandSearchTerm(""); 
    setBrands([]); 
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Thương hiệu</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các thương hiệu sản phẩm</p>
        </div>
        {canEdit && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> 
            <Plus size={16} /> Thêm Thương hiệu 
          </Button>
        )}
      </div>

      {/* Lỗi API chung */}
      {apiError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{apiError}</div> )}
      
      {/* Form */}
      {showForm && canEdit && ( 
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa Thương hiệu" : "Thêm Thương hiệu mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            
            <div className="space-y-1.5">
              <Label htmlFor="brandImageUrl" className="block text-sm font-medium text-muted-foreground">Hình ảnh thương hiệu (URL)</Label> 
              <ImageUpload 
                  value={formData.imageUrl || ""} 
                  onChange={(value) => setFormData({ ...formData, imageUrl: value })} 
                  label="" 
                  className="w-24 h-24" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="brandName" className={`text-xs ${formErrors.name ? 'text-destructive' : 'text-muted-foreground'}`}>Tên thương hiệu *</Label>
              <Input 
                id="brandName"
                placeholder="Tên thương hiệu" 
                value={formData.name} 
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                }}
                className={formErrors.name ? "border-destructive" : ""} 
              />
              {formErrors.name && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.name}</p>}
            </div>
            
            <Textarea placeholder="Mô tả (tùy chọn)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[60px]"/>
            
            <div className="flex items-center gap-2">
              <Checkbox id="brandActiveForm" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}/>
              <Label htmlFor="brandActiveForm" className="text-sm">Đang hoạt động</Label>
            </div>
            
            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handleSubmit} className="flex-1">{editingId ? "Cập nhật" : "Lưu"} thương hiệu</Button>
              <Button variant="outline" onClick={resetForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Bảng Danh sách --- */}
      <Card className="shadow-sm">
        <CardHeader>
          {/* CẬP NHẬT: Hiển thị tổng số bản ghi */}
          <CardTitle className="text-xl font-semibold">Danh sách Thương hiệu ({totalBrands})</CardTitle>
          
          <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
              <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
              <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm theo tên thương hiệu..." value={brandSearchTerm} onChange={(e) => { setBrandSearchTerm(e.target.value); setBrandPage(1); }} className="h-9 text-sm"/>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
            brands.length === 0 ? <div className="text-center py-6 text-muted-foreground">{brandSearchTerm ? "Không tìm thấy." : `Không có thương hiệu nào (${filterStatus.toLowerCase()}).`}</div> :
            (
             <>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead className="bg-muted/30">
                     <tr className="border-b">
                       <th className="text-left py-2.5 px-3 font-semibold text-foreground/80 w-[60px]">Ảnh</th> 
                       <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên Thương hiệu</th>
                       <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Số SP</th>
                       <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mô tả</th>
                       <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                       {canEdit && (
                         <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[120px]">Hành động</th>
                       )}
                     </tr>
                   </thead>
                   <tbody>
                     {brands.map((brand) => (
                       <tr key={brand.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!brand.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                         
                         <td className="py-2 px-3">
                           <img 
                             src={brand.imageUrl || "/placeholder.svg"} 
                             alt={brand.name} 
                             className="w-10 h-10 object-contain rounded border"
                             onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                           />
                         </td>
                         <td className="py-2 px-3 font-medium text-foreground">{brand.name}</td>
                         <td className="py-2 px-3 text-muted-foreground text-sm text-center">{brand.productCount}</td>
                         <td className="py-2 px-3 text-muted-foreground text-xs truncate max-w-xs">{brand.description || "-"}</td>
                         <td className="py-2 px-3 text-center">
                           <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${brand.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                             {brand.active ? "Hoạt động" : "Ngừng HĐ"}
                           </span>
                         </td>
                         
                         {canEdit && (
                           <td className="py-2 px-3">
                             <div className="flex gap-1.5 justify-center">
                               <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(brand)}><Edit2 size={14} /></Button>
                               
                               {brand.active ? (
                                 <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => setDialogState({ isOpen: true, action: 'delete', brand: brand })}>
                                   <Trash2 size={14} />
                                 </Button>
                               ) : (
                                 <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => setDialogState({ isOpen: true, action: 'reactivate', brand: brand })}>
                                   <RotateCcw size={14} /> 
                                 </Button>
                               )}

                               {!brand.active && brand.productCount === 0 && isAdmin && ( 
                                 <Button 
                                   variant="outline" 
                                   size="icon" 
                                   className="w-7 h-7 text-red-700 border-red-700 hover:bg-red-100/50 dark:text-red-500 dark:border-red-500 dark:hover:bg-red-900/30" 
                                   title="Xóa vĩnh viễn" 
                                   onClick={() => setDialogState({ isOpen: true, action: 'permanentDelete', brand: brand })}
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
               {totalBrandPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={brandPage} totalPages={totalBrandPages} onPageChange={setBrandPage} /></div>)}
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
                {dialogState.action === 'delete' && `Bạn có chắc muốn ngừng hoạt động "${dialogState.brand?.name}"? TẤT CẢ sản phẩm thuộc thương hiệu này cũng sẽ bị ngừng hoạt động.`}
                {dialogState.action === 'reactivate' && `Bạn có chắc muốn kích hoạt lại "${dialogState.brand?.name}"? (Sản phẩm liên quan SẼ KHÔNG tự động kích hoạt lại).`}
                {dialogState.action === 'permanentDelete' && (
                  <span className="text-red-600 font-medium dark:text-red-400">
                    Hành động này KHÔNG THỂ hoàn tác. Thương hiệu "${dialogState.brand?.name}" sẽ bị xóa vĩnh viễn (vì không còn sản phẩm nào).
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