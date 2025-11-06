"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState, Suspense, useCallback } from "react";
import { useAuthStore } from "@/lib/authStore";

// --- Helper API Call (Đã làm sạch) ---
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
  
  // --- 1. SỬA LỖI COD: Đọc tham số method ---
  const paymentMethod = searchParams.get("method"); // Lấy 'COD' từ URL

  const { fetchCart } = useCart();
  const { token } = useAuthStore();

  const [orderStatus, setOrderStatus] = useState<
    'POLLING' | 'PAID' | 'FAILED'
  >('POLLING');
  const [retryCount, setRetryCount] = useState(0);

  // --- Logic Polling (Giữ nguyên) ---
  const pollOrderStatus = useCallback(async () => {
    if (!orderId || !token) {
      if (!orderId) setOrderStatus('FAILED');
      return;
    }

    try {
      const response = await manualFetchApi(`/v1/orders/my-orders/${orderId}`);
      const paymentStatus = response.data.paymentStatus;

      if (paymentStatus === 'PAID') {
        setOrderStatus('PAID');
        fetchCart();
      } else if (paymentStatus === 'FAILED') {
        setOrderStatus('FAILED');
      } else if (paymentStatus === 'PENDING' && retryCount < 5) {
        setRetryCount(prev => prev + 1);
        setTimeout(pollOrderStatus, 3000); // Polling!
      } else {
        setOrderStatus('FAILED');
      }
    } catch (error) {
      console.error("Lỗi khi polling trạng thái:", error);
      setOrderStatus('FAILED');
    }
  }, [orderId, token, retryCount, fetchCart]);


  // --- 2. SỬA LỖI COD: Cập nhật useEffect ---
  useEffect(() => {
    // Ưu tiên 1: VNPAY báo lỗi ngay lập tức
    if (urlStatusHint === 'failed') {
      setOrderStatus('FAILED');
      return; // Dừng
    }

    // Ưu tiên 2: Đây là đơn COD, báo thành công ngay!
    if (paymentMethod === 'COD') {
      setOrderStatus('PAID'); // 'PAID' là để hiển thị UI thành công
      fetchCart(); // Cập nhật icon giỏ hàng
      return; // Dừng, KHÔNG POLLING
    }

    // Ưu tiên 3: Mặc định là VNPAY, bắt đầu Polling
    // (Chỉ poll khi có token)
    if (token) {
      pollOrderStatus();
    }

  }, [pollOrderStatus, urlStatusHint, token, paymentMethod]); // <-- Thêm paymentMethod


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