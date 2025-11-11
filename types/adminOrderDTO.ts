// (Tạo file tại: src/types/adminOrderDTO.ts)

// (Lấy từ enums/OrderStatus.java)
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "DISPUTE";
// (Lấy từ enums/PaymentStatus.java)
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "PENDING_REFUND" | "REFUNDED";

// (Lấy từ enums/PaymentMethod.java)
export type PaymentMethod = "COD" | "VNPAY";


/**
 * DTO cho danh sách (Bảng) - Khớp AdminOrderDTO.java
 */
export interface AdminOrderDTO {
  id: number;
  orderNumber: string;
  customerName: string;
  createdAt: string; // (ISO Date string)
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod; // <-- Thêm dòng này
  stockReturned: boolean;  // <-- THÊM DÒNG NÀY
}

/**
 * DTO cho item trong modal - Khớp AdminOrderItemDTO.java
 */
export interface AdminOrderItemDTO {
  variantId: number;
  productName: string;
  variantInfo: string; // (Vd: "Color: Đen, Size: L")
  quantity: number;
  price: number;
  imageUrl: string | null;
}

/**
 * DTO cho Modal Chi tiết - Khớp AdminOrderDetailDTO.java
 */
export interface AdminOrderDetailDTO {
  id: number;
  orderNumber: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  note: string | null;
  subtotal: number;
  shippingFee: number;
  couponDiscount: number;
  totalAmount: number;
  items: AdminOrderItemDTO[];
  stockReturned: boolean;  // <-- THÊM DÒNG NÀY

}

/**
 * DTO cho Phân trang (Wrapper) - Khớp PageResponseDTO.java
 */
export interface PageResponseDTO<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}