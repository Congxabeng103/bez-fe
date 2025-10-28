"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, RotateCcw } from "lucide-react"; // Đã import RotateCcw
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";
// Import Tabs
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS_PER_PAGE = 10;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces (Giữ nguyên) ---
interface CategoryResponse { id: number; name: string; description: string; active: boolean; }
interface CategoryFormData { name: string; description: string; active: boolean; }

// --- Component ---
export function CategoryManagement() {
  const { token } = useAuthStore();

  // --- States ---
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [totalCategoryPages, setTotalCategoryPages] = useState(0);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  
  // --- THÊM STATE LỌC ---
  const [filterStatus, setFilterStatus] = useState("ACTIVE"); // Mặc định xem "ACTIVE"

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ name: "", description: "", active: true });
  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching (Cập nhật) ---
  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    const url = new URL(`${API_URL}/v1/categories`);
    url.searchParams.append("page", (categoryPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "name,asc");
    url.searchParams.append("status", filterStatus); // <-- Thêm tham số status
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
  }, [token, categoryPage, categorySearchTerm, filterStatus]); // <-- Thêm filterStatus

  // --- useEffects ---
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); setFormError(null);
    setFormData({ name: "", description: "", active: true });
  }

  // Submit Form (Tạo/Sửa)
  const handleSubmit = async () => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    setFormError(null);
    if (!formData.name.trim()) return setFormError("Tên danh mục không được để trống.");
    const isEditing = !!editingId;
    const url = isEditing ? `${API_URL}/v1/categories/${editingId}` : `${API_URL}/v1/categories`;
    const method = isEditing ? "PUT" : "POST";
    const requestBody = { ...formData, name: formData.name.trim() };
    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật danh mục thành công!" : "Thêm danh mục thành công!");
        resetForm(); 
        fetchCategories(); // Tải lại danh sách
      } else throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); setFormError(err.message); }
  };

  // Mở form Sửa
  const handleEdit = (category: CategoryResponse) => {
    setFormData({ name: category.name, description: category.description || "", active: category.active });
    setEditingId(category.id); setShowForm(true); setFormError(null);
  };

  // Xóa (Soft Delete)
  const handleDelete = async (id: number) => {
    if (!token || !confirm("Ngừng hoạt động danh mục này?")) return;
    try {
      const response = await fetch(`${API_URL}/v1/categories/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động danh mục.");
        fetchCategories(); // Tải lại
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // --- HÀM KÍCH HOẠT LẠI ---
  const handleReactivate = async (category: CategoryResponse) => {
    if (!token || !confirm(`Kích hoạt lại danh mục "${category.name}"?`)) return;
    const url = `${API_URL}/v1/categories/${category.id}`;
    const requestBody = { 
        name: category.name, 
        description: category.description, 
        active: true // <-- Đổi trạng thái thành true
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
        fetchCategories(); // Tải lại
      } else throw new Error(result.message || "Kích hoạt thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // --- HÀM ĐỔI TAB ---
  const handleTabChange = (newStatus: string) => {
      setFilterStatus(newStatus);
      setCategoryPage(1); // Quay về trang 1
      setCategorySearchTerm(""); // Xóa tìm kiếm
      setCategories([]); // Xóa list cũ (để user thấy loading)
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Danh mục</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các danh mục sản phẩm</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> <Plus size={16} /> Thêm Danh mục </Button>
      </div>

      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}

      {/* --- Form Thêm/Sửa (Giữ nguyên) --- */}
      {showForm && (
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
           <CardHeader className="pb-4 border-b">
             <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"}</CardTitle>
           </CardHeader>
           <CardContent className="pt-6 space-y-5">
             <Input placeholder="Tên danh mục *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
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

      {/* --- Bảng Danh sách (Đã thêm Tabs) --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách Danh mục</CardTitle>
           {/* --- THÊM TABS LỌC TRẠNG THÁI --- */}
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
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên Danh mục</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mô tả</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!cat.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        {/* --- VIẾT LIỀN CÁC THẺ <td> --- */}
                        <td className="py-2 px-3 font-medium text-foreground">{cat.name}</td><td className="py-2 px-3 text-muted-foreground text-xs truncate max-w-xs">{cat.description || "-"}</td><td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cat.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                            {cat.active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td><td className="py-2 px-3">
                           <div className="flex gap-1.5 justify-center">
                              {/* Nút Sửa: Luôn hiển thị */}
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(cat)}><Edit2 size={14} /></Button>
                              
                              {/* --- LOGIC NÚT XÓA/KÍCH HOẠT --- */}
                              {cat.active ? (
                                // Nút Ngừng HĐ (Trash)
                                <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></Button>
                              ) : (
                                // Nút Kích hoạt lại (RotateCcw)
                                <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivate(cat)}>
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
              {totalCategoryPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={categoryPage} totalPages={totalCategoryPages} onPageChange={setCategoryPage} /></div>)}
            </>
           )}
        </CardContent>
      </Card>
    </div>
  )
}