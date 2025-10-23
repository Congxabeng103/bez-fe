"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, Percent } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces ---
interface PromotionResponse {
  id: number;
  name: string;
  description: string;
  discountValue: number; // % Giảm giá
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  // Bỏ productIds
}

interface PromotionFormData {
  name: string;
  description: string;
  discountValue: number | string; // % Giảm
  startDate: string;
  endDate: string;
  active: boolean;
  // Bỏ productIds
}

// --- Component ---
export function PromotionManagement() {
  const { token } = useAuthStore();

  // --- States ---
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [promotionPage, setPromotionPage] = useState(1);
  const [totalPromotionPages, setTotalPromotionPages] = useState(0);
  const [promotionSearchTerm, setPromotionSearchTerm] = useState("");
  const [isFetchingPromotions, setIsFetchingPromotions] = useState(false);

  // Form Promotion
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [promotionFormData, setPromotionFormData] = useState<PromotionFormData>({
    name: "", description: "", discountValue: "", startDate: "", endDate: "", active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching ---
  const fetchPromotions = useCallback(async () => {
    if (!token) return; setIsFetchingPromotions(true);
    const url = new URL(`${API_URL}/v1/promotions`);
    url.searchParams.append("page", (promotionPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "createdAt,desc");
    if (promotionSearchTerm) url.searchParams.append("search", promotionSearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setPromotions(result.data.content); setTotalPromotionPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải khuyến mãi");
    } catch (err: any) { toast.error(`Lỗi tải Khuyến mãi (%): ${err.message}`); }
    finally { setIsFetchingPromotions(false); }
  }, [token, promotionPage, promotionSearchTerm]);

  // --- useEffects ---
  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  // --- Handlers ---
  const resetPromotionForm = () => {
    setShowPromotionForm(false); setEditingPromotionId(null); setFormError(null);
    setPromotionFormData({ name: "", description: "", discountValue: "", startDate: "", endDate: "", active: true });
  }

  // Submit Form Promotion (Không gửi productIds)
  const handlePromotionSubmit = async () => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    setFormError(null);
    if (!promotionFormData.name.trim()) return setFormError("Tên KM trống.");
    const discountValue = Number(promotionFormData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) return setFormError("% giảm không hợp lệ.");
    if (!promotionFormData.startDate || !promotionFormData.endDate) return setFormError("Ngày trống.");
    if (promotionFormData.startDate >= promotionFormData.endDate) return setFormError("Ngày kết thúc phải sau ngày bắt đầu.");

    const isEditing = !!editingPromotionId;
    const url = isEditing ? `${API_URL}/v1/promotions/${editingPromotionId}` : `${API_URL}/v1/promotions`;
    const method = isEditing ? "PUT" : "POST";

    // Bỏ productIds khỏi requestBody
    const { productIds, ...restFormData } = promotionFormData as any; // Ép kiểu
    const requestBody = {
      ...restFormData,
      discountValue: discountValue,
    };

    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật thành công!" : "Thêm thành công!");
        resetPromotionForm(); fetchPromotions();
      } else throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); setFormError(err.message); }
  };

  // Mở form Sửa Promotion (Không cần productIds)
  const handleEditPromotion = (promo: PromotionResponse) => {
    setPromotionFormData({
        name: promo.name, description: promo.description || "",
        discountValue: promo.discountValue, startDate: promo.startDate,
        endDate: promo.endDate, active: promo.active,
    } as PromotionFormData); // Ép kiểu
    setEditingPromotionId(promo.id); setShowPromotionForm(true); setFormError(null);
  };

  // Xóa Promotion
  const handleDeletePromotion = async (id: number) => {
     if (!token || !confirm("Xóa khuyến mãi này? Sản phẩm thuộc KM này sẽ mất KM.")) return;
    try {
      const response = await fetch(`${API_URL}/v1/promotions/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Xóa thành công!");
        // Cần tải lại danh sách sản phẩm ở ProductManagement để cập nhật giá
        // Tạm thời chỉ tải lại danh sách KM
        if (promotions.length === 1 && promotionPage > 1) setPromotionPage(promotionPage - 1); else fetchPromotions();
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div> <h1 className="text-2xl sm:text-3xl font-bold">Khuyến mãi (%)</h1> <p className="text-sm text-muted-foreground mt-1">Quản lý chương trình giảm giá theo phần trăm</p> </div>
        <Button onClick={() => { resetPromotionForm(); setShowPromotionForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> <Plus size={16} /> Thêm KM (%) </Button>
      </div>

      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}

      {/* --- Form Thêm/Sửa Promotion (Đã bỏ phần chọn sản phẩm) --- */}
      {showPromotionForm && (
        <Card className="border-purple-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b"> <CardTitle className="text-lg font-semibold">{editingPromotionId ? "Chỉnh sửa KM (%)" : "Thêm KM (%) mới"}</CardTitle> </CardHeader>
          <CardContent className="pt-6 space-y-5">
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
            {/* --- BỎ PHẦN CHỌN SẢN PHẨM --- */}
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

      {/* --- Danh sách Promotions (%) (Bỏ cột SP áp dụng) --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách Khuyến mãi (%)</CardTitle>
           <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm theo tên khuyến mãi..." value={promotionSearchTerm} onChange={(e) => { setPromotionSearchTerm(e.target.value); setPromotionPage(1); }} className="h-9 text-sm"/>
          </div>
        </CardHeader>
        <CardContent>
          {isFetchingPromotions ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
           promotions.length === 0 ? <div className="text-center py-6 text-muted-foreground">{promotionSearchTerm ? "Không tìm thấy." : "Chưa có khuyến mãi nào."}</div> :
           (
            <div className="space-y-3">
              {promotions.map((promo) => (
                <div key={promo.id} className="border rounded-lg p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
                     <div> <h3 className="font-semibold text-base">{promo.name}</h3> <p className="text-xs text-muted-foreground mt-0.5">{promo.description || "Không có mô tả"}</p> </div>
                     <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${promo.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}> {promo.active ? "Hoạt động" : "Tạm dừng"} </span>
                  </div>
                  {/* Bỏ cột SP áp dụng */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm border-t pt-2 mt-2">
                    <div><span className="text-muted-foreground text-xs">Giảm:</span> {promo.discountValue}%</div>
                    <div><span className="text-muted-foreground text-xs">Từ:</span> {promo.startDate}</div>
                    <div><span className="text-muted-foreground text-xs">Đến:</span> {promo.endDate}</div>
                  </div>
                  <div className="flex gap-1.5 mt-3 justify-end sm:justify-start">
                    <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEditPromotion(promo)}><Edit2 size={14} /></Button>
                    <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Xóa" onClick={() => handleDeletePromotion(promo.id)}><Trash2 size={14} /></Button>
                  </div>
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