"use client";

import { useAuthStore } from "@/lib/authStore";
import { OrderCard } from "@/components/store/order-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
// Sửa: Thêm OrderStatus để dùng trong hàm update
import { PageResponseDTO, UserOrderDTO, OrderStatus } from "@/types/userOrderDTO"; 

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
// --- Hết Helper ---

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [orders, setOrders] = useState<UserOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, size: 5 });

  // --- 1. SỬA: DÙNG 1 STATE LOADING THỐNG NHẤT ---
  // 'retryingOrderId' đổi tên thành 'processingOrderId' để dùng chung
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

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

  // --- HÀM CẬP NHẬT TRẠNG THÁI 1 ĐƠN HÀNG TRONG LIST ---
  const updateOrderStatusInList = (orderId: number, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderId ? { ...o, orderStatus: newStatus } : o
      )
    );
  };

  // --- 2. HÀM THANH TOÁN LẠI (Sửa lại tên state) ---
  const handleRetryPayment = async (orderId: number) => {
    setProcessingOrderId(orderId); // Báo là: "Nút của đơn này đang load"
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
      setProcessingOrderId(null); // Tắt loading nếu lỗi
    }
  };

  // --- 3. HÀM MỚI: XÁC NHẬN ĐÃ NHẬN HÀNG ---
  const handleConfirmDelivery = async (orderId: number) => {
    setProcessingOrderId(orderId);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${orderId}/complete`, { method: 'PUT' });
      toast.success("Xác nhận đã nhận hàng thành công!");
      // Cập nhật lại list orders để đổi trạng thái
      updateOrderStatusInList(orderId, 'COMPLETED');
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xác nhận.");
    } finally {
      setProcessingOrderId(null); // Tắt loading
    }
  };

  // --- 4. HÀM MỚI: KHIẾU NẠI ---
  const handleReportIssue = async (orderId: number) => {
    if (!confirm("Bạn muốn báo cáo vấn đề (chưa nhận được hàng) với đơn hàng này?")) return;
    setProcessingOrderId(orderId);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${orderId}/report-issue`, { method: 'PUT' });
      toast.success("Đã gửi khiếu nại. Chúng tôi sẽ liên hệ với bạn.");
      // Cập nhật lại list orders để đổi trạng thái
      updateOrderStatusInList(orderId, 'DISPUTE');
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gửi khiếu nại.");
    } finally {
      setProcessingOrderId(null); // Tắt loading
    }
  };

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

            {/* --- 5. SỬA CHỖ NÀY: TRUYỀN TẤT CẢ PROPS XUỐNG --- */}
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                
                // Props cho nút "Thanh toán lại"
                onRetryPayment={handleRetryPayment}
                
                // Props cho nút "Đã nhận hàng"
                onConfirmDelivery={handleConfirmDelivery}
                
                // Props cho nút "Khiếu nại"
                onReportIssue={handleReportIssue}
                
                // Báo cho Card biết nó có đang loading hay không
                // Đổi 'isRetrying' thành 'isProcessing' cho thống nhất
                isProcessing={processingOrderId === order.id}
              />
            ))}

          </div>
        )}
      </div>
    </div>
  );
}