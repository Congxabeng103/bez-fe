"use client";

import { useAuthStore } from "@/lib/authStore";
import { OrderCard } from "@/components/store/order-card";
import { Button, buttonVariants } from "@/components/ui/button"; // Sửa: Thêm buttonVariants
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageResponseDTO, UserOrderDTO, OrderStatus } from "@/types/userOrderDTO"; 

// --- 1. THÊM CÁC IMPORT CHO POPUP ---
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

// --- Helper API Call (Giữ nguyên) ---
const API_URL = process.env.NEXT_PUBLIC_API_URL;
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
// --- Hết Helper ---

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [orders, setOrders] = useState<UserOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, size: 5 });

  // State loading cho các nút trên card
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

  // --- 2. THÊM STATE CHO POPUP KHIẾU NẠI ---
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingOrderId, setReportingOrderId] = useState<number | null>(null);

  // fetchMyOrders (Giữ nguyên)
  const fetchMyOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await manualFetchApi(
        `/v1/orders/my-orders?page=${pagination.page}&size=${pagination.size}`
      );
      const data: PageResponseDTO<UserOrderDTO> = response.data;
      setOrders(data.content);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages
      }));
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.size]);

  // useEffect (Giữ nguyên)
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchMyOrders]);

  // HÀM CẬP NHẬT TRẠNG THÁI (Giữ nguyên)
  const updateOrderStatusInList = (orderId: number, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderId ? { ...o, orderStatus: newStatus } : o
      )
    );
  };

  // HÀM THANH TOÁN LẠI (Giữ nguyên)
  const handleRetryPayment = async (orderId: number) => {
    setProcessingOrderId(orderId); 
    try {
      const response = await manualFetchApi(
        `/v1/payment/${orderId}/retry-vnpay`,
        { method: 'POST' }
      );
      const paymentUrl = response.data.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không thể tạo link thanh toán.");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thử thanh toán lại.");
      setProcessingOrderId(null); 
    }
  };

  // HÀM XÁC NHẬN ĐÃ NHẬN HÀNG (Giữ nguyên)
  const handleConfirmDelivery = async (orderId: number) => {
    // (Tùy chọn: Bạn cũng có thể thêm 1 popup xác nhận cho hành động này)
    setProcessingOrderId(orderId);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${orderId}/complete`, { method: 'PUT' });
      toast.success("Xác nhận đã nhận hàng thành công!");
      updateOrderStatusInList(orderId, 'COMPLETED');
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xác nhận.");
    } finally {
      setProcessingOrderId(null); 
    }
  };

  // --- 3. REFACTOR HÀM KHIẾU NẠI ---

  // Hàm MỚI: Mở popup khiếu nại
  const openReportDialog = (orderId: number) => {
    setReportingOrderId(orderId);
    setReportReason(""); // Xóa lý do cũ
    setIsReportDialogOpen(true);
  };

  // Hàm MỚI: Đóng popup
  const closeReportDialog = () => {
    if (processingOrderId) return; // Không cho đóng khi đang gửi
    setIsReportDialogOpen(false);
    setReportingOrderId(null);
  };

  // Hàm MỚI: Gửi khiếu nại (logic từ `handleReportIssue` cũ)
  const handleSubmitReport = async () => {
    // 1. Kiểm tra
    if (!reportingOrderId) return;
    if (reportReason.trim() === "") {
      toast.error("Vui lòng nhập nội dung khiếu nại.");
      return; // Không đóng popup
    }

    setProcessingOrderId(reportingOrderId); // Bật loading
    try {
      // 2. Gửi API với 'body'
      await manualFetchApi(`/v1/orders/my-orders/${reportingOrderId}/report-issue`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }) // Gửi DisputeRequestDTO
      });
      
      toast.success("Đã gửi khiếu nại. Chúng tôi sẽ liên hệ với bạn.");
      updateOrderStatusInList(reportingOrderId, 'DISPUTE');
      closeReportDialog(); // Đóng popup SAU KHI thành công
      
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gửi khiếu nại.");
      // Không đóng popup nếu lỗi
    } finally {
      // Chỉ tắt loading nếu API đã xong (dù thành công hay thất bại)
      // Nếu thành công, `processingOrderId` đã được set null ở trên
      if (reportingOrderId) {
         setProcessingOrderId(null);
      }
    }
  };

  // --- HẾT REFACTOR ---


  // Loading (Giữ nguyên)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Render (Giữ nguyên)
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Package className="w-8 h-8" />
            Đơn hàng của tôi
          </h1>
          <p className="text-muted-foreground">Theo dõi và quản lý các đơn hàng của bạn</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-muted-foreground mb-6">Hãy bắt đầu mua sắm để tạo đơn hàng đầu tiên!</p>
            <Link href="/products">
              <Button>Tiếp tục mua sắm</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* --- 4. SỬA CHỖ NÀY: TRUYỀN HÀM MỞ POPUP --- */}
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                
                // Props cho nút "Thanh toán lại"
                onRetryPayment={handleRetryPayment}
                
                // Props cho nút "Đã nhận hàng"
                onConfirmDelivery={handleConfirmDelivery}
                
                // Props cho nút "Khiếu nại" (Dùng hàm MỚI)
                onReportIssue={openReportDialog} 
                
                // Báo cho Card biết nó có đang loading hay không
                isProcessing={processingOrderId === order.id}
              />
            ))}

          </div>
        )}
      </div>

      {/* --- 5. THÊM POPUP XÁC NHẬN KHIẾU NẠI --- */}
      <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gửi khiếu nại cho đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng mô tả chi tiết vấn đề bạn gặp phải (ví dụ: sai sản phẩm, 
              sản phẩm lỗi, hư hỏng...). Chúng tôi sẽ xem xét và liên hệ lại với bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Ô nhập lý do */}
          <div className="py-2">
            <Textarea
              id="reportReason"
              placeholder="Nhập nội dung khiếu nại (bắt buộc)..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={5}
              className="resize-none"
              autoFocus
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeReportDialog} disabled={processingOrderId !== null}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitReport}
              disabled={processingOrderId !== null || reportReason.trim() === ""}
              className={cn(buttonVariants({ variant: "destructive" }))} // Nút màu đỏ
            >
              {processingOrderId === reportingOrderId ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              Gửi khiếu nại
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}