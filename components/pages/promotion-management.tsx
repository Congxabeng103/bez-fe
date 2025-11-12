"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, Percent, RotateCcw } from "lucide-react"; 
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { manualFetchApi } from "@/lib/api"; // <-- SỬA 1: Import hàm fetch

const ITEMS_PER_PAGE = 5;

// --- Interfaces ---
interface PromotionResponse {
  id: number;
  name: string;
  description: string;
  discountValue: number; // %
  startDate: string;
  endDate: string;
  active: boolean; // Dùng để lọc
  createdAt: string;
}

interface PromotionFormData {
  name: string;
  description: string;
  discountValue: number | string; // %
  startDate: string;
  endDate: string;
  active: boolean;
}

// --- Component ---
export function PromotionManagement() {
  // --- SỬA 2: Lấy user và quyền ---
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  // (Chỉ Manager và Admin mới có quyền sửa)
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  // --- KẾT THÚC SỬA 2 ---

  // --- States ---
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [promotionPage, setPromotionPage] = useState(1);
  const [totalPromotionPages, setTotalPromotionPages] = useState(0);
  const [promotionSearchTerm, setPromotionSearchTerm] = useState("");
  const [isFetchingPromotions, setIsFetchingPromotions] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE"); 

  // Form Promotion
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null); // null = Tạo mới
  const [promotionFormData, setPromotionFormData] = useState<PromotionFormData>({
    name: "", description: "", discountValue: "", startDate: "", endDate: "", active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching (Đã sửa) ---
  const fetchPromotions = useCallback(async () => {
    setIsFetchingPromotions(true);
    
    // 1. Tạo chuỗi query
    const query = new URLSearchParams();
    query.append("page", (promotionPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "createdAt,desc");
    query.append("status", filterStatus);
    if (promotionSearchTerm) query.append("search", promotionSearchTerm);

    try {
      // 2. Gọi manualFetchApi
      const result = await manualFetchApi(`/v1/promotions?${query.toString()}`);
      
      if (result.status === 'SUCCESS' && result.data) {
        setPromotions(result.data.content); setTotalPromotionPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải khuyến mãi");
    } catch (err: any) { 
      // Lỗi 403 (Forbidden) sẽ được bắt ở đây nếu STAFF cố tình truy cập
      toast.error(`Lỗi tải Khuyến mãi (%): ${err.message}`); 
    }
    finally { setIsFetchingPromotions(false); }
  }, [promotionPage, promotionSearchTerm, filterStatus]); // (Đã xóa 'token' khỏi dependency)

  // --- useEffects ---
  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  // --- Handlers ---
  const resetPromotionForm = () => {
    setShowPromotionForm(false); setEditingPromotionId(null); setFormError(null);
    setPromotionFormData({ name: "", description: "", discountValue: "", startDate: "", endDate: "", active: true });
  }

  // Submit Form (Tạo/Sửa)
  const handlePromotionSubmit = async () => {
    if (!canEdit) { // <-- SỬA 3: Kiểm tra quyền
      toast.error("Bạn không có quyền thực hiện hành động này.");
      return;
    }
    
    setFormError(null);

    // --- VALIDATION (Giữ nguyên) ---
    if (!promotionFormData.name.trim()) return setFormError("Tên KM trống.");
    const discountValue = Number(promotionFormData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) { 
        return setFormError("% giảm không hợp lệ (phải từ 1-100).");
    }
    if (!promotionFormData.startDate || !promotionFormData.endDate) return setFormError("Ngày trống.");

    const today = new Date().toISOString().split('T')[0];
    
    if (promotionFormData.startDate < today && !editingPromotionId) {
        return setFormError("Ngày bắt đầu không thể là ngày trong quá khứ.");
    }

    if (promotionFormData.startDate > promotionFormData.endDate) {
        return setFormError("Ngày kết thúc phải sau ngày bắt đầu.");
    }
    // --- HẾT VALIDATION ---

    const isEditing = !!editingPromotionId;
    const url = isEditing ? `/v1/promotions/${editingPromotionId}` : `/v1/promotions`;
    const method = isEditing ? "PUT" : "POST"; 

    const requestBody = {
      ...promotionFormData, 
      discountValue: discountValue,
    };

    try {
      // --- SỬA 4: Dùng hàm fetch chung ---
      const result = await manualFetchApi(url, { 
        method, 
        body: JSON.stringify(requestBody) 
      });
      // --- KẾT THÚC SỬA 4 ---
      
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật thành công!" : "Thêm thành công!");
        resetPromotionForm(); fetchPromotions();
      } else {
         throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
      }
    } catch (err: any) { 
      // Bắt lỗi 409 (trùng lặp) hoặc 403 (không quyền)
      if (err.message && (err.message.toLowerCase().includes("đã tồn tại") || err.message.toLowerCase().includes("duplicate"))) {
          setFormError(err.message);
          toast.error(err.message);
      } else {
          toast.error(`Lỗi: ${err.message}`); 
          setFormError(err.message);
      }
    }
  };

  // Mở form Sửa
  const handleEditPromotion = (promo: PromotionResponse) => {
    if (!canEdit) { // <-- SỬA 5: Kiểm tra quyền
      toast.error("Bạn không có quyền sửa.");
      return;
    }
    setPromotionFormData({
        name: promo.name, description: promo.description || "",
        discountValue: promo.discountValue, startDate: promo.startDate,
        endDate: promo.endDate, active: promo.active,
    });
    setEditingPromotionId(promo.id); setShowPromotionForm(true); setFormError(null);
  };

  // Xóa (Soft Delete)
  const handleDeletePromotion = async (id: number) => {
    if (!canEdit) { // <-- SỬA 6: Kiểm tra quyền
      toast.error("Bạn không có quyền ngừng hoạt động.");
      return;
    }
    
    if (!confirm("Ngừng hoạt động khuyến mãi này?")) return;
    
    try {
      // --- SỬA 7: Dùng hàm fetch chung ---
      const result = await manualFetchApi(`/v1/promotions/${id}`, { method: "DELETE" });
      // --- KẾT THÚC SỬA 7 ---
      
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động khuyến mãi.");
        fetchPromotions(); // Tải lại
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // Kích hoạt lại (PUT)
  const handleReactivatePromotion = async (promo: PromotionResponse) => {
    if (!canEdit) { // <-- SỬA 8: Kiểm tra quyền
      toast.error("Bạn không có quyền kích hoạt lại.");
      return;
    }
    
    if (!confirm(`Kích hoạt lại khuyến mãi "${promo.name}"?`)) return;
    const url = `/v1/promotions/${promo.id}`;
    const requestBody = { ...promo, active: true }; // Gửi lại data cũ, set active=true
    
    try {
      // --- SỬA 9: Dùng hàm fetch chung ---
      const result = await manualFetchApi(url, { 
          method: "PUT", 
          body: JSON.stringify(requestBody) 
      });
      // --- KẾT THÚC SỬA 9 ---
      
      if (result.status === 'SUCCESS') {
        toast.success("Kích hoạt lại khuyến mãi thành công!");
        fetchPromotions(); // Tải lại
      } else throw new Error(result.message || "Kích hoạt thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // Xử lý đổi Tab
  const handleTabChange = (newStatus: string) => {
      setFilterStatus(newStatus);
      setPromotionPage(1);
      setPromotionSearchTerm("");
      setPromotions([]);
  };

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
         <div> <h1 className="text-2xl sm:text-3xl font-bold">Khuyến mãi (%)</h1> <p className="text-sm text-muted-foreground mt-1">Quản lý chương trình giảm giá theo phần trăm</p> </div>
         
         {/* --- SỬA 10: Ẩn nút "Thêm" nếu là STAFF --- */}
         {canEdit && (
            <Button onClick={() => { resetPromotionForm(); setShowPromotionForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> 
              <Plus size={16} /> Thêm KM (%) 
            </Button>
         )}
         {/* --- KẾT THÚC SỬA 10 --- */}
      </div>

       {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}

       {/* Ẩn Form Thêm/Sửa nếu là STAFF */}
       {showPromotionForm && canEdit && (
         <Card className="border-purple-500/50 shadow-md animate-fade-in">
           <CardHeader className="pb-4 border-b"> <CardTitle className="text-lg font-semibold">{editingPromotionId ? "Chỉnh sửa KM (%)" : "Thêm KM (%) mới"}</CardTitle> </CardHeader>
           <CardContent className="pt-6 space-y-5">
             {/* ... (Code Form Inputs giữ nguyên) ... */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Tên khuyến mãi *" value={promotionFormData.name} onChange={(e) => setPromotionFormData({ ...promotionFormData, name: e.target.value })}/>
              <Textarea placeholder="Mô tả (tùy chọn)" value={promotionFormData.description} onChange={(e) => setPromotionFormData({ ...promotionFormData, description: e.target.value })} className="min-h-[40px] md:min-h-[auto]"/>
            </div>
            <div>
              <Label htmlFor="promoDiscount" className="text-xs text-muted-foreground">Phần trăm giảm *</Label>
               <div className="relative mt-1">
                   <Input id="promoDiscount" placeholder="vd: 15" type="number" value={promotionFormData.discountValue} min="1" max="100" onChange={(e) => setPromotionFormData({ ...promotionFormData, discountValue: e.target.value })}/>
                   <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="promoStartDate" className="text-xs text-muted-foreground">Ngày bắt đầu *</Label><Input id="promoStartDate" type="date" value={promotionFormData.startDate} onChange={(e) => setPromotionFormData({ ...promotionFormData, startDate: e.target.value })}/></div>
              <div><Label htmlFor="promoEndDate" className="text-xs text-muted-foreground">Ngày kết thúc *</Label><Input id="promoEndDate" type="date" value={promotionFormData.endDate} onChange={(e) => setPromotionFormData({ ...promotionFormData, endDate: e.target.value })}/></div>
            </div>
            <div className="flex items-center gap-2">
               <Checkbox id="promoActiveForm" checked={promotionFormData.active} onCheckedChange={(checked) => setPromotionFormData({ ...promotionFormData, active: Boolean(checked) })}/>
               <Label htmlFor="promoActiveForm" className="text-sm">Kích hoạt khuyến mãi này</Label>
            </div>
            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handlePromotionSubmit} className="flex-1">{editingPromotionId ? "Cập nhật" : "Lưu"} khuyến mãi</Button>
              <Button variant="outline" onClick={resetPromotionForm} className="flex-1">Hủy</Button>
            </div>
           </CardContent>
         </Card>
       )}

      {/* --- Danh sách Promotions (%) (Đã thêm Tabs) --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách Khuyến mãi (%)</CardTitle>
           {/* Tabs Lọc */}
           <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
             <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
               <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
               <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
               <TabsTrigger value="ALL">Tất cả</TabsTrigger>
             </TabsList>
           </Tabs>
           <div className="mt-3 flex gap-2 items-center">
             <Search size={18} className="text-muted-foreground" />
             <Input placeholder="Tìm theo tên khuyến mãi..." value={promotionSearchTerm} onChange={(e) => { setPromotionSearchTerm(e.target.value); setPromotionPage(1); }} className="h-9 text-sm"/>
           </div>
        </CardHeader>
        <CardContent>
          {isFetchingPromotions ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
           promotions.length === 0 ? <div className="text-center py-6 text-muted-foreground">{promotionSearchTerm ? "Không tìm thấy." : `Không có KM nào (${filterStatus.toLowerCase()}).`}</div> :
           (
            <div className="space-y-3">
              {promotions.map((promo) => (
                <div key={promo.id} className={`border rounded-lg p-3 sm:p-4 transition-colors ${!promo.active ? 'opacity-70 bg-gray-50 dark:bg-gray-900/30' : 'hover:bg-muted/30'}`}>
                  {/* ... (Hiển thị thông tin) ... */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
                      <div> <h3 className="font-semibold text-base">{promo.name}</h3> <p className="text-xs text-muted-foreground mt-0.5">{promo.description || "Không có mô tả"}</p> </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${promo.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}> {promo.active ? "Hoạt động" : "Ngừng HĐ"} </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm border-t pt-2 mt-2">
                    <div><span className="text-muted-foreground text-xs">Giảm:</span> {promo.discountValue}%</div>
                    <div><span className="text-muted-foreground text-xs">Từ:</span> {promo.startDate}</div>
                    <div><span className="text-muted-foreground text-xs">Đến:</span> {promo.endDate}</div>
                  </div>
                  
                  {/* --- SỬA 11: Ẩn các nút nếu là STAFF --- */}
                  {canEdit && (
                    <div className="flex gap-1.5 mt-3 justify-end sm:justify-start">
                      <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEditPromotion(promo)}><Edit2 size={14} /></Button>
                      
                      {/* --- LOGIC NÚT XÓA/KÍCH HOẠT LẠI --- */}
                      {promo.active ? (
                          <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDeletePromotion(promo.id)}><Trash2 size={14} /></Button>
                      ) : (
                          <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivatePromotion(promo)}>
                              <RotateCcw size={14} /> 
                          </Button>
                      )}
                    </div>
                  )}
                  {/* --- KẾT THÚC SỬA 11 --- */}
                </div>
              ))}
            </div>
           )}
          {totalPromotionPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={promotionPage} totalPages={totalPromotionPages} onPageChange={setPromotionPage} /></div>)}
        </CardContent>
      </Card>
    </div>
  )
}