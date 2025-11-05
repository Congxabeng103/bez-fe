"use client";

// Sửa: Import đầy đủ DTO và các enums
import { UserOrderDTO, OrderStatus, PaymentStatus, PaymentMethod } from "@/types/userOrderDTO";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard, // <-- Thêm
  Loader2     // <-- Thêm
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // <-- Thêm Button
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // <-- Dùng Card cho đẹp

// --- Labels và Colors (Sao chép từ file Admin) ---
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

// --- THÊM LABELS CHO PAYMENT ---
// (Giả sử bạn đã thêm PaymentStatus vào userOrderDTO.ts)
const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  PENDING_REFUND: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền"
};
// ---

// --- Helper định dạng tiền ---
const formatCurrency = (amount: number) => `₫${amount.toLocaleString('vi-VN')}`;

// --- 1. ĐỊNH NGHĨA PROPS MỚI ---
interface OrderCardProps {
  order: UserOrderDTO;
  isRetrying: boolean; // Trạng thái loading
  onRetryPayment: (orderId: number) => void; // Hàm để gọi
}

export function OrderCard({ order, isRetrying, onRetryPayment }: OrderCardProps) {

  // Helper để lấy Icon
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "PENDING": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "CONFIRMED": return <Package className="w-5 h-5 text-blue-500" />;
      case "SHIPPING": return <Truck className="w-5 h-5 text-purple-500" />;
      case "DELIVERED": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "COMPLETED": return <CheckCircle className="w-5 h-5 text-gray-500" />;
      case "CANCELLED": return <XCircle className="w-5 h-5 text-red-500" />;
      case "DISPUTE": return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // --- 2. THÊM ĐIỀU KIỆN ĐỂ HIỂN THỊ NÚT ---
  // (Giả sử DTO của bạn đã có 2 trường này từ Backend)
  const canRetryPayment =
    order.paymentMethod === 'VNPAY' &&
    // SỬA LẠI DÒNG NÀY
    (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') &&
    // (Giữ lại cái này để đảm bảo admin chưa đụng vào)
    order.orderStatus === 'PENDING';

  return (
    // Sửa lại layout dùng Card cho đồng bộ
    <Card className="flex flex-col justify-between hover:shadow-lg transition">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
            <p className="font-semibold text-lg">{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.orderStatus)}
            <Badge variant="outline" className={`text-xs ${statusColors[order.orderStatus]}`}>
              {statusLabels[order.orderStatus]}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          {new Date(order.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      </CardHeader>

      <CardContent className="space-y-3 pt-0 pb-4">

        {/* --- 3. THÊM HIỂN THỊ PAYMENT --- */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Thanh toán:</span>
          <span className="font-medium flex items-center gap-1.5 text-sm">
            {/* (Giả sử DTO đã có paymentMethod) */}
            {order.paymentMethod === 'VNPAY'
              ? <CreditCard className="w-4 h-4 text-blue-600" />
              : <Truck className="w-4 h-4 text-green-600" />
            }
            {/* (Giả sử DTO đã có paymentStatus) */}
            {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Số lượng:</span>
          <span className="font-medium text-sm">{order.totalItems} sản phẩm</span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-muted-foreground text-sm">Tổng tiền:</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {/* --- 4. SỬA LẠI CÁC NÚT BẤM --- */}
        <Link href={`/orders/${order.id}`} className="flex-1">
          <Button variant="outline" className="w-full bg-transparent">Xem chi tiết</Button>
        </Link>

        {canRetryPayment && (
          <Button
            className="flex-1"
            disabled={isRetrying} // Sẽ bị vô hiệu hóa nếu 'cha' báo
            onClick={() => onRetryPayment(order.id)} // Gọi hàm của 'cha'
          >
            {isRetrying
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <CreditCard className="w-4 h-4 mr-2" />
            }
            {isRetrying ? "Đang xử lý..." : "Thanh toán lại"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}