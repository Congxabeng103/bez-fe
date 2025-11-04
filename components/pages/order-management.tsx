// (path: src/app/(admin)/orders/page.tsx - hoặc nơi bạn đặt file)

"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Download, Ban, X, Check, Truck, Undo, Package, MapPin, PhoneCall, ScrollText, Loader2, AlertCircle, PackageCheck } from "lucide-react";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/authStore";

// --- Import DTOs thật ---
import {
  AdminOrderDTO,
  AdminOrderDetailDTO,
  OrderStatus,
  PaymentStatus,
  PageResponseDTO
} from "@/types/adminOrderDTO"; // (Đảm bảo file này đã có 'DISPUTE')

// --- Thêm Helper API Call ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
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


const ITEMS_PER_PAGE = 10; 

// --- Labels và Colors (Đã thêm DISPUTE) ---
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
// ---

// --- Helper định dạng tiền ---
const formatCurrency = (amount: number) => `₫${amount.toLocaleString('vi-VN')}`;

// --- Component Chính ---
export function OrderManagement() {
  // --- States ---
  const [orders, setOrders] = useState<AdminOrderDTO[]>([]);
  const [pagination, setPagination] = useState({ 
    page: 0, 
    totalPages: 0, 
    totalElements: 0 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0); 
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetailDTO | null>(null);
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // --- Logic gọi API (Giữ nguyên) ---
  
  // 1. Fetch danh sách đơn hàng
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.append("page", String(currentPage));
      query.append("size", String(ITEMS_PER_PAGE)); 
      query.append("status", statusFilter);
      if (searchTerm) {
        query.append("search", searchTerm);
      }
      
      const response = await manualFetchApi(`/v1/orders?${query.toString()}`);
      const data: PageResponseDTO<AdminOrderDTO> = response.data;
      
      setOrders(data.content);
      setPagination({
        page: data.number,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
      });
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải danh sách đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); 
  
  // 2. Xem chi tiết (Giữ nguyên)
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
  };

  // 3. Cập nhật trạng thái (Giữ nguyên)
  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    
    if (newStatus === 'CANCELLED') {
      if (!confirm("Bạn có chắc muốn HỦY đơn hàng này? Hàng sẽ được hoàn kho (nếu cần).")) {
        return;
      }
    }
    if (newStatus === 'PENDING') {
      if (!confirm("Hoàn lại trạng thái 'Chờ xác nhận'? Hàng sẽ được cộng lại kho (nếu cần).")) {
        return;
      }
    }
    
    try {
      const response = await manualFetchApi(`/v1/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ newStatus: newStatus })
      });
      
      const updatedOrder: AdminOrderDTO = response.data;
      
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === updatedOrder.id ? updatedOrder : o
        )
      );
      toast.success(`Đã cập nhật đơn #${updatedOrder.orderNumber} sang trạng thái "${statusLabels[newStatus]}"`);
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, orderStatus: newStatus }) : null);
      }
      
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cập nhật trạng thái.");
    }
  };
  
  const handleEnterTrackingCode = (orderId: number) => {
     handleUpdateStatus(orderId, "SHIPPING");
  };

  // (Các hàm helper khác giữ nguyên)
  const handleCloseDetails = () => { setShowDetails(false); setSelectedOrder(null); };
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus as OrderStatus | "ALL");
    setCurrentPage(0); 
  };
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage - 1); 
  };
  const exportToExcel = () => {
     toast.info("Chức năng xuất Excel đang được phát triển.");
  };

  // --- 4. SỬA LỖI: Render Nút Hành Động (Thêm lại Hủy khi SHIPPING/DELIVERED) ---
  const renderActionButtons = (order: AdminOrderDTO) => {
    const buttons = [];
    const buttonBaseClass = "min-w-[80px] justify-center text-xs h-8";
    
    buttons.push( <Button key="view" variant="outline" size="sm" className="h-8 px-2" onClick={() => handleViewDetails(order)}> <Eye size={14} /> </Button> );
    
    switch (order.orderStatus) {
      case "PENDING":
        buttons.push( <Button key="confirm" size="sm" variant="secondary" className={`bg-blue-500 hover:bg-blue-600 text-white ${buttonBaseClass}`} onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}> <Check size={14} className="mr-1" /> Xác nhận </Button> );
        buttons.push( <Button key="cancel" size="sm" variant="destructive" className={buttonBaseClass} onClick={() => handleUpdateStatus(order.id, "CANCELLED")}> <Ban size={14} className="mr-1"/> Hủy </Button> );
        break;
        
      case "CONFIRMED":
        buttons.push( <Button key="ship" size="sm" variant="secondary" className={`bg-purple-500 hover:bg-purple-600 text-white ${buttonBaseClass}`} onClick={() => handleEnterTrackingCode(order.id)}> <Truck size={14} className="mr-1"/> Gửi hàng </Button> );
        buttons.push( <Button key="cancel_proc" size="sm" variant="destructive" className={buttonBaseClass} onClick={() => handleUpdateStatus(order.id, "CANCELLED")}> <Ban size={14} className="mr-1"/> Hủy </Button> );
        buttons.push( <Button key="undo_confirm" size="sm" variant="outline" title="Hoàn lại Chờ xác nhận" className="h-8 px-2" onClick={() => handleUpdateStatus(order.id, "PENDING")}> <Undo size={14} /> </Button> );
        break;
        
      case "SHIPPING":
        buttons.push( <Button key="delivered" size="sm" variant="secondary" className={`bg-green-500 hover:bg-green-600 text-white ${buttonBaseClass}`} onClick={() => handleUpdateStatus(order.id, "DELIVERED")}> <Check size={14} className="mr-1" /> Đã giao </Button> );
        // (Thêm lại nút Hủy - Dành cho Admin xử lý giao thất bại)
        buttons.push( <Button key="cancel_ship" size="sm" variant="destructive" className={buttonBaseClass} onClick={() => handleUpdateStatus(order.id, "CANCELLED")}> <Ban size={14} className="mr-1"/> Hủy </Button> );
        break;
        
      case "DELIVERED":
        buttons.push( <Button key="complete" size="sm" variant="secondary" className={`bg-gray-500 hover:bg-gray-600 text-white ${buttonBaseClass}`} onClick={() => handleUpdateStatus(order.id, "COMPLETED")}> <PackageCheck size={14} className="mr-1" /> Hoàn tất </Button> );
        // (Thêm nút Hủy - Dành cho Admin xử lý trả hàng/khiếu nại qua điện thoại)
        buttons.push( <Button key="cancel_delivered" size="sm" variant="destructive" className={buttonBaseClass} onClick={() => handleUpdateStatus(order.id, "CANCELLED")}> <Ban size={14} className="mr-1"/> Hủy/Trả hàng </Button> );
        break;
      
      case "DISPUTE":
        buttons.push( <Button key="resolve_delivered" size="sm" variant="secondary" className={`bg-green-500 hover:bg-green-600 text-white ${buttonBaseClass}`} onClick={() => handleUpdateStatus(order.id, "DELIVERED")}> <Check size={14} className="mr-1" /> Đã giao </Button> );
        buttons.push( <Button key="resolve_cancel" size="sm" variant="destructive" className={buttonBaseClass} onClick={() => handleUpdateStatus(order.id, "CANCELLED")}> <Ban size={14} className="mr-1"/> Hủy/Hoàn tiền </Button> );
        break;
        
      default: 
        // (COMPLETED, CANCELLED không có nút)
        break;
    }
    return <div className="flex gap-1.5 justify-center items-center">{buttons}</div>;
  };
  // --- KẾT THÚC SỬA ---


  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header (Giữ nguyên) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div> <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý đơn hàng</h1> <p className="text-sm text-muted-foreground mt-1">Quản lý tất cả đơn hàng từ khách hàng</p> </div>
        <div className="flex gap-2 self-end sm:self-center">
          <Button onClick={exportToExcel} className="gap-2" size="sm"> <Download size={16} /> Xuất Excel </Button> 
        </div>
      </div>

      {/* Card Danh sách */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({pagination.totalElements})</CardTitle>
          
          {/* --- 5. SỬA: Thêm tab "Khiếu nại" và "Hoàn tất" (grid-cols-8) --- */}
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
            </TabsList>
          </Tabs>
          {/* --- KẾT THÚC SỬA --- */}

          <div className="mt-4 flex gap-2 items-center"> <Search size={18} className="text-muted-foreground" /> <Input placeholder="Tìm mã đơn, tên khách, SĐT..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }} className="flex-1 h-9" /> </div>
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
                  <thead className="bg-muted/30"><tr className="border-b"><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mã đơn</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Khách hàng</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ngày đặt</th><th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Tổng cộng</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Thanh toán</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái ĐH</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80 min-w-[160px]">Hành động</th></tr></thead>
                  <tbody>{orders.map((order) => (<tr key={order.id} className="border-b last:border-b-0 hover:bg-muted/50"><td className="py-2 px-3 font-medium">{order.orderNumber}</td><td className="py-2 px-3">{order.customerName}</td><td className="py-2 px-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td><td className="py-2 px-3 text-right font-semibold">{formatCurrency(order.totalAmount)}</td><td className="py-2 px-3 text-xs"><Badge variant="outline" className={`mt-1 text-[11px] font-medium ${paymentStatusColors[order.paymentStatus]}`}>{paymentStatusLabels[order.paymentStatus]}</Badge></td><td className="py-2 px-3 text-center"><Badge variant="outline" className={`text-[11px] font-medium ${statusColors[order.orderStatus]}`}>{statusLabels[order.orderStatus]}</Badge></td><td className="py-2 px-3"><div className="flex gap-1.5 justify-center items-center">{renderActionButtons(order)}</div></td></tr>))}</tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && ( 
                <div className="flex justify-center pt-4">
                  <Pagination 
                    currentPage={pagination.page + 1} // (API 0-based, UI 1-based)
                    totalPages={pagination.totalPages} 
                    onPageChange={handlePageChange} 
                  />
                </div> 
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG (Dùng Data thật) --- */}
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
                  {/* Thông tin chung */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm"> 
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground flex items-center gap-1"><Package size={14}/> Mã đơn hàng</p> <p className="font-semibold text-base">{selectedOrder.orderNumber}</p> </div> 
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Ngày đặt</p> <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p> </div> 
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Trạng thái ĐH</p> <Badge variant="outline" className={`text-xs ${statusColors[selectedOrder.orderStatus]}`}>{statusLabels[selectedOrder.orderStatus]}</Badge> </div> 
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Khách hàng</p> <p className="font-medium">{selectedOrder.customerName}</p> </div> 
                    <div className="md:col-span-2"> <p className="text-xs text-muted-foreground flex items-center gap-1"><PhoneCall size={14}/> Số điện thoại</p> <p className="font-medium">{selectedOrder.phone || "-"}</p> </div> 
                    <div className="col-span-2 md:col-span-3"> <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={14}/> Địa chỉ giao hàng</p> <p className="font-medium">{selectedOrder.address || "-"}</p> </div> 
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">P.Thức TT</p> <p className="font-medium">{selectedOrder.paymentMethod}</p> </div> 
                    <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Trạng thái TT</p> <Badge variant="outline" className={`text-xs ${paymentStatusColors[selectedOrder.paymentStatus]}`}>{paymentStatusLabels[selectedOrder.paymentStatus]}</Badge> </div> 
                    {(selectedOrder.note) && ( 
                      <div className="col-span-2 md:col-span-3"> <p className="text-xs text-muted-foreground flex items-center gap-1"><ScrollText size={14}/> Ghi chú của khách</p> <p className="font-medium text-sm italic">{selectedOrder.note}</p> </div> 
                    )} 
                  </div>
                  {/* Chi tiết Thanh toán */}
                  <div className="border rounded-md p-4 space-y-2 text-sm bg-muted/30"> 
                    <h4 className="font-semibold mb-2 text-base">Chi tiết thanh toán</h4> 
                    <div className="flex justify-between"><span>Tiền hàng ({selectedOrder.items.length} SP):</span> <span>{formatCurrency(selectedOrder.subtotal)}</span></div> 
                    <div className="flex justify-between"><span>Phí vận chuyển:</span> <span>{formatCurrency(selectedOrder.shippingFee)}</span></div> 
                    {selectedOrder.couponDiscount > 0 && ( 
                      <div className="flex justify-between text-destructive"> <span>Giảm giá:</span> <span>- {formatCurrency(selectedOrder.couponDiscount)}</span> </div> 
                    )} 
                    <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-base"><span>Tổng cộng:</span> <span>{formatCurrency(selectedOrder.totalAmount)}</span></div> 
                  </div>
                  {/* Danh sách sản phẩm */}
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
                            {item.quantity > 1 && ( <p className="text-xs text-muted-foreground font-normal mt-0.5">{formatCurrency(item.price)} / SP</p> )} 
                          </div> 
                        </div> 
                      ))} 
                    </div> 
                  </div>
                  <div className="flex justify-end pt-4 border-t"> <Button variant="outline" onClick={handleCloseDetails}>Đóng</Button> </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}