"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs

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
  const [filterStatus, setFilterStatus] = useState("ACTIVE"); // <-- THÊM STATE LỌC
  // Form Coupon
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null); // null = Tạo mới
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
    url.searchParams.append("status", filterStatus); // Gửi status
    if (couponSearchTerm) url.searchParams.append("search", couponSearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      if (!response.ok) { /* ... (Xử lý lỗi) ... */ }
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setCoupons(result.data.content);
        setTotalCouponPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải coupon");
    } catch (err: any) { toast.error(`Lỗi tải Coupons: ${err.message}`); }
    finally { setIsFetchingCoupons(false); }
  }, [token, couponPage, couponSearchTerm, filterStatus]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // --- Handlers ---
  const resetCouponForm = () => {
    setShowCouponForm(false); setEditingCouponId(null); setFormError(null);
    setCouponFormData({ code: "", description: "", discountValue: "", maxDiscountAmount: null, minOrderAmount: null, usageLimit: null, startDate: "", endDate: "", active: true });
  }

  // --- SỬA HÀM NÀY (Thêm logic Tạo mới) ---
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
    if (couponFormData.usageLimit && (isNaN(usageLimit!) || usageLimit! < 1)) return setFormError("Giới hạn lượt dùng phải là số >= 1.");

    const isEditing = !!editingCouponId;
    const url = isEditing ? `${API_URL}/v1/coupons/${editingCouponId}` : `${API_URL}/v1/coupons`;
    const method = isEditing ? "PUT" : "POST"; // POST khi tạo mới

    const requestBody = {
      ...couponFormData, // Đã bao gồm 'active'
      code: couponFormData.code.trim().toUpperCase(),
      discountValue: discountValue,
      maxDiscountAmount: maxDiscount,
      minOrderAmount: minOrder,
      usageLimit: usageLimit,
    };

    try {
      const response = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      const result = await response.json();
      if (response.status === 409) { // Lỗi trùng lặp
           setFormError(result.message || "Mã coupon này đã tồn tại.");
           toast.error(result.message || "Mã coupon này đã tồn tại.");
           return;
      }
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật coupon thành công!" : "Thêm coupon thành công!");
        resetCouponForm();
        fetchCoupons();
      } else throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); setFormError(err.message); }
  };
  // --- KẾT THÚC SỬA ---

  // Mở form Sửa
  const handleEditCoupon = (coupon: CouponResponse) => {
    setCouponFormData({
        code: coupon.code, description: coupon.description || "",
        discountValue: coupon.discountValue, maxDiscountAmount: coupon.maxDiscountAmount ?? "",
        minOrderAmount: coupon.minOrderAmount ?? "",
        usageLimit: coupon.usageLimit === 0 ? "" : (coupon.usageLimit ?? ""),
        startDate: coupon.startDate, endDate: coupon.endDate, active: coupon.active,
    });
    setEditingCouponId(coupon.id); setShowCouponForm(true); setFormError(null);
  };

 const handleDeleteCoupon = async (id: number) => {
    if (!token || !confirm("Ngừng hoạt động coupon này?")) return;
    try {
      const response = await fetch(`${API_URL}/v1/coupons/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json(); // Luôn đọc result
      if (result.status === 'SUCCESS') {
        toast.success("Đã ngừng hoạt động coupon.");
        fetchCoupons(); // Tải lại
      } else throw new Error(result.message || "Xóa thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // Kích hoạt lại (PUT)
  const handleReactivateCoupon = async (coupon: CouponResponse) => {
      if (!token || !confirm(`Kích hoạt lại coupon "${coupon.code}"?`)) return;
      const url = `${API_URL}/v1/coupons/${coupon.id}`;
      // Gửi lại data cũ, chỉ đổi active = true
      const requestBody = { 
          ...coupon, // Gửi lại toàn bộ thông tin cũ
          // Chuyển đổi lại các trường number/null
          discountValue: Number(coupon.discountValue) || 0,
          maxDiscountAmount: Number(coupon.maxDiscountAmount) || null,
          minOrderAmount: Number(coupon.minOrderAmount) || null,
          usageLimit: Number(coupon.usageLimit) || null,
          active: true // Set active
      };
      try {
        const response = await fetch(url, { 
            method: "PUT", 
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, 
            body: JSON.stringify(requestBody) 
        });
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại coupon thành công!");
          fetchCoupons(); // Tải lại
        } else throw new Error(result.message || "Kích hoạt thất bại");
      } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  // Đổi Tab
const handleTabChange = (newStatus: string) => {
      setFilterStatus(newStatus); // 1. Cập nhật state lọc
      setCouponPage(1); // 2. Quay về trang 1
      setCouponSearchTerm(""); // 3. Xóa tìm kiếm
      setCoupons([]); // 4. Xóa list cũ (để user thấy loading)
      // useEffect sẽ tự động gọi fetchCoupons với status mới
  };
  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các mã giảm giá</p>
        </div>
        {/* Sửa onClick: Set editingId = null khi Thêm mới */}
<Button onClick={() => { resetCouponForm(); setShowCouponForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm"> <Plus size={16} /> Thêm Coupon </Button>      </div>

      {formError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{formError}</div> )}

      {showCouponForm && (
        <Card className="border-teal-500/50 shadow-md animate-fade-in">
           <CardHeader className="pb-4 border-b">
             <CardTitle className="text-lg font-semibold">{editingCouponId ? "Chỉnh sửa Coupon" : "Thêm Coupon mới"}</CardTitle>
           </CardHeader>
           {/* ... (Code form <CardContent> giữ nguyên) ... */}
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
                 <Input placeholder="Giới hạn lượt dùng (Để trống = không giớiHạn)" type="number" value={couponFormData.usageLimit ?? ""} min="1" onChange={(e) => setCouponFormData({ ...couponFormData, usageLimit: e.target.value || null })}/>
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

      {/* --- Danh sách Coupons (Đã thêm Tabs) --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách Coupons</CardTitle>
          <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
              <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
                <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
                <TabsTrigger value="ALL">Tất cả</TabsTrigger>
              </TabsList>
           </Tabs>
          <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm theo mã hoặc mô tả..." value={couponSearchTerm} onChange={(e) => { setCouponSearchTerm(e.target.value); setCouponPage(1); }} className="h-9 text-sm"/>
          </div>
        </CardHeader>
        <CardContent>
          {/* ... (Logic hiển thị bảng, map data, logic nút Xóa/Kích hoạt lại) ... */}
           {isFetchingCoupons ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
           coupons.length === 0 ? <div className="text-center py-6 text-muted-foreground">{couponSearchTerm ? "Không tìm thấy." : `Không có coupon nào (${filterStatus.toLowerCase()}).`}</div> :
           (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mã</th><th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giá trị (₫)</th><th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giảm Tối Đa</th><th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Đơn Tối Thiểu</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Lượt Dùng</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Bắt đầu</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Kết thúc</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!coupon.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                        <td className="py-2 px-3 font-mono font-medium text-foreground">{coupon.code}</td><td className="py-2 px-3 text-right">{coupon.discountValue.toLocaleString('vi-VN')}₫</td><td className="py-2 px-3 text-right text-muted-foreground">{coupon.maxDiscountAmount ? `${coupon.maxDiscountAmount.toLocaleString('vi-VN')}₫` : "-"}</td><td className="py-2 px-3 text-right text-muted-foreground">{coupon.minOrderAmount ? `${coupon.minOrderAmount.toLocaleString('vi-VN')}₫` : "-"}</td><td className="py-2 px-3 text-center text-muted-foreground">{coupon.usageLimit > 0 ? `${coupon.usedCount}/${coupon.usageLimit}` : `${coupon.usedCount}/∞`}</td><td className="py-2 px-3 text-muted-foreground">{coupon.startDate}</td><td className="py-2 px-3 text-muted-foreground">{coupon.endDate}</td><td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${coupon.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                            {coupon.active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td><td className="py-2 px-3">
                           <div className="flex gap-1.5 justify-center">
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEditCoupon(coupon)}><Edit2 size={14} /></Button>
                              {coupon.active ? (
                                <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => handleDeleteCoupon(coupon.id)}><Trash2 size={14} /></Button>
                              ) : (
                                <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => handleReactivateCoupon(coupon)}>
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
              {totalCouponPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={couponPage} totalPages={totalCouponPages} onPageChange={setCouponPage} /></div>)}
            </>
           )}
        </CardContent>
      </Card>
    </div>
  )
}