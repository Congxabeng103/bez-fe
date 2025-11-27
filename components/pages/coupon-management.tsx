"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, RotateCcw, XCircle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { manualFetchApi } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 5;

// --- Interfaces ---
interface CouponResponse {
  id: number;
  code: string;
  description: string;
  discountValue: number; // %
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
  discountValue: number | string; // %
  maxDiscountAmount: number | string | null;
  minOrderAmount: number | string | null;
  usageLimit: number | string | null;
  startDate: string;
  endDate: string;
  active: boolean;
}

type CouponFormErrors = Partial<Record<keyof CouponFormData, string>>;

interface DialogState {
  isOpen: boolean;
  action: 'delete' | 'reactivate' | 'permanentDelete' | null;
  coupon: CouponResponse | null;
}

const getLocalTodayStr = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

// --- Component ---
export function CouponManagement() {

  // --- Lấy user và quyền ---
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  const isAdmin = roles.includes("ADMIN");

  // --- States ---
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [couponPage, setCouponPage] = useState(1);
  const [totalCouponPages, setTotalCouponPages] = useState(0);
  const [totalCoupons, setTotalCoupons] = useState(0);

  const [couponSearchTerm, setCouponSearchTerm] = useState("");
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  // Form Coupon
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [couponFormData, setCouponFormData] = useState<CouponFormData>({
    code: "", description: "", discountValue: "", maxDiscountAmount: null, minOrderAmount: null, usageLimit: null, startDate: "", endDate: "", active: true,
  });

  // State lỗi (Inline validation)
  const [formErrors, setFormErrors] = useState<CouponFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // State quản lý dialog xác nhận
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    action: null,
    coupon: null,
  });

  // --- API Fetching ---
  const fetchCoupons = useCallback(async () => {
    setIsFetchingCoupons(true);

    const query = new URLSearchParams();
    query.append("page", (couponPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "endDate,desc");
    query.append("status", filterStatus);
    if (couponSearchTerm) query.append("search", couponSearchTerm);

    try {
      const result = await manualFetchApi(`/v1/coupons?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        setCoupons(result.data.content || []);
        setTotalCouponPages(result.data.totalPages ?? 0);
        setTotalCoupons(result.data.totalElements ?? 0);
      } else throw new Error(result.message || "Lỗi tải coupon");
    } catch (err: any) {
      toast.error(`Lỗi tải Coupons: ${err.message}`);
    }
    finally { setIsFetchingCoupons(false); }
  }, [couponPage, couponSearchTerm, filterStatus]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // --- Handlers ---
  const resetCouponForm = () => {
    setShowCouponForm(false);
    setEditingCouponId(null);
    setApiError(null);
    setFormErrors({});
    setCouponFormData({ code: "", description: "", discountValue: "", maxDiscountAmount: null, minOrderAmount: null, usageLimit: null, startDate: "", endDate: "", active: true });
  }

  // Hàm Validate
  const validateForm = (): CouponFormErrors => {
    const newErrors: CouponFormErrors = {};
    const { code, discountValue, startDate, endDate, maxDiscountAmount, minOrderAmount, usageLimit, active } = couponFormData;
    const todayStr = getLocalTodayStr();

    if (!code.trim()) {
      newErrors.code = "Mã coupon không được để trống.";
    }
    const discNum = Number(discountValue);
    if (isNaN(discNum) || discNum <= 0 || discNum > 100) {
      newErrors.discountValue = "Giá trị (%) phải > 0 và <= 100.";
    }
    if (!startDate) {
      newErrors.startDate = "Vui lòng chọn ngày bắt đầu.";
    }
    if (!endDate) {
      newErrors.endDate = "Vui lòng chọn ngày kết thúc.";
    } else if (startDate && startDate > endDate) {
      newErrors.endDate = "Ngày kết thúc phải sau hoặc trùng ngày bắt đầu.";
    } else if (active && endDate < todayStr) {
      newErrors.endDate = "Coupon đang kích hoạt không được có ngày kết thúc trong quá khứ.";
    }

    const maxDiscNum = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (maxDiscountAmount && (isNaN(maxDiscNum!) || maxDiscNum! <= 0)) {
      newErrors.maxDiscountAmount = "Giảm tối đa phải là số > 0.";
    }
    const minOrderNum = minOrderAmount ? Number(minOrderAmount) : null;
    if (minOrderAmount && (isNaN(minOrderNum!) || minOrderNum! < 0)) {
      newErrors.minOrderAmount = "Đơn tối thiểu phải là số >= 0.";
    }
    const usageNum = usageLimit ? Number(usageLimit) : null;
    if (usageLimit && (isNaN(usageNum!) || usageNum! < 1)) {
      newErrors.usageLimit = "Giới hạn lượt dùng phải >= 1.";
    }
    return newErrors;
  }

  // Submit Form (Tạo/Sửa)
  const handleCouponSubmit = async () => {
    if (!canEdit) {
      toast.error("Bạn không có quyền thực hiện hành động này.");
      return;
    }
    setApiError(null);
    setFormErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      toast.error("Vui lòng kiểm tra lại các trường có lỗi.");
      return;
    }

    const isEditing = !!editingCouponId;
    const url = isEditing ? `/v1/coupons/${editingCouponId}` : `/v1/coupons`;
    const method = isEditing ? "PUT" : "POST";

    const requestBody = {
      ...couponFormData,
      code: couponFormData.code.trim().toUpperCase(),
      discountValue: Number(couponFormData.discountValue),
      maxDiscountAmount: couponFormData.maxDiscountAmount ? Number(couponFormData.maxDiscountAmount) : null,
      minOrderAmount: couponFormData.minOrderAmount ? Number(couponFormData.minOrderAmount) : null,
      usageLimit: couponFormData.usageLimit ? Number(couponFormData.usageLimit) : null,
    };

    try {
      const result = await manualFetchApi(url, {
        method,
        body: JSON.stringify(requestBody)
      });
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật coupon thành công!" : "Thêm coupon thành công!");
        resetCouponForm();
        fetchCoupons();
      } else {
        throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
      }
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("đã tồn tại") || err.message.toLowerCase().includes("duplicate"))) {
        setFormErrors({ code: err.message });
        toast.error(err.message);
      } else {
        toast.error(`Lỗi: ${err.message}`);
        setApiError(err.message);
      }
    }
  };

  const handleEditCoupon = (coupon: CouponResponse) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền sửa.");
      return;
    }
    setCouponFormData({
      code: coupon.code, description: coupon.description || "",
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      minOrderAmount: coupon.minOrderAmount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      startDate: coupon.startDate, endDate: coupon.endDate, active: coupon.active,
    });
    setEditingCouponId(coupon.id);
    setShowCouponForm(true);
    setApiError(null);
    setFormErrors({});
  };

  const handleTabChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    setCouponPage(1);
    setCouponSearchTerm("");
    setCoupons([]);
  };

  // --- Logic Dialog Xác nhận ---
  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, coupon: null });
  };

  const handleConfirmAction = async () => {
    const { action, coupon } = dialogState;
    if (!coupon || !canEdit) {
      toast.error("Hành động không hợp lệ hoặc bạn không có quyền.");
      closeDialog();
      return;
    };

    try {
      if (action === 'delete') {
        const result = await manualFetchApi(`/v1/coupons/${coupon.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã ngừng hoạt động coupon.");
          fetchCoupons();
        } else throw new Error(result.message || "Ngừng hoạt động thất bại");
      }

      else if (action === 'reactivate') {
        const todayStr = getLocalTodayStr();
        if (coupon.endDate < todayStr) {
          toast.error(`Kích hoạt thất bại: Coupon đã hết hạn vào ngày ${coupon.endDate}.`);
          toast.info("Vui lòng bấm 'Sửa' (Edit) để gia hạn ngày kết thúc trước.");
          closeDialog();
          return;
        }

        const url = `/v1/coupons/${coupon.id}`;
        const requestBody = {
          code: coupon.code, description: coupon.description,
          discountValue: coupon.discountValue, maxDiscountAmount: coupon.maxDiscountAmount,
          minOrderAmount: coupon.minOrderAmount, usageLimit: coupon.usageLimit,
          startDate: coupon.startDate, endDate: coupon.endDate,
          active: true
        };
        const result = await manualFetchApi(url, { method: "PUT", body: JSON.stringify(requestBody) });
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại coupon thành công!");
          fetchCoupons();
        } else throw new Error(result.message || "Kích hoạt thất bại");
      }

      else if (action === 'permanentDelete') {
        // --- LOGIC PHÂN QUYỀN: CHẶN MANAGER ---
        if (!isAdmin) {
          toast.error("Chỉ Admin mới có quyền xóa vĩnh viễn!");
          closeDialog();
          return;
        }
        if (coupon.usedCount > 0) {
          toast.error("Không thể xóa vĩnh viễn coupon đã có lượt dùng.");
          closeDialog();
          return;
        }
        const result = await manualFetchApi(`/v1/coupons/permanent-delete/${coupon.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã xóa vĩnh viễn coupon.");
          fetchCoupons();
        } else throw new Error(result.message || "Xóa vĩnh viễn thất bại");
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      closeDialog();
    }
  };


  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các mã giảm giá</p>
        </div>
        {canEdit && (
          <Button onClick={() => { resetCouponForm(); setShowCouponForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm">
            <Plus size={16} /> Thêm Coupon
          </Button>
        )}
      </div>

      {/* Form Thêm/Sửa */}
      {showCouponForm && canEdit && (
        <Card className="border-teal-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">{editingCouponId ? "Chỉnh sửa Coupon" : "Thêm Coupon mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">

            {apiError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">
                {apiError}
              </div>
            )}

            {/* Row 1: Code & Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="couponCode">Mã Coupon <span className="text-destructive">*</span></Label>
                <Input
                  id="couponCode"
                  placeholder="VD: HELLO20"
                  value={couponFormData.code}
                  onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                  className={formErrors.code ? "border-destructive" : ""}
                />
                {formErrors.code && <p className="text-xs text-destructive animate-shake">{formErrors.code}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponDiscount">Giá trị giảm (%) <span className="text-destructive">*</span></Label>
                <Input
                  id="couponDiscount"
                  placeholder="0 - 100"
                  type="number"
                  value={couponFormData.discountValue}
                  min="0.01" max="100" step="0.01"
                  onChange={(e) => setCouponFormData({ ...couponFormData, discountValue: e.target.value })}
                  className={formErrors.discountValue ? "border-destructive" : ""}
                />
                {formErrors.discountValue && <p className="text-xs text-destructive animate-shake">{formErrors.discountValue}</p>}
              </div>
            </div>

            {/* Row 2: Max Discount & Min Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Giảm tối đa (₫)</Label>
                <Input
                  id="maxDiscount"
                  placeholder="Để trống = Không giới hạn"
                  type="number"
                  value={couponFormData.maxDiscountAmount ?? ""}
                  min="1"
                  onChange={(e) => setCouponFormData({ ...couponFormData, maxDiscountAmount: e.target.value || null })}
                  className={formErrors.maxDiscountAmount ? "border-destructive" : ""}
                />
                {formErrors.maxDiscountAmount && <p className="text-xs text-destructive animate-shake">{formErrors.maxDiscountAmount}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minOrder">Đơn tối thiểu (₫)</Label>
                <Input
                  id="minOrder"
                  placeholder="Để trống = Không yêu cầu"
                  type="number"
                  value={couponFormData.minOrderAmount ?? ""}
                  min="0"
                  onChange={(e) => setCouponFormData({ ...couponFormData, minOrderAmount: e.target.value || null })}
                  className={formErrors.minOrderAmount ? "border-destructive" : ""}
                />
                {formErrors.minOrderAmount && <p className="text-xs text-destructive animate-shake">{formErrors.minOrderAmount}</p>}
              </div>
            </div>

            {/* Row 3: Usage Limit & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Giới hạn lượt dùng</Label>
                <Input
                  id="usageLimit"
                  placeholder="Để trống = Không giới hạn"
                  type="number"
                  value={couponFormData.usageLimit ?? ""}
                  min="1"
                  onChange={(e) => setCouponFormData({ ...couponFormData, usageLimit: e.target.value || null })}
                  className={formErrors.usageLimit ? "border-destructive" : ""}
                />
                {formErrors.usageLimit && <p className="text-xs text-destructive animate-shake">{formErrors.usageLimit}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  placeholder="Mô tả ngắn gọn về coupon..."
                  value={couponFormData.description}
                  onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Row 4: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="couponStartDate" className={formErrors.startDate ? 'text-destructive' : ''}>Ngày bắt đầu <span className="text-destructive">*</span></Label>
                <Input
                  id="couponStartDate"
                  type="date"
                  value={couponFormData.startDate}
                  onChange={(e) => setCouponFormData({ ...couponFormData, startDate: e.target.value })}
                  className={formErrors.startDate ? "border-destructive" : ""}
                />
                {formErrors.startDate && <p className="text-xs text-destructive animate-shake">{formErrors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponEndDate" className={formErrors.endDate ? 'text-destructive' : ''}>Ngày kết thúc <span className="text-destructive">*</span></Label>
                <Input
                  id="couponEndDate"
                  type="date"
                  value={couponFormData.endDate}
                  onChange={(e) => setCouponFormData({ ...couponFormData, endDate: e.target.value })}
                  className={formErrors.endDate ? "border-destructive" : ""}
                />
                {formErrors.endDate && <p className="text-xs text-destructive animate-shake">{formErrors.endDate}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="couponActiveForm" checked={couponFormData.active} onCheckedChange={(checked) => setCouponFormData({ ...couponFormData, active: Boolean(checked) })} />
              <Label htmlFor="couponActiveForm" className="text-sm cursor-pointer">Kích hoạt coupon này ngay sau khi lưu</Label>
            </div>

            <div className="flex gap-3 pt-3 border-t mt-2">
              <Button onClick={handleCouponSubmit} className="flex-1">{editingCouponId ? "Cập nhật" : "Lưu"} coupon</Button>
              <Button variant="outline" onClick={resetCouponForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Danh sách Coupons --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Danh sách Coupons ({totalCoupons})</CardTitle>
          <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
              <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
              <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm theo mã hoặc mô tả..." value={couponSearchTerm} onChange={(e) => { setCouponSearchTerm(e.target.value); setCouponPage(1); }} className="h-9 text-sm" />
          </div>
        </CardHeader>

        <CardContent>
          {isFetchingCoupons ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
            coupons.length === 0 ? <div className="text-center py-6 text-muted-foreground">{couponSearchTerm ? "Không tìm thấy." : `Không có coupon nào (${filterStatus.toLowerCase()}).`}</div> :
              (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr className="border-b">
                          <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mã</th>
                          <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giá trị (%)</th>
                          <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giảm Tối Đa (₫)</th>
                          <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Đơn Tối Thiểu (₫)</th>
                          <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Lượt Dùng</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Bắt đầu</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Kết thúc</th>
                          <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                          {canEdit && (
                            <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map((coupon) => (
                          <tr key={coupon.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!coupon.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                            <td className="py-2 px-3 font-mono font-medium text-foreground">{coupon.code}</td>
                            <td className="py-2 px-3 text-right font-medium">{coupon.discountValue}%</td>
                            <td className="py-2 px-3 text-right text-muted-foreground">{coupon.maxDiscountAmount ? `${coupon.maxDiscountAmount.toLocaleString('vi-VN')}₫` : "-"}</td>
                            <td className="py-2 px-3 text-right text-muted-foreground">{coupon.minOrderAmount ? `${coupon.minOrderAmount.toLocaleString('vi-VN')}₫` : "-"}</td>
                            <td className="py-2 px-3 text-center text-muted-foreground">{coupon.usageLimit > 0 ? `${coupon.usedCount}/${coupon.usageLimit}` : `${coupon.usedCount}/∞`}</td>
                            <td className="py-2 px-3 text-muted-foreground">{coupon.startDate}</td>
                            <td className="py-2 px-3 text-muted-foreground">{coupon.endDate}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${coupon.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                                {coupon.active ? "Hoạt động" : "Ngừng HĐ"}
                              </span>
                            </td>

                            {canEdit && (
                              <td className="py-2 px-3">
                                <div className="flex gap-1.5 justify-center">
                                  <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEditCoupon(coupon)}><Edit2 size={14} /></Button>

                                  {coupon.active ? (
                                    <Button
                                      variant="outline" size="icon"
                                      className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10"
                                      title="Ngừng hoạt động"
                                      onClick={() => setDialogState({ isOpen: true, action: 'delete', coupon: coupon })}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="outline" size="icon"
                                        className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50"
                                        title="Kích hoạt lại"
                                        onClick={() => setDialogState({ isOpen: true, action: 'reactivate', coupon: coupon })}
                                      >
                                        <RotateCcw size={14} />
                                      </Button>

                                      {/* UI PERMISSION: CHỈ ADMIN & CHƯA CÓ LƯỢT DÙNG MỚI THẤY NÚT XÓA CỨNG */}
                                      {isAdmin && coupon.usedCount === 0 && (
                                        <Button
                                          variant="outline" size="icon"
                                          className="w-7 h-7 text-red-700 border-red-700 hover:bg-red-100/50 dark:text-red-500 dark:border-red-500 dark:hover:bg-red-900/30"
                                          title="XÓA VĨNH VIỄN (Chỉ Admin)"
                                          onClick={() => setDialogState({ isOpen: true, action: 'permanentDelete', coupon: coupon })}
                                        >
                                          <XCircle size={14} />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalCouponPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={couponPage} totalPages={totalCouponPages} onPageChange={setCouponPage} /></div>)}
                </>
              )}
        </CardContent>

        <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogState.action === 'delete' && "Xác nhận ngừng hoạt động?"}
                {dialogState.action === 'reactivate' && "Xác nhận kích hoạt lại?"}
                {dialogState.action === 'permanentDelete' && "Xác nhận XÓA VĨNH VIỄN?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dialogState.action === 'delete' && `Bạn có chắc muốn ngừng hoạt động coupon "${dialogState.coupon?.code}"?`}
                {dialogState.action === 'reactivate' && `Bạn có chắc muốn kích hoạt lại coupon "${dialogState.coupon?.code}"?`}
                {dialogState.action === 'permanentDelete' && (
                  <span className="text-red-600 font-medium dark:text-red-400">
                    Hành động này KHÔNG THỂ hoàn tác. Coupon "{dialogState.coupon?.code}" sẽ bị xóa vĩnh viễn.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDialog}>Hủy</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleConfirmAction}
                  variant={(dialogState.action === 'delete' || dialogState.action === 'permanentDelete') ? "destructive" : "default"}
                >
                  {dialogState.action === 'delete' && "Ngừng HĐ"}
                  {dialogState.action === 'reactivate' && "Kích hoạt"}
                  {dialogState.action === 'permanentDelete' && "Xóa vĩnh viễn"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </Card>
    </div>
  )
}