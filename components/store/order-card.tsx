"use client";

import { UserOrderDTO, OrderStatus, PaymentStatus } from "@/types/userOrderDTO";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Loader2,
  Calendar,
  ShoppingBag,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- HELPER: COLORS & LABELS (GIỮ NGUYÊN) ---
const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-500/20",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20",
  SHIPPING: "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20",
  DELIVERED: "bg-green-50 text-green-700 border-green-200 ring-green-500/20",
  COMPLETED: "bg-gray-100 text-gray-700 border-gray-200 ring-gray-500/20",
  CANCELLED: "bg-red-50 text-red-700 border-red-200 ring-red-500/20",
  DISPUTE: "bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20"
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

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
// -------------------------------------------

interface OrderCardProps {
  order: UserOrderDTO;
  isProcessing: boolean;
  onRetryPayment: (orderId: number) => void;
  onConfirmDelivery: (orderId: number) => void;
  onReportIssue: (orderId: number) => void;
}

// --- LOGIC RENDER NÚT BẤM (GIỮ NGUYÊN 100% TỪ CODE GỐC CỦA BẠN) ---
const renderActions = (order: UserOrderDTO, isProcessing: boolean, props: OrderCardProps) => {
  switch (order.orderStatus) {
    case "PENDING":
      // Logic gốc của bạn: VNPAY + (PENDING hoặc FAILED) thì hiện nút
      if (order.paymentMethod === 'VNPAY' && (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED')) {
        return (
          <Button
            onClick={() => props.onRetryPayment(order.id)}
            disabled={isProcessing}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
            Thanh toán lại
          </Button>
        );
      }
      return null; 

    case "DELIVERED":
      return (
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => props.onReportIssue(order.id)}
            disabled={isProcessing}
            className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
            Khiếu nại
          </Button>
          <Button
            size="sm"
            onClick={() => props.onConfirmDelivery(order.id)}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
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
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Xác nhận đã nhận
        </Button>
      );

    default:
      return null;
  }
};

// --- COMPONENT CHÍNH (RE-DESIGN UI, KEEP LOGIC) ---
export function OrderCard({
  order,
  isProcessing,
  onRetryPayment,
  onConfirmDelivery,
  onReportIssue
}: OrderCardProps) {

  // Icon trạng thái
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "PENDING": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "CONFIRMED": return <Package className="w-4 h-4 text-blue-600" />;
      case "SHIPPING": return <Truck className="w-4 h-4 text-purple-600" />;
      case "DELIVERED": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "COMPLETED": return <CheckCircle className="w-4 h-4 text-gray-500" />;
      case "CANCELLED": return <XCircle className="w-4 h-4 text-red-500" />;
      case "DISPUTE": return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* HEADER: Mã đơn, Ngày tạo, Trạng thái */}
      <div className="px-5 py-3 border-b bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white border rounded-md shadow-sm">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <span className="font-semibold text-gray-900 text-sm">Đơn hàng #{order.orderNumber}</span>
               <span className="text-gray-300">|</span>
               <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
               </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end">
          <Badge variant="outline" className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full border", statusColors[order.orderStatus])}>
            <span className="flex items-center gap-1.5">
              {getStatusIcon(order.orderStatus)}
              {statusLabels[order.orderStatus].toUpperCase()}
            </span>
          </Badge>
        </div>
      </div>

      {/* CONTENT: Thông tin chi tiết */}
      <div className="p-5 grid md:grid-cols-2 gap-6">
        {/* Cột Trái: Thông tin chung */}
        <div className="space-y-3">
           <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                 <Package className="w-4 h-4" /> Số lượng sản phẩm
              </span>
              <span className="font-medium">{order.totalItems}</span>
           </div>

           <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                 <CreditCard className="w-4 h-4" /> P.Thức thanh toán
              </span>
              <span className="font-medium">{order.paymentMethod}</span>
           </div>

           <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Trạng thái TT
              </span>
              <Badge variant="secondary" className={cn(
                 "text-[10px] font-semibold px-2 rounded-sm",
                 order.paymentStatus === 'PAID' ? "bg-green-100 text-green-700" :
                 order.paymentStatus === 'PENDING' ? "bg-yellow-100 text-yellow-700" :
                 order.paymentStatus === 'PENDING_REFUND' ? "bg-blue-100 text-blue-700" :
                 "bg-gray-100 text-gray-600"
              )}>
                 {paymentStatusLabels[order.paymentStatus]}
              </Badge>
           </div>
        </div>

        {/* Cột Phải: Tổng tiền */}
        <div className="flex flex-col justify-center items-end md:items-end border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
           <span className="text-sm text-muted-foreground mb-1">Tổng thành tiền</span>
           <span className="text-2xl font-bold text-primary tracking-tight">
              {formatCurrency(order.totalAmount)}
           </span>
        </div>
      </div>

      {/* FOOTER: Actions */}
      <div className="px-5 py-3 bg-gray-50/30 border-t flex flex-wrap justify-between items-center gap-3">
        <Link href={`/orders/${order.id}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors group/link">
           Xem chi tiết <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
        </Link>

        <div className="flex gap-2">
          {/* Gọi hàm renderActions với logic gốc */}
          {renderActions(order, isProcessing, {
            order,
            isProcessing,
            onRetryPayment,
            onConfirmDelivery,
            onReportIssue
          })}
        </div>
      </div>
    </div>
  );
}