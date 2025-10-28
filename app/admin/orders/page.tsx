"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Download, Ban, X, Check, Truck, Undo, Package, Ticket, MapPin, PhoneCall, ScrollText, Plus, Trash2 } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload"; // Giả sử component này tồn tại

const ITEMS_PER_PAGE = 5;
// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Định nghĩa các loại trạng thái và phương thức ---
type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type PaymentMethod = "COD" | "VNPAY" | "MOMO";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "COD_PENDING";

// --- Interface cho Đơn hàng ---
interface Order {
  id: string; orderNumber: string; customerName: string; createdAt: string; itemsCount: number; subtotal: number; shippingFee: number; discountCode?: string | null; discountAmount: number; total: number; status: OrderStatus; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; shippingAddress: string; customerPhone: string; customerNote?: string | null; trackingCode?: string | null;
}

// --- Interface cho Chi tiết sản phẩm trong đơn ---
interface OrderItem { id: string; productName: string; variantInfo: string; quantity: number; price: number; imageUrl?: string; }

// --- Interface cho Kết quả tìm kiếm SP ---
interface MockProductSearchResult { id: string; name: string; price: number; stock: number; imageUrl?: string; }

// --- Dữ liệu giả lập ---
const initialOrders: Order[] = [ { id: "1", orderNumber: "DH001", customerName: "Nguyễn Văn A", createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), itemsCount: 2, subtotal: 550000, shippingFee: 30000, discountCode: "SALE10", discountAmount: 55000, total: 525000, status: "PENDING", paymentMethod: "COD", paymentStatus: "COD_PENDING", shippingAddress: "123 Đường ABC, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh", customerPhone: "0901234567", customerNote: "Giao hàng giờ hành chính"}, { id: "2", orderNumber: "DH002", customerName: "Trần Thị B", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), itemsCount: 1, subtotal: 1200000, shippingFee: 0, discountCode: null, discountAmount: 0, total: 1200000, status: "PENDING", paymentMethod: "VNPAY", paymentStatus: "PAID", shippingAddress: "Số 456, Ngõ XYZ, Đường Láng, Quận Đống Đa, Hà Nội", customerPhone: "0987654321" }, { id: "3", orderNumber: "DH003", customerName: "Lê Văn C", createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), itemsCount: 3, subtotal: 300000, shippingFee: 25000, discountCode: null, discountAmount: 0, total: 325000, status: "PROCESSING", paymentMethod: "COD", paymentStatus: "COD_PENDING", shippingAddress: "789 Đường DEF, Quận Hải Châu, Đà Nẵng", customerPhone: "0912987654", customerNote: "Gọi trước khi giao" }, { id: "4", orderNumber: "DH004", customerName: "Phạm Thị D", createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), itemsCount: 1, subtotal: 850000, shippingFee: 0, discountCode: "FREESHIP", discountAmount: 0, total: 850000, status: "SHIPPED", paymentMethod: "MOMO", paymentStatus: "PAID", shippingAddress: "101 Đường GHI, Quận Ninh Kiều, Cần Thơ", customerPhone: "0945112233", trackingCode: "VNPOST123456" }, { id: "5", orderNumber: "DH005", customerName: "Hoàng Văn E", createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), itemsCount: 5, subtotal: 2100000, shippingFee: 50000, discountCode: "BIGSALE", discountAmount: 210000, total: 1940000, status: "DELIVERED", paymentMethod: "COD", paymentStatus: "PAID", shippingAddress: "222 Đường KLM, Phường An Lộc, Thị xã Bình Long, Bình Phước", customerPhone: "0933445566" }, { id: "6", orderNumber: "DH006", customerName: "Vũ Thị F", createdAt: new Date(Date.now() - 86400000 * 6).toISOString(), itemsCount: 1, subtotal: 400000, shippingFee: 15000, discountCode: null, discountAmount: 0, total: 415000, status: "CANCELLED", paymentMethod: "VNPAY", paymentStatus: "PENDING", shippingAddress: "333 Đường NOP, TP. Thủ Dầu Một, Bình Dương", customerPhone: "0977889900" }, ];
const orderItemsData: Record<string, OrderItem[]> = { "1": [ { id: "oi1", productName: "Áo Thun Basic Cotton", variantInfo: "Trắng / Size M", quantity: 1, price: 250000, imageUrl: "/placeholder.svg" }, { id: "oi2", productName: "Quần Jeans Slimfit Co Giãn", variantInfo: "Xanh Đậm / Size 30", quantity: 1, price: 300000, imageUrl: "/placeholder.svg" } ], "2": [ { id: "oi3", productName: "Giày Sneaker Chạy Bộ", variantInfo: "Đen / Size 42", quantity: 1, price: 1200000, imageUrl: "/placeholder.svg" } ], "3": [ { id: "oi4", productName: "Áo Sơ Mi Tay Ngắn", variantInfo: "Xanh Caro / Size L", quantity: 2, price: 100000, imageUrl: "/placeholder.svg" }, { id: "oi5", productName: "Mũ Lưỡi Trai", variantInfo: "Đen / Free Size", quantity: 1, price: 100000, imageUrl: "/placeholder.svg" } ], "4": [ { id: "oi6", productName: "Đầm Voan Hoa", variantInfo: "Vàng / Size S", quantity: 1, price: 850000, imageUrl: "/placeholder.svg" } ], "5": [ { id: "oi7", productName: "Áo Thun Basic Cotton", variantInfo: "Đen / Size XL", quantity: 3, price: 250000, imageUrl: "/placeholder.svg" }, { id: "oi8", productName: "Quần Short Kaki", variantInfo: "Be / Size 32", quantity: 2, price: 200000, imageUrl: "/placeholder.svg" }, { id: "oi9", productName: "Thắt Lưng Da", variantInfo: "Nâu", quantity: 1, price: 450000, imageUrl: "/placeholder.svg" }, { id: "oi10", productName: "Vớ Cổ Ngắn", variantInfo: "Trắng (Set 3 đôi)", quantity: 2, price: 250000, imageUrl: "/placeholder.svg" } ], "6": [ { id: "oi11", productName: "Áo Khoác Dù", variantInfo: "Xám / Size M", quantity: 1, price: 400000, imageUrl: "/placeholder.svg" } ], };
const mockProductDatabase: MockProductSearchResult[] = [ { id: "prod1_var1", name: "Áo Thun Basic - Trắng / M", price: 250000, stock: 50, imageUrl: "/placeholder.svg" }, { id: "prod1_var2", name: "Áo Thun Basic - Đen / L", price: 250000, stock: 30, imageUrl: "/placeholder.svg" }, { id: "prod1_var3", name: "Áo Thun Basic - Xám / M", price: 250000, stock: 0, imageUrl: "/placeholder.svg" }, { id: "prod2_var1", name: "Quần Jeans Slimfit - Xanh Đậm / 30", price: 300000, stock: 25, imageUrl: "/placeholder.svg" }, { id: "prod2_var2", name: "Quần Jeans Slimfit - Đen / 32", price: 310000, stock: 15, imageUrl: "/placeholder.svg" }, { id: "prod3_var1", name: "Giày Sneaker - Đen / 42", price: 1200000, stock: 5, imageUrl: "/placeholder.svg" }, ];

// --- Labels và Colors ---
const statusColors: Record<OrderStatus, string> = { PENDING: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300", PROCESSING: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300", SHIPPED: "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300", DELIVERED: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300", CANCELLED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300"};
const statusLabels: Record<OrderStatus, string> = { PENDING: "Chờ xử lý", PROCESSING: "Đang xử lý", SHIPPED: "Đã gửi", DELIVERED: "Đã giao", CANCELLED: "Đã hủy"};
const paymentStatusLabels: Record<PaymentStatus, string> = { PENDING: "Chờ thanh toán", PAID: "Đã thanh toán", FAILED: "Thất bại", COD_PENDING: "Chờ thu COD"};
const paymentStatusColors: Record<PaymentStatus, string> = { PENDING: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300", PAID: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300", FAILED: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300", COD_PENDING: "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300"};

// --- Helper định dạng tiền ---
const formatCurrency = (amount: number) => `₫${amount.toLocaleString('vi-VN')}`;

// --- Component Chính ---
export function OrderManagement() {
  // --- States ---
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState({ name: "", phone: "", address: "" });
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [foundProducts, setFoundProducts] = useState<MockProductSearchResult[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [newOrderShippingFee, setNewOrderShippingFee] = useState<number | string>(0);
  const [newOrderDiscountCode, setNewOrderDiscountCode] = useState("");
  const [newOrderDiscountAmount, setNewOrderDiscountAmount] = useState(0);
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState<PaymentMethod>("COD");
  const [newOrderNote, setNewOrderNote] = useState("");

  // --- Handlers ---

  // Cập nhật trạng thái (mô phỏng API)
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, trackingCode?: string) => {
    console.log(`Simulating API Call: Update order ${orderId} to status ${newStatus}${trackingCode ? ` with tracking ${trackingCode}` : ''}`);
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              // SỬA: Đảm bảo paymentStatus là kiểu PaymentStatus
              paymentStatus: (newStatus === "DELIVERED" && o.paymentMethod === "COD") ? "PAID" as PaymentStatus : o.paymentStatus,
              trackingCode: trackingCode !== undefined ? trackingCode : o.trackingCode
            }
          : o
      )
    );
    toast.success(`Đã cập nhật đơn #${orders.find(o=>o.id === orderId)?.orderNumber} sang trạng thái "${statusLabels[newStatus]}"`);
  };

  // Hủy đơn (mô phỏng API)
  const cancelOrder = (orderId: string) => {
    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel || (orderToCancel.status !== 'PENDING' && orderToCancel.status !== 'PROCESSING')) { toast.warning("Không thể hủy đơn hàng ở trạng thái này."); return; }
    if (!confirm(`Bạn có chắc muốn hủy đơn hàng #${orderToCancel.orderNumber} không?`)) return;
    console.log(`Simulating API Call: Cancel order ${orderId}`);
    updateOrderStatus(orderId, "CANCELLED");
  };

  // Lọc và Phân trang
  const filteredOrders = useMemo( () => orders.filter( (o) => (statusFilter === "ALL" || o.status === statusFilter) && (o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || (o.customerPhone && o.customerPhone.includes(searchTerm))) ), [orders, searchTerm, statusFilter] );
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Xem chi tiết (mô phỏng fetch items)
  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order); setShowDetails(true); setIsFetchingItems(true);
    console.log(`Simulating API Call: Fetch items for order ${order.id}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    const items = orderItemsData[order.id] || [];
    setSelectedOrderItems(items); setIsFetchingItems(false);
  };

  // Đóng modal
  const handleCloseDetails = () => { setShowDetails(false); setSelectedOrder(null); setSelectedOrderItems([]); };
  const handleCloseCreateForm = () => { setShowCreateForm(false); };

  // Đổi bộ lọc trạng thái
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus as OrderStatus | "ALL"); // Ép kiểu ở đây
    setCurrentPage(1);
  };

  // Xuất Excel
  const exportToExcel = () => {
    const headers = ["Mã đơn", "Khách hàng", "SĐT", "Ngày đặt", "Số lượng SP", "Tiền hàng", "Phí Ship", "Mã giảm giá", "Tiền giảm", "Tổng cộng", "Trạng thái ĐH", "P.Thức TT", "Trạng thái TT", "Địa chỉ", "Ghi chú"];
    const data = filteredOrders.map((order) => [ order.orderNumber, order.customerName, order.customerPhone, new Date(order.createdAt).toLocaleString('vi-VN'), order.itemsCount, order.subtotal, order.shippingFee, order.discountCode || "", order.discountAmount, order.total, statusLabels[order.status] || order.status, order.paymentMethod, paymentStatusLabels[order.paymentStatus] || order.paymentStatus, order.shippingAddress, order.customerNote || "", ]);
    let csv = headers.join(",") + "\n"; data.forEach((row) => { csv += row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(",") + "\n"; });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", `DonHang_${new Date().toISOString().split("T")[0]}.csv`); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Nhập mã vận đơn
  const handleEnterTrackingCode = (orderId: string) => {
    const currentOrder = orders.find(o => o.id === orderId); const currentTrackingCode = currentOrder?.trackingCode || "";
    const trackingCode = prompt(`Nhập mã vận đơn cho đơn hàng #${currentOrder?.orderNumber}:`, currentTrackingCode);
    if (trackingCode !== null) { updateOrderStatus(orderId, "SHIPPED", trackingCode.trim()); }
  };

  // Render Nút Hành Động
  const renderActionButtons = (order: Order) => {
    const buttons = []; const buttonBaseClass = "min-w-[80px] justify-center text-xs h-8";
    buttons.push( <Button key="view" variant="outline" size="sm" className="h-8 px-2" onClick={() => handleViewDetails(order)}> <Eye size={14} /> </Button> );
    switch (order.status) {
      case "PENDING": if ((order.paymentMethod !== 'COD' && order.paymentStatus === 'PAID') || order.paymentMethod === 'COD') { buttons.push( <Button key="process" size="sm" variant="secondary" className={`bg-blue-500 hover:bg-blue-600 text-white ${buttonBaseClass}`} onClick={() => updateOrderStatus(order.id, "PROCESSING")}> <Check size={14} className="mr-1" /> Xử lý </Button> ); } buttons.push( <Button key="cancel" size="sm" variant="destructive" className={buttonBaseClass} onClick={() => cancelOrder(order.id)}> <Ban size={14} className="mr-1"/> Hủy </Button> ); break;
      case "PROCESSING": buttons.push( <Button key="ship" size="sm" variant="secondary" className={`bg-purple-500 hover:bg-purple-600 text-white ${buttonBaseClass}`} onClick={() => handleEnterTrackingCode(order.id)}> <Truck size={14} className="mr-1"/> Gửi hàng </Button> ); buttons.push( <Button key="cancel_proc" size="sm" variant="destructive" className={buttonBaseClass} onClick={() => cancelOrder(order.id)}> <Ban size={14} className="mr-1"/> Hủy </Button> ); break;
      case "SHIPPED": if (order.paymentMethod === 'COD' && order.paymentStatus === 'COD_PENDING') { buttons.push( <Button key="cod_paid" size="sm" variant="secondary" className={`bg-green-500 hover:bg-green-600 text-white ${buttonBaseClass}`} onClick={() => updateOrderStatus(order.id, "DELIVERED")}> <Check size={14} className="mr-1" /> Đã thu tiền </Button> ); } else if (order.paymentMethod !== 'COD' && order.paymentStatus === 'PAID') { buttons.push( <Button key="delivered" size="sm" variant="secondary" className={`bg-green-500 hover:bg-green-600 text-white ${buttonBaseClass}`} onClick={() => updateOrderStatus(order.id, "DELIVERED")}> <Check size={14} className="mr-1" /> Đã giao </Button> ); } buttons.push( <Button key="undo_ship" size="sm" variant="outline" title="Hoàn lại Đang xử lý" className="h-8 px-2" onClick={() => updateOrderStatus(order.id, "PROCESSING")}> <Undo size={14} /> </Button> ); break;
      default: break;
    }
    return <div className="flex gap-1.5 justify-center items-center">{buttons}</div>;
  };

  // --- Handlers cho Form Tạo Đơn ---
  const handleOpenCreateForm = () => { setNewOrderCustomer({ name: "", phone: "", address: "" }); setNewOrderItems([]); setProductSearch(""); setFoundProducts([]); setNewOrderShippingFee(0); setNewOrderDiscountCode(""); setNewOrderDiscountAmount(0); setNewOrderPaymentMethod("COD"); setNewOrderNote(""); setShowCreateForm(true); };

  const searchProductsToAdd = async (term: string) => {
    if (!term || term.length < 1) { setFoundProducts([]); return; }
    setIsSearchingProducts(true); console.log("Simulating API Call: Search products/variants with term:", term); await new Promise(resolve => setTimeout(resolve, 300));
    const mockResults = mockProductDatabase.filter(p => p.name.toLowerCase().includes(term.toLowerCase()) && p.stock > 0);
    setFoundProducts(mockResults); setIsSearchingProducts(false);
  };

  const handleAddItemToOrder = (product: MockProductSearchResult) => {
    if (product.stock <= 0) { toast.warning(`Sản phẩm "${product.name}" đã hết hàng.`); return; }
    setNewOrderItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
        if (existingItemIndex > -1) { const updatedItems = [...prevItems]; if (updatedItems[existingItemIndex].quantity < product.stock) { updatedItems[existingItemIndex].quantity += 1; } else { toast.warning(`Chỉ còn ${product.stock} sản phẩm "${product.name}" trong kho.`); } return updatedItems; }
        else { const [productName = '', variantInfo = ''] = product.name.split(' - '); const newItem: OrderItem = { id: product.id, productName: productName, variantInfo: variantInfo, quantity: 1, price: product.price, imageUrl: product.imageUrl, }; return [...prevItems, newItem]; }
    });
    setProductSearch(""); setFoundProducts([]);
  };

  const handleRemoveItemFromOrder = (itemId: string) => { setNewOrderItems(prevItems => prevItems.filter(item => item.id !== itemId)); };

  const handleUpdateItemQuantity = (itemId: string, quantityStr: string) => {
    const quantity = parseInt(quantityStr) || 0; const productInDb = mockProductDatabase.find(p => p.id === itemId); const maxStock = productInDb?.stock ?? 0;
    setNewOrderItems(prevItems => prevItems.map(item => { if (item.id === itemId) { if (quantity < 1) { return { ...item, quantity: 1 }; } if (quantity > maxStock) { toast.warning(`Chỉ còn ${maxStock} sản phẩm "${item.productName} - ${item.variantInfo}" trong kho.`); return { ...item, quantity: maxStock }; } return { ...item, quantity: quantity }; } return item; }) );
  };

  const newOrderSubtotal = useMemo(() => newOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [newOrderItems]);
  const newOrderTotal = useMemo(() => { const fee = Number(newOrderShippingFee) || 0; const discount = newOrderDiscountAmount || 0; return newOrderSubtotal + fee - discount; }, [newOrderSubtotal, newOrderShippingFee, newOrderDiscountAmount]);

  const handleApplyDiscountCode = () => {
    if (!newOrderDiscountCode.trim()) return; console.log("API Call: Validate discount code", newOrderDiscountCode);
    if (newOrderDiscountCode.toUpperCase() === "SALE10") { const discount = Math.round(newOrderSubtotal * 0.1); setNewOrderDiscountAmount(discount); toast.success(`Áp dụng mã ${newOrderDiscountCode} thành công! Giảm ${formatCurrency(discount)}`); }
    else if (newOrderDiscountCode.toUpperCase() === "FREESHIP") { const discount = Number(newOrderShippingFee) || 0; setNewOrderDiscountAmount(discount); toast.success(`Áp dụng mã ${newOrderDiscountCode} thành công! Miễn phí vận chuyển (${formatCurrency(discount)})`); }
    else { setNewOrderDiscountAmount(0); toast.error("Mã giảm giá không hợp lệ hoặc đã hết hạn."); }
  };

  const handleCreateOrderSubmit = async () => {
    if (!newOrderCustomer.name.trim() || !newOrderCustomer.phone.trim() || !newOrderCustomer.address.trim()) { toast.error("Vui lòng nhập đầy đủ thông tin khách hàng."); return; }
    if (newOrderItems.length === 0) { toast.error("Vui lòng thêm sản phẩm vào đơn hàng."); return; }
    const shippingFee = Number(newOrderShippingFee); if (isNaN(shippingFee) || shippingFee < 0) { toast.error("Phí vận chuyển không hợp lệ."); return; }
    // SỬA: Đảm bảo paymentStatus là kiểu PaymentStatus
    const paymentStatusToSend: PaymentStatus = newOrderPaymentMethod === 'COD' ? 'COD_PENDING' : 'PENDING';
    const orderPayload = { customerInfo: newOrderCustomer, items: newOrderItems.map(item => ({ variantId: item.id, quantity: item.quantity, price: item.price })), shippingFee: shippingFee, discountCode: newOrderDiscountCode || null, discountAmount: newOrderDiscountAmount, subtotal: newOrderSubtotal, totalAmount: newOrderTotal, paymentMethod: newOrderPaymentMethod, status: "PENDING" as OrderStatus, paymentStatus: paymentStatusToSend, notes: newOrderNote || null };

    console.log("API Call: POST /api/v1/orders/admin-create with payload:", orderPayload); toast.info("Đang tạo đơn hàng..."); await new Promise(resolve => setTimeout(resolve, 1000));
    const newOrderId = `new_${Date.now()}`; const newOrder: Order = { id: newOrderId, orderNumber: `DH${Math.floor(Math.random() * 9000) + 1000}`, customerName: orderPayload.customerInfo.name, customerPhone: orderPayload.customerInfo.phone, shippingAddress: orderPayload.customerInfo.address, createdAt: new Date().toISOString(), itemsCount: orderPayload.items.reduce((sum, i) => sum + i.quantity, 0), subtotal: orderPayload.subtotal, shippingFee: orderPayload.shippingFee, discountCode: orderPayload.discountCode, discountAmount: orderPayload.discountAmount, total: orderPayload.totalAmount, status: orderPayload.status, paymentMethod: orderPayload.paymentMethod, paymentStatus: orderPayload.paymentStatus, customerNote: orderPayload.notes };
    setOrders(prev => [newOrder, ...prev]); toast.success("Tạo đơn hàng thủ công thành công!"); handleCloseCreateForm();
  };


  // --- JSX ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div> <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý đơn hàng</h1> <p className="text-sm text-muted-foreground mt-1">Quản lý tất cả đơn hàng từ khách hàng</p> </div>
        <div className="flex gap-2 self-end sm:self-center"> <Button onClick={handleOpenCreateForm} className="gap-2" size="sm"> <Plus size={16} /> Tạo Đơn Hàng </Button> <Button onClick={exportToExcel} className="gap-2" size="sm"> <Download size={16} /> Xuất Excel </Button> </div>
      </div>

      {/* Card Danh sách */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({filteredOrders.length})</CardTitle>
          {/* SỬA: Truyền hàm đúng */}
          <Tabs value={statusFilter} onValueChange={handleStatusFilterChange} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6"> <TabsTrigger value="ALL">Tất cả</TabsTrigger> <TabsTrigger value="PENDING">Chờ xử lý</TabsTrigger> <TabsTrigger value="PROCESSING">Đang xử lý</TabsTrigger> <TabsTrigger value="SHIPPED">Đã gửi</TabsTrigger> <TabsTrigger value="DELIVERED">Đã giao</TabsTrigger> <TabsTrigger value="CANCELLED">Đã hủy</TabsTrigger> </TabsList>
          </Tabs>
          <div className="mt-4 flex gap-2 items-center"> <Search size={18} className="text-muted-foreground" /> <Input placeholder="Tìm mã đơn, tên khách, SĐT..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="flex-1 h-9" /> </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? ( <div className="text-center py-10 text-muted-foreground">Chưa có đơn hàng nào.</div> ) : filteredOrders.length === 0 ? ( <div className="text-center py-10 text-muted-foreground">Không tìm thấy đơn hàng nào khớp.</div> ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {/* SỬA: Viết liền <th> */}
                  <thead className="bg-muted/30"><tr className="border-b"><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Mã đơn</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Khách hàng</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ngày đặt</th><th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Tổng cộng</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Thanh toán</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái ĐH</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80 min-w-[160px]">Hành động</th></tr></thead>
                  {/* SỬA: Viết liền <td> */}
                  <tbody>{paginatedOrders.map((order) => (<tr key={order.id} className="border-b last:border-b-0 hover:bg-muted/50"><td className="py-2 px-3 font-medium">{order.orderNumber}</td><td className="py-2 px-3">{order.customerName}</td><td className="py-2 px-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td><td className="py-2 px-3 text-right font-semibold">{formatCurrency(order.total)}</td><td className="py-2 px-3 text-xs"><div>{order.paymentMethod}</div><Badge variant="outline" className={`mt-1 text-[11px] font-medium ${paymentStatusColors[order.paymentStatus]}`}>{paymentStatusLabels[order.paymentStatus]}</Badge></td><td className="py-2 px-3 text-center"><Badge variant="outline" className={`text-[11px] font-medium ${statusColors[order.status]}`}>{statusLabels[order.status]}</Badge></td><td className="py-2 px-3"><div className="flex gap-1.5 justify-center items-center">{renderActionButtons(order)}</div></td></tr>))}</tbody>
                </table>
              </div>
              {totalPages > 1 && ( <div className="flex justify-center pt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div> )}
            </>
          )}
        </CardContent>
      </Card>

      {/* --- MODAL TẠO ĐƠN HÀNG --- */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in duration-200" onClick={handleCloseCreateForm}>
          <Card className="w-full max-w-4xl bg-card shadow-xl animate-scale-in duration-200 h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b flex-shrink-0"> <CardTitle className="text-lg font-semibold">Tạo Đơn Hàng Mới</CardTitle> <Button variant="ghost" size="icon" className="w-7 h-7 -mr-2 -mt-1 text-muted-foreground hover:bg-muted" onClick={handleCloseCreateForm}> <X size={18} /> </Button> </CardHeader>
            <CardContent className="pt-6 space-y-5 flex-1 overflow-y-auto">
              {/* Thông Tin Khách Hàng */}
              <div className="border rounded-md p-4 space-y-3 bg-muted/20"> <Label className="block text-base font-semibold text-foreground">1. Thông Tin Khách Hàng</Label> <Input placeholder="Tên khách hàng *" value={newOrderCustomer.name} onChange={e => setNewOrderCustomer({...newOrderCustomer, name: e.target.value})} /> <Input placeholder="Số điện thoại *" value={newOrderCustomer.phone} onChange={e => setNewOrderCustomer({...newOrderCustomer, phone: e.target.value})} /> <Input placeholder="Địa chỉ giao hàng *" value={newOrderCustomer.address} onChange={e => setNewOrderCustomer({...newOrderCustomer, address: e.target.value})} /> </div>
              {/* Thêm Sản Phẩm */}
              <div className="border rounded-md p-4 space-y-3"> <Label className="block text-base font-semibold text-foreground">2. Thêm Sản Phẩm</Label> <div className="relative"> <Input placeholder="Tìm kiếm tên sản phẩm hoặc SKU..." value={productSearch} onChange={e => { setProductSearch(e.target.value); searchProductsToAdd(e.target.value); }} /> {isSearchingProducts && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Đang tìm...</span>} {foundProducts.length > 0 && ( <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto"> {foundProducts.map(p => ( <div key={p.id} className="p-2 hover:bg-muted cursor-pointer text-sm flex items-center gap-2" onClick={() => handleAddItemToOrder(p)}> <img src={p.imageUrl || '/placeholder.svg'} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" /> <div className="flex-1 min-w-0"> <p className="truncate">{p.name}</p> <p className="text-xs text-muted-foreground">{formatCurrency(p.price)} - Tồn: {p.stock}</p> </div> </div> ))} </div> )} </div>
                {/* Danh sách sản phẩm đã thêm */}
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2"> {newOrderItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Chưa có sản phẩm nào.</p>} {newOrderItems.map((item, index) => ( <div key={item.id + index} className="flex items-center gap-3 border-b pb-2 last:border-b-0"> <img src={item.imageUrl || '/placeholder.svg'} alt="" className="w-10 h-10 object-cover rounded border flex-shrink-0" /> <div className="flex-1 text-sm min-w-0"> <p className="font-medium truncate">{item.productName}</p> <p className="text-xs text-muted-foreground truncate">{item.variantInfo}</p> <p className="text-xs">{formatCurrency(item.price)}</p> </div> <Input type="number" min="1" value={item.quantity} onChange={e => handleUpdateItemQuantity(item.id, e.target.value)} className="h-8 w-16 text-center text-sm appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"/> <div className="text-sm font-semibold w-20 text-right">{formatCurrency(item.price * item.quantity)}</div> <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive flex-shrink-0" onClick={() => handleRemoveItemFromOrder(item.id)}> <Trash2 size={14} /> </Button> </div> ))} </div>
              </div>
              {/* Thanh Toán & Vận Chuyển */}
              <div className="border rounded-md p-4 space-y-3 bg-muted/20"> <Label className="block text-base font-semibold text-foreground">3. Thanh Toán & Vận Chuyển</Label> <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> <div> <Label htmlFor="shippingFee" className="text-xs text-muted-foreground">Phí vận chuyển *</Label> <Input id="shippingFee" type="number" placeholder="0" min="0" value={newOrderShippingFee} onChange={e => setNewOrderShippingFee(e.target.value)} className="mt-1 h-9"/> </div> <div className="flex items-end gap-2"> <div className="flex-1"> <Label htmlFor="discountCode" className="text-xs text-muted-foreground">Mã giảm giá</Label> <Input id="discountCode" placeholder="Nhập mã..." value={newOrderDiscountCode} onChange={e => { setNewOrderDiscountCode(e.target.value); setNewOrderDiscountAmount(0); }} className="mt-1 h-9"/> </div> <Button onClick={handleApplyDiscountCode} size="sm" className="h-9 px-3" disabled={!newOrderDiscountCode.trim()}>Áp dụng</Button> </div> </div> <div> <Label htmlFor="paymentMethod" className="text-xs text-muted-foreground">Phương thức thanh toán *</Label> <Select value={newOrderPaymentMethod} onValueChange={(value: PaymentMethod) => setNewOrderPaymentMethod(value)}> <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger> <SelectContent> <SelectItem value="COD">Thanh toán khi nhận hàng (COD)</SelectItem> <SelectItem value="VNPAY">Thanh toán VNPAY (Chuyển khoản)</SelectItem> <SelectItem value="MOMO">Thanh toán MOMO</SelectItem> </SelectContent> </Select> </div> <div> <Label htmlFor="orderNote" className="text-xs text-muted-foreground">Ghi chú đơn hàng</Label> <Input id="orderNote" placeholder="Ghi chú thêm (vd: thời gian giao hàng mong muốn...)" value={newOrderNote} onChange={e => setNewOrderNote(e.target.value)} className="mt-1 h-9"/> </div> </div>
              {/* Tóm tắt đơn hàng */}
              <div className="border rounded-md p-4 space-y-2 text-sm sticky bottom-0 bg-background shadow-sm"> <h4 className="font-semibold mb-2 text-base">Tóm tắt</h4> <div className="flex justify-between"><span>Tiền hàng ({newOrderItems.length} SP):</span> <span>{formatCurrency(newOrderSubtotal)}</span></div> <div className="flex justify-between"><span>Phí vận chuyển:</span> <span>{formatCurrency(Number(newOrderShippingFee) || 0)}</span></div> {newOrderDiscountAmount > 0 && ( <div className="flex justify-between text-destructive"> <span>Giảm giá ({newOrderDiscountCode}):</span> <span>- {formatCurrency(newOrderDiscountAmount)}</span> </div> )} <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-lg"><span>Tổng cộng:</span> <span>{formatCurrency(newOrderTotal)}</span></div> </div>
            </CardContent>
            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0 bg-muted/30"> <Button variant="outline" onClick={handleCloseCreateForm}>Hủy</Button> <Button onClick={handleCreateOrderSubmit} disabled={newOrderItems.length === 0}> Tạo Đơn Hàng </Button> </div>
          </Card>
        </div>
      )}

      {/* Modal Chi tiết */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in duration-200" onClick={handleCloseDetails}>
          <Card className="w-full max-w-3xl bg-card shadow-xl animate-scale-in duration-200" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b"> <CardTitle className="text-lg font-semibold">Chi tiết đơn hàng #{selectedOrder.orderNumber}</CardTitle> <Button variant="ghost" size="icon" className="w-7 h-7 -mr-2 -mt-1 text-muted-foreground hover:bg-muted" onClick={handleCloseDetails}> <X size={18} /> </Button> </CardHeader>
            <CardContent className="pt-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Thông tin chung */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm"> <div className="md:col-span-1"> <p className="text-xs text-muted-foreground flex items-center gap-1"><Package size={14}/> Mã đơn hàng</p> <p className="font-semibold text-base">{selectedOrder.orderNumber}</p> </div> <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Ngày đặt</p> <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</p> </div> <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Trạng thái ĐH</p> <Badge variant="outline" className={`text-xs ${statusColors[selectedOrder.status]}`}>{statusLabels[selectedOrder.status]}</Badge> </div> <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Khách hàng</p> <p className="font-medium">{selectedOrder.customerName}</p> </div> <div className="md:col-span-2"> <p className="text-xs text-muted-foreground flex items-center gap-1"><PhoneCall size={14}/> Số điện thoại</p> <p className="font-medium">{selectedOrder.customerPhone || "-"}</p> </div> <div className="col-span-2 md:col-span-3"> <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={14}/> Địa chỉ giao hàng</p> <p className="font-medium">{selectedOrder.shippingAddress || "-"}</p> </div> <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">P.Thức TT</p> <p className="font-medium">{selectedOrder.paymentMethod}</p> </div> <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Trạng thái TT</p> <Badge variant="outline" className={`text-xs ${paymentStatusColors[selectedOrder.paymentStatus]}`}>{paymentStatusLabels[selectedOrder.paymentStatus]}</Badge> </div> {selectedOrder.trackingCode && ( <div className="md:col-span-1"> <p className="text-xs text-muted-foreground">Mã vận đơn</p> <p className="font-medium text-blue-600">{selectedOrder.trackingCode}</p> </div> )} {(selectedOrder.customerNote) && ( <div className="col-span-2 md:col-span-3"> <p className="text-xs text-muted-foreground flex items-center gap-1"><ScrollText size={14}/> Ghi chú của khách</p> <p className="font-medium text-sm italic">{selectedOrder.customerNote}</p> </div> )} </div>
              {/* Chi tiết Thanh toán */}
              <div className="border rounded-md p-4 space-y-2 text-sm bg-muted/30"> <h4 className="font-semibold mb-2 text-base">Chi tiết thanh toán</h4> <div className="flex justify-between"><span>Tiền hàng ({selectedOrder.itemsCount} SP):</span> <span>{formatCurrency(selectedOrder.subtotal)}</span></div> <div className="flex justify-between"><span>Phí vận chuyển:</span> <span>{formatCurrency(selectedOrder.shippingFee)}</span></div> {selectedOrder.discountAmount > 0 && ( <div className="flex justify-between text-destructive"> <span>Giảm giá ({selectedOrder.discountCode || 'Khác'}):</span> <span>- {formatCurrency(selectedOrder.discountAmount)}</span> </div> )} <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-base"><span>Tổng cộng:</span> <span>{formatCurrency(selectedOrder.total)}</span></div> </div>
              {/* Danh sách sản phẩm */}
              <div className="border-t pt-4"> <h4 className="font-semibold mb-3 text-base">Sản phẩm trong đơn</h4> {isFetchingItems ? ( <div className="text-center py-4 text-muted-foreground">Đang tải chi tiết sản phẩm...</div> ) : selectedOrderItems.length === 0 ? ( <div className="text-center py-4 text-muted-foreground">Không có sản phẩm trong đơn hàng này.</div> ) : ( <div className="space-y-3"> {selectedOrderItems.map(item => ( <div key={item.id} className="flex items-start gap-3 border-b pb-3 last:border-b-0"> <img src={item.imageUrl || "/placeholder.svg"} alt={item.productName} className="w-16 h-16 object-cover rounded border flex-shrink-0" /> <div className="flex-1 text-sm min-w-0"> <p className="font-medium truncate">{item.productName}</p> <p className="text-xs text-muted-foreground truncate">{item.variantInfo}</p> <p className="text-xs text-muted-foreground">SL: {item.quantity}</p> </div> <div className="text-sm font-semibold text-right flex-shrink-0 w-28"> {formatCurrency(item.price * item.quantity)} {item.quantity > 1 && ( <p className="text-xs text-muted-foreground font-normal mt-0.5">{formatCurrency(item.price)} / SP</p> )} </div> </div> ))} </div> )} </div>
              {/* Nút đóng */}
              <div className="flex justify-end pt-4 border-t"> <Button variant="outline" onClick={handleCloseDetails}>Đóng</Button> </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div> // Div gốc ngoài cùng
  )
}