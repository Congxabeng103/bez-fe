"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Search, RotateCcw, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { ImageUpload } from "@/components/store/image-upload";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS_PER_PAGE = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces ---
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
  variantCount: number; // <-- THÊM DÒNG NÀY
}
interface Category { id: number; name: string; } 
interface Brand { id: number; name: string; }
interface PromotionBrief { id: number; name: string; }
interface ProductFormData {
  name: string; 
  description: string; 
  price: number | string; 
  imageUrl: string;
  categoryId: string; 
  brandId: string; 
  promotionId: string;
  active: boolean;
}

export function ProductManagement() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "", description: "", price: "", imageUrl: "", 
    categoryId: "", brandId: "", promotionId: "", 
    active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotionsBrief, setPromotionsBrief] = useState<PromotionBrief[]>([]);
  const [isLoadingSelectData, setIsLoadingSelectData] = useState(false);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  
  // --- (fetchProducts, fetchSelectData, useEffects, resetForm, handleSubmit, handleEdit - Giữ nguyên) ---
  // --- API Fetching ---
  const fetchProducts = useCallback(async () => {
    if (!token) return; setIsLoading(true); setError(null);
    const url = new URL(`${API_URL}/v1/products`);
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "createdAt,desc");
    url.searchParams.append("status", filterStatus);
    if (searchTerm) url.searchParams.append("search", searchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      if (!response.ok) {
        let errorMsg = `Lỗi HTTP: ${response.status}`;
        try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch (e) {}
        throw new Error(errorMsg);
      }
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setProducts(result.data.content); setTotalPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải sản phẩm");
    } catch (err: any) { setError(err.message); toast.error(`Lỗi tải sản phẩm: ${err.message}`); }
    finally { setIsLoading(false); }
  }, [token, currentPage, searchTerm, filterStatus]);

  // Fetch dữ liệu cho Selects
  const fetchSelectData = useCallback(async () => {
    if (!token) return { cats: [], brs: [], promos: [] }; 
    setIsLoadingSelectData(true);
    let cats: Category[] = [];
    let brs: Brand[] = [];
    let promos: PromotionBrief[] = [];
    try {
      const [catRes, brandRes, promoRes] = await Promise.all([
        fetch(`${API_URL}/v1/categories/all-brief`, { headers: { "Authorization": `Bearer ${token}` }}),
        fetch(`${API_URL}/v1/brands/all-brief`, { headers: { "Authorization": `Bearer ${token}` }}),
        fetch(`${API_URL}/v1/promotions/brief`, { headers: { "Authorization": `Bearer ${token}` }})
      ]);
      const catResult = await catRes.json();
      const brandResult = await brandRes.json();
      const promoResult = await promoRes.json();
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
  }, [token]);

  // --- useEffects ---
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { 
    if (token && showForm && !editingId) {
        fetchSelectData(); 
    }
  }, [token, showForm, editingId, fetchSelectData]);
  
  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFormWarning(null); 
    setErrors({}); 
    setFormData({ name: "", description: "", price: "", imageUrl: "", categoryId: "", brandId: "", promotionId: "", active: true });
  }

  // Submit Form
  const handleSubmit = async () => {
    if (!token) return toast.error("Hết hạn đăng nhập.");
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    const name = formData.name.trim();
    const priceValue = Number(formData.price);
    const categoryId = formData.categoryId;
    if (!name) { newErrors.name = "Tên sản phẩm là bắt buộc."; } 
    else if (name.length < 3) { newErrors.name = "Tên sản phẩm phải có ít nhất 3 ký tự."; }
    if (isNaN(priceValue) || priceValue <= 0) { newErrors.price = "Giá gốc phải là số hợp lệ và lớn hơn 0."; }
    if (!categoryId) { newErrors.categoryId = "Vui lòng chọn danh mục."; }
    setErrors(newErrors); 
    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin trong form."); 
      return; 
    }
    const isEditing = !!editingId;
    const url = isEditing ? `${API_URL}/v1/products/${editingId}` : `${API_URL}/v1/products`;
    const method = isEditing ? "PUT" : "POST";
    const requestBody = {
        name: name, 
        description: formData.description.trim(),
        price: priceValue, 
        imageUrl: formData.imageUrl || null,
        categoryId: Number(categoryId) || null,
        brandId: Number(formData.brandId) || null,
        promotionId: Number(formData.promotionId) || null,
        active: formData.active,
    };
    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      if (!response.ok) { 
        let errorMsg = `Lỗi HTTP: ${response.status}`;
        try { 
          const errData = await response.json(); 
          errorMsg = errData.message || errData.error || errorMsg; 
        } catch (e) { errorMsg = await response.text(); }
        throw new Error(errorMsg); 
      }
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật thành công!" : "Thêm thành công!");
        resetForm(); 
        fetchProducts(); 
      } else {
        throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
      }
    } catch (err: any) { 
      toast.error(`Thao tác thất bại: ${err.message}`); 
    }
  };

  // Mở Form Sửa
  const handleEdit = async (product: ProductResponse) => {
    let localCategories = categories;
    let localBrands = brands;
    let localPromotions = promotionsBrief; 
    if(categories.length === 0 || brands.length === 0 || promotionsBrief.length === 0) {
      const { cats, brs, promos } = await fetchSelectData(); 
      localCategories = cats;
      localBrands = brs;
      localPromotions = promos; 
    }
    let warning = null;
    if (product.categoryId && !localCategories.some(c => c.id === product.categoryId)) {
        warning = `Danh mục cũ "${product.categoryName}" đã ngừng hoạt động. Vui lòng chọn một danh mục mới.`;
    } else if (product.brandId && !localBrands.some(b => b.id === product.brandId)) {
        warning = `Thương hiệu cũ "${product.brandName}" đã ngừng hoạt động. Vui lòng chọn một thương hiệu mới.`;
    } else if (product.promotionId && !localPromotions.some(p => p.id === product.promotionId)) {
        warning = `Khuyến mãi cũ "${product.promotionName}" đã ngừng hoạt động/hết hạn. Vui lòng chọn KM khác hoặc bỏ trống.`;
    }
    setFormWarning(warning); 
    setFormData({
        name: product.name, description: product.description || "",
        price: product.price, imageUrl: product.imageUrl || "",
        categoryId: product.categoryId ? String(product.categoryId) : "",
        brandId: product.brandId ? String(product.brandId) : "",
        promotionId: product.promotionId ? String(product.promotionId) : "",
        active: product.active,
    });
    setEditingId(product.id); 
    setShowForm(true);
  };  

  // --- SỬA HÀM NÀY (Soft Delete) ---
  const handleDelete = async (id: number) => {
    // Sửa lại câu confirm
    if (!token || !confirm("Ngừng hoạt động sản phẩm này? (Lưu ý: Các biến thể của sản phẩm cũng sẽ bị ẩn theo).")) return;
    try {
      const response = await fetch(`${API_URL}/v1/products/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData.message || "Lỗi khi ngừng hoạt động");
      }
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động sản phẩm (và các biến thể liên quan).");
        fetchProducts(); // Tải lại
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // --- THÊM HÀM MỚI (Permanent Delete) ---
  const handlePermanentDelete = async (id: number) => {
    if (!token || !confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA VĨNH VIỄN SẢN PHẨM NÀY? Sản phẩm này không có biến thể. Hành động này không thể hoàn tác.")) return;
    
    try {
      const response = await fetch(`${API_URL}/v1/products/${id}/permanent`, { // <-- Gọi API mới
        method: "DELETE", 
        headers: { "Authorization": `Bearer ${token}` } 
      });

      if (!response.ok) {
         let errorMsg = `Lỗi HTTP: ${response.status}`;
         try {
           const errData = await response.json();
           errorMsg = errData.message || "Không thể xóa. Sản phẩm có thể vẫn còn biến thể.";
         } catch (e) {}
         throw new Error(errorMsg);
      }
      
      const result = await response.json();
      if (result.status === 'SUCCESS') {
         toast.success("Đã xóa vĩnh viễn sản phẩm.");
         fetchProducts(); // Tải lại
      } else {
         throw new Error(result.message || "Xóa vĩnh viễn thất bại");
      }
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
  };

  // --- Kích hoạt lại (Giữ nguyên) ---
  const handleReactivate = async (product: ProductResponse) => {
    if (!token || !confirm(`Kích hoạt lại sản phẩm "${product.name}"?`)) return;
    let localCategories = categories;
    let localBrands = brands;
    if (categories.length === 0 || brands.length === 0) {
      const { cats, brs } = await fetchSelectData();
      localCategories = cats;
      localBrands = brs;
    }
    const isCategoryActive = product.categoryId && localCategories.some(c => c.id === product.categoryId);
    const isBrandActive = !product.brandId || localBrands.some(b => b.id === product.brandId);
    if (!isCategoryActive) {
        toast.error(`Không thể kích hoạt: Danh mục "${product.categoryName}" đã ngừng hoạt động.`);
        handleEdit(product); 
        return; 
    }
    if (!isBrandActive) {
        toast.error(`Không thể kích hoạt: Thương hiệu "${product.brandName}" đã ngừng hoạt động.`);
        handleEdit(product); 
        return; 
    }
    const url = `${API_URL}/v1/products/${product.id}`;
    const requestBody = { 
        name: product.name, description: product.description, price: product.price,
        imageUrl: product.imageUrl, 
        categoryId: product.categoryId, 
        brandId: product.brandId,
        promotionId: product.promotionId, 
        active: true 
    };
    try {
      const response = await fetch(url, { method: "PUT", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.message || "Kích hoạt thất bại");
      }
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Kích hoạt lại thành công!");
        fetchProducts(); 
      } else throw new Error(result.message || "Kích hoạt thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // Xử lý đổi Tab (Giữ nguyên)
  const handleTabChange = (newStatus: string) => {
      setFilterStatus(newStatus);
      setCurrentPage(1);
      setSearchTerm("");
      setProducts([]);
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ... (Phần tiêu đề và Form - Giữ nguyên) ... */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div> <h1 className="text-2xl sm:text-3xl font-bold">Quản lý sản phẩm</h1> <p className="text-sm text-muted-foreground mt-1">Quản lý sản phẩm trong cửa hàng</p> </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> <Plus size={16} /> Thêm sản phẩm </Button>
      </div>
      {showForm && (
        <Card className="border-primary/50 shadow-md animate-fade-in">
          <CardHeader> <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</CardTitle> </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {formWarning && (
              <div className="flex items-start gap-3 p-3 border border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 text-sm rounded-md">
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  <p className="flex-1"><strong>Cảnh báo:</strong> {formWarning}</p>
              </div>
            )}
            <ImageUpload value={formData.imageUrl || ""} onChange={(value) => setFormData({ ...formData, imageUrl: value })} label="Hình ảnh sản phẩm (URL)"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"> 
                <Input 
                  placeholder="Tên sản phẩm *" 
                  value={formData.name} 
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); 
                  }}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>} 
              </div>
              <div className="space-y-1.5">
                <Input 
                  placeholder="Giá gốc *" 
                  type="number" 
                  value={formData.price} 
                  onChange={(e) => {
                    setFormData({ ...formData, price: e.target.value });
                    if (errors.price) setErrors(prev => ({ ...prev, price: undefined }));
                  }} 
                  min="1"
                  className={errors.price ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>
            </div>
            <Textarea placeholder="Mô tả sản phẩm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"> 
                <Label 
                  htmlFor="categorySelect" 
                  className={`text-xs text-muted-foreground ${errors.categoryId ? 'text-destructive' : ''}`}
                >
                  Danh mục * (Chỉ hiện mục active)
                </Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, categoryId: value });
                    if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: undefined }));
                  }}
                >
                  <SelectTrigger 
                    id="categorySelect" 
                    className={`mt-1 ${errors.categoryId ? "border-destructive focus:ring-destructive" : ""}`}
                  >
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>{isLoadingSelectData ? <div className="p-2 text-sm text-center">Đang tải...</div> : 
                    categories.map(cat => (<SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>))
                  }{!isLoadingSelectData && categories.length === 0 && <div className="p-2 text-sm text-center">Không có DL</div>}</SelectContent>
                </Select>
                {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>} 
              </div>
              <div>
                <Label htmlFor="brandSelect" className="text-xs text-muted-foreground">Thương hiệu (Chỉ hiện mục active)</Label>
                <Select value={formData.brandId} onValueChange={(value) => setFormData({ ...formData, brandId: value })}>
                  <SelectTrigger id="brandSelect" className="mt-1"><SelectValue placeholder="Chọn thương hiệu (Tùy chọn)" /></SelectTrigger>
                  <SelectContent>{isLoadingSelectData ? <div className="p-2 text-sm text-center">Đang tải...</div> : 
                    brands.map(brand => (<SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>))
                  }{!isLoadingSelectData && brands.length === 0 && <div className="p-2 text-sm text-center">Không có DL</div>}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
                 <Label htmlFor="promotionSelect" className="text-xs text-muted-foreground">Khuyến mãi áp dụng (Chỉ hiện mục active)</Label>
                 <Select value={formData.promotionId} onValueChange={(value) => setFormData({ ...formData, promotionId: value })}>
                    <SelectTrigger id="promotionSelect" className="mt-1"><SelectValue placeholder="-- Không áp dụng KM --" /></SelectTrigger>
                    <SelectContent>
                         {isLoadingSelectData ? <div className="p-2 text-sm text-center">Đang tải...</div> :
                           promotionsBrief.map(promo => ( <SelectItem key={promo.id} value={String(promo.id)}>{promo.name}</SelectItem> ))}
                         {!isLoadingSelectData && promotionsBrief.length === 0 && <div className="p-2 text-sm text-center">Không có KM</div>}
                    </SelectContent>
                 </Select>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="productActiveForm" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}/>
                <Label htmlFor="productActiveForm" className="text-sm">Đang hoạt động</Label>
            </div>
            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handleSubmit} className="flex-1">{editingId ? "Cập nhật" : "Lưu"}</Button>
              <Button variant="outline" onClick={resetForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- DANH SÁCH SẢN PHẨM --- */}
      <Card className="shadow-sm">
        <CardHeader>
          {/* ... (Phần Tiêu đề, Tabs, Search - Giữ nguyên) ... */}
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
          {isLoading ? ( <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div>
          ) : error ? ( <div className="text-center py-6 text-red-600">Lỗi: {error}</div>
          ) : products.length === 0 ? ( <div className="text-center py-6 text-muted-foreground">{searchTerm ? `Không tìm thấy "${searchTerm}".` : `Không có sản phẩm nào (${filterStatus.toLowerCase()}).`}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    {/* SỬA <thead>:
                        1. Xóa cột "Khuyến mãi" (vì bạn đã xóa <td> ở dưới)
                        2. Thêm cột "Số BT"
                        3. Tăng độ rộng cột "Hành động"
                        4. Viết liền các <th> để tránh lỗi hydration
                    */}
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ảnh</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên sản phẩm</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Danh mục</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Thương hiệu</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Số BT</th><th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giá</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[120px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      /* SỬA <tbody>:
                          1. Viết liền các <td> để tránh lỗi hydration
                          2. Xóa <td> của "Khuyến mãi"
                          3. Thêm <td> của "Số BT"
                          4. Sửa <td> "Hành động" để thêm logic 3 nút
                      */
                      <tr key={product.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!product.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        <td className="py-2 px-3"><img src={product.imageUrl || "/placeholder.svg"} alt={product.name} className="w-10 h-10 object-cover rounded border"/></td><td className="py-2 px-3 font-medium text-foreground">{product.name}</td><td className={`py-2 px-3 text-muted-foreground ${product.categoryId != null && product.isCategoryActive === false ? 'text-red-500 font-medium' : ''}`}>
                            {product.categoryName || "-"}
                        </td><td className={`py-2 px-3 text-muted-foreground ${product.brandId != null && product.isBrandActive === false ? 'text-red-500 font-medium' : ''}`}>
                            {product.brandName || "-"}
                        </td><td className="py-2 px-3 text-muted-foreground text-center">{product.variantCount}</td><td className="py-2 px-3 text-right">
                          {product.salePrice !== null && product.salePrice < product.price ? (
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-destructive">{product.salePrice.toLocaleString('vi-VN')}₫</span>
                              <span className="text-xs text-muted-foreground line-through">{product.price.toLocaleString('vi-VN')}₫</span>
                            </div>
                          ) : (
                            <span>{product.price.toLocaleString('vi-VN')}₫</span>
                          )}
                        </td><td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${product.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                            {product.active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td><td className="py-2 px-3">
                          <div className="flex gap-1.5 justify-center">
                            {/* Nút Sửa: Luôn hiển thị */}
                            <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(product)}><Edit2 size={14} /></Button>
                            
                            {product.active ? (
                              // Nút Ngừng HĐ (Soft Delete)
                              <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDelete(product.id)}><Trash2 size={14} /></Button>
                            ) : (
                              // Nút Kích hoạt lại
                              <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivate(product)}>
                                <RotateCcw size={14} /> 
                              </Button>
                            )}

                            {/* Nút Xóa vĩnh viễn (Hard Delete) */}
                            {/* Chỉ hiển thị khi: ĐANG NGỪNG HĐ VÀ KHÔNG CÓ BIẾN THỂ */}
                            {!product.active && product.variantCount === 0 && (
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="w-7 h-7" 
                                title="Xóa vĩnh viễn" 
                                onClick={() => handlePermanentDelete(product.id)}
                              >
                                <Trash2 size={14} />
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