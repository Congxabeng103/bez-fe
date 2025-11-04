// (path: components/store/order-card.tsx)
"use client";

// Sửa: Import DTO thật và các enums
import { UserOrderDTO, OrderStatus } from "@/types/userOrderDTO"; 
import { Package, Truck, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"; 
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
// ---

// --- Helper định dạng tiền ---
const formatCurrency = (amount: number) => `₫${amount.toLocaleString('vi-VN')}`;

interface OrderCardProps {
  order: UserOrderDTO; // Sửa: Dùng DTO thật
}

export function OrderCard({ order }: OrderCardProps) {

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

  return (
    <div className="border border-border rounded-lg p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
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

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Ngày đặt</p>
          <p className="font-medium">
            {new Date(order.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Số lượng</p>
          <p className="font-medium">{order.totalItems} sản phẩm</p>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-border">
         {/* (Xóa tóm tắt items) */}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tổng tiền</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
        {/* Sửa: Link tới trang chi tiết động */}
        <Link href={`/orders/${order.id}`} className="text-primary hover:underline font-medium">
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}