"use client";

import { UserOrderDTO, OrderStatus, PaymentStatus, PaymentMethod } from "@/types/userOrderDTO";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Loader2 
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// --- Labels và Colors (Giữ nguyên) ---
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
const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  PENDING_REFUND: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền"
};
const formatCurrency = (amount: number) => `₫${amount.toLocaleString('vi-VN')}`;
// --- (Hết phần helpers) ---


// --- 1. ĐỊNH NGHĨA PROPS (Giữ nguyên) ---
interface OrderCardProps {
  order: UserOrderDTO;
  isProcessing: boolean;
  onRetryPayment: (orderId: number) => void;
  onConfirmDelivery: (orderId: number) => void;
  onReportIssue: (orderId: number) => void;
}

// --- 2. HÀM RENDER NÚT HÀNH ĐỘNG (Giữ nguyên) ---
const renderActions = (order: UserOrderDTO, isProcessing: boolean, props: OrderCardProps) => {
  switch (order.orderStatus) {

    case "PENDING":
      if (order.paymentMethod === 'VNPAY' && (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED')) {
        return (
          <Button
            onClick={() => props.onRetryPayment(order.id)}
            disabled={isProcessing}
            size="sm"
          >
            {isProcessing
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <CreditCard className="w-4 h-4 mr-2" />
            }
            Thanh toán lại
          </Button>
        );
      }
      return null;

    case "DELIVERED":
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => props.onReportIssue(order.id)}
            disabled={isProcessing}
          >
            {isProcessing
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <AlertCircle className="w-4 h-4 mr-2" />
            }
            Khiếu nại
          </Button>
          <Button
            size="sm"
            onClick={() => props.onConfirmDelivery(order.id)}
            disabled={isProcessing}
          >
            {isProcessing
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <CheckCircle className="w-4 h-4 mr-2" />
            }
            Đã nhận hàng
          </Button>
        </div>
      );

    case "DISPUTE":
      return (
        <Button
          size="sm"
          onClick={() => props.onConfirmDelivery(order.id)}
          disabled={isProcessing}
        >
          {isProcessing
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <CheckCircle className="w-4 h-4 mr-2" />
          }
          Xác nhận đã nhận
        </Button>
      );

    default:
      return null;
  }
};


// --- 3. COMPONENT CHÍNH ---
export function OrderCard({
  order,
  isProcessing,
  onRetryPayment,
  onConfirmDelivery,
  onReportIssue
}: OrderCardProps) {

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
    <Card className="flex flex-col justify-between hover:shadow-lg transition">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
            <Link href={`/orders/${order.id}`} className="hover:underline">
              <p className="font-semibold text-lg">{order.orderNumber}</p>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.orderStatus)}
            <Badge variant="outline" className={`text-xs ${statusColors[order.orderStatus]}`}>
              {statusLabels[order.orderStatus]}
            </Badge>
          </div>
        </div>
        
        {/* 👇👇👇 SỬA LỖI Ở ĐÂY 👇👇👇 */}
        <p className="text-sm text-muted-foreground pt-2">
          {new Date(order.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
        </p> 
        {/* 👆👆👆 ĐÃ SỬA TỪ </page> THÀNH </p> 👆👆👆 */}

      </CardHeader>

      <CardContent className="space-y-3 pt-0 pb-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Thanh toán:</span>
          <span className="font-medium flex items-center gap-1.5 text-sm">
            {order.paymentMethod === 'VNPAY'
              ? <CreditCard className="w-4 h-4 text-blue-600" />
              : <Truck className="w-4 h-4 text-green-600" />
            }
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

      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <Link href={`/orders/${order.id}`}>
          <Button variant="ghost" size="sm">Xem chi tiết</Button>
        </Link>

        <div className="flex justify-end">
          {renderActions(order, isProcessing, {
            order,
            isProcessing,
            onRetryPayment,
            onConfirmDelivery,
            onReportIssue
          })}
        </div>
      </CardFooter>
    </Card>
  );
}