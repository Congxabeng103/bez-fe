"use client";

import { useAuthStore } from "@/lib/authStore";
import { OrderCard } from "@/components/store/order-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageResponseDTO, UserOrderDTO } from "@/types/userOrderDTO";

// --- Thêm Helper API Call ---
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
  return responseData; // Trả về toàn bộ response
};
// --- Hết Helper ---

export default function OrdersPage() {
  // Lấy 'isAuthenticated' từ store
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [orders, setOrders] = useState<UserOrderDTO[]>([]);
  // SỬA: Khởi tạo isLoading là true
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, size: 5 });

  // --- 1. THÊM STATE ĐỂ BIẾT NÚT NÀO ĐANG LOADING ---
  const [retryingOrderId, setRetryingOrderId] = useState<number | null>(null);

  // SỬA LỖI 2: Chỉ fetch khi 'isAuthenticated' là true
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
  }, [pagination.page, pagination.size]); // Chỉ phụ thuộc vào phân trang

  useEffect(() => {
    // Nếu store đã tải và xác nhận 'isAuthenticated'
    if (isAuthenticated) {
      fetchMyOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchMyOrders]); // Chạy lại khi auth thay đổi

  // --- 2. THÊM HÀM XỬ LÝ THANH TOÁN LẠI ---
  const handleRetryPayment = async (orderId: number) => {
    setRetryingOrderId(orderId); // Báo là: "Nút của đơn này đang load"
    try {
      // Gọi API backend (đã có)
      const response = await manualFetchApi(
        `/v1/payment/${orderId}/retry-vnpay`,
        { method: 'POST' }
      );
      const paymentUrl = response.data.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl; // Redirect sang VNPAY
      } else {
        throw new Error("Không thể tạo link thanh toán.");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thử thanh toán lại.");
      setRetryingOrderId(null); // Tắt loading nếu lỗi
    }
    // Không cần 'finally' vì nếu thành công là đã redirect đi rồi.
  };

  // SỬA LỖI 3: Chỉ check 'isLoading'
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

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

            {/* --- 3. SỬA CHỖ NÀY ĐỂ TRUYỀN PROPS XUỐNG --- */}
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                // Truyền hàm xử lý xuống
                onRetryPayment={handleRetryPayment}
                // Báo cho Card biết nó có đang loading hay không
                isRetrying={retryingOrderId === order.id}
              />
            ))}

          </div>
        )}
      </div>
    </div>
  );
}