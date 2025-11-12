"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState, Suspense, useRef } from "react"; // 1. Thêm useRef
import { useAuthStore } from "@/lib/authStore";

// --- Helper API Call (Giữ nguyên) ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const manualFetchApi = async (url: string, options: RequestInit = {}) => {
  // Lấy token từ store
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

  // --- SỬA LOGIC POLLING ---
  
  // 1. Xóa retryCount
  // const [retryCount, setRetryCount] = useState(0);

  // 2. Thêm Ref để lưu ID của timeout
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 3. Thêm Ref để đảm bảo polling chỉ chạy 1 lần
  const isPollingActive = useRef(false);

  // 4. Xóa useCallback(pollOrderStatus) cũ
  
  // 5. Viết lại hoàn toàn useEffect
  useEffect(() => {
    // Ưu tiên 1: VNPAY báo lỗi ngay lập tức
    if (urlStatusHint === 'failed') {
      setOrderStatus('FAILED');
      return; // Dừng
    }

    // Ưu tiên 2: Đây là đơn COD, báo thành công ngay!
    if (paymentMethod === 'COD') {
      setOrderStatus('PAID');
      fetchCart(); // Cập nhật icon giỏ hàng
      return; // Dừng, KHÔNG POLLING
    }
    
    // Ưu tiên 3: Đơn VNPAY, bắt đầu Polling
    
    // Kiểm tra các điều kiện cần thiết
    if (!orderId || !token) {
      if (!orderId) setOrderStatus('FAILED'); // Lỗi URL, không có orderId
      return;
    }

    // Đảm bảo polling chỉ chạy 1 lần duy nhất
    if (isPollingActive.current) return;
    isPollingActive.current = true;

    // Đặt thời hạn polling (ví dụ: 2 phút)
    // IPN của VNPay có thể mất 30-60 giây
    const pollingDeadline = Date.now() + (2 * 60 * 1000); // 2 phút

    const poll = async () => {
      // 1. Kiểm tra xem còn thời gian không
      if (Date.now() > pollingDeadline) {
        setOrderStatus('FAILED'); // Hết giờ, báo thất bại
        isPollingActive.current = false;
        return;
      }

      // 2. Fetch trạng thái
      try {
        const response = await manualFetchApi(`/v1/orders/my-orders/${orderId}`);
        const paymentStatus = response.data.paymentStatus;

        if (paymentStatus === 'PAID') {
          setOrderStatus('PAID');
          fetchCart();
          isPollingActive.current = false;
          // Thành công, dừng polling

        } else if (paymentStatus === 'FAILED') {
          setOrderStatus('FAILED');
          isPollingActive.current = false;
          // Thất bại, dừng polling

        } else {
          // Vẫn là 'PENDING', tiếp tục poll
          pollingTimeoutRef.current = setTimeout(poll, 3000); // Thử lại sau 3s
        }
      } catch (error) {
        console.error("Lỗi khi polling trạng thái:", error);
        setOrderStatus('FAILED'); // Lỗi, dừng polling
        isPollingActive.current = false;
      }
    };

    // Bắt đầu polling lần đầu tiên
    poll();

    // Hàm dọn dẹp (Cleanup):
    // Rất quan trọng: Nếu người dùng rời khỏi trang, phải dừng polling
    return () => {
      isPollingActive.current = false; // Đánh dấu là đã dừng
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };

  }, [orderId, token, urlStatusHint, paymentMethod, fetchCart]); // Dependencies
  // --- KẾT THÚC SỬA LOGIC POLLING ---


  // --- Logic Render (Giữ nguyên) ---

  // Trạng thái "Đang chờ IPN"
  if (orderStatus === 'POLLING') {
    return (
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Loader2 className="w-20 h-20 animate-spin text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Đang xác nhận...</h1>
        <p className="text-muted-foreground text-lg">
          Hệ thống đang xác nhận thanh toán. Vui lòng chờ trong giây lát...
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
            Đơn hàng #{orderId} của bạn chưa được thanh toán hoặc đã xảy ra lỗi.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/account/orders/${orderId}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">Thử lại thanh toán</Button>
          </Link>
          <Link href="/products" className="flex-1">
            <Button className="w-full">Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </>
    );
  }

  // Trạng thái Thành công (Dùng chung cho cả COD và VNPAY)
  if (orderStatus === 'PAID') {
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
              <p className="text-2xl font-bold">#{orderId}</p>
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
          <Link href="/account/orders" className="flex-1">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Xem đơn hàng</Button>
          </Link>
        </div>
      </>
    );
  }

  // Fallback
  return null;
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