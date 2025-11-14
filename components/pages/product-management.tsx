"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Search, RotateCcw, AlertTriangle, X, GripVertical, XCircle } from "lucide-react"; // <-- THÊM XCircle
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { ImageUpload } from "@/components/store/image-upload";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { manualFetchApi } from "@/lib/api";
// THÊM: Import Alert Dialog
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
const CLEAR_SELECTION_VALUE = "__CLEAR__"; 

// --- Interfaces (Đã chuẩn) ---
interface ProductResponse {
  id: number; 
  name: string; 
  description: string; 
  price: number; 
  imageUrl: string;
  categoryId: number | null; 
  categoryName: string;
  brandId: number | null; 
  brandName: string; 
  promotionId: number | null; 
  promotionName: string | null;
  salePrice: number | null; 
  createdAt: string;
  active: boolean;
  isCategoryActive?: boolean | null; 
  isBrandActive?: boolean | null;
  isPromotionStillValid?: boolean | null;
  variantCount: number;
}
interface Category { id: number; name: string; } 
interface Brand { id: number; name: string; }
interface PromotionBrief { id: number; name: string; }

interface OptionValueForm {
  tempId: string;
  value: string;
}
interface OptionForm {
  tempId: string;
  name: string;
  values: OptionValueForm[];
  newValueInput: string; 
}
interface ProductFormData {
  name: string; 
  description: string; 
  imageUrl: string;
  categoryId: string; 
  brandId: string; 
  promotionId: string;
  active: boolean;
  options: OptionForm[]; 
}

interface ProductOptionValueResponse { id: number; value: string; }
interface ProductOptionResponse { id: number; name: string; values: ProductOptionValueResponse[]; }
interface ProductDetailResponse {
  product: ProductResponse;
  relatedProducts: ProductResponse[];
  attributes: ProductOptionResponse[];
}

// Kiểu cho state lỗi
type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>;

// Kiểu cho state của Dialog
interface DialogState {
  isOpen: boolean;
  action: 'delete' | 'reactivate' | 'permanentDelete' | null;
  product: ProductResponse | null;
}

// --- Component ---
export function ProductManagement() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  const isAdmin = roles.includes("ADMIN");

  // --- States ---
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "", description: "", imageUrl: "", 
    categoryId: "", brandId: "", promotionId: "", 
    active: true,
    options: [], 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotionsBrief, setPromotionsBrief] = useState<PromotionBrief[]>([]);
  const [isLoadingSelectData, setIsLoadingSelectData] = useState(false);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  
  // === SỬA: State lỗi (Inline validation) ===
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // === THÊM: State quản lý dialog xác nhận ===
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    action: null,
    product: null,
  });
  
  // --- API Fetching ---
  const fetchProducts = useCallback(async () => {
    setIsLoading(true); setApiError(null);
    const query = new URLSearchParams();
    query.append("page", (currentPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "createdAt,desc");
    query.append("status", filterStatus);
    if (searchTerm) query.append("search", searchTerm);
    
    try {
      // (Giả sử public, không cần token)
      const result = await manualFetchApi(`/v1/products?${query.toString()}`, {
          headers: { 'Authorization': '' } 
      });
      if (result.status === 'SUCCESS' && result.data) {
        setProducts(result.data.content); setTotalPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải sản phẩm");
    } catch (err: any) { 
      setApiError(err.message); 
      toast.error(`Lỗi tải sản phẩm: ${err.message}`); 
    }
    finally { setIsLoading(false); }
  }, [currentPage, searchTerm, filterStatus]);

  const fetchSelectData = useCallback(async () => {
    setIsLoadingSelectData(true);
    let cats: Category[] = [];
    let brs: Brand[] = [];
    let promos: PromotionBrief[] = [];
    try {
      const [catResult, brandResult, promoResult] = await Promise.all([
        manualFetchApi("/v1/categories/all-brief"),
        manualFetchApi("/v1/brands/all-brief"),
        manualFetchApi("/v1/promotions/brief")
      ]);
      
      if (catResult.status === 'SUCCESS') cats = catResult.data || []; 
      else console.error("Lỗi tải danh mục:", catResult.message);
      if (brandResult.status === 'SUCCESS') brs = brandResult.data || []; 
      else console.error("Lỗi tải thương hiệu:", brandResult.message);
      if (promoResult.status === 'SUCCESS') promos = promoResult.data || []; 
      else console.error("Lỗi tải khuyến mãi:", promoResult.message);
      
      setCategories(cats);
      setBrands(brs);
      setPromotionsBrief(promos);
      return { cats, brs, promos }; 
    } catch (err: any) { 
        toast.error("Lỗi tải dữ liệu cho form."); console.error(err); 
        return { cats: [], brs: [], promos: [] }; 
    }
    finally { setIsLoadingSelectData(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { 
    if (showForm && !editingId) {
        fetchSelectData(); 
    }
  }, [showForm, editingId, fetchSelectData]);
  
  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFormWarning(null); 
    setApiError(null); // <-- SỬA
    setFormErrors({}); // <-- SỬA
    setFormData({ 
      name: "", description: "", imageUrl: "", 
      categoryId: "", brandId: "", promotionId: "", 
      active: true,
      options: []
    });
  }

  // (Các hàm Option... giữ nguyên)
  const handleAddOption = () => {
    if (formData.options.length >= 3) { toast.warning("Chỉ nên tạo tối đa 3 thuộc tính."); return; }
    setFormData(prev => ({ ...prev, options: [ ...prev.options, { tempId: Math.random().toString(), name: "", values: [], newValueInput: "" } ] }));
  };
  const handleRemoveOption = (tempId: string) => {
    setFormData(prev => ({ ...prev, options: prev.options.filter(opt => opt.tempId !== tempId) }));
  };
  const handleOptionNameChange = (tempId: string, name: string) => {
    setFormData(prev => ({ ...prev, options: prev.options.map(opt => opt.tempId === tempId ? { ...opt, name: name } : opt ) }));
  };
  const handleOptionNewValueChange = (tempId: string, value: string) => {
    setFormData(prev => ({ ...prev, options: prev.options.map(opt => opt.tempId === tempId ? { ...opt, newValueInput: value } : opt ) }));
  };
  const handleAddValueToOption = (tempId: string) => {
    const option = formData.options.find(opt => opt.tempId === tempId);
    if (!option || !option.newValueInput.trim()) return;
    const newValue = option.newValueInput.trim();
    if (option.values.some(val => val.value.toLowerCase() === newValue.toLowerCase())) { toast.error("Giá trị này đã tồn tại."); return; }
    setFormData(prev => ({ ...prev, options: prev.options.map(opt => opt.tempId === tempId ? { ...opt, values: [ ...opt.values, { tempId: Math.random().toString(), value: newValue } ], newValueInput: "" } : opt ) }));
  };
  const handleRemoveValueFromOption = (optionTempId: string, valueTempId: string) => {
    setFormData(prev => ({ ...prev, options: prev.options.map(opt => opt.tempId === optionTempId ? { ...opt, values: opt.values.filter(val => val.tempId !== valueTempId) } : opt ) }));
  };
  // (Kết thúc hàm Option)

  // === SỬA: handleSubmit (Tích hợp Inline Validation) ===
  const handleSubmit = async () => {
    if (!canEdit) { toast.error("Bạn không có quyền."); return; }
    
    setApiError(null);
    
    // --- VALIDATE ---
    const newErrors: ProductFormErrors = {};
    const name = formData.name.trim();
    const categoryId = formData.categoryId;
    if (!name) { newErrors.name = "Tên sản phẩm là bắt buộc."; } 
    else if (name.length < 3) { newErrors.name = "Tên sản phẩm phải có ít nhất 3 ký tự."; }
    if (!categoryId) { newErrors.categoryId = "Vui lòng chọn danh mục."; }
    
    let optionError = false;
    if (formData.options.length > 0) {
      for (const opt of formData.options) {
        if (!opt.name.trim()) { optionError = true; toast.error("Tên thuộc tính không được để trống."); break; }
        if (opt.values.length === 0) { optionError = true; toast.error(`Thuộc tính "${opt.name}" phải có ít nhất 1 giá trị.`); break; }
        for (const val of opt.values) {
          if (!val.value.trim()) { optionError = true; toast.error(`Giá trị của thuộc tính "${opt.name}" không được để trống.`); break; }
        }
        if (optionError) break;
      }
    }
    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || optionError) {
      if (!optionError) toast.error("Vui lòng kiểm tra lại thông tin trong form.");
      return;
    }
    // --- HẾT VALIDATE ---

    const isEditing = !!editingId;
    const url = isEditing ? `/v1/products/${editingId}` : `/v1/products`;
    const method = isEditing ? "PUT" : "POST";

    const optionsForApi = formData.options
      .filter(opt => opt.name.trim() && opt.values.length > 0)
      .map(opt => ({
        name: opt.name.trim(),
        values: opt.values
          .filter(val => val.value.trim())
          .map(val => ({ value: val.value.trim() }))
      }));

    const requestBody = {
      name: name, 
      description: formData.description.trim(),
      imageUrl: formData.imageUrl || null,
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      brandId: formData.brandId ? Number(formData.brandId) : null,
      promotionId: formData.promotionId ? Number(formData.promotionId) : null,
      active: formData.active,
      options: optionsForApi, 
    };

    try {
      const result = await manualFetchApi(url, { 
        method, 
        body: JSON.stringify(requestBody) 
      });
      
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật thành công!" : "Thêm thành công!");
        resetForm(); 
        fetchProducts(); 
      } else {
        throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
      }
    } catch (err: any) { 
      // === SỬA: Gán lỗi vào đúng ô Name ===
      if (err.message && (err.message.toLowerCase().includes("đã tồn tại") || err.message.toLowerCase().includes("duplicate"))) { 
        setFormErrors({ name: err.message });
        toast.error(err.message);
      } else {
        toast.error(`Thao tác thất bại: ${err.message}`); 
        setApiError(err.message); // Lỗi API chung
      }
    }
  };

  // handleEdit (Đã cập nhật reset lỗi)
  const handleEdit = async (product: ProductResponse) => {
    if (!canEdit) { toast.error("Bạn không có quyền sửa."); return; }
    
    setEditingId(product.id);
    setShowForm(true);
    setIsLoading(true); 
    setFormWarning(null);
    setApiError(null);
    setFormErrors({});

    try {
      const { cats, brs, promos } = await fetchSelectData(); 
      
      const detailResult = await manualFetchApi(`/v1/products/detail/${product.id}`);
      if (detailResult.status !== 'SUCCESS') throw new Error(detailResult.message);
      
      const detail: ProductDetailResponse = detailResult.data;

      const optionsFromApi: OptionForm[] = detail.attributes.map(attr => ({
        tempId: Math.random().toString(),
        name: attr.name,
        newValueInput: "", 
        values: attr.values.map(val => ({
          tempId: Math.random().toString(),
          value: val.value
        }))
      }));

      setFormData({
        name: detail.product.name,
        description: detail.product.description || "",
        imageUrl: detail.product.imageUrl || "",
        categoryId: detail.product.categoryId ? String(detail.product.categoryId) : "",
        brandId: detail.product.brandId ? String(detail.product.brandId) : "",
        promotionId: detail.product.promotionId ? String(detail.product.promotionId) : "",
        active: detail.product.active,
        options: optionsFromApi 
      });

      let warning = null;
      if (product.categoryId && !cats.some(c => c.id === product.categoryId)) {
          warning = `Danh mục cũ "${product.categoryName}" đã ngừng hoạt động. Vui lòng chọn một danh mục mới.`;
      } else if (product.brandId && !brs.some(b => b.id === product.brandId)) {
          warning = `Thương hiệu cũ "${product.brandName}" đã ngừng hoạt động. Vui lòng chọn một thương hiệu mới.`;
      } else if (product.promotionId && !promos.some(p => p.id === product.promotionId)) {
          warning = `Khuyến mãi cũ "${product.promotionName}" đã ngừng hoạt động/hết hạn. Vui lòng chọn KM khác hoặc bỏ trống.`;
      }
      setFormWarning(warning);

    } catch (err: any) {
      toast.error(`Lỗi khi mở form sửa: ${err.message}`);
      resetForm(); 
    } finally {
      setIsLoading(false);
    }
  };

  // === THAY THẾ: Logic Dialog (Thay cho handleDelete, handlePermanentDelete, handleReactivate) ===
  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, product: null });
  };
  
  const handleConfirmAction = async () => {
    const { action, product } = dialogState;
    if (!product) return;

    try {
      // 1. Logic cho "Ngừng hoạt động"
      if (action === 'delete') {
        if (!canEdit) { toast.error("Bạn không có quyền."); return; }
        const result = await manualFetchApi(`/v1/products/${product.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã ngừng hoạt động sản phẩm (và các biến thể liên quan).");
          fetchProducts(); 
        } else throw new Error(result.message || "Xóa thất bại");
      }
      
      // 2. Logic cho "Kích hoạt lại"
      else if (action === 'reactivate') {
        if (!canEdit) { toast.error("Bạn không có quyền."); return; }
        
        // (Kiểm tra logic Category Active giống như hàm cũ của bạn)
        let localCategories = categories;
        if (categories.length === 0) {
          const { cats } = await fetchSelectData();
          localCategories = cats;
        }
        const isCategoryActive = product.categoryId && localCategories.some(c => c.id === product.categoryId);
        if (!isCategoryActive) {
            toast.error(`Không thể kích hoạt: Danh mục "${product.categoryName}" đã ngừng hoạt động.`);
            handleEdit(product); 
            return; 
        }
        
        const url = `/v1/products/${product.id}`;
        const requestBody = { 
            name: product.name, description: product.description, imageUrl: product.imageUrl, 
            categoryId: product.categoryId, brandId: product.brandId,
            promotionId: product.promotionId, active: true 
        };
        const result = await manualFetchApi(url, { method: "PUT", body: JSON.stringify(requestBody) });
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại thành công!");
          fetchProducts(); 
        } else throw new Error(result.message || "Kích hoạt thất bại");
      }
      
      // 3. Logic cho "Xóa vĩnh viễn"
      else if (action === 'permanentDelete') {
        if (!isAdmin) { toast.error("Bạn không có quyền."); return; }
        // Backend sẽ kiểm tra (variantCount > 0)
        const result = await manualFetchApi(`/v1/products/${product.id}/permanent`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã xóa vĩnh viễn sản phẩm.");
          fetchProducts();
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
    setProducts([]);
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div> <h1 className="text-2xl sm:text-3xl font-bold">Quản lý sản phẩm</h1> <p className="text-sm text-muted-foreground mt-1">Quản lý sản phẩm và các thuộc tính của chúng</p> </div>
        {canEdit && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> 
            <Plus size={16} /> Thêm sản phẩm 
          </Button>
        )}
      </div>
      
      {/* Ẩn Form Thêm/Sửa nếu là STAFF */}
      {showForm && canEdit && (
        <Card className="border-primary/50 shadow-md animate-fade-in">
          <CardHeader> <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</CardTitle> </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Lỗi API chung */}
            {apiError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{apiError}</div> )}
            
            {formWarning && (
              <div className="flex items-start gap-3 p-3 border border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 text-sm rounded-md">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <p className="flex-1"><strong>Cảnh báo:</strong> {formWarning}</p>
              </div>
            )}
            
            {/* 1. Thông tin cơ bản (Đã cập nhật Inline Validation) */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">1. Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload value={formData.imageUrl || ""} onChange={(value) => setFormData({ ...formData, imageUrl: value })} label="Hình ảnh sản phẩm (URL)"/>
                
                <div className="space-y-1.5"> 
                  <Label htmlFor="productName" className={`text-xs ${formErrors.name ? 'text-destructive' : 'text-muted-foreground'}`}>Tên sản phẩm *</Label>
                  <Input 
                    id="productName"
                    placeholder="Tên sản phẩm" 
                    value={formData.name} 
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined })); 
                    }}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.name}</p>} 
                </div>
                
                <Textarea placeholder="Mô tả sản phẩm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}/>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Select */}
                  <div className="space-y-1.5"> 
                    <Label htmlFor="categorySelect" className={`text-xs ${formErrors.categoryId ? 'text-destructive' : 'text-muted-foreground'}`}>
                      Danh mục * (Chỉ hiện mục active)
                    </Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, categoryId: value });
                        if (formErrors.categoryId) setFormErrors(prev => ({ ...prev, categoryId: undefined }));
                      }}
                    >
                      <SelectTrigger id="categorySelect" className={`mt-1 ${formErrors.categoryId ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>{isLoadingSelectData ? <div className="p-2 text-sm text-center">Đang tải...</div> : 
                        categories.map(cat => (<SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>))
                      }{!isLoadingSelectData && categories.length === 0 && <div className="p-2 text-sm text-center">Không có DL</div>}</SelectContent>
                    </Select>
                    {formErrors.categoryId && <p className="text-xs text-destructive mt-1.5 animate-shake">{formErrors.categoryId}</p>} 
                  </div>
                  
                  {/* Brand Select */}
                  <div>
                    <Label htmlFor="brandSelect" className="text-xs text-muted-foreground">Thương hiệu (Chỉ hiện mục active)</Label>
                    <Select 
                      value={formData.brandId} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, brandId: value === CLEAR_SELECTION_VALUE ? "" : value });
                      }}
                    >
                      <SelectTrigger id="brandSelect" className="mt-1"><SelectValue placeholder="Chọn thương hiệu (Tùy chọn)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CLEAR_SELECTION_VALUE}>-- Không chọn thương hiệu --</SelectItem>
                        {isLoadingSelectData && <div className="p-2 text-sm text-center">Đang tải...</div>}
                        {!isLoadingSelectData && 
                          brands.map(brand => (<SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Promotion Select */}
                <div>
                  <Label htmlFor="promotionSelect" className="text-xs text-muted-foreground">Khuyến mãi áp dụng (Chỉ hiện mục active)</Label>
                  <Select 
                    value={formData.promotionId} 
                    onValueChange={(value) => {
                      setFormData({ ...formData, promotionId: value === CLEAR_SELECTION_VALUE ? "" : value });
                    }}
                  >
                    <SelectTrigger id="promotionSelect" className="mt-1"><SelectValue placeholder="-- Không áp dụng KM --" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={CLEAR_SELECTION_VALUE}>-- Không áp dụng KM --</SelectItem>
                        {isLoadingSelectData && <div className="p-2 text-sm text-center">Đang tải...</div>}
                        {!isLoadingSelectData &&
                          promotionsBrief.map(promo => ( <SelectItem key={promo.id} value={String(promo.id)}>{promo.name}</SelectItem> ))
                        }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                    <Checkbox id="productActiveForm" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}/>
                    <Label htmlFor="productActiveForm" className="text-sm">Đang hoạt động</Label>
                </div>
              </CardContent>
            </Card>

            {/* 2. Thuộc tính sản phẩm (Không đổi) */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">2. Thuộc tính sản phẩm</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Thêm các thuộc tính như "Màu sắc", "Kích cỡ" để tạo biến thể.
                  {editingId && (
                    <span className="text-yellow-600 font-medium block">
                      Cảnh báo: Sửa thuộc tính có thể ảnh hưởng đến các biến thể đã tạo.
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.options.map((option, index) => (
                  <div key={option.tempId} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-muted-foreground" />
                      <Input
                        placeholder="Tên thuộc tính (vd: Màu sắc)"
                        value={option.name}
                        onChange={(e) => handleOptionNameChange(option.tempId, e.target.value)}
                        className="flex-1 bg-background"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveOption(option.tempId)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    
                    <div className="pl-6 space-y-2">
                      {option.values.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {option.values.map((val) => (
                            <div
                              key={val.tempId}
                              className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-background border rounded-full text-sm"
                            >
                              <span>{val.value}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 rounded-full text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveValueFromOption(option.tempId, val.tempId)}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Giá trị (vd: Đỏ)"
                          value={option.newValueInput}
                          onChange={(e) => handleOptionNewValueChange(option.tempId, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddValueToOption(option.tempId);
                            }
                          }}
                          className="h-9 bg-background"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-background"
                          onClick={() => handleAddValueToOption(option.tempId)}
                        >
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full gap-2" onClick={handleAddOption}>
                  <Plus size={16} /> Thêm thuộc tính
                </Button>
              </CardContent>
            </Card>

            {/* Nút Submit / Hủy */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
                {isLoading ? (editingId ? "Đang cập nhật..." : "Đang lưu...") : (editingId ? "Cập nhật sản phẩm" : "Lưu sản phẩm")}
              </Button>
              <Button variant="outline" onClick={resetForm} className="flex-1" disabled={isLoading}>
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- DANH SÁCH SẢN PHẨM (ĐÃ CẬP NHẬT NÚT XÓA) --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách sản phẩm</CardTitle>
            <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
              <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
                <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
                <TabsTrigger value="ALL">Tất cả</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-3 flex gap-2 items-center">
              <Search size={18} className="text-muted-foreground" />
              <Input placeholder="Tìm kiếm sản phẩm theo tên..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-sm flex-1"/>
            </div>
        </CardHeader>
        <CardContent>
          {isLoading && products.length === 0 ? ( <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div>
          ) : apiError ? ( <div className="text-center py-6 text-red-600">Lỗi: {apiError}</div>
          ) : products.length === 0 ? ( <div className="text-center py-6 text-muted-foreground">{searchTerm ? `Không tìm thấy "${searchTerm}".` : `Không có sản phẩm nào (${filterStatus.toLowerCase()}).`}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ảnh</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên sản phẩm</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Danh mục</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Thương hiệu</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Số BT</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giá</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                      {canEdit && (
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[120px]">Hành động</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!product.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        <td className="py-2 px-3"><img src={product.imageUrl || "/placeholder.svg"} alt={product.name} className="w-10 h-10 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}/></td>
                        <td className="py-2 px-3 font-medium text-foreground">{product.name}</td>
                        <td className={`py-2 px-3 text-muted-foreground ${product.categoryId != null && product.isCategoryActive === false ? 'text-red-500 font-medium' : ''}`}>
                            {product.categoryName || "-"}
                        </td>
                        <td className={`py-2 px-3 text-muted-foreground ${product.brandId != null && product.isBrandActive === false ? 'text-red-500 font-medium' : ''}`}>
                            {product.brandName || "-"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-center">{product.variantCount}</td>
                        <td className="py-2 px-3 text-right">
                          {product.salePrice !== null && product.salePrice < product.price ? (
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-destructive">{(product.salePrice?.toLocaleString('vi-VN') ?? '0').toString()}₫</span>
                              <span className="text-xs text-muted-foreground line-through">{(product.price?.toLocaleString('vi-VN') ?? '0').toString()}₫</span>
                            </div>
                          ) : (
                              <span>{(product.price?.toLocaleString('vi-VN') ?? '0').toString()}₫</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${product.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                            {product.active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="py-2 px-3">
                            <div className="flex gap-1.5 justify-center">
                              {/* === SỬA: Dùng Dialog === */}
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(product)}><Edit2 size={14} /></Button>
                              
                              {product.active ? (
                                <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => setDialogState({ isOpen: true, action: 'delete', product: product })}>
                                  <Trash2 size={14} />
                                </Button>
                              ) : (
                                <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => setDialogState({ isOpen: true, action: 'reactivate', product: product })}>
                                  <RotateCcw size={14} /> 
                                </Button>
                              )}

                              {/* === SỬA: Dùng XCircle và logic chuẩn === */}
                              {!product.active && product.variantCount === 0 && isAdmin && (
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="w-7 h-7 text-red-700 border-red-700 hover:bg-red-100/50 dark:text-red-500 dark:border-red-500 dark:hover:bg-red-900/30" 
                                  title="Xóa vĩnh viễn" 
                                  onClick={() => setDialogState({ isOpen: true, action: 'permanentDelete', product: product })}
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
              {totalPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>)}
            </>
          )}
        </CardContent>

        {/* === THÊM: Dialog Xác nhận === */}
        <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogState.action === 'delete' && "Xác nhận ngừng hoạt động?"}
                {dialogState.action === 'reactivate' && "Xác nhận kích hoạt lại?"}
                {dialogState.action === 'permanentDelete' && "Xác nhận XÓA VĨNH VIỄN?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dialogState.action === 'delete' && `Bạn có chắc muốn ngừng hoạt động "${dialogState.product?.name}"? Các biến thể liên quan cũng sẽ bị ngừng hoạt động.`}
                {dialogState.action === 'reactivate' && `Bạn có chắc muốn kích hoạt lại "${dialogState.product?.name}"?`}
                {dialogState.action === 'permanentDelete' && (
                  <span className="text-red-600 font-medium dark:text-red-400">
                    Hành động này KHÔNG THỂ hoàn tác. Sản phẩm "${dialogState.product?.name}" sẽ bị xóa vĩnh viễn (vì không còn biến thể nào).
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