"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 5;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces ---
interface CouponResponse {
  id: number;
  code: string;
  description: string;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}

interface CouponFormData {
  code: string;
  description: string;
  discountValue: number | string;
  maxDiscountAmount: number | string | null;
  minOrderAmount: number | string | null;
  usageLimit: number | string | null;
  startDate: string;
  endDate: string;
  active: boolean;
}

// --- Component ---
export function CouponManagement() {
  const { token } = useAuthStore();

  // --- States ---
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [couponPage, setCouponPage] = useState(1);
  const [totalCouponPages, setTotalCouponPages] = useState(0);
  const [couponSearchTerm, setCouponSearchTerm] = useState("");
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(false);

  // Form Coupon
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [couponFormData, setCouponFormData] = useState<CouponFormData>({
    code: "", description: "", discountValue: "", maxDiscountAmount: null, minOrderAmount: null, usageLimit: null, startDate: "", endDate: "", active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // --- API Fetching ---
  const fetchCoupons = useCallback(async () => {
    if (!token) return;
    setIsFetchingCoupons(true);
    const url = new URL(`${API_URL}/v1/coupons`);
    url.searchParams.append("page", (couponPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", "endDate,desc");
    if (couponSearchTerm) url.searchParams.append("search", couponSearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setCoupons(result.data.content);
        setTotalCouponPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải coupon");
    } catch (err: any) { toast.error(`Lỗi tải Coupons: ${err.message}`); }
    finally { setIsFetchingCoupons(false); }
  }, [token, couponPage, couponSearchTerm]);

  // --- useEffects ---
  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // --- Handlers ---
  const resetCouponForm = () => {
    setShowCouponForm(false); setEditingCouponId(null); setFormError(null);
    setCouponFormData({ code: "", description: "", discountValue: "", maxDiscountAmount: null, minOrderAmount: null, usageLimit: null, startDate: "", endDate: "", active: true });
  }

  // Submit Form Coupon
  const handleCouponSubmit = async () => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    setFormError(null);

    // Validate
    if (!couponFormData.code.trim()) return setFormError("Mã coupon không được để trống.");
    const discountValue = Number(couponFormData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) return setFormError("Giá trị giảm không hợp lệ.");
    if (!couponFormData.startDate) return setFormError("Vui lòng chọn ngày bắt đầu.");
    if (!couponFormData.endDate) return setFormError("Vui lòng chọn ngày kết thúc.");
    if (couponFormData.startDate >= couponFormData.endDate) return setFormError("Ngày kết thúc phải sau ngày bắt đầu.");
    const maxDiscount = couponFormData.maxDiscountAmount ? Number(couponFormData.maxDiscountAmount) : null;
    if (couponFormData.maxDiscountAmount && (isNaN(maxDiscount!) || maxDiscount! <= 0)) return setFormError("Giảm tối đa không hợp lệ.");
    const minOrder = couponFormData.minOrderAmount ? Number(couponFormData.minOrderAmount) : null;
    if (couponFormData.minOrderAmount && (isNaN(minOrder!) || minOrder! < 0)) return setFormError("Đơn tối thiểu không hợp lệ.");
    const usageLimit = couponFormData.usageLimit ? Number(couponFormData.usageLimit) : null;
     // Sửa: Cho phép usageLimit là null hoặc >= 1
    if (couponFormData.usageLimit && (isNaN(usageLimit!) || usageLimit! < 1)) return setFormError("Giới hạn lượt dùng phải là số >= 1.");


    const isEditing = !!editingCouponId;
    const url = isEditing ? `${API_URL}/v1/coupons/${editingCouponId}` : `${API_URL}/v1/coupons`;
    const method = isEditing ? "PUT" : "POST";

    const requestBody = {
      ...couponFormData,
      code: couponFormData.code.trim().toUpperCase(),
      discountValue: discountValue,
      maxDiscountAmount: maxDiscount,
      minOrderAmount: minOrder,
      usageLimit: usageLimit, // Gửi null nếu không giới hạn
    };

    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật coupon thành công!" : "Thêm coupon thành công!");
        resetCouponForm();
        fetchCoupons();
      } else throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); setFormError(err.message); }
  };

  // Mở form Sửa Coupon
  const handleEditCoupon = (coupon: CouponResponse) => {
    setCouponFormData({
        code: coupon.code,
        description: coupon.description || "",
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount ?? "",
        minOrderAmount: coupon.minOrderAmount ?? "",
        usageLimit: coupon.usageLimit === 0 ? "" : coupon.usageLimit, // Hiển thị rỗng nếu không giới hạn (0 từ backend)
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        active: coupon.active,
    });
    setEditingCouponId(coupon.id);
    setShowCouponForm(true);
    setFormError(null);
  };

  // Xóa Coupon
  const handleDeleteCoupon = async (id: number) => {
    if (!token || !confirm("Bạn chắc chắn muốn xóa coupon này?")) return;
    try {
      const response = await fetch(`${API_URL}/v1/coupons/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success("Xóa coupon thành công!");
        if (coupons.length === 1 && couponPage > 1) setCouponPage(couponPage - 1); else fetchCoupons();
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header & Nút Thêm Coupon */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các mã giảm giá (áp dụng cho toàn bộ đơn hàng)</p>
        </div>
        <Button onClick={() => { resetCouponForm(); setShowCouponForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> <Plus size={16} /> Thêm Coupon </Button>
      </div>

      {/* Thông báo lỗi form */}
      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}

      {/* --- Form Thêm/Sửa Coupon --- */}
      {showCouponForm && (
        <Card className="border-teal-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">{editingCouponId ? "Chỉnh sửa Coupon" : "Thêm Coupon mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Mã Coupon (vd: HELLO20) *" value={couponFormData.code} onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}/>
                <Input placeholder="Giá trị giảm (₫) *" type="number" value={couponFormData.discountValue} min="1" onChange={(e) => setCouponFormData({ ...couponFormData, discountValue: e.target.value })}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Giảm tối đa (₫) (Để trống = không giới hạn)" type="number" value={couponFormData.maxDiscountAmount ?? ""} min="1" onChange={(e) => setCouponFormData({ ...couponFormData, maxDiscountAmount: e.target.value || null })}/>
                <Input placeholder="Đơn tối thiểu (₫) (Để trống = không yêu cầu)" type="number" value={couponFormData.minOrderAmount ?? ""} min="0" onChange={(e) => setCouponFormData({ ...couponFormData, minOrderAmount: e.target.value || null })}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Giới hạn lượt dùng (Để trống = không giới hạn)" type="number" value={couponFormData.usageLimit ?? ""} min="1" onChange={(e) => setCouponFormData({ ...couponFormData, usageLimit: e.target.value || null })}/>
                <Input placeholder="Mô tả (tùy chọn)" value={couponFormData.description} onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="couponStartDate" className="text-xs text-muted-foreground">Ngày bắt đầu *</Label><Input id="couponStartDate" type="date" value={couponFormData.startDate} onChange={(e) => setCouponFormData({ ...couponFormData, startDate: e.target.value })}/></div>
                <div><Label htmlFor="couponEndDate" className="text-xs text-muted-foreground">Ngày kết thúc *</Label><Input id="couponEndDate" type="date" value={couponFormData.endDate} onChange={(e) => setCouponFormData({ ...couponFormData, endDate: e.target.value })}/></div>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="couponActiveForm" checked={couponFormData.active} onCheckedChange={(checked) => setCouponFormData({ ...couponFormData, active: Boolean(checked) })}/>
                <Label htmlFor="couponActiveForm" className="text-sm">Kích hoạt coupon này</Label>
            </div>
            <div className="flex gap-3 pt-3 border-t">
              <Button onClick={handleCouponSubmit} className="flex-1">{editingCouponId ? "Cập nhật" : "Lưu"} coupon</Button>
              <Button variant="outline" onClick={resetCouponForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Danh sách Coupons --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách Coupons</CardTitle>
          <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm theo mã hoặc mô tả..." value={couponSearchTerm} onChange={(e) => { setCouponSearchTerm(e.target.value); setCouponPage(1); }} className="h-9 text-sm"/>
          </div>
        </CardHeader>
        <CardContent>
          {isFetchingCoupons ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
           coupons.length === 0 ? <div className="text-center py-6 text-muted-foreground">{couponSearchTerm ? "Không tìm thấy coupon." : "Chưa có coupon nào."}</div> :
           (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mã</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giá trị (₫)</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giảm Tối Đa</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Đơn Tối Thiểu</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Lượt Dùng</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Bắt đầu</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Kết thúc</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3 font-mono font-medium text-foreground">{coupon.code}</td>
                        <td className="py-2 px-3 text-right">{coupon.discountValue.toLocaleString('vi-VN')}₫</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{coupon.maxDiscountAmount ? `${coupon.maxDiscountAmount.toLocaleString('vi-VN')}₫` : "-"}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{coupon.minOrderAmount ? `${coupon.minOrderAmount.toLocaleString('vi-VN')}₫` : "-"}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{coupon.usageLimit > 0 ? `${coupon.usedCount}/${coupon.usageLimit}` : `${coupon.usedCount}/∞`}</td>
                        <td className="py-2 px-3 text-muted-foreground">{coupon.startDate}</td>
                        <td className="py-2 px-3 text-muted-foreground">{coupon.endDate}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${coupon.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                            {coupon.active ? "Hoạt động" : "Tạm dừng"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                           <div className="flex gap-1.5 justify-center">
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEditCoupon(coupon)}><Edit2 size={14} /></Button>
                              <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Xóa" onClick={() => handleDeleteCoupon(coupon.id)}><Trash2 size={14} /></Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalCouponPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={couponPage} totalPages={totalCouponPages} onPageChange={setCouponPage} /></div>)}
            </>
           )}
        </CardContent>
      </Card>
    </div>
  )
}