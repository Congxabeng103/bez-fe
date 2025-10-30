"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, RotateCcw } from "lucide-react"; // Import RotateCcw
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs

const ITEMS_PER_PAGE = 10;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces ---
interface BrandResponse { // Đổi tên
  id: number;
  name: string;
  description: string;
  active: boolean;
}

interface BrandFormData { // Đổi tên
  name: string;
  description: string;
  active: boolean;
}

// --- Component ---
export function BrandManagement() { // Đổi tên
  const { token } = useAuthStore();

  // --- States ---
  const [brands, setBrands] = useState<BrandResponse[]>([]); // Đổi tên
  const [brandPage, setBrandPage] = useState(1); // Đổi tên
  const [totalBrandPages, setTotalBrandPages] = useState(0); // Đổi tên
  const [brandSearchTerm, setBrandSearchTerm] = useState(""); // Đổi tên
  const [isFetching, setIsFetching] = useState(false);
  
  // --- THÊM STATE LỌC ---
  const [filterStatus, setFilterStatus] = useState("ACTIVE"); // Mặc định xem "ACTIVE"

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({ // Đổi tên
    name: "", description: "", active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching (Cập nhật) ---
  const fetchBrands = useCallback(async () => { // Đổi tên
    if (!token) return;
    setIsFetching(true);
    const url = new URL(`${API_URL}/v1/brands`); // Đổi API Endpoint
    url.searchParams.append("page", (brandPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "name,asc");
    url.searchParams.append("status", filterStatus); // <-- Thêm tham số status
    if (brandSearchTerm) url.searchParams.append("search", brandSearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setBrands(result.data.content); // Đổi state
        setTotalBrandPages(result.data.totalPages); // Đổi state
      } else throw new Error(result.message || "Lỗi tải thương hiệu");
    } catch (err: any) { toast.error(`Lỗi tải thương hiệu: ${err.message}`); } // Đổi text
    finally { setIsFetching(false); }
  }, [token, brandPage, brandSearchTerm, filterStatus]); // <-- Thêm filterStatus

  // --- useEffects ---
  useEffect(() => { fetchBrands(); }, [fetchBrands]); // Đổi tên hàm

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); setFormError(null);
    setFormData({ name: "", description: "", active: true });
  }

  // Submit Form (Tạo/Sửa)
  const handleSubmit = async () => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    setFormError(null);
    if (!formData.name.trim()) return setFormError("Tên thương hiệu không được để trống."); // Đổi text

    const isEditing = !!editingId;
    const url = isEditing ? `${API_URL}/v1/brands/${editingId}` : `${API_URL}/v1/brands`; // Đổi API Endpoint
    const method = isEditing ? "PUT" : "POST";

    const requestBody = { ...formData, name: formData.name.trim() };

    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật thương hiệu thành công!" : "Thêm thương hiệu thành công!"); // Đổi text
        resetForm(); 
        fetchBrands(); // Đổi tên hàm
      } else throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); setFormError(err.message); }
  };

  // Mở form Sửa
  const handleEdit = (brand: BrandResponse) => { // Đổi tên
    setFormData({
        name: brand.name,
        description: brand.description || "",
        active: brand.active,
    });
    setEditingId(brand.id);
    setShowForm(true);
    setFormError(null);
  };

  // Xóa (Soft Delete)
  const handleDelete = async (id: number) => {
    if (!token || !confirm("Ngừng hoạt động thương hiệu này?")) return; // Đổi text
    try {
      const response = await fetch(`${API_URL}/v1/brands/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); // Đổi API Endpoint
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động thương hiệu."); // Đổi text
        fetchBrands(); // Tải lại
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // --- THÊM HÀM KÍCH HOẠT LẠI ---
  const handleReactivate = async (brand: BrandResponse) => { // Đổi tên
    if (!token || !confirm(`Kích hoạt lại thương hiệu "${brand.name}"?`)) return; // Đổi text
    const url = `${API_URL}/v1/brands/${brand.id}`; // Đổi API Endpoint
    const requestBody = { 
        name: brand.name, 
        description: brand.description, 
        active: true // Đặt active = true
    };
    try {
      const response = await fetch(url, { 
          method: "PUT", 
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, 
          body: JSON.stringify(requestBody) 
      });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Kích hoạt lại thương hiệu thành công!"); // Đổi text
        fetchBrands(); // Tải lại
      } else throw new Error(result.message || "Kích hoạt thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // --- HÀM ĐỔI TAB ---
  const handleTabChange = (newStatus: string) => {
      setFilterStatus(newStatus);
      setBrandPage(1); // Quay về trang 1
      setBrandSearchTerm(""); // Xóa tìm kiếm
      setBrands([]); // Xóa list cũ
  }

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Thương hiệu</h1> {/* Đổi text */}
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các thương hiệu sản phẩm</p> {/* Đổi text */}
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> <Plus size={16} /> Thêm Thương hiệu </Button> {/* Đổi text */}
      </div>

      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}

      {/* --- Form Thêm/Sửa --- */}
      {showForm && (
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa Thương hiệu" : "Thêm Thương hiệu mới"}</CardTitle> {/* Đổi text */}
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <Input placeholder="Tên thương hiệu *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/>
            <Textarea placeholder="Mô tả (tùy chọn)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[60px]"/>
            <div className="flex items-center gap-2">
                <Checkbox id="brandActiveForm" checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}/>
                <Label htmlFor="brandActiveForm" className="text-sm">Đang hoạt động</Label>
            </div>
            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handleSubmit} className="flex-1">{editingId ? "Cập nhật" : "Lưu"} thương hiệu</Button> {/* Đổi text */}
              <Button variant="outline" onClick={resetForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Bảng Danh sách (Đã thêm Tabs) --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách Thương hiệu</CardTitle> {/* Đổi text */}
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
            <Input 
              placeholder="Tìm theo tên thương hiệu..." // Đổi text
              value={brandSearchTerm} 
              onChange={(e) => { 
                setBrandSearchTerm(e.target.value); 
                setBrandPage(1); 
              }} 
              className="h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
           brands.length === 0 ? <div className="text-center py-6 text-muted-foreground">{brandSearchTerm ? "Không tìm thấy." : `Không có thương hiệu nào (${filterStatus.toLowerCase()}).`}</div> : // Đổi text
           (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên Thương hiệu</th>{/* Đổi text */}
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mô tả</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((brand) => (
                      <tr key={brand.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!brand.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        {/* --- VIẾT LIỀN CÁC THẺ <td> --- */}
                        <td className="py-2 px-3 font-medium text-foreground">{brand.name}</td><td className="py-2 px-3 text-muted-foreground text-xs truncate max-w-xs">{brand.description || "-"}</td><td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${brand.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                            {brand.active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td><td className="py-2 px-3">
                           <div className="flex gap-1.5 justify-center">
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(brand)}><Edit2 size={14} /></Button>
                              {/* --- LOGIC NÚT XÓA/KÍCH HOẠT --- */}
                              {brand.active ? (
                                <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDelete(brand.id)}><Trash2 size={14} /></Button>
                              ) : (
                                <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivate(brand)}>
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
              {totalBrandPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={brandPage} totalPages={totalBrandPages} onPageChange={setBrandPage} /></div>)}
            </>
           )}
        </CardContent>
      </Card>
    </div>
  )
}