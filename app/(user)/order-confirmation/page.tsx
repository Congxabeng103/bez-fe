"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react"; // Thêm icon Lỗi/Loading
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart"; // Sửa: Dùng hook cart thật
import { useEffect, useState, Suspense } from "react"; // Thêm Suspense

// 1. Tách component con để dùng useSearchParams
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status"); // (Backend trả về 'failed' nếu VNPAY lỗi)
  
  const { fetchCart } = useCart(); // Lấy hàm fetchCart để cập nhật Header
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Khi trang này tải, nghĩa là đơn hàng đã xử lý (thành công hoặc thất bại)
    // Chúng ta 'fetchCart()' để giỏ hàng (icon header) cập nhật lại (thành 0)
    // Chỉ fetch khi đơn hàng không thất bại (vì thất bại thì giỏ hàng vẫn còn)
    if (status !== 'failed') {
         fetchCart();
    }
    setIsLoading(false);
  }, [fetchCart, status]);

  if (isLoading) {
    return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

  // --- 2. THÊM TRẠNG THÁI THẤT BẠI ---
  if (status === 'failed') {
    return (
      <>
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <XCircle className="w-20 h-20 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Thanh toán thất bại</h1>
          <p className="text-muted-foreground text-lg">
            Đơn hàng #{orderId} của bạn chưa được thanh toán.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
           <Link href="/cart" className="flex-1">
             <Button variant="outline" className="w-full bg-transparent">Thử lại thanh toán</Button>
           </Link>
           <Link href="/products" className="flex-1">
             <Button className="w-full">Tiếp tục mua sắm</Button>
           </Link>
         </div>
       </>
    );
  }

  // --- 3. TRẠNG THÁI THÀNH CÔNG (Giữ layout của bạn, xóa phần data) ---
  return (
    <>
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          {/* Sửa: Dùng màu xanh */}
          <CheckCircle className="w-20 h-20 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Đặt hàng thành công!</h1>
        <p className="text-muted-foreground text-lg">Cảm ơn bạn đã mua hàng.</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-8 mb-8">
        <div className="grid grid-cols-1 gap-8 mb-8">
          <div>
            <p className="text-muted-foreground text-sm mb-2">Mã đơn hàng</p>
            {/* Sửa: Chỉ hiển thị Order ID từ URL */}
            <p className="text-2xl font-bold">#{orderId || "Đang xử lý"}</p>
          </div>
          {/* Xóa "Estimated Delivery" vì không có data */}
        </div>

        {/* XÓA TOÀN BỘ PHẦN CHI TIẾT ĐƠN HÀNG (ITEMS, GIÁ, ĐỊA CHỈ)
            VÌ TRANG NÀY KHÔNG CÓ DATA ĐÓ.
            (Người dùng sẽ xem chi tiết trong "Tài khoản" -> "Đơn hàng của tôi")
        */}

        <div className="border-t border-border pt-8">
          <h2 className="text-xl font-bold mb-4">Tiếp theo là gì?</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-1">1.</span>
              <span>Bạn sẽ nhận được email xác nhận với chi tiết đơn hàng (nếu có cung cấp email).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-1">2.</span>
              <span>Đơn hàng sẽ được xử lý và vận chuyển trong 1-2 ngày làm việc.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold mt-1">3.</span>
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
        {/* Sửa: Link tới trang 'Đơn hàng' (giả sử là /account/orders) */}
        <Link href="/account/orders" className="flex-1">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Xem đơn hàng</Button>
        </Link>
      </div>
    </>
  );
}

// 4. Bọc component chính trong Suspense
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