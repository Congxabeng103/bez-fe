// (path: app/(user)/orders/page.tsx)
"use client";

import { useAuthStore } from "@/lib/authStore"; 
import { OrderCard } from "@/components/store/order-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; // (SỬA: Thêm useCallback)
import { Package, Loader2 } from "lucide-react"; 
import { toast } from "sonner";
import { PageResponseDTO, UserOrderDTO } from "@/types/userOrderDTO";

// --- Thêm Helper API Call ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const manualFetchApi = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState();
  // (Middleware đã chặn, nhưng vẫn check token ở đây để đề phòng 
  // trường hợp token hết hạn khi user đang mở trang)
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

  

  // SỬA LỖI 2: Chỉ fetch khi 'isAuthenticated' là true
  // (Zustand/persist sẽ tự động re-render khi 'isAuthenticated'
  // đổi từ false (server) -> true (client hydated))
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
      // Nếu token hết hạn, 'manualFetchApi' sẽ ném lỗi 
      // và chúng ta sẽ toast lỗi đó
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
      // Nếu vì lý do nào đó (sau khi hydrate) mà vẫn false
      // (Middleware nên bắt, nhưng đây là dự phòng)
      // Hoặc nếu 'isAuthenticated' ban đầu là false (server render)
      // thì ta không làm gì cả (chỉ 'isLoading')
      
      // Nếu không 'isAuthenticated' VÀ *không* 'isLoading' (tức là đã load xong)
      // thì mới set 'isLoading = false'
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchMyOrders]); // Chạy lại khi auth thay đổi

  // SỬA LỖI 3: Chỉ check 'isLoading'
  // (isAuthenticated=false sẽ bị middleware chặn, 
  // hoặc 'fetchOrders' không chạy, 'isLoading' sẽ về false)
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
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          

        )}
      </div>
    </div>
  );
}