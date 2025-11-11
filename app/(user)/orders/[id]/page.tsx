"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import {
  // (Đây là DTO/Enum gốc của bạn)
  OrderStatus,
  PaymentStatus,
} from "@/types/adminOrderDTO";
import {
  Loader2,
  Package,
  MapPin,
  ScrollText,
  CheckCircle,
  Ban,
  AlertCircle,
  CreditCard,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button"; // <-- 1. THÊM buttonVariants
import { manualFetchApi } from "@/lib/api";

// --- 2. THÊM IMPORT CHO POPUP ---
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
import { Textarea } from "@/components/ui/textarea"; // Dùng cho lý do
import { cn } from "@/lib/utils"; // Dùng cho cn
// ---

// --- SỬA LẠI TYPE DTO (Giữ nguyên như bạn cung cấp) ---
type AdminOrderDetailDTO = {
  id: number;
  orderNumber: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  address: string;
  note?: string; 
  subtotal: number;
  shippingFee: number;
  couponDiscount: number;
  totalAmount: number;
  items: any[]; 

  cancellationReason?: string; // <-- LÝ DO HỦY
  disputeReason?: string; // <-- LÝ DO KHIẾU NẠI
};
// ---

type OrderAuditLogResponseDTO = {
  id: number;
  staffName: string;
  description: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
};

// --- (Các hằng số Labels và Colors giữ nguyên) ---
const statusColors: Record<OrderStatus, string> = {
  PENDING:
    "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  CONFIRMED:
    "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  SHIPPING:
    "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  DELIVERED:
    "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
  COMPLETED:
    "border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-300",
  CANCELLED:
    "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
  DISPUTE:
    "border-orange-600/50 bg-orange-600/10 text-orange-700 dark:text-orange-400 font-semibold",
};
const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  DISPUTE: "Khiếu nại",
};
const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  PENDING_REFUND: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};
const paymentStatusColors: Record<PaymentStatus, string> = {
  PENDING:
    "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  PAID:
    "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
  FAILED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
  PENDING_REFUND:
    "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  REFUNDED:
    "border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-300",
};
const formatCurrency = (amount: number) =>
  `₫${amount.toLocaleString("vi-VN")}`;
// ---

// --- SỬA HÀM "BIÊN DỊCH" LOG (Giữ nguyên logic của bạn) ---
const formatUserTimelineMessage = (
  log: OrderAuditLogResponseDTO
): string | null => {

  if (log.description.includes("Lý do:")) {
    return log.description;
  }
  
  if (log.fieldChanged === "orderStatus") {
    switch (log.newValue) {
      case "CONFIRMED":
        return "Đơn hàng của bạn đã được xác nhận.";
      case "SHIPPING":
        return "Đơn hàng của bạn đang trên đường vận chuyển.";
      case "DELIVERED":
        return "Đơn hàng đã được giao thành công. Vui lòng kiểm tra và xác nhận.";
      case "COMPLETED":
        if (log.staffName === "Khách hàng") {
          return "Bạn đã xác nhận nhận hàng. Cảm ơn bạn đã mua sắm!";
        } else {
          return "Đơn hàng đã được hoàn tất.";
        }
      case "CANCELLED":
        return "Đơn hàng của bạn đã bị hủy."; 
      case "DISPUTE":
        return "Đơn hàng đang có khiếu nại."; 
    }
  }

  if (log.fieldChanged === "paymentStatus") {
    if (log.newValue === "PAID") {
      return "Thanh toán thành công!";
    }
    if (log.newValue === "REFUNDED") {
      return "Yêu cầu hoàn tiền của bạn đã được xử lý thành công.";
    }
    if (
      log.oldValue === "PENDING_REFUND" &&
      log.newValue === "PENDING_REFUND"
    ) {
      return "Yêu cầu hoàn tiền của bạn xử lý thất bại. Chúng tôi sẽ liên hệ lại.";
    }
  }

  if (log.description.includes("Đơn hàng đã được tạo")) {
    return "Đơn hàng đã được đặt thành công. Chờ xử lý...";
  }

  return null;
};
// ---

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paramId = Array.isArray(params.id) ? params.id[0] : params.id;
  const orderId = paramId;

  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<AdminOrderDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<OrderAuditLogResponseDTO[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);

  // --- 3. THÊM STATE CHO DIALOG ---
  const [reasonInput, setReasonInput] = useState("");

  type DialogConfigState = {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    confirmVariant: "default" | "destructive";
    // Phần mở rộng cho nhập liệu
    requiresReason: boolean;
    reasonLabel?: string;
    reasonPlaceholder?: string;
    isReasonRequired?: boolean;
    // Dữ liệu cho hành động
    actionType: 'cancel' | 'report' | 'confirmDelivery' | 'none';
  };
  
  const initialDialogConfig: DialogConfigState = {
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Xác nhận",
    confirmVariant: "default",
    requiresReason: false,
    actionType: 'none',
  };
  
  const [dialogConfig, setDialogConfig] = useState<DialogConfigState>(initialDialogConfig);

  // Hàm đóng/mở dialog
  const closeDialog = () => {
    if (isUpdating) return; // Không cho đóng khi đang update
    setDialogConfig(initialDialogConfig);
    setReasonInput("");
  };

  // Hàm mở dialog
  const openDialog = (type: 'cancel' | 'report' | 'confirmDelivery') => {
    if (!order) return;

    switch (type) {
      case 'cancel':
        setDialogConfig({
          isOpen: true,
          title: "Xác nhận Hủy Đơn hàng",
          description: "Bạn có chắc muốn hủy đơn hàng này? Vui lòng cung cấp lý do bên dưới.",
          confirmText: "Xác nhận Hủy",
          confirmVariant: "destructive",
          requiresReason: true,
          reasonLabel: "Lý do hủy (bắt buộc)",
          reasonPlaceholder: "Nhập lý do bạn muốn hủy đơn...",
          isReasonRequired: true,
          actionType: 'cancel',
        });
        break;
      case 'report':
        setDialogConfig({
          isOpen: true,
          title: "Gửi Khiếu nại / Báo cáo sự cố",
          description: "Vui lòng mô tả chi tiết vấn đề bạn gặp phải (ví dụ: sai sản phẩm, hư hỏng...).",
          confirmText: "Gửi Khiếu nại",
          confirmVariant: "destructive",
          requiresReason: true,
          reasonLabel: "Nội dung khiếu nại (bắt buộc)",
          reasonPlaceholder: "Nhập chi tiết sự cố...",
          isReasonRequired: true,
          actionType: 'report',
        });
        break;
      case 'confirmDelivery':
        setDialogConfig({
          isOpen: true,
          title: "Xác nhận Đã nhận hàng",
          description: "Bạn có chắc chắn đã nhận được đơn hàng này và không có vấn đề gì không?",
          confirmText: "Đã nhận hàng",
          confirmVariant: "default",
          requiresReason: false,
          actionType: 'confirmDelivery',
        });
        break;
    }
  };
  // --- KẾT THÚC STATE DIALOG ---

  // fetchDetail (Giữ nguyên)
  const fetchDetail = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const response = await manualFetchApi(`/v1/orders/my-orders/${id}`);
        setOrder(response.data as AdminOrderDetailDTO);
      } catch (err: any) {
        toast.error(err.message || "Không tìm thấy đơn hàng.");
        router.push("/orders");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // fetchHistory (Giữ nguyên)
  const fetchHistory = useCallback(async (id: string) => {
    setIsFetchingHistory(true);
    try {
      const response = await manualFetchApi(
        `/v1/orders/my-orders/${id}/history`
      );
      setHistoryLogs(response.data as OrderAuditLogResponseDTO[]);
    } catch (err: any) {
      console.error("Lỗi khi tải lịch sử đơn hàng:", err);
    } finally {
      setIsFetchingHistory(false);
    }
  }, []);

  // useEffect (Giữ nguyên)
  useEffect(() => {
    if (!orderId) return;
    if (isAuthenticated) {
      fetchDetail(orderId as string);
      fetchHistory(orderId as string);
    } else {
      setIsLoading(false);
      setIsFetchingHistory(false);
    }
  }, [isAuthenticated, orderId, fetchDetail, fetchHistory]);

  // --- 4. SỬA LẠI HÀM HỦY ĐƠN (NHẬN REASON) ---
  const handleCancelOrder = async (reason: string) => {
    if (!order) return;
    
    // (Đã xóa prompt)
    if (!reason || reason.trim() === "") {
        toast.error("Lý do hủy không được để trống.");
        return;
    }

    setIsUpdating(true);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${order.id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ reason: reason }) 
      });
      
      toast.success("Đã hủy đơn hàng thành công.");
      await fetchDetail(order.id.toString()); 
      fetchHistory(order.id.toString());
      closeDialog(); // <-- Đóng dialog
      
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi hủy đơn hàng.");
    } finally {
      setIsUpdating(false);
    }
  };

  // handleConfirmDelivery (Sửa: Tách logic khỏi confirm())
  const handleConfirmDelivery = async () => {
    if (!order) return;
    // (Đã xóa confirm())
    setIsUpdating(true);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${order.id}/complete`, {
        method: "PUT",
      });
      toast.success("Xác nhận thành công! Cảm ơn bạn đã mua sắm.");
      await fetchDetail(order.id.toString()); 
      fetchHistory(order.id.toString());
      closeDialog(); // <-- Đóng dialog
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xác nhận.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- 5. SỬA LẠI HÀM KHIẾU NẠI (NHẬN REASON) ---
  const handleReportIssue = async (reason: string) => {
    if (!order) return;

    // (Đã xóa prompt)
    if (!reason || reason.trim() === "") {
      toast.error("Nội dung khiếu nại không được để trống.");
      return;
    }

    setIsUpdating(true);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${order.id}/report-issue`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason }) 
      });

      toast.success("Đã gửi khiếu nại. Chúng tôi sẽ liên hệ với bạn.");
      await fetchDetail(order.id.toString()); 
      fetchHistory(order.id.toString());
      closeDialog(); // <-- Đóng dialog
      
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gửi khiếu nại.");
    } finally {
      setIsUpdating(false);
    }
  };

  // handleRetryPayment (Giữ nguyên)
  const handleRetryPayment = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const response = await manualFetchApi(
        `/v1/payment/${order.id}/retry-vnpay`,
        { method: "POST" }
      );
      const paymentUrl = response.data.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không thể tạo link thanh toán.");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thử thanh toán lại.");
      setIsUpdating(false);
    }
  };
  
  // --- 6. HÀM XÁC NHẬN MỚI CỦA DIALOG ---
  const handleConfirmAction = () => {
    const { actionType, isReasonRequired } = dialogConfig;

    // Kiểm tra lý do
    if (isReasonRequired && !reasonInput.trim()) {
      toast.error("Vui lòng nhập nội dung bắt buộc.");
      return; // Không đóng, không làm gì cả
    }

    // Gọi đúng hàm
    switch (actionType) {
      case 'cancel':
        handleCancelOrder(reasonInput);
        break;
      case 'report':
        handleReportIssue(reasonInput);
        break;
      case 'confirmDelivery':
        handleConfirmDelivery();
        break;
    }
    
    // (Các hàm con sẽ tự đóng dialog khi thành công)
  };

  // Logic Render (Loading... / Not Found) (Giữ nguyên)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>
          {!isAuthenticated
            ? "Bạn cần đăng nhập để xem đơn hàng."
            : "Không tìm thấy đơn hàng."}
        </p>
      </div>
    );
  }

  // --- 7. SỬA LẠI NÚT KHIẾU NẠI (GỌI openDialog) ---
  const renderUserActions = () => {
    switch (order.orderStatus) {
      case "PENDING":
        if (
          order.paymentMethod === "VNPAY" &&
          (order.paymentStatus === "PENDING" ||
            order.paymentStatus === "FAILED")
        ) {
          // Đơn VNPAY đang chờ thanh toán
          return (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="destructive"
                onClick={() => openDialog('cancel')} // <-- SỬA
                disabled={isUpdating}
              >
                <Ban className="w-4 h-4 mr-2" /> Hủy đơn
              </Button>
              <Button onClick={handleRetryPayment} disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Thanh toán lại
              </Button>
            </div>
          );
        }
        // Đơn COD PENDING
        return (
          <Button
            variant="destructive"
            onClick={() => openDialog('cancel')} // <-- SỬA
            disabled={isUpdating}
          >
            <Ban className="w-4 h-4 mr-2" /> Hủy đơn hàng
          </Button>
        );
      case "CONFIRMED":
        return (
          <Button
            variant="destructive"
            onClick={() => openDialog('cancel')} // <-- SỬA
            disabled={isUpdating}
          >
            <Ban className="w-4 h-4 mr-2" /> Hủy đơn hàng
          </Button>
        );
      case "DELIVERED":
        return (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="destructive"
              onClick={() => openDialog('report')} // <-- SỬA
              disabled={isUpdating}
            >
              <AlertCircle className="w-4 h-4 mr-2" /> 
              Khiếu nại / Báo cáo
            </Button>
            <Button onClick={() => openDialog('confirmDelivery')} disabled={isUpdating}> {/* <-- SỬA */}
              <CheckCircle className="w-4 h-4 mr-2" /> Đã nhận được hàng
            </Button>
          </div>
        );
      case "DISPUTE":
        return (
          <Button onClick={() => openDialog('confirmDelivery')} disabled={isUpdating}> {/* <-- SỬA */}
            <CheckCircle className="w-4 h-4 mr-2" />
            Xác nhận Đã nhận được hàng
          </Button>
        );
      default:
        // CANCELLED, COMPLETED... không có action
        return null;
    }
  };

  // Biến chứa log (Giữ nguyên)
  const userFriendlyLogs = historyLogs
    .map(log => ({
      id: log.id,
      message: formatUserTimelineMessage(log),
      createdAt: log.createdAt
    }))
    .filter(log => log.message !== null && log.message !== "");
  // ---

  // --- 8. SỬA LẠI PHẦN RENDER JSX (Thêm Dialog) ---
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="w-full bg-card shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <CardTitle className="text-lg font-semibold">
              Chi tiết đơn hàng #{order.orderNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Thông tin chung (Giữ nguyên) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package size={14} /> Mã đơn hàng
                </p>
                <p className="font-semibold text-base">{order.orderNumber}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">Ngày đặt</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleString("vi-VN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">Trạng thái ĐH</p>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[order.orderStatus]}`}
                >
                  {statusLabels[order.orderStatus]}
                </Badge>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin size={14} /> Địa chỉ giao hàng
                </p>
                <p className="font-medium">{order.address || "-"}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">P.Thức TT</p>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">Trạng thái TT</p>
                <Badge
                  variant="outline"
                  className={`text-xs ${paymentStatusColors[order.paymentStatus]
                    }`}
                >
                  {paymentStatusLabels[order.paymentStatus]}
                </Badge>
              </div>
            </div>

            {/* --- THÊM 3 KHỐI HIỂN THỊ LÝ DO (Giữ nguyên) --- */}
            
            {/* 1. GHI CHÚ CỦA KHÁCH */}
            {order.note && (
              <div className="border rounded-md p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                    <ScrollText size={16} /> Ghi chú của khách hàng:
                  </h4>
                  <p className="text-sm text-blue-600 italic pt-1 pl-6">{order.note}</p>
              </div>
            )}

            {/* 2. LÝ DO HỦY */}
            {order.orderStatus === 'CANCELLED' && order.cancellationReason && (
              <div className="border rounded-md p-4 bg-red-50 border-red-200">
                  <h4 className="font-semibold text-red-700">Lý do hủy đơn hàng:</h4>
                  <p className="text-sm text-red-600 italic pt-1">{order.cancellationReason}</p>
              </div>
            )}
            
            {/* 3. LÝ DO KHIẾU NẠI */}
            {order.orderStatus === 'DISPUTE' && order.disputeReason && (
              <div className="border rounded-md p-4 bg-orange-50 border-orange-200">
                  <h4 className="font-semibold text-orange-700">Nội dung khiếu nại:</h4>
                  <p className="text-sm text-orange-600 italic pt-1">{order.disputeReason}</p>
              </div>
            )}
            {/* --- KẾT THÚC THÊM --- */}

            {/* Chi tiết Thanh toán (Giữ nguyên) */}
            <div className="border rounded-md p-4 space-y-2 text-sm bg-muted/30">
              <h4 className="font-semibold mb-2 text-base">
                Chi tiết thanh toán
              </h4>
              <div className="flex justify-between">
                <span>Tiền hàng ({order.items.length} SP):</span>{" "}
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>{" "}
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-destructive">
                  {" "}
                  <span>Giảm giá:</span>{" "}
                  <span>- {formatCurrency(order.couponDiscount)}</span>{" "}
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-base">
                <span>Tổng cộng:</span>{" "}
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {/* Danh sách sản phẩm (Giữ nguyên) */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-base">
                Sản phẩm trong đơn
              </h4>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-start gap-3 border-b pb-3 last:border-b-0"
                  >
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded border flex-shrink-0"
                    />
                    <div className="flex-1 text-sm min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.variantInfo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SL: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-right flex-shrink-0 w-28">
                      {formatCurrency(item.price * item.quantity)}
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          {formatCurrency(item.price)} / SP
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline (Giữ nguyên) */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4 text-base">
                Lịch sử đơn hàng
              </h4>
              {isFetchingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : userFriendlyLogs.length > 0 ? (
                <ul className="space-y-4">
                  {userFriendlyLogs.map((log) => (
                    <li key={log.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có cập nhật nào cho đơn hàng này.
                </p>
              )}
            </div>

            {/* Nút hành động (Giữ nguyên) */}
            <div className="flex justify-end pt-4 border-t">
              {renderUserActions()}
            </div>
          </CardContent>
        </Card>
        
        {/* --- 9. THÊM POPUP XÁC NHẬN CHUNG --- */}
        <AlertDialog open={dialogConfig.isOpen} onOpenChange={closeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogConfig.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {dialogConfig.description}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* THÊM PHẦN NHẬP LIỆU */}
            {dialogConfig.requiresReason && (
              <div className="space-y-2 pt-2">
                <label htmlFor="dialogReasonInput" className="text-sm font-medium text-foreground/80">
                  {dialogConfig.reasonLabel}
                </label>
                <Textarea
                  id="dialogReasonInput"
                  placeholder={dialogConfig.reasonPlaceholder}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  rows={4}
                  className="resize-none"
                  autoFocus
                />
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDialog} disabled={isUpdating}>
                 Hủy
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmAction}
                disabled={
                   isUpdating ||
                   (dialogConfig.isReasonRequired && !reasonInput.trim())
                }
                className={cn(
                  buttonVariants({ variant: dialogConfig.confirmVariant }),
                )}
              >
                 {isUpdating ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                 ) : null}
                {dialogConfig.confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}