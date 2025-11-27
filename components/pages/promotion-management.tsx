"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, Percent, RotateCcw, XCircle } from "lucide-react";
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
interface PromotionResponse {
  id: number;
  name: string;
  description: string;
  discountValue: number; // %
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  productCount: number;
}

interface PromotionFormData {
  name: string;
  description: string;
  discountValue: number | string; // %
  startDate: string;
  endDate: string;
  active: boolean;
}

type PromotionFormErrors = Partial<Record<keyof PromotionFormData, string>>;

interface DialogState {
  isOpen: boolean;
  action: 'delete' | 'reactivate' | 'permanentDelete' | null;
  promotion: PromotionResponse | null;
}

const getLocalTodayStr = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000; 
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

// --- Component ---
export function PromotionManagement() {

  // --- Lấy user và quyền ---
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  // THÊM: Biến kiểm tra Admin
  const isAdmin = roles.includes("ADMIN");

  // --- States ---
  const [promotions, setPromotions] = useState<PromotionResponse[]>([]);
  const [promotionPage, setPromotionPage] = useState(1);
  const [totalPromotionPages, setTotalPromotionPages] = useState(0);
  const [totalPromotions, setTotalPromotions] = useState(0);

  const [promotionSearchTerm, setPromotionSearchTerm] = useState("");
  const [isFetchingPromotions, setIsFetchingPromotions] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  // Form Promotion
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [promotionFormData, setPromotionFormData] = useState<PromotionFormData>({
    name: "", description: "", discountValue: "", startDate: "", endDate: "", active: true,
  });

  // State lỗi
  const [formErrors, setFormErrors] = useState<PromotionFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // State dialog
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    action: null,
    promotion: null,
  });

  // --- API Fetching ---
  const fetchPromotions = useCallback(async () => {
    setIsFetchingPromotions(true);
    const query = new URLSearchParams();
    query.append("page", (promotionPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "createdAt,desc");
    query.append("status", filterStatus);
    if (promotionSearchTerm) query.append("search", promotionSearchTerm);

    try {
      const result = await manualFetchApi(`/v1/promotions?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        setPromotions(result.data.content || []); 
        setTotalPromotionPages(result.data.totalPages ?? 0);
        setTotalPromotions(result.data.totalElements ?? 0);
      } else throw new Error(result.message || "Lỗi tải khuyến mãi");
    } catch (err: any) {
      toast.error(`Lỗi tải Khuyến mãi (%): ${err.message}`);
    }
    finally { setIsFetchingPromotions(false); }
  }, [promotionPage, promotionSearchTerm, filterStatus]);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  // --- Handlers ---
  const resetPromotionForm = () => {
    setShowPromotionForm(false); setEditingPromotionId(null);
    setApiError(null);
    setFormErrors({});
    setPromotionFormData({ name: "", description: "", discountValue: "", startDate: "", endDate: "", active: true });
  }

  // Hàm Validate
  const validateForm = (): PromotionFormErrors => {
    const newErrors: PromotionFormErrors = {};
    const { name, discountValue, startDate, endDate, active } = promotionFormData;

    const todayStr = getLocalTodayStr();

    if (!name.trim()) {
      newErrors.name = "Tên khuyến mãi không được để trống.";
    }
    const discNum = Number(discountValue);
    if (isNaN(discNum) || discNum <= 0 || discNum > 100) {
      newErrors.discountValue = "Giá trị (%) phải là số lớn hơn 0 và nhỏ hơn hoặc bằng 100.";
    }
    if (!startDate) {
      newErrors.startDate = "Vui lòng chọn ngày bắt đầu.";
    }
    if (!endDate) {
      newErrors.endDate = "Vui lòng chọn ngày kết thúc.";
    } else if (startDate && startDate > endDate) {
      newErrors.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
    } else if (active && endDate < todayStr) {
      newErrors.endDate = "Nếu muốn kích hoạt (active), ngày kết thúc không được ở trong quá khứ.";
    }
    
    return newErrors;
  }

  // Submit Form (Tạo/Sửa)
  const handlePromotionSubmit = async () => {
    if (!canEdit) { toast.error("Bạn không có quyền thực hiện hành động này."); return; }
    setApiError(null); setFormErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      toast.error("Vui lòng kiểm tra lại các trường có lỗi.");
      return;
    }

    const isEditing = !!editingPromotionId;
    const url = isEditing ? `/v1/promotions/${editingPromotionId}` : `/v1/promotions`;
    const method = isEditing ? "PUT" : "POST";

    const requestBody = {
      ...promotionFormData,
      discountValue: Number(promotionFormData.discountValue),
    };

    try {
      const result = await manualFetchApi(url, {
        method,
        body: JSON.stringify(requestBody)
      });
      if (result.status === 'SUCCESS') {
        toast.success(isEditing ? "Cập nhật thành công!" : "Thêm thành công!");
        resetPromotionForm(); fetchPromotions();
      } else {
        throw new Error(result.message || (isEditing ? "Cập nhật thất bại" : "Thêm thất bại"));
      }
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes("đã tồn tại") || err.message.toLowerCase().includes("duplicate"))) {
        setFormErrors({ name: err.message }); 
        toast.error(err.message);
      } else {
        toast.error(`Lỗi: ${err.message}`);
        setApiError(err.message);
      }
    }
  };

  // Mở form Sửa
  const handleEditPromotion = (promo: PromotionResponse) => {
    if (!canEdit) { toast.error("Bạn không có quyền sửa."); return; }
    setPromotionFormData({
      name: promo.name, description: promo.description || "",
      discountValue: promo.discountValue, startDate: promo.startDate,
      endDate: promo.endDate, active: promo.active,
    });
    setEditingPromotionId(promo.id);
    setShowPromotionForm(true);
    setApiError(null);
    setFormErrors({});
  };

  // Đổi Tab
  const handleTabChange = (newStatus: string) => {
    setFilterStatus(newStatus); setPromotionPage(1);
    setPromotionSearchTerm(""); setPromotions([]);
  };

  // --- Logic Dialog Xác nhận ---
  const closeDialog = () => {
    setDialogState({ isOpen: false, action: null, promotion: null });
  };

  const handleConfirmAction = async () => {
    const { action, promotion } = dialogState;
    if (!promotion || !canEdit) { toast.error("Hành động không hợp lệ hoặc bạn không có quyền."); closeDialog(); return; };

    try {
      // 1. Ngừng hoạt động
      if (action === 'delete') {
        const result = await manualFetchApi(`/v1/promotions/${promotion.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') { toast.success("Đã ngừng hoạt động khuyến mãi."); fetchPromotions(); }
        else throw new Error(result.message || "Ngừng hoạt động thất bại");
      }

      // 2. Kích hoạt lại
      else if (action === 'reactivate') {
        const todayStr = getLocalTodayStr();
        if (promotion.endDate < todayStr) {
          toast.error(`Kích hoạt thất bại: Khuyến mãi "${promotion.name}" đã hết hạn.`);
          toast.info("Vui lòng bấm 'Sửa' (Edit) để gia hạn ngày kết thúc trước.");
          closeDialog();
          return; 
        }
        
        const url = `/v1/promotions/${promotion.id}`;
        const requestBody = {
          name: promotion.name, description: promotion.description, discountValue: promotion.discountValue,
          startDate: promotion.startDate, endDate: promotion.endDate, 
          active: true 
        };
        const result = await manualFetchApi(url, { method: "PUT", body: JSON.stringify(requestBody) });
        if (result.status === 'SUCCESS') { toast.success("Kích hoạt lại khuyến mãi thành công!"); fetchPromotions(); }
        else throw new Error(result.message || "Kích hoạt thất bại");
      }

      // 3. Xóa vĩnh viễn
      else if (action === 'permanentDelete') {
        // --- LOGIC MỚI: CHẶN MANAGER ---
        if (!isAdmin) {
          toast.error("Chỉ Admin mới có quyền xóa vĩnh viễn!");
          closeDialog();
          return;
        }

        if (promotion.productCount > 0) {
           toast.error("Không thể xóa vĩnh viễn KM đang có sản phẩm áp dụng.");
           closeDialog();
           return;
        }
        const result = await manualFetchApi(`/v1/promotions/permanent-delete/${promotion.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') { toast.success("Đã xóa vĩnh viễn khuyến mãi."); fetchPromotions(); }
        else throw new Error(result.message || "Xóa vĩnh viễn thất bại");
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
          <h1 className="text-2xl sm:text-3xl font-bold">Khuyến mãi (%)</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý chương trình giảm giá theo phần trăm</p>
        </div>
        {canEdit && (
          <Button onClick={() => { resetPromotionForm(); setShowPromotionForm(true); }} className="gap-1.5 self-start sm:self-center" size="sm">
            <Plus size={16} /> Thêm KM (%)
          </Button>
        )}
      </div>

      {/* Form Thêm/Sửa */}
      {showPromotionForm && canEdit && (
        <Card className="border-purple-500/50 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">{editingPromotionId ? "Chỉnh sửa KM (%)" : "Thêm KM (%) mới"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Lỗi API chung */}
            {apiError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">
                {apiError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tên khuyến mãi */}
              <div className="space-y-2">
                <Label htmlFor="promoName">Tên khuyến mãi <span className="text-destructive">*</span></Label>
                <Input
                  id="promoName"
                  placeholder="VD: Giảm giá hè 2024"
                  value={promotionFormData.name}
                  onChange={(e) => setPromotionFormData({ ...promotionFormData, name: e.target.value })}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive animate-shake">{formErrors.name}</p>
                )}
              </div>
              
              {/* Mô tả */}
              <div className="space-y-2">
                <Label htmlFor="promoDesc">Mô tả</Label>
                <Textarea
                  id="promoDesc"
                  placeholder="Mô tả chi tiết (tùy chọn)"
                  value={promotionFormData.description}
                  onChange={(e) => setPromotionFormData({ ...promotionFormData, description: e.target.value })}
                  className="min-h-[40px] md:min-h-[auto]"
                />
              </div>
            </div>

            {/* Phần trăm giảm */}
            <div className="space-y-2">
              <Label htmlFor="promoDiscount">Giá trị giảm (%) <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="promoDiscount"
                  placeholder="VD: 15"
                  type="number"
                  value={promotionFormData.discountValue}
                  min="1" max="100"
                  onChange={(e) => setPromotionFormData({ ...promotionFormData, discountValue: e.target.value })}
                  className={formErrors.discountValue ? "border-destructive" : ""}
                />
                <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              {formErrors.discountValue && (
                <p className="text-xs text-destructive animate-shake">{formErrors.discountValue}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ngày bắt đầu */}
              <div className="space-y-2">
                <Label htmlFor="promoStartDate" className={formErrors.startDate ? 'text-destructive' : ''}>Ngày bắt đầu <span className="text-destructive">*</span></Label>
                <Input
                  id="promoStartDate"
                  type="date"
                  value={promotionFormData.startDate}
                  onChange={(e) => setPromotionFormData({ ...promotionFormData, startDate: e.target.value })}
                  className={formErrors.startDate ? "border-destructive" : ""}
                />
                {formErrors.startDate && (
                  <p className="text-xs text-destructive animate-shake">{formErrors.startDate}</p>
                )}
              </div>
              {/* Ngày kết thúc */}
              <div className="space-y-2">
                <Label htmlFor="promoEndDate" className={formErrors.endDate ? 'text-destructive' : ''}>Ngày kết thúc <span className="text-destructive">*</span></Label>
                <Input
                  id="promoEndDate"
                  type="date"
                  value={promotionFormData.endDate}
                  onChange={(e) => setPromotionFormData({ ...promotionFormData, endDate: e.target.value })}
                  className={formErrors.endDate ? "border-destructive" : ""}
                />
                {formErrors.endDate && (
                  <p className="text-xs text-destructive animate-shake">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="promoActiveForm" checked={promotionFormData.active} onCheckedChange={(checked) => setPromotionFormData({ ...promotionFormData, active: Boolean(checked) })} />
              <Label htmlFor="promoActiveForm" className="text-sm cursor-pointer">Kích hoạt khuyến mãi này ngay</Label>
            </div>
            {/* Nút Form */}
            <div className="flex gap-3 pt-3 border-t mt-2">
              <Button onClick={handlePromotionSubmit} className="flex-1">{editingPromotionId ? "Cập nhật" : "Lưu"} khuyến mãi</Button>
              <Button variant="outline" onClick={resetPromotionForm} className="flex-1">Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Danh sách Promotions (Bảng) --- */}
      <Card className="shadow-sm">
        <CardHeader>
          {/* CẬP NHẬT: Hiển thị số lượng bản ghi */}
          <CardTitle className="text-xl font-semibold">Danh sách Khuyến mãi (%) ({totalPromotions})</CardTitle>
          
          <Tabs value={filterStatus} onValueChange={handleTabChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
              <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
              <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-3 flex gap-2 items-center">
            <Search size={18} className="text-muted-foreground" />
            <Input placeholder="Tìm theo tên khuyến mãi..." value={promotionSearchTerm} onChange={(e) => { setPromotionSearchTerm(e.target.value); setPromotionPage(1); }} className="h-9 text-sm" />
          </div>
        </CardHeader>
        
        <CardContent>
          {isFetchingPromotions ? <div className="text-center py-6 text-muted-foreground animate-pulse">Đang tải...</div> :
            promotions.length === 0 ? <div className="text-center py-6 text-muted-foreground">{promotionSearchTerm ? "Không tìm thấy." : `Không có KM nào (${filterStatus.toLowerCase()}).`}</div> :
              (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr className="border-b">
                          <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Tên Khuyến Mãi</th>
                          <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giảm (%)</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Bắt đầu</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Kết thúc</th>
                          <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Sản phẩm</th>
                          <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                          {canEdit && (
                            <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {promotions.map((promo) => (
                          <tr key={promo.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!promo.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                            
                            <td className="py-2 px-3 font-medium text-foreground">
                              {promo.name}
                              {promo.description && (
                                <p className="text-xs text-muted-foreground font-normal truncate max-w-xs">{promo.description}</p>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-medium">{promo.discountValue}%</td>
                            <td className="py-2 px-3 text-muted-foreground">{promo.startDate}</td>
                            <td className="py-2 px-3 text-muted-foreground">{promo.endDate}</td>
                            
                            <td className="py-2 px-3 text-center text-muted-foreground">
                              {promo.productCount}
                            </td>
                            
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${promo.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                                {promo.active ? "Hoạt động" : "Ngừng HĐ"}
                              </span>
                            </td>
                            
                            {canEdit && (
                              <td className="py-2 px-3">
                                <div className="flex gap-1.5 justify-center">
                                  <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa" onClick={() => handleEditPromotion(promo)}><Edit2 size={14} /></Button>
                                  {promo.active ? (
                                    <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động" onClick={() => setDialogState({ isOpen: true, action: 'delete', promotion: promo })}>
                                      <Trash2 size={14} />
                                    </Button>
                                  ) : (
                                    <>
                                      <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại" onClick={() => setDialogState({ isOpen: true, action: 'reactivate', promotion: promo })}>
                                        <RotateCcw size={14} />
                                      </Button>
                                      
                                      {/* UI PERMISSION: CHỈ ADMIN & CHƯA CÓ SP ÁP DỤNG MỚI THẤY NÚT XÓA CỨNG */}
                                      {isAdmin && promo.productCount === 0 && (
                                        <Button 
                                            variant="outline" size="icon" 
                                            className="w-7 h-7 text-red-700 border-red-700 hover:bg-red-100/50 dark:text-red-500 dark:border-red-500 dark:hover:bg-red-900/30" 
                                            title="XÓA VĨNH VIỄN (Chỉ Admin)" 
                                            onClick={() => setDialogState({ isOpen: true, action: 'permanentDelete', promotion: promo })}
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
                  {totalPromotionPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={promotionPage} totalPages={totalPromotionPages} onPageChange={setPromotionPage} /></div>)}
                </>
              )}
        </CardContent>

        {/* Dialog Xác nhận */}
        <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogState.action === 'delete' && "Xác nhận ngừng hoạt động?"}
                {dialogState.action === 'reactivate' && "Xác nhận kích hoạt lại?"}
                {dialogState.action === 'permanentDelete' && "Xác nhận XÓA VĨNH VIỄN?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dialogState.action === 'delete' && `Bạn có chắc muốn ngừng hoạt động KM "${dialogState.promotion?.name}"?`}
                {dialogState.action === 'reactivate' && `Bạn có chắc muốn kích hoạt lại KM "${dialogState.promotion?.name}"?`}
                {dialogState.action === 'permanentDelete' && (
                  <span className="text-red-600 font-medium dark:text-red-400">
                    Hành động này KHÔNG THỂ hoàn tác. KM "{dialogState.promotion?.name}" sẽ bị xóa vĩnh viễn (vì không còn sản phẩm nào áp dụng).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDialog}>Hủy</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleConfirmAction}
                  variant={ (dialogState.action === 'delete' || dialogState.action === 'permanentDelete') ? "destructive" : "default" }
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