"use client";

import { useAuthStore } from "@/lib/authStore";
import { OrderCard } from "@/components/store/order-card"; 
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageResponseDTO, UserOrderDTO, OrderStatus } from "@/types/userOrderDTO";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/store/pagination"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// --- Helper API Call ---
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

const statusLabels: Record<string, string> = {
  ALL: "Tất cả",
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  DISPUTE: "Khiếu nại",
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [orders, setOrders] = useState<UserOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- State Phân trang & Lọc ---
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, size: 5 });
  // THÊM: State lưu tổng số đơn hàng
  const [totalOrders, setTotalOrders] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

  // State Popup Khiếu nại
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingOrderId, setReportingOrderId] = useState<number | null>(null);

  // --- CẬP NHẬT FETCH API ---
  const fetchMyOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(pagination.page));
      params.append("size", String(pagination.size));
      
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const response = await manualFetchApi(
        `/v1/orders/my-orders?${params.toString()}`
      );
      const data: PageResponseDTO<UserOrderDTO> = response.data;
      
      // CẬP NHẬT: Thêm fallback và setTotalOrders
      setOrders(data.content || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages ?? 0
      }));
      setTotalOrders(data.totalElements ?? 0); // <-- Lấy tổng số bản ghi

    } catch (err: any) {
      if (orders.length > 0) toast.error(err.message || "Lỗi khi tải đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.size, statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchMyOrders]);

  // --- Handlers ---
  const handleTabChange = (val: string) => {
    setStatusFilter(val);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage - 1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateOrderStatusInList = (orderId: number, newStatus: OrderStatus) => {
    if (statusFilter !== "ALL" && statusFilter !== newStatus) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
    } else {
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === orderId ? { ...o, orderStatus: newStatus } : o
          )
        );
    }
  };

  // --- Logic Actions ---
  const handleRetryPayment = async (orderId: number) => {
    setProcessingOrderId(orderId); 
    try {
      const response = await manualFetchApi(
        `/v1/payment/${orderId}/retry-vnpay`,
        { method: 'POST' }
      );
      const paymentUrl = response.data.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không thể tạo link thanh toán.");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thử thanh toán lại.");
      setProcessingOrderId(null); 
    }
  };

  const handleConfirmDelivery = async (orderId: number) => {
    setProcessingOrderId(orderId);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${orderId}/complete`, { method: 'PUT' });
      toast.success("Xác nhận đã nhận hàng thành công!");
      updateOrderStatusInList(orderId, 'COMPLETED');
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xác nhận.");
    } finally {
      setProcessingOrderId(null); 
    }
  };

  const openReportDialog = (orderId: number) => {
    setReportingOrderId(orderId);
    setReportReason("");
    setIsReportDialogOpen(true);
  };

  const closeReportDialog = () => {
    if (processingOrderId) return;
    setIsReportDialogOpen(false);
    setReportingOrderId(null);
  };

  const handleSubmitReport = async () => {
    if (!reportingOrderId) return;
    if (reportReason.trim() === "") {
      toast.error("Vui lòng nhập nội dung khiếu nại.");
      return;
    }

    setProcessingOrderId(reportingOrderId);
    try {
      await manualFetchApi(`/v1/orders/my-orders/${reportingOrderId}/report-issue`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason })
      });
      
      toast.success("Đã gửi khiếu nại. Chúng tôi sẽ liên hệ với bạn.");
      updateOrderStatusInList(reportingOrderId, 'DISPUTE');
      closeReportDialog();
      
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gửi khiếu nại.");
    } finally {
      if (reportingOrderId) {
         setProcessingOrderId(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            {/* CẬP NHẬT: Hiển thị số lượng đơn hàng */}
            Đơn hàng của tôi ({totalOrders})
          </h1>
          <p className="text-muted-foreground">Theo dõi và quản lý các đơn hàng của bạn</p>
        </div>

        {/* --- GIAO DIỆN TABS --- */}
        <Tabs value={statusFilter} onValueChange={handleTabChange} className="mb-6 sticky top-0 z-10 bg-gray-50/30 backdrop-blur py-2">
            <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
              <TabsList className="w-max h-auto p-1 bg-white border rounded-xl shadow-sm">
                {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTE'].map(st => (
                  <TabsTrigger key={st} value={st} className="px-4 py-2 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                    {statusLabels[st]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
        </Tabs>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed shadow-sm">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-muted-foreground mb-6">
              {statusFilter === 'ALL' ? "Bạn chưa mua đơn hàng nào." : "Không có đơn hàng ở trạng thái này."}
            </p>
            <Link href="/products">
              <Button>Tiếp tục mua sắm</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onRetryPayment={handleRetryPayment}
                onConfirmDelivery={handleConfirmDelivery}
                onReportIssue={openReportDialog} 
                isProcessing={processingOrderId === order.id}
              />
            ))}
          </div>
        )}
        
        {/* --- GIAO DIỆN PHÂN TRANG --- */}
        {pagination.totalPages > 1 && (
            <div className="flex justify-center pt-8">
                <Pagination 
                    currentPage={pagination.page + 1} 
                    totalPages={pagination.totalPages} 
                    onPageChange={handlePageChange} 
                />
            </div>
        )}

      </div>

      {/* --- POPUP KHIẾU NẠI --- */}
      <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gửi khiếu nại cho đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng mô tả chi tiết vấn đề bạn gặp phải (ví dụ: sai sản phẩm, 
              sản phẩm lỗi, hư hỏng...). Chúng tôi sẽ xem xét và liên hệ lại với bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              id="reportReason"
              placeholder="Nhập nội dung khiếu nại (bắt buộc)..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={5}
              className="resize-none"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeReportDialog} disabled={processingOrderId !== null}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitReport}
              disabled={processingOrderId !== null || reportReason.trim() === ""}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {processingOrderId === reportingOrderId ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              Gửi khiếu nại
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}