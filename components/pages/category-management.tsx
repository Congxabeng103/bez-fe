"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/store/image-upload";

const ITEMS_PER_PAGE = 10;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces ---
interface CategoryResponse { 
  id: number; 
  name: string; 
  description: string;
  imageUrl: string; 
  active: boolean; 
  productCount: number; // <-- THÊM DÒNG NÀY
}
interface CategoryFormData { 
  name: string; 
  description: string;
  imageUrl: string; 
  active: boolean; 
}

// --- Component ---
export function CategoryManagement() {
  const { token } = useAuthStore();

  // --- States ---
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [totalCategoryPages, setTotalCategoryPages] = useState(0);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE"); 

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ name: "", description: "", imageUrl: "", active: true });
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});

  // --- API Fetching ---
  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    const url = new URL(`${API_URL}/v1/categories`);
    url.searchParams.append("page", (categoryPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "name,asc");
    url.searchParams.append("status", filterStatus);
    if (categorySearchTerm) url.searchParams.append("search", categorySearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setCategories(result.data.content);
        setTotalCategoryPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải danh mục");
    } catch (err: any) { toast.error(`Lỗi tải danh mục: ${err.message}`); }
    finally { setIsFetching(false); }
  }, [token, categoryPage, categorySearchTerm, filterStatus]);

  // --- useEffects ---
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); 
    setErrors({}); 
    setFormData({ name: "", description: "", imageUrl: "", active: true });
  }

  // Submit Form (Tạo/Sửa)
  const handleSubmit = async () => {
    // ... (Logic này giữ nguyên)
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    const newErrors: Partial<Record<keyof CategoryFormData, string>> = {};
    const name = formData.name.trim();
    if (!name) { newErrors.name = "Tên danh mục không được để trống."; } 
    else if (name.length < 3) { newErrors.name = "Tên danh mục phải có ít nhất 3 ký tự."; }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin.");
      return;
    }
    const isEditing = !!editingId;
    const url = isEditing ? `${API_URL}/v1/categories/${editingId}` : `${API_URL}/v1/categories`;
    const method = isEditing ? "PUT" : "POST";
    const requestBody = { ...formData, name: name, imageUrl: formData.imageUrl || null }; 
    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật danh mục thành công!" : "Thêm danh mục thành công!");
        resetForm(); 
        fetchCategories(); 
      } else {
        if (response.status === 409) { 
          setErrors({ name: result.message || "Tên danh mục này đã tồn tại." });
          toast.error(result.message || "Tên danh mục này đã tồn tại.");
        } else {
          throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
        }
      }
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
  };

  // Mở form Sửa (Giữ nguyên)
  const handleEdit = (category: CategoryResponse) => {
    setFormData({ 
      name: category.name, 
      description: category.description || "", 
      active: category.active,
      imageUrl: category.imageUrl || ""
    });
    setEditingId(category.id); 
    setShowForm(true); 
    setErrors({});
  };
  
  // --- SỬA HÀM NÀY (Soft Delete) ---
  const handleDelete = async (id: number) => {
    // Thêm cảnh báo về việc ẩn hàng loạt
    if (!token || !confirm("Ngừng hoạt động danh mục này? LƯU Ý: Tất cả sản phẩm đang hoạt động thuộc danh mục này cũng sẽ bị ngừng hoạt động.")) return;
    try {
      const response = await fetch(`${API_URL}/v1/categories/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động danh mục và sản phẩm liên quan."); // Sửa text
        fetchCategories(); 
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // --- THÊM HÀM MỚI (Permanent Delete) ---
  const handlePermanentDelete = async (id: number) => {
    if (!token || !confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA VĨNH VIỄN? Hành động này không thể hoàn tác.")) return;
    
    try {
      const response = await fetch(`${API_URL}/v1/categories/${id}/permanent`, { // <-- Gọi API mới
        method: "DELETE", 
        headers: { "Authorization": `Bearer ${token}` } 
      });

      if (!response.ok) {
         // Đọc lỗi từ server (ví dụ lỗi 409 "Không thể xóa...")
         let errorMsg = `Lỗi HTTP: ${response.status}`;
         try {
           const errData = await response.json();
           errorMsg = errData.message || errorMsg;
         } catch (e) {
           // không phải json
         }
         throw new Error(errorMsg);
      }
      
      const result = await response.json();
      if (result.status === 'SUCCESS') {
         toast.success("Đã xóa vĩnh viễn danh mục.");
         fetchCategories(); // Tải lại
      } else {
         throw new Error(result.message || "Xóa vĩnh viễn thất bại");
      }
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
  };
  
  // Kích hoạt lại (Giữ nguyên)
  const handleReactivate = async (category: CategoryResponse) => {
    if (!token || !confirm(`Kích hoạt lại danh mục "${category.name}"?`)) return;
    const url = `${API_URL}/v1/categories/${category.id}`;
    
    const requestBody = { 
        name: category.name, 
        description: category.description, 
        imageUrl: category.imageUrl, 
        active: true 
    };
    try {
      const response = await fetch(url, { 
        method: "PUT", 
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, 
        body: JSON.stringify(requestBody) 
      });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Kích hoạt lại danh mục thành công!");
        fetchCategories(); 
      } else throw new Error(result.message || "Kích hoạt thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // Đổi Tab (Giữ nguyên)
  const handleTabChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    setCategoryPage(1); 
    setCategorySearchTerm(""); 
    setCategories([]); 
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ... (Phần tiêu đề và nút Thêm - Giữ nguyên) ... */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Danh mục</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các danh mục sản phẩm</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> <Plus size={16} /> Thêm Danh mục </Button>
      </div>

      {/* --- Form Thêm/Sửa (Giữ nguyên) --- */}
      {showForm && (
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            
            <ImageUpload 
              value={formData.imageUrl || ""} 
              onChange={(value) => setFormData({ ...formData, imageUrl: value })} 
              label="Hình ảnh danh mục (URL)"
            />
            <div className="space-y-1.5">
              <Input 
                placeholder="Tên danh mục *" 
                value={formData.name} 
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""} 
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
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
        {/* ... (Phần CardHeader, Tabs, Search - Giữ nguyên) ... */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách Danh mục</CardTitle>
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
                <div className="overflow-auto max-h-[500px] rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr className="border-b">
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80 w-[60px]">Ảnh</th> 
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên Danh mục</th>
                        {/* --- THÊM CỘT "Số SP" --- */}
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Số SP</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mô tả</th>
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                        {/* Tăng chiều rộng cột Hành động */}
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[120px]">Hành động</th>
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
                              onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          </td>
                          <td className="py-2 px-3 font-medium text-foreground">{cat.name}</td>
                          
                          {/* --- THÊM Ô "Số SP" --- */}
                          <td className="py-2 px-3 text-muted-foreground text-sm">{cat.productCount}</td>
                          
                          <td className="py-2 px-3 text-muted-foreground text-xs truncate max-w-xs">{cat.description || "-"}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cat.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                              {cat.active ? "Hoạt động" : "Ngừng HĐ"}
                            </span>
                          </td>
                          
                          {/* --- SỬA LOGIC NÚT --- */}
                          <td className="py-2 px-3">
                            <div className="flex gap-1.5 justify-center">
                              {/* Nút Sửa: Luôn hiển thị */}
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(cat)}><Edit2 size={14} /></Button>
                              
                              {cat.active ? (
                                // Nút Ngừng HĐ (Soft Delete)
                                <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></Button>
                              ) : (
                                // Nút Kích hoạt lại
                                <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivate(cat)}>
                                  <RotateCcw size={14} /> 
                                </Button>
                              )}

                              {/* Nút Xóa vĩnh viễn (Hard Delete) */}
                              {/* Chỉ hiển thị khi: ĐANG NGỪNG HĐ VÀ KHÔNG CÓ SẢN PHẨM */}
                              {!cat.active && cat.productCount === 0 && (
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  className="w-7 h-7" 
                                  title="Xóa vĩnh viễn" 
                                  onClick={() => handlePermanentDelete(cat.id)}
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
                {totalCategoryPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={categoryPage} totalPages={totalCategoryPages} onPageChange={setCategoryPage} /></div>)}
              </>
            )}
        </CardContent>
      </Card>
    </div>
  )
}