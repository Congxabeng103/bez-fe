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
import { manualFetchApi } from "@/lib/api"; // <-- (Giả sử file api.ts nằm ở lib/api.ts)

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

// --- Component ---
export function BrandManagement() { 
  // --- Lấy user và quyền ---
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  // (Chỉ Manager và Admin mới có quyền sửa)
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  // (Chỉ Admin mới có quyền xóa vĩnh viễn)
  const isAdmin = roles.includes("ADMIN");

  // --- States ---
  const [brands, setBrands] = useState<BrandResponse[]>([]); 
  const [brandPage, setBrandPage] = useState(1); 
  const [totalBrandPages, setTotalBrandPages] = useState(0); 
  const [brandSearchTerm, setBrandSearchTerm] = useState(""); 
  const [isFetching, setIsFetching] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE"); 

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BrandFormData>({ name: "", description: "", imageUrl: "", active: true }); 
  const [errors, setErrors] = useState<Partial<Record<keyof BrandFormData, string>>>({}); 

  // --- API Fetching (ĐÃ SỬA LỖI API_URL) ---
  const fetchBrands = useCallback(async () => { 
    setIsFetching(true);
    
    // 1. Tạo chuỗi query
    const query = new URLSearchParams();
    query.append("page", (brandPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "name,asc");
    query.append("status", filterStatus);
    if (brandSearchTerm) query.append("search", brandSearchTerm);

    try {
      // 2. Gọi manualFetchApi với chỉ đường dẫn
      const result = await manualFetchApi(`/v1/brands?${query.toString()}`);
      
      if (result.status === 'SUCCESS' && result.data) {
        setBrands(result.data.content); 
        setTotalBrandPages(result.data.totalPages); 
      } else throw new Error(result.message || "Lỗi tải thương hiệu"); 
    } catch (err: any) { 
      toast.error(`Lỗi tải thương hiệu: ${err.message}`); 
    } 
    finally { setIsFetching(false); }
  }, [brandPage, brandSearchTerm, filterStatus]); // (Đã xóa 'token' khỏi dependency)

  // --- useEffects ---
  useEffect(() => { fetchBrands(); }, [fetchBrands]); 

  // --- Handlers ---
  const resetForm = () => {
    setShowForm(false); setEditingId(null); 
    setErrors({}); 
    setFormData({ name: "", description: "", imageUrl: "", active: true });
  }

  // Submit Form (Tạo/Sửa)
  const handleSubmit = async () => {
    if (!canEdit) { 
      toast.error("Bạn không có quyền thực hiện hành động này.");
      return;
    }
    
    // ... (Logic validate giữ nguyên)
    const newErrors: Partial<Record<keyof BrandFormData, string>> = {};
    const name = formData.name.trim();
    if (!name) { newErrors.name = "Tên thương hiệu không được để trống."; } 
    else if (name.length < 1) { newErrors.name = "Tên thương hiệu không được bỏ trống"; }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin.");
      return;
    }
    
    const isEditing = !!editingId;
    const url = isEditing ? `/v1/brands/${editingId}` : `/v1/brands`;
    const method = isEditing ? "PUT" : "POST";
    const requestBody = { ...formData, name: name, imageUrl: formData.imageUrl || null }; 
    
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
         if (result.message && (result.message.toLowerCase().includes("đã tồn tại") || result.message.toLowerCase().includes("duplicate"))) { 
           setErrors({ name: result.message });
           toast.error(result.message);
         } else {
           throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
         }
      }
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
  };

  // Mở form Sửa
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
    setErrors({});
  };
  
  // Ngừng hoạt động (Soft Delete)
  const handleDelete = async (id: number) => {
    if (!canEdit) { 
      toast.error("Bạn không có quyền ngừng hoạt động.");
      return;
    }
    
    if (!confirm("Ngừng hoạt động thương hiệu này? LƯU Ý: Tất cả sản phẩm đang hoạt động thuộc thương hiệu này cũng sẽ bị ngừng hoạt động.")) return;
    
    try {
      const result = await manualFetchApi(`/v1/brands/${id}`, { method: "DELETE" });
      
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động thương hiệu và sản phẩm liên quan."); 
        fetchBrands(); 
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // Xóa vĩnh viễn (Permanent Delete)
  const handlePermanentDelete = async (id: number) => {
    if (!isAdmin) { 
      toast.error("Chỉ Quản trị viên (Admin) mới có quyền xóa vĩnh viễn.");
      return;
    }
    
    if (!confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA VĨNH VIỄN? Hành động này không thể hoàn tác.")) return;
    
    try {
      const result = await manualFetchApi(`/v1/brands/${id}/permanent`, { 
        method: "DELETE" 
      });
      
      if (result.status === 'SUCCESS') {
          toast.success("Đã xóa vĩnh viễn thương hiệu.");
          fetchBrands(); // Tải lại
      } else {
          throw new Error(result.message || "Xóa vĩnh viễn thất bại");
      }
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    }
  };
  
  // Kích hoạt lại
  const handleReactivate = async (brand: BrandResponse) => {
    if (!canEdit) { 
      toast.error("Bạn không có quyền kích hoạt lại.");
      return;
    }

    if (!confirm(`Kích hoạt lại thương hiệu "${brand.name}"?`)) return;
    const url = `/v1/brands/${brand.id}`;
    
    const requestBody = { 
        name: brand.name, 
        description: brand.description, 
        imageUrl: brand.imageUrl, 
        active: true 
    };
    try {
      const result = await manualFetchApi(url, { 
        method: "PUT", 
        body: JSON.stringify(requestBody) 
      });
      
      if (result.status === 'SUCCESS') {
        toast.success("Kích hoạt lại thương hiệu thành công!");
        fetchBrands(); 
      } else throw new Error(result.message || "Kích hoạt thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // Đổi Tab (Giữ nguyên)
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
        {/* Ẩn nút "Thêm" nếu là STAFF */}
        {canEdit && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> 
            <Plus size={16} /> Thêm Thương hiệu 
          </Button>
        )}
      </div>

      {/* Ẩn Form Thêm/Sửa nếu là STAFF */}
      {showForm && canEdit && ( 
        <Card className="border-blue-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">{editingId ? "Chỉnh sửa Thương hiệu" : "Thêm Thương hiệu mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            
            <ImageUpload 
              value={formData.imageUrl || ""} 
              onChange={(value) => setFormData({ ...formData, imageUrl: value })} 
              label="Hình ảnh thương hiệu (URL)"
            />
            <div className="space-y-1.5">
              <Input 
                placeholder="Tên thương hiệu *" 
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
          <CardTitle className="text-xl font-semibold">Danh sách Thương hiệu</CardTitle>
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
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Số SP</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mô tả</th>
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                        {/* Ẩn cột Hành động nếu là STAFF */}
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
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          </td>
                          <td className="py-2 px-3 font-medium text-foreground">{brand.name}</td>
                          <td className="py-2 px-3 text-muted-foreground text-sm">{brand.productCount}</td>
                          <td className="py-2 px-3 text-muted-foreground text-xs truncate max-w-xs">{brand.description || "-"}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${brand.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                              {brand.active ? "Hoạt động" : "Ngừng HĐ"}
                            </span>
                          </td>
                          
                          {/* Ẩn các nút nếu là STAFF */}
                          {canEdit && (
                            <td className="py-2 px-3">
                              <div className="flex gap-1.5 justify-center">
                                {/* Nút Sửa: Luôn hiển thị */}
                                <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEdit(brand)}><Edit2 size={14} /></Button>
                                
                                {brand.active ? (
                                  // Nút Ngừng HĐ (Soft Delete)
                                  <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDelete(brand.id)}><Trash2 size={14} /></Button>
                                ) : (
                                  // Nút Kích hoạt lại
                                  <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivate(brand)}>
                                    <RotateCcw size={14} /> 
                                  </Button>
                                )}

                                {/* Nút Xóa vĩnh viễn (Hard Delete) */}
                                {/* Chỉ hiển thị khi: ĐANG NGỪNG HĐ, KHÔNG CÓ SẢN PHẨM VÀ LÀ ADMIN */}
                                {!brand.active && brand.productCount === 0 && isAdmin && ( 
                                  <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="w-7 h-7" 
                                    title="Xóa vĩnh viễn" 
                                    onClick={() => handlePermanentDelete(brand.id)}
                                  >
                                    <Trash2 size={14} />
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
      </Card>
    </div>
  )
}