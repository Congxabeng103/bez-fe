"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Eye, Ban, Check, Truck, Undo, Package,X,
  MapPin, PhoneCall, ScrollText, Loader2, PackageCheck,
  CreditCard, Landmark, History, Mail, User
} from "lucide-react";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/authStore";

// Import Alert Dialog
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

// Import Timeline
import { OrderHistoryTimeline } from "@/components/admin/order-history-timeline";
import { cn } from "@/lib/utils";

// --- Import DTOs ---
import {
  AdminOrderDTO,
  OrderStatus,
  PaymentStatus,
  PageResponseDTO
} from "@/types/adminOrderDTO";

// DTO cho chi tiết (Cập nhật type đúng với logic mới)
type AdminOrderDetailDTO = {
  id: number;
  orderNumber: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  
  // Đây là thông tin NGƯỜI NHẬN (từ checkout)
  customerName: string; 
  phone: string;
  address: string;
  
  // Đây là thông tin TÀI KHOẢN (từ user logged in)
  email: string; 
  
  note?: string;
  subtotal: number;
  shippingFee: number;
  couponDiscount: number;
  totalAmount: number;
  items: any[];
  stockReturned: boolean;
  cancellationReason?: string;
  disputeReason?: string;
};

type OrderAuditLogResponseDTO = {
  id: number;
  staffName: string;
  staffEmail?: string;
  description: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
};

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

  if (!response.ok) {
    if (response.status === 403) {
      try {
        const responseData = await response.json();
        throw new Error(responseData.message || "Bạn không có quyền thực hiện hành động này.");
      } catch (e) {
         throw new Error("Bạn không có quyền thực hiện hành động này.");
      }
    }
    try {
      const responseData = await response.json();
      throw new Error(responseData.message || "Có lỗi xảy ra");
    } catch (e: any) {
      if (e.message.includes("Bạn không có quyền")) throw e;
      throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
    }
  }

  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
};

// --- Constants ---
const ITEMS_PER_PAGE = 5;
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
const paymentStatusColors: Record<PaymentStatus, string> = {
  PENDING: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  PAID: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
  FAILED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
  PENDING_REFUND: "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  REFUNDED: "border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-300"
};
const formatCurrency = (amount: number) => `₫${amount.toLocaleString('vi-VN')}`;

export function OrderManagement() {
  // --- States ---
  const [orders, setOrders] = useState<AdminOrderDTO[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");

  // States cho Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetailDTO | null>(null);
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderAuditLogResponseDTO[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  // States Loading
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundingOrderId, setRefundingOrderId] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updatingStatusOrderId, setUpdatingStatusOrderId] = useState<number | null>(null);
  const [isConfirmingStock, setIsConfirmingStock] = useState(false);
  const [stockConfirmOrderId, setStockConfirmOrderId] = useState<number | null>(null);

  // --- Phân Quyền ---
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isStaff = roles.includes('STAFF');
  const isManager = roles.includes('MANAGER');
  const isAdmin = roles.includes('ADMIN');
  const isManagerOrAdmin = isManager || isAdmin;

  // --- Dialog Config ---
  const [reasonInput, setReasonInput] = useState("");

  type DialogConfigState = {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    confirmVariant: "default" | "destructive";
    requiresReason: boolean;
    reasonLabel?: string;
    reasonPlaceholder?: string;
    isReasonRequired?: boolean;
    reasonType?: 'input' | 'textarea';
    displayReason?: string;
    actionType: 'updateStatus' | 'refund' | 'refundCod' | 'confirmStock' | 'none';
    orderId?: number;
    orderNumber?: string;
    newStatus?: OrderStatus;
    totalAmount?: number;
  };

  const initialDialogConfig: DialogConfigState = {
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Xác nhận",
    confirmVariant: "default",
    requiresReason: false,
    actionType: 'none',
  };

  const [dialogConfig, setDialogConfig] = useState<DialogConfigState>(initialDialogConfig);

  const closeDialog = () => {
    setDialogConfig(initialDialogConfig);
    setReasonInput("");
  };

  const openUpdateStatusDialog = (order: AdminOrderDTO | AdminOrderDetailDTO, newStatus: OrderStatus) => {
    let config: Partial<DialogConfigState> = {};

    switch (newStatus) {
      case "CANCELLED":
        config = {
          title: "Xác nhận Hủy Đơn",
          description: `Bạn có chắc muốn HỦY đơn hàng #${order.orderNumber}?`,
          confirmText: "Xác nhận Hủy",
          confirmVariant: "destructive",
          requiresReason: true,
          reasonLabel: "Lý do hủy (bắt buộc)",
          reasonPlaceholder: "Nhập lý do hủy đơn hàng...",
          isReasonRequired: true,
          reasonType: 'textarea',
        };
        if (order.orderStatus === 'CONFIRMED' || order.orderStatus === 'SHIPPING' || order.orderStatus === 'DELIVERED' || order.orderStatus === 'DISPUTE') {
          config.description += " Hàng sẽ được xử lý kho (nếu áp dụng)."
        }
        break;
      case "SHIPPING":
        config = {
          title: "Xác nhận Gửi hàng",
          description: `Bạn có chắc muốn chuyển đơn hàng #${order.orderNumber} sang trạng thái "Đang giao"?`,
          confirmText: "Xác nhận Gửi",
          confirmVariant: "default",
          requiresReason: true,
          reasonLabel: "Mã vận đơn (nếu có)",
          reasonPlaceholder: "Nhập mã vận đơn (VD: GHN123456)...",
          isReasonRequired: false,
          reasonType: 'input',
        };
        break;
      case "CONFIRMED":
        config = { title: "Xác nhận Đơn hàng", description: `Bạn có chắc muốn XÁC NHẬN đơn hàng #${order.orderNumber}? Hành động này sẽ trừ kho.`, confirmText: "Xác nhận" };
        break;
      case "DELIVERED":
        config = { title: "Xác nhận Đã Giao", description: `Bạn có chắc muốn xác nhận đơn hàng #${order.orderNumber} đã GIAO THÀNH CÔNG?`, confirmText: "Đã giao" };
        break;
      case "COMPLETED":
        config = { title: "Xác nhận Hoàn Tất", description: `Bạn có chắc muốn HOÀN TẤT đơn hàng #${order.orderNumber}?`, confirmText: "Hoàn tất" };
        break;
      case "PENDING":
        config = { title: "Xác nhận Hoàn tác", description: `Bạn có chắc muốn hoàn tác đơn #${order.orderNumber} về "Chờ xác nhận"? Hàng sẽ được cộng lại kho.`, confirmText: "Hoàn tác" };
        break;
    }

    setDialogConfig({
      ...initialDialogConfig,
      ...config,
      isOpen: true,
      actionType: 'updateStatus',
      orderId: order.id,
      orderNumber: order.orderNumber,
      newStatus: newStatus,
    });
  };

  const openRefundDialog = (order: AdminOrderDTO | AdminOrderDetailDTO) => {
    setDialogConfig({
      ...initialDialogConfig,
      isOpen: true,
      title: "Xác nhận Hoàn Tiền (VNPAY)",
      description: `Bạn có chắc muốn hoàn ${formatCurrency(order.totalAmount)} qua VNPAY cho đơn #${order.orderNumber}? Hành động này KHÔNG THỂ hoàn tác.`,
      confirmText: "Xác nhận Hoàn tiền",
      confirmVariant: "destructive",
      actionType: 'refund',
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });
  };

  const openCodRefundDialog = (order: AdminOrderDTO | AdminOrderDetailDTO) => {
    setDialogConfig({
      ...initialDialogConfig,
      isOpen: true,
      title: "Xác nhận Hoàn Tiền (COD)",
      description: `Bạn có chắc muốn XÁC NHẬN đã hoàn tiền cho đơn hàng COD #${order.orderNumber}? (Trạng thái sẽ chuyển sang "Đã hoàn tiền").`,
      confirmText: "Xác nhận",
      confirmVariant: "default",
      actionType: 'refundCod',
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  };

  const openConfirmStockDialog = (order: AdminOrderDTO | AdminOrderDetailDTO) => {
    let reasonText: string;
    if ('cancellationReason' in order && order.cancellationReason) {
      reasonText = order.cancellationReason;
    } else {
      if (!('items' in order)) {
        reasonText = "Vui lòng MỞ CHI TIẾT ĐƠN HÀNG để xem lý do hủy chính xác.";
      } else {
        reasonText = "Đơn hàng này không có lý do hủy.";
      }
    }

    setDialogConfig({
      ...initialDialogConfig,
      isOpen: true,
      title: "Xác nhận Nhập kho?",
      description: `Bạn có chắc muốn nhập kho lại sản phẩm của đơn #${order.orderNumber}? 
                      Hành động này chỉ nên được thực hiện sau khi đã nhận và kiểm tra hàng.`,
      confirmText: "Xác nhận Nhập kho",
      confirmVariant: "default",
      actionType: 'confirmStock',
      orderId: order.id,
      orderNumber: order.orderNumber,
      requiresReason: false,
      displayReason: reasonText,
    });
  };

  // --- Logic API ---
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.append("page", String(page - 1));
      query.append("size", String(ITEMS_PER_PAGE));
      query.append("status", statusFilter);
      
      if (searchTerm) {
        query.append("search", searchTerm);
      }
      const response = await manualFetchApi(`/v1/orders?${query.toString()}`);
      if (!response) return;

      const data: PageResponseDTO<AdminOrderDTO> = response.data;
      setOrders(data.content || []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);

    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải danh sách đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderHistory = async (orderId: number) => {
    setIsFetchingHistory(true);
    setOrderHistory([]);
    try {
      const historyResponse = await manualFetchApi(`/v1/orders/${orderId}/history`);
      setOrderHistory(historyResponse.data as OrderAuditLogResponseDTO[]);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải lịch sử đơn hàng.");
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleViewDetails = async (order: AdminOrderDTO) => {
    setSelectedOrder(null);
    setShowDetails(true);
    setIsFetchingItems(true);

    try {
      const response = await manualFetchApi(`/v1/orders/${order.id}`);
      setSelectedOrder(response.data as AdminOrderDetailDTO);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải chi tiết đơn hàng.");
    } finally {
      setIsFetchingItems(false);
    }
    fetchOrderHistory(order.id);
  };

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus, note: string = "") => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setUpdatingStatusOrderId(orderId);

    try {
      const response = await manualFetchApi(`/v1/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ newStatus: newStatus, note: note })
      });
      const updatedOrder: AdminOrderDTO = response.data;

      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
        )
      );
      toast.success(`Đã cập nhật đơn #${updatedOrder.orderNumber} sang "${statusLabels[newStatus]}"`);

      if (selectedOrder && selectedOrder.id === orderId) {
        try {
          const detailResponse = await manualFetchApi(`/v1/orders/${orderId}`);
          setSelectedOrder(detailResponse.data as AdminOrderDetailDTO);
        } catch (e) {
          handleCloseDetails();
        }
        fetchOrderHistory(orderId);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cập nhật trạng thái.");
    } finally {
      setIsUpdatingStatus(false);
      setUpdatingStatusOrderId(null);
      closeDialog();
    }
  };

  const handleRequestRefund = async (orderId: number) => {
    if (isRefunding) return;
    setIsRefunding(true);
    setRefundingOrderId(orderId);
    try {
      const response = await manualFetchApi(`/v1/payment/refund/vnpay/${orderId}`, {
        method: 'POST',
      });
      toast.success(response.message || "Gửi yêu cầu hoàn tiền thành công!");
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, paymentStatus: 'REFUNDED' } : o
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, paymentStatus: 'REFUNDED' }) : null);
        fetchOrderHistory(orderId);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thực hiện hoàn tiền.");
    } finally {
      setIsRefunding(false);
      setRefundingOrderId(null);
      closeDialog();
    }
  };

  const handleConfirmCodRefund = async (orderId: number) => {
    if (isRefunding) return;
    setIsRefunding(true);
    setRefundingOrderId(orderId);
    try {
      const response = await manualFetchApi(`/v1/orders/${orderId}/confirm-refund`, {
        method: 'PUT',
      });
      const refundData = response.data;
      toast.success(response.message || "Xác nhận hoàn tiền COD thành công!");
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, paymentStatus: refundData.newPaymentStatus } : o
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, paymentStatus: refundData.newPaymentStatus }) : null);
        fetchOrderHistory(orderId);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xác nhận hoàn tiền COD.");
    } finally {
      setIsRefunding(false);
      setRefundingOrderId(null);
      closeDialog();
    }
  };

  const handleConfirmStockReturn = async (orderId: number) => {
    if (isConfirmingStock) return;
    setIsConfirmingStock(true);
    setStockConfirmOrderId(orderId);
    try {
      const response = await manualFetchApi(`/v1/orders/${orderId}/confirm-stock-return`, {
        method: 'PUT',
      });
      const updatedOrder = response.data as AdminOrderDTO;
      toast.success(response.message || "Xác nhận nhập kho thành công!");
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, ...updatedOrder } : o
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        const detailResponse = await manualFetchApi(`/v1/orders/${orderId}`);
        setSelectedOrder(detailResponse.data as AdminOrderDetailDTO);
        fetchOrderHistory(orderId);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xác nhận nhập kho.");
    } finally {
      setIsConfirmingStock(false);
      setStockConfirmOrderId(null);
      closeDialog();
    }
  };

  const handleCloseDetails = () => { setShowDetails(false); setSelectedOrder(null); };
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus as OrderStatus | "ALL");
    setPage(1);
  };
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleConfirmAction = () => {
    const { actionType, orderId, newStatus, isReasonRequired, reasonLabel } = dialogConfig;
    if (isReasonRequired && !reasonInput.trim()) {
      toast.error(`Vui lòng nhập ${reasonLabel || 'lý do'}.`);
      return;
    }
    if (actionType === 'updateStatus' && orderId && newStatus) {
      handleUpdateStatus(orderId, newStatus, reasonInput);
    } else if (actionType === 'refund' && orderId) {
      handleRequestRefund(orderId);
    } else if (actionType === 'refundCod' && orderId) {
      handleConfirmCodRefund(orderId);
    } else if (actionType === 'confirmStock' && orderId) {
      handleConfirmStockReturn(orderId);
    }
  };

  const renderActionButtons = (order: AdminOrderDTO | AdminOrderDetailDTO) => {
    const buttons = [];
    const buttonBaseClass = "w-[110px] justify-center text-xs h-8";
    const isLoadingStatus = isUpdatingStatus && updatingStatusOrderId === order.id;
    const isLoadingRefund = isRefunding && refundingOrderId === order.id;
    const isLoadingStock = isConfirmingStock && stockConfirmOrderId === order.id;
    const isDisabled = isLoadingStatus || isLoadingRefund || isLoadingStock;

    if (isManagerOrAdmin && order.paymentStatus === 'PENDING_REFUND') {
      if (order.paymentMethod === 'VNPAY') {
        buttons.push(
          <Button key="refund" size="sm" variant="destructive" className={`bg-orange-600 hover:bg-orange-700 text-white ${buttonBaseClass}`} onClick={() => openRefundDialog(order)} disabled={isDisabled}>
            {isLoadingRefund ? <Loader2 size={14} className="mr-1 animate-spin" /> : <History size={14} className="mr-1" />} Hoàn tiền
          </Button>
        );
      } else if (order.paymentMethod === 'COD') {
        buttons.push(
          <Button key="refund_cod" size="sm" variant="default" className={`bg-green-600 hover:bg-green-700 text-white ${buttonBaseClass}`} onClick={() => openCodRefundDialog(order)} disabled={isDisabled}>
            {isLoadingRefund ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Check size={14} className="mr-1" />} Xác nhận
          </Button>
        );
      }
    }

    // @ts-ignore
    if (isManagerOrAdmin && order.orderStatus === 'CANCELLED' && order.stockReturned === false) {
      buttons.push(
        <Button key="stock_return" size="sm" variant="outline" className={`border-blue-600 text-blue-700 hover:bg-blue-100 ${buttonBaseClass}`} onClick={() => openConfirmStockDialog(order)} disabled={isDisabled}>
          {isLoadingStock ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Package size={14} className="mr-1" />} Nhập kho
        </Button>
      );
    }

    switch (order.orderStatus) {
      case "PENDING":
        buttons.push(<Button key="confirm" size="sm" variant="secondary" className={`bg-blue-500 hover:bg-blue-600 text-white ${buttonBaseClass}`} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "CONFIRMED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Check size={14} className="mr-1" />} Xác nhận </Button>);
        buttons.push(<Button key="cancel" size="sm" variant="destructive" className={buttonBaseClass} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "CANCELLED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Ban size={14} className="mr-1" />} Hủy </Button>);
        break;
      case "CONFIRMED":
        buttons.push(<Button key="ship" size="sm" variant="secondary" className={`bg-purple-500 hover:bg-purple-600 text-white ${buttonBaseClass}`} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "SHIPPING")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Truck size={14} className="mr-1" />} Gửi hàng </Button>);
        if (isManagerOrAdmin) {
          buttons.push(<Button key="cancel_proc" size="sm" variant="destructive" className={buttonBaseClass} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "CANCELLED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Ban size={14} className="mr-1" />} Hủy </Button>);
          buttons.push(<Button key="undo_confirm" size="sm" variant="outline" title="Hoàn lại Chờ xác nhận" className="h-8 px-2" disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "PENDING")}> {isLoadingStatus ? <Loader2 size={14} className="animate-spin" /> : <Undo size={14} />} </Button>);
        }
        break;
      case "SHIPPING":
        buttons.push(<Button key="delivered" size="sm" variant="secondary" className={`bg-green-500 hover:bg-green-600 text-white ${buttonBaseClass}`} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "DELIVERED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Check size={14} className="mr-1" />} Đã giao </Button>);
        if (isManagerOrAdmin) {
          buttons.push(<Button key="cancel_ship" size="sm" variant="destructive" className={buttonBaseClass} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "CANCELLED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Ban size={14} className="mr-1" />} Hủy </Button>);
        }
        break;
      case "DELIVERED":
        buttons.push(<Button key="complete" size="sm" variant="secondary" className={`bg-gray-500 hover:bg-gray-600 text-white ${buttonBaseClass}`} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "COMPLETED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <PackageCheck size={14} className="mr-1" />} Hoàn tất </Button>);
        if (isManagerOrAdmin) {
          buttons.push(<Button key="cancel_delivered" size="sm" variant="destructive" className={buttonBaseClass} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "CANCELLED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Ban size={14} className="mr-1" />} Hủy/Trả hàng </Button>);
        }
        break;
      case "DISPUTE":
        if (isManagerOrAdmin) {
          buttons.push(<Button key="complete" size="sm" variant="secondary" className={`bg-gray-500 hover:bg-gray-600 text-white ${buttonBaseClass}`} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "COMPLETED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <PackageCheck size={14} className="mr-1" />} Hoàn tất </Button>);
          buttons.push(<Button key="resolve_cancel" size="sm" variant="destructive" className={buttonBaseClass} disabled={isDisabled} onClick={() => openUpdateStatusDialog(order, "CANCELLED")}> {isLoadingStatus ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Ban size={14} className="mr-1" />} Hủy/Hoàn tiền </Button>);
        }
        break;
      default:
        break;
    }
    return <>{buttons}</>;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({totalElements})</CardTitle>
          <Tabs value={statusFilter} onValueChange={handleStatusFilterChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8">
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
              <TabsTrigger value="DISPUTE" className="text-orange-600 font-semibold">Khiếu nại</TabsTrigger>
              <TabsTrigger value="PENDING">Chờ xác nhận</TabsTrigger>
              <TabsTrigger value="CONFIRMED">Đã xác nhận</TabsTrigger>
              <TabsTrigger value="SHIPPING">Đang giao</TabsTrigger>
              <TabsTrigger value="DELIVERED">Đã giao</TabsTrigger>
              <TabsTrigger value="COMPLETED">Hoàn tất</TabsTrigger>
              <TabsTrigger value="CANCELLED">Đã hủy</TabsTrigger>
              {isManagerOrAdmin && (<TabsTrigger value="PENDING_REFUND" className="text-orange-600 font-semibold">Chờ hoàn tiền</TabsTrigger>)}
              {isManagerOrAdmin && (<TabsTrigger value="PENDING_STOCK_RETURN" className="text-blue-600 font-semibold">Chờ nhập kho</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="mt-4 flex gap-2 items-center"> <Search size={18} className="text-muted-foreground" /> <Input placeholder="Tìm theo tên người nhận, SĐT người nhận, Email tài khoản..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }} className="flex-1 h-9" /> </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Chưa có đơn hàng nào khớp với bộ lọc.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mã đơn</th>
                      
                      {/* THAY ĐỔI HEADER TABLE */}
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Người nhận / Email</th>
                      
                      <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ngày đặt</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Tổng cộng</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Thanh toán</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái ĐH</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[320px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const isDisabled = (isUpdatingStatus && updatingStatusOrderId === order.id) ||
                        (isRefunding && refundingOrderId === order.id) ||
                        (isConfirmingStock && stockConfirmOrderId === order.id);

                      return (
                        <tr key={order.id} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium">{order.orderNumber}</td>
                          
                          <td className="py-2 px-3">
                            <div className="flex flex-col max-w-[200px]">
                              {/* Tên người nhận (customerName) */}
                              <div className="flex items-center gap-1.5">
                                <User size={14} className="text-muted-foreground/70" />
                                <span className="font-medium truncate" title={order.customerName}>
                                  {order.customerName}
                                </span>
                              </div>
                              
                              {/* Email tài khoản */}
                              {/* @ts-ignore */}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Mail size={12} className="text-muted-foreground/70" />
                                <span className="truncate" title={order.email || "Không có email"}>
                                  {order.email || ""}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-2 px-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                          <td className="py-2 px-3 text-xs">
                            <div className="flex items-center justify-center gap-1.5">
                              {order.paymentMethod === 'VNPAY' ? (
                                <div title="VNPAY (Online)"> <CreditCard size={16} className="text-blue-600" /> </div>
                              ) : (
                                <div title="COD (Tiền mặt)"> <Landmark size={16} className="text-green-600" /> </div>
                              )}
                              <Badge variant="outline" className={`min-w-[110px] justify-center text-[11px] font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                                {paymentStatusLabels[order.paymentStatus]}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant="outline" className={`text-[11px] font-medium ${statusColors[order.orderStatus]}`}>
                              {statusLabels[order.orderStatus]}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className={`flex gap-1.5 items-center w-full ${(order.orderStatus === 'COMPLETED' || (order.orderStatus === 'CANCELLED' && (order.paymentStatus !== 'PENDING_REFUND' && (!// @ts-ignore
                              order.stockReturned || // @ts-ignore
                              order.stockReturned === true)))) ? 'justify-center' : 'justify-start'}`}>
                              <Button key="view" variant="outline" size="sm" className="h-8 px-2" onClick={() => handleViewDetails(order)} disabled={isDisabled}>
                                <Eye size={14} />
                              </Button>
                              {renderActionButtons(order)}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* --- Modal Chi Tiết (ĐÃ SỬA LẠI LOGIC HIỂN THỊ) --- */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in duration-200" onClick={handleCloseDetails}>
          <Card className="w-full max-w-3xl bg-card shadow-xl animate-scale-in duration-200" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              {selectedOrder ? (
                <CardTitle className="text-lg font-semibold">Chi tiết đơn hàng #{selectedOrder.orderNumber}</CardTitle>
              ) : (
                <CardTitle className="text-lg font-semibold">Đang tải...</CardTitle>
              )}
              <Button variant="ghost" size="icon" className="w-7 h-7 -mr-2 -mt-1 text-muted-foreground hover:bg-muted" onClick={handleCloseDetails}> <X size={18} /> </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {isFetchingItems || !selectedOrder ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p>Đang tải chi tiết đơn hàng...</p>
                </div>
              ) : (
                <>
                  {/* 1. THÔNG TIN CHUNG */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground flex items-center gap-1"><Package size={14} /> Mã đơn hàng</p> <p className="font-semibold text-base">{selectedOrder.orderNumber}</p> </div>
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Ngày đặt</p> <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p> </div>
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">P.Thức TT</p> <p className="font-medium">{selectedOrder.paymentMethod}</p> </div>
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Trạng thái TT</p> <Badge variant="outline" className={`text-xs ${paymentStatusColors[selectedOrder.paymentStatus]}`}>{paymentStatusLabels[selectedOrder.paymentStatus]}</Badge> </div>
                  </div>

                  {/* 2. THÔNG TIN GIAO HÀNG (NGƯỜI NHẬN) */}
                  <div className="border rounded-md p-4 bg-muted/10 space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2 text-primary">
                      <Truck size={18} /> Thông tin giao hàng (Người nhận)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Họ tên người nhận</p>
                            <p className="font-semibold text-base">{selectedOrder.customerName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Số điện thoại người nhận</p>
                            <p className="font-medium">{selectedOrder.phone || "-"}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={14} /> Địa chỉ giao hàng</p>
                            <p className="font-medium">{selectedOrder.address || "-"}</p>
                        </div>
                    </div>
                  </div>

                  {/* 3. THÔNG TIN TÀI KHOẢN & GHI CHÚ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Tài khoản */}
                    <div className="border rounded-md p-3 bg-blue-50/50 border-blue-100">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <Mail size={14} /> Tài khoản đặt hàng
                        </p>
                        <p className="font-medium text-blue-700 truncate" title={selectedOrder.email}>
                            {selectedOrder.email || "(Không xác định)"}
                        </p>
                    </div>
                    
                    {/* Ghi chú */}
                    {selectedOrder.note ? (
                        <div className="border rounded-md p-3 bg-yellow-50/50 border-yellow-100">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <ScrollText size={14} /> Ghi chú
                            </p>
                            <p className="text-sm text-yellow-700 italic">{selectedOrder.note}</p>
                        </div>
                    ) : (
                        <div className="border rounded-md p-3 bg-muted/20">
                            <p className="text-xs text-muted-foreground">Không có ghi chú</p>
                        </div>
                    )}
                  </div>

                  {/* CÁC BOX TRẠNG THÁI ĐẶC BIỆT */}
                  {selectedOrder.orderStatus === 'CANCELLED' && selectedOrder.cancellationReason && (
                    <div className="border rounded-md p-4 bg-red-50 border-red-200">
                      <h4 className="font-semibold text-red-700">Lý do hủy đơn hàng:</h4>
                      <p className="text-sm text-red-600 italic pt-1">{selectedOrder.cancellationReason}</p>
                    </div>
                  )}
                  {selectedOrder.orderStatus === 'DISPUTE' && selectedOrder.disputeReason && (
                    <div className="border rounded-md p-4 bg-orange-50 border-orange-200">
                      <h4 className="font-semibold text-orange-700">Nội dung khiếu nại:</h4>
                      <p className="text-sm text-orange-600 italic pt-1">{selectedOrder.disputeReason}</p>
                    </div>
                  )}

                  {/* THANH TOÁN & SẢN PHẨM */}
                  <div className="border rounded-md p-4 space-y-2 text-sm bg-muted/30">
                    <h4 className="font-semibold mb-2 text-base">Chi tiết thanh toán</h4>
                    <div className="flex justify-between"><span>Tiền hàng ({selectedOrder.items.length} SP):</span> <span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                    <div className="flex justify-between"><span>Phí vận chuyển:</span> <span>{formatCurrency(selectedOrder.shippingFee)}</span></div>
                    {selectedOrder.couponDiscount > 0 && (<div className="flex justify-between text-destructive"> <span>Giảm giá:</span> <span>- {formatCurrency(selectedOrder.couponDiscount)}</span> </div>)}
                    <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-base"><span>Tổng cộng:</span> <span>{formatCurrency(selectedOrder.totalAmount)}</span></div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-base">Sản phẩm trong đơn</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map(item => (
                        <div key={item.variantId} className="flex items-start gap-3 border-b pb-3 last:border-b-0">
                          <img src={item.imageUrl || "/placeholder.svg"} alt={item.productName} className="w-16 h-16 object-cover rounded border flex-shrink-0" />
                          <div className="flex-1 text-sm min-w-0">
                            <p className="font-medium truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.variantInfo}</p>
                            <p className="text-xs text-muted-foreground">SL: {item.quantity}</p>
                          </div>
                          <div className="text-sm font-semibold text-right flex-shrink-0 w-28">
                            {formatCurrency(item.price * item.quantity)}
                            {item.quantity > 1 && (<p className="text-xs text-muted-foreground font-normal mt-0.5">{formatCurrency(item.price)} / SP</p>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4 text-base">Lịch sử thao tác</h4>
                    <OrderHistoryTimeline logs={orderHistory} isLoading={isFetchingHistory} />
                  </div>

                  <div className="flex justify-end items-center pt-4 border-t">
                    <div className="flex gap-2">
                      {renderActionButtons(selectedOrder)}
                      <Button variant="outline" onClick={handleCloseDetails} disabled={isRefunding || isUpdatingStatus || isConfirmingStock}> Đóng </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={dialogConfig.isOpen} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {dialogConfig.displayReason && (
            <div className="border rounded-md p-3 bg-muted/50">
              <h4 className="text-sm font-semibold text-foreground/80 mb-1">Lý do hủy được ghi nhận:</h4>
              <p className="text-sm text-foreground italic">"{dialogConfig.displayReason}"</p>
            </div>
          )}
          {dialogConfig.requiresReason && (
            <div className="space-y-2 pt-2">
              <label htmlFor="dialogReasonInput" className="text-sm font-medium text-foreground/80">{dialogConfig.reasonLabel}</label>
              {dialogConfig.reasonType === 'textarea' ? (
                <Textarea id="dialogReasonInput" placeholder={dialogConfig.reasonPlaceholder} value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} rows={3} className="resize-none" autoFocus />
              ) : (
                <Input id="dialogReasonInput" placeholder={dialogConfig.reasonPlaceholder} value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} autoFocus />
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog} disabled={isUpdatingStatus || isRefunding || isConfirmingStock}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={isUpdatingStatus || isRefunding || isConfirmingStock || (dialogConfig.isReasonRequired && !reasonInput.trim())} className={cn(buttonVariants({ variant: dialogConfig.confirmVariant }), dialogConfig.actionType === "refund" ? "bg-orange-600 hover:bg-orange-700" : "", dialogConfig.actionType === "refundCod" ? "bg-green-600 hover:bg-green-700" : "", dialogConfig.actionType === "confirmStock" ? "bg-blue-600 hover:bg-blue-700 text-white" : "")}>
              {(isUpdatingStatus && dialogConfig.actionType === 'updateStatus') || (isRefunding && (dialogConfig.actionType === 'refund' || dialogConfig.actionType === 'refundCod')) || (isConfirmingStock && dialogConfig.actionType === 'confirmStock') ? (<Loader2 size={16} className="mr-2 animate-spin" />) : null}
              {dialogConfig.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}