"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import { AdminOrderDetailDTO, OrderStatus, PaymentStatus } from "@/types/adminOrderDTO";
import {
  Loader2,
  Package,
  MapPin,
  PhoneCall,
  ScrollText,
  CheckCircle,
  Ban,
  AlertCircle,
  CreditCard // <-- 1. ĐÃ THÊM ICON
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// --- Helper API Call (Giữ nguyên) ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const manualFetchApi = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState();
  if (!token) throw new Error("Bạn cần đăng nhập");
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  const responseData = await response.json();
  if (!response.ok || responseData.status !== 'SUCCESS') {
    throw new Error(responseData.message || "Có lỗi xảy ra");
  }
  return responseData;
};
// ---

// --- Labels và Colors (Giữ nguyên) ---
const statusColors: Record<OrderStatus, string> = {
  PENDING: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  CONFIRMED: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  SHIPPING: "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  DELIVERED: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
  COMPLETED: "border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-300",
  CANCELLED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
  DISPUTE: "border-orange-600/50 bg-orange-600/10 text-orange-700 dark:text-orange-400 font-semibold"
};
const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  DISPUTE: "Khiếu nại"
};
const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  PENDING_REFUND: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền"
};
const paymentStatusColors: Record<PaymentStatus, string> = {
  PENDING: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  PAID: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
  FAILED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
  PENDING_REFUND: "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  REFUNDED: "border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-300"
};
const formatCurrency = (amount: number) => `₫${amount.toLocaleString('vi-VN')}`;
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

  // fetchDetail (Giữ nguyên)
  const fetchDetail = useCallback(async (id: string) => {
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
  }, [router]);

  // useEffect (Giữ nguyên)
  useEffect(() => {
    if (!orderId) {
      return;
    }
    if (isAuthenticated) {
      fetchDetail(orderId as string);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, orderId, fetchDetail]);

  // --- (Các hàm handle... giữ nguyên) ---
  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    setIsUpdating(true);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${order.id}/cancel`, { method: 'PUT' });
      setOrder(prev => prev ? { ...prev, orderStatus: 'CANCELLED' } : null);
      toast.success("Đã hủy đơn hàng thành công.");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi hủy đơn hàng.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    if (!confirm("Xác nhận bạn đã nhận được hàng?")) return;
    setIsUpdating(true);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${order.id}/complete`, { method: 'PUT' });
      setOrder(prev => prev ? { ...prev, orderStatus: 'COMPLETED' } : null);
      toast.success("Xác nhận thành công! Cảm ơn bạn đã mua sắm.");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xác nhận.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReportIssue = async () => {
    if (!order) return;
    if (!confirm("Bạn muốn báo cáo vấn đề (chưa nhận được hàng) với đơn hàng này?")) return;
    setIsUpdating(true);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${order.id}/report-issue`, { method: 'PUT' });
      setOrder(prev => prev ? { ...prev, orderStatus: 'DISPUTE' } : null);
      toast.success("Đã gửi khiếu nại. Chúng tôi sẽ liên hệ với bạn.");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gửi khiếu nại.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- 2. HÀM MỚI ĐỂ THANH TOÁN LẠI ---
  const handleRetryPayment = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      // API này sẽ tạo lại link VNPAY cho đơn hàng cũ
      const response = await manualFetchApi(
        `/v1/payment/${order.id}/retry-vnpay`, // API MỚI CẦN TẠO Ở BACKEND
        { method: 'POST' }
      );

      const paymentUrl = response.data.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl; // Chuyển hướng sang VNPAY
      } else {
        throw new Error("Không thể tạo link thanh toán.");
      }

    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thử thanh toán lại.");
      setIsUpdating(false); // Tắt loading nếu lỗi
    }
  };

  // Logic Render (Giữ nguyên)
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

  // --- 3. SỬA LẠI HÀM RENDERUSERACTIONS ---
  const renderUserActions = () => {
    switch (order.orderStatus) {
      case "PENDING":
        // Logic mới: Kiểm tra PENDING của VNPAY hay COD
if (order.paymentMethod === 'VNPAY' && (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED')) {          // Đây là đơn VNPAY đang chờ thanh toán
          return (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="destructive" onClick={handleCancelOrder} disabled={isUpdating}>
                <Ban className="w-4 h-4 mr-2" /> Hủy đơn
              </Button>
              <Button onClick={handleRetryPayment} disabled={isUpdating}>
                {isUpdating
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <CreditCard className="w-4 h-4 mr-2" />
                }
                Thanh toán lại
              </Button>
            </div>
          );
        }

        // Đây là đơn COD PENDING (hoặc VNPAY FAILED)
        // Chỉ cho phép Hủy
        return (
          <Button variant="destructive" onClick={handleCancelOrder} disabled={isUpdating}>
            <Ban className="w-4 h-4 mr-2" /> Hủy đơn hàng
          </Button>
        );

      case "CONFIRMED":
        // Đơn COD đã xác nhận (VNPAY PENDING không rơi vào đây)
        return (
          <Button variant="destructive" onClick={handleCancelOrder} disabled={isUpdating}>
            <Ban className="w-4 h-4 mr-2" /> Hủy đơn hàng
          </Button>
        );

      case "DELIVERED":
        // (Giữ nguyên logic của bạn)
        return (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="destructive" onClick={handleReportIssue} disabled={isUpdating}>
              <AlertCircle className="w-4 h-4 mr-2" /> Tôi chưa nhận được hàng
            </Button>
            <Button onClick={handleConfirmDelivery} disabled={isUpdating}>
              <CheckCircle className="w-4 h-4 mr-2" /> Đã nhận được hàng
            </Button>
          </div>
        );
      default:
        // Các trạng thái CANCELLED, COMPLETED, DISPUTE... không có action
        return null;
    }
  };

  // Render nội dung (ĐÃ ĐƯỢC DỌN DẸP SẠCH SẼ)
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
            {/* Thông tin chung */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Package size={14} /> Mã đơn hàng</p>
                <p className="font-semibold text-base">{order.orderNumber}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">Ngày đặt</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">Trạng thái ĐH</p>
                <Badge variant="outline" className={`text-xs ${statusColors[order.orderStatus]}`}>{statusLabels[order.orderStatus]}</Badge>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={14} /> Địa chỉ giao hàng</p>
                <p className="font-medium">{order.address || "-"}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">P.Thức TT</p>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">Trạng thái TT</p>
                <Badge variant="outline" className={`text-xs ${paymentStatusColors[order.paymentStatus]}`}>{paymentStatusLabels[order.paymentStatus]}</Badge>
              </div>
              {(order.note) && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><ScrollText size={14} /> Ghi chú của khách</p>
                  <p className="font-medium text-sm italic">{order.note}</p>
                </div>
              )}
            </div>

            {/* Chi tiết Thanh toán */}
            <div className="border rounded-md p-4 space-y-2 text-sm bg-muted/30">
              <h4 className="font-semibold mb-2 text-base">Chi tiết thanh toán</h4>
              <div className="flex justify-between"><span>Tiền hàng ({order.items.length} SP):</span> <span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Phí vận chuyển:</span> <span>{formatCurrency(order.shippingFee)}</span></div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-destructive"> <span>Giảm giá:</span> <span>- {formatCurrency(order.couponDiscount)}</span> </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-base"><span>Tổng cộng:</span> <span>{formatCurrency(order.totalAmount)}</span></div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-base">Sản phẩm trong đơn</h4>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.variantId} className="flex items-start gap-3 border-b pb-3 last:border-b-0">
                    <img src={item.imageUrl || "/placeholder.svg"} alt={item.productName} className="w-16 h-16 object-cover rounded border flex-shrink-0" />
                    <div className="flex-1 text-sm min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.variantInfo}</p>
                      <p className="text-xs text-muted-foreground">SL: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-semibold text-right flex-shrink-0 w-28">
                      {formatCurrency(item.price * item.quantity)}
                      {item.quantity > 1 && (<p className="text-xs text-muted-foreground font-normal mt-0.5">{formatCurrency(item.price)} / SP</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* --- NÚT HÀNH ĐỘNG CỦA USER --- */}
            <div className="flex justify-end pt-4 border-t">
              {renderUserActions()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}