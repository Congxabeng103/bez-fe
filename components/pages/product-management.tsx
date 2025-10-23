"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/pagination";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const ITEMS_PER_PAGE = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces ---
interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number; // Giá gốc
  imageUrl: string;
  categoryName: string;
  brandName: string;
  promotionId: number | null; // ID KM
  promotionName: string | null; // Tên KM
  salePrice: number | null; // Giá sau giảm (nếu có)
  createdAt: string;
}

interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface PromotionBrief { id: number; name: string; } // Cho dropdown KM

interface ProductFormData {
  name: string;
  description: string;
  price: number | string;
  imageUrl: string;
  categoryId: string;
  brandId: string;
  promotionId: string; // ID KM (dạng string cho Select)
}

export function ProductManagement() {
  const { token } = useAuthStore();

  // --- States ---
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "", description: "", price: "", imageUrl: "", categoryId: "", brandId: "", promotionId: "", // Khởi tạo promotionId
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotionsBrief, setPromotionsBrief] = useState<PromotionBrief[]>([]); // State cho KM brief
  const [isLoadingSelectData, setIsLoadingSelectData] = useState(false);


  // --- API Fetching ---
  // Fetch Products (bao gồm thông tin KM và salePrice)
  const fetchProducts = useCallback(async () => {
    if (!token) return; setIsLoading(true); setError(null);
    const url = new URL(`${API_URL}/v1/products`);
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "createdAt,desc");
    if (searchTerm) url.searchParams.append("search", searchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setProducts(result.data.content); setTotalPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải sản phẩm");
    } catch (err: any) { setError(err.message); toast.error(`Lỗi tải sản phẩm: ${err.message}`); }
    finally { setIsLoading(false); }
  }, [token, currentPage, searchTerm]);

  // Fetch dữ liệu cho các Select (Category, Brand, Promotion)
  const fetchSelectData = useCallback(async () => {
    if (!token) return; setIsLoadingSelectData(true);
    try {
      const [catRes, brandRes, promoRes] = await Promise.all([
        fetch(`${API_URL}/v1/categories`, { headers: { "Authorization": `Bearer ${token}` }}),
        fetch(`${API_URL}/v1/brands`, { headers: { "Authorization": `Bearer ${token}` }}),
        fetch(`${API_URL}/v1/promotions/brief`, { headers: { "Authorization": `Bearer ${token}` }}) // Fetch KM brief
      ]);
      const catResult = await catRes.json();
      const brandResult = await brandRes.json();
      const promoResult = await promoRes.json();

      if (catResult.status === 'SUCCESS') setCategories(catResult.data || []);
      else console.error("Lỗi tải danh mục:", catResult.message);
      if (brandResult.status === 'SUCCESS') setBrands(brandResult.data || []);
      else console.error("Lỗi tải thương hiệu:", brandResult.message);
      if (promoResult.status === 'SUCCESS') setPromotionsBrief(promoResult.data || []); // Lưu KM brief
      else console.error("Lỗi tải khuyến mãi:", promoResult.message);
    } catch (err: any) { toast.error("Lỗi tải dữ liệu cho form."); console.error(err); }
    finally { setIsLoadingSelectData(false); }
  }, [token]);

  // --- useEffects ---
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  // Fetch select data khi có token (chỉ 1 lần thường là đủ)
  useEffect(() => { if (token) fetchSelectData(); }, [token, fetchSelectData]); // Sửa dependency


  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFormData({ name: "", description: "", price: "", imageUrl: "", categoryId: "", brandId: "", promotionId: "" });
  }

  // Submit Form (Thêm/Sửa Product, gửi kèm promotionId)
  const handleSubmit = async () => {
    if (!token) return toast.error("Hết hạn đăng nhập.");
     if (!formData.name.trim()) return toast.error("Nhập tên sản phẩm.");
     const price = Number(formData.price); if (isNaN(price) || price <= 0) return toast.error("Nhập giá > 0.");
     if (!formData.categoryId) return toast.error("Chọn danh mục.");

    const isEditing = !!editingId;
    const url = isEditing ? `${API_URL}/v1/products/${editingId}` : `${API_URL}/v1/products`;
    const method = isEditing ? "PUT" : "POST";

    const requestBody = {
        name: formData.name.trim(), description: formData.description.trim(),
        price: price, imageUrl: formData.imageUrl || null,
        categoryId: Number(formData.categoryId) || null,
        brandId: Number(formData.brandId) || null,
        promotionId: Number(formData.promotionId) || null, // Gửi ID KM (hoặc null)
    };

    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const result = await response.json();
       if (result.status === 'SUCCESS') {
         toast.success(isEditing ? "Cập nhật thành công!" : "Thêm thành công!");
         resetForm(); fetchProducts();
       } else throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // Mở Form Sửa (Điền promotionId vào form)
  const handleEdit = (product: ProductResponse) => {
    const category = categories.find(c => c.name === product.categoryName);
    const brand = brands.find(b => b.name === product.brandName);

    setFormData({
        name: product.name, description: product.description || "",
        price: product.price, imageUrl: product.imageUrl || "",
        categoryId: category ? String(category.id) : "",
        brandId: brand ? String(brand.id) : "",
        promotionId: product.promotionId ? String(product.promotionId) : "", // Điền ID KM
    });
    setEditingId(product.id); setShowForm(true);
  };

  // Xóa Sản phẩm
  const handleDelete = async (id: number) => {
    if (!token || !confirm("Xóa sản phẩm này?")) return;
    try {
      const response = await fetch(`${API_URL}/v1/products/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Xóa thành công!");
        // Tải lại dữ liệu sau khi xóa
        if (products.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1); // Lùi trang nếu xóa hết trang hiện tại
        } else {
            fetchProducts(); // Tải lại trang hiện tại
        }
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header và Nút Thêm */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div> <h1 className="text-2xl sm:text-3xl font-bold">Quản lý sản phẩm</h1> <p className="text-sm text-muted-foreground mt-1">Quản lý sản phẩm trong cửa hàng</p> </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> <Plus size={16} /> Thêm sản phẩm </Button>
      </div>

      {/* --- FORM THÊM/SỬA --- */}
      {showForm && (
        <Card className="border-primary/50 shadow-md animate-fade-in">
          <CardHeader> <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</CardTitle> </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <ImageUpload value={formData.imageUrl || ""} onChange={(value) => setFormData({ ...formData, imageUrl: value })} label="Hình ảnh sản phẩm (URL)"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Tên sản phẩm *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
              <Input placeholder="Giá gốc *" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} min="1"/>
            </div>
            <Textarea placeholder="Mô tả sản phẩm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Category */}
              <div>
                <Label htmlFor="categorySelect" className="text-xs text-muted-foreground">Danh mục *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger id="categorySelect" className="mt-1"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>{isLoadingSelectData ? <div className="p-2 text-sm text-center">Đang tải...</div> : categories.map(cat => (<SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>))}{!isLoadingSelectData && categories.length === 0 && <div className="p-2 text-sm text-center">Không có DL</div>}</SelectContent>
                </Select>
              </div>
              {/* Select Brand */}
              <div>
                <Label htmlFor="brandSelect" className="text-xs text-muted-foreground">Thương hiệu</Label>
                <Select value={formData.brandId} onValueChange={(value) => setFormData({ ...formData, brandId: value })}>
                  <SelectTrigger id="brandSelect" className="mt-1"><SelectValue placeholder="Chọn thương hiệu (Tùy chọn)" /></SelectTrigger>
                  <SelectContent>{isLoadingSelectData ? <div className="p-2 text-sm text-center">Đang tải...</div> : brands.map(brand => (<SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>))}{!isLoadingSelectData && brands.length === 0 && <div className="p-2 text-sm text-center">Không có DL</div>}</SelectContent>
                </Select>
              </div>
            </div>
           {/* --- Select Promotion --- */}
            <div>
                 <Label htmlFor="promotionSelect" className="text-xs text-muted-foreground">Khuyến mãi áp dụng (Tùy chọn)</Label>
                 <Select value={formData.promotionId} onValueChange={(value) => setFormData({ ...formData, promotionId: value })}>
                    <SelectTrigger id="promotionSelect" className="mt-1">
                      {/* Placeholder đã xử lý việc "không chọn" */}
                      <SelectValue placeholder="-- Không áp dụng KM --" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* --- XÓA DÒNG NÀY ĐI --- */}
                        {/* <SelectItem value="">-- Không áp dụng KM --</SelectItem> */}
                        {/* --- KẾT THÚC XÓA --- */}

                        {/* Danh sách promotions */}
                        {isLoadingSelectData ? <div className="p-2 text-sm text-center">Đang tải...</div> :
                         promotionsBrief.map(promo => ( <SelectItem key={promo.id} value={String(promo.id)}>{promo.name}</SelectItem> ))}
                        {!isLoadingSelectData && promotionsBrief.length === 0 && <div className="p-2 text-sm text-center">Không có KM</div>}
                    </SelectContent>
                </Select>
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
          <CardTitle className="text-xl font-semibold">Danh sách sản phẩm</CardTitle>
           <div className="mt-3 flex gap-2 items-center">
             <Search size={18} className="text-muted-foreground" />
             <Input placeholder="Tìm kiếm sản phẩm theo tên..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-sm flex-1"/>
           </div>
        </CardHeader>
        <CardContent>
          {isLoading ? ( <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div>
          ) : error ? ( <div className="text-center py-6 text-red-600">Lỗi: {error}</div>
          ) : products.length === 0 ? ( <div className="text-center py-6 text-muted-foreground">{searchTerm ? `Không tìm thấy "${searchTerm}".` : "Chưa có sản phẩm."}</div>
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
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Khuyến mãi</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giá</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b last:border-b-0 hover:bg-muted/20">
                        <td className="py-2 px-3"><img src={product.imageUrl || "/placeholder.svg"} alt={product.name} className="w-10 h-10 object-cover rounded border"/></td>
                        <td className="py-2 px-3 font-medium text-foreground">{product.name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{product.categoryName || "-"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{product.brandName || "-"}</td>
                        <td className="py-2 px-3 text-muted-foreground text-xs">{product.promotionName || "-"}</td>
                        {/* --- Hiển thị giá gốc/giá sale --- */}
                        <td className="py-2 px-3 text-right">
                          {product.salePrice !== null && product.salePrice < product.price ? (
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-destructive">{product.salePrice.toLocaleString('vi-VN')}₫</span>
                              <span className="text-xs text-muted-foreground line-through">{product.price.toLocaleString('vi-VN')}₫</span>
                            </div>
                          ) : (
                            <span>{product.price.toLocaleString('vi-VN')}₫</span>
                          )}
                        </td>
                        {/* --- End hiển thị giá --- */}
                         <td className="py-2 px-3">
                           <div className="flex gap-1.5 justify-center">
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(product)}><Edit2 size={14} /></Button>
                              <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Xóa" onClick={() => handleDelete(product.id)}><Trash2 size={14} /></Button>
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