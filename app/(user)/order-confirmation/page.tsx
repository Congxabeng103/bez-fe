"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState, Suspense, useRef } from "react";
import { useAuthStore } from "@/lib/authStore";

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

// --- SỬA 1: THÊM DTO ĐƠN HÀNG TỐI GIẢN ---
// Chúng ta cần DTO này để lấy 'orderNumber'
interface SimpleOrderDTO {
  id: number;
  orderNumber: string; // <-- Đây là Mã Đơn Hàng (DH-123)
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  // (Thêm các trường khác nếu bạn cần, nhưng 'orderNumber' là bắt buộc)
}


function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const urlStatusHint = searchParams.get("status"); // Gợi ý của VNPAY
  const paymentMethod = searchParams.get("method"); // Lấy 'COD' từ URL

  const { fetchCart } = useCart();
  const { token } = useAuthStore();

  const [orderStatus, setOrderStatus] = useState<
    'POLLING' | 'PAID' | 'FAILED'
  >('POLLING');
  
  // --- SỬA 2: THÊM STATE ĐỂ LƯU THÔNG TIN ĐƠN HÀNG ---
  const [order, setOrder] = useState<SimpleOrderDTO | null>(null);

  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingActive = useRef(false);

  // --- SỬA 3: VIẾT LẠI HOÀN TOÀN useEffect ---
  useEffect(() => {
    // Ưu tiên 1: VNPAY báo lỗi ngay lập tức
    if (urlStatusHint === 'failed') {
      setOrderStatus('FAILED');
      return; // Dừng
    }

    // Kiểm tra các điều kiện cần thiết
    if (!orderId || !token) {
      if (!orderId) setOrderStatus('FAILED'); // Lỗi URL, không có orderId
      return;
    }
    
    // Đảm bảo polling chỉ chạy 1 lần duy nhất
    if (isPollingActive.current) return;
    isPollingActive.current = true;
    
    // Đặt thời hạn polling (ví dụ: 2 phút)
    const pollingDeadline = Date.now() + (2 * 60 * 1000); // 2 phút

    const poll = async () => {
      // 1. Kiểm tra xem còn thời gian không (chỉ áp dụng cho VNPAY)
      if (paymentMethod !== 'COD' && Date.now() > pollingDeadline) {
        setOrderStatus('FAILED'); // Hết giờ, báo thất bại
        isPollingActive.current = false;
        return;
      }

      // 2. Fetch trạng thái
      try {
        const response = await manualFetchApi(`/v1/orders/my-orders/${orderId}`);
        const orderData = response.data as SimpleOrderDTO;
        
        // --- LƯU LẠI THÔNG TIN ĐƠN HÀNG ---
        setOrder(orderData); // <-- Lưu data để lấy orderNumber

        // 3. Xử lý trạng thái
        if (paymentMethod === 'COD') {
            // Đơn COD luôn thành công, chỉ cần lấy data
            setOrderStatus('PAID');
            fetchCart();
            isPollingActive.current = false;
        
        } else if (orderData.paymentStatus === 'PAID') {
            // Đơn VNPAY đã thanh toán
            setOrderStatus('PAID');
            fetchCart();
            isPollingActive.current = false;

        } else if (orderData.paymentStatus === 'FAILED') {
            // Đơn VNPAY thất bại
            setOrderStatus('FAILED');
            isPollingActive.current = false;
        
        } else {
            // Đơn VNPAY vẫn là 'PENDING', tiếp tục poll
            pollingTimeoutRef.current = setTimeout(poll, 3000); // Thử lại sau 3s
        }
      } catch (error) {
        console.error("Lỗi khi polling trạng thái:", error);
        setOrderStatus('FAILED'); // Lỗi, dừng polling
        isPollingActive.current = false;
      }
    };

    // Bắt đầu polling/fetch lần đầu tiên
    poll();

    // Hàm dọn dẹp (Cleanup)
    return () => {
      isPollingActive.current = false;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };

  }, [orderId, token, urlStatusHint, paymentMethod, fetchCart]);
  // --- KẾT THÚC SỬA LOGIC POLLING ---


  // --- Logic Render ---

  // Trạng thái "Đang chờ" (Chung cho cả COD và VNPAY)
  if (orderStatus === 'POLLING') {
    return (
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Loader2 className="w-20 h-20 animate-spin text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Đang xác nhận...</h1>
        <p className="text-muted-foreground text-lg">
          Hệ thống đang xác nhận đơn hàng. Vui lòng chờ trong giây lát...
        </p>
      </div>
    );
  }

  // Trạng thái Thất bại
  if (orderStatus === 'FAILED') {
    return (
      <>
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <XCircle className="w-20 h-20 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Đặt hàng thất bại</h1>
          <p className="text-muted-foreground text-lg">
            Đơn hàng của bạn chưa được thanh toán hoặc đã xảy ra lỗi.
          </p>
          {/* Hiển thị Mã ĐH (nếu có) hoặc ID (nếu fetch lỗi) */}
          {order ? (
             <p className="text-lg font-semibold">Mã đơn hàng: {order.orderNumber}</p>
          ) : (
             <p className="text-lg font-semibold">Mã đơn hàng: #{orderId}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* SỬA 4: Link trỏ đến /orders/id */}
          <Link href={`/orders/${orderId}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">Xem chi tiết đơn hàng</Button>
          </Link>
          <Link href="/products" className="flex-1">
            <Button className="w-full">Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </>
    );
  }

  // Trạng thái Thành công (Dùng chung cho cả COD và VNPAY)
  if (orderStatus === 'PAID' && order) { // Phải có 'order'
    return (
      <>
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Đặt hàng thành công!</h1>
          <p className="text-muted-foreground text-lg">Cảm ơn bạn đã mua hàng.</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <div className="grid grid-cols-1 gap-8 mb-8">
            <div>
              <p className="text-muted-foreground text-sm mb-2">Mã đơn hàng</p>
              
              {/* --- SỬA 5: HIỂN THỊ MÃ ĐƠN HÀNG --- */}
              <p className="text-2xl font-bold">{order.orderNumber}</p>
              
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-4">Tiếp theo là gì?</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">1.</span>
                <span>Đơn hàng của bạn đã được xác nhận và sẽ sớm được xử lý.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">2.</span>
                <span>Bạn có thể theo dõi đơn hàng trong mục "Đơn hàng của tôi".</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/products" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Tiếp tục mua sắm
            </Button>
          </Link>
          
          {/* --- SỬA 6: LINK TRỎ ĐẾN /orders/id --- */}
          <Link href={`/orders/${order.id}`} className="flex-1">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Xem đơn hàng</Button>
          </Link>
        </div>
      </>
    );
  }

  // Fallback (Nếu bị lỗi không mong muốn)
  return (
    <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Đã xảy ra lỗi</h1>
        <p className="text-muted-foreground text-lg">
          Không thể tải trạng thái đơn hàng.
        </p>
    </div>
  );
}

// Bọc component chính trong Suspense (Giữ nguyên)
export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Suspense fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        }>
          <ConfirmationContent />
        </Suspense>
      </div>
    </div>
  );
}