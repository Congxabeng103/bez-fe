// (Tạo file này tại: src/types/userOrderDTO.ts)

// (Lấy từ enums/OrderStatus.java)
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "DISPUTE";

// (Lấy từ enums/PaymentStatus.java)
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "PENDING_REFUND" | "REFUNDED";

// (Lấy từ enums/PaymentMethod.java)
export type PaymentMethod = "COD" | "VNPAY";

/**
 * DTO cho danh sách đơn hàng của User - Khớp UserOrderDTO.java
 */
export interface UserOrderDTO {
  id: number;
  orderNumber: string;
  createdAt: string; // (ISO Date string "2025-11-04T10:30:00")
  totalAmount: number;
  orderStatus: OrderStatus;
  totalItems: number; // (Tổng số loại sản phẩm)
}

/**
 * DTO cho Phân trang (Wrapper) - Khớp PageResponseDTO.java
 */
export interface PageResponseDTO<T> {
  content: T[];
  number: number;      // (Trang hiện tại, bắt đầu từ 0)
  size: number;        // (Số lượng trên trang)
  totalElements: number; // (Tổng số đơn hàng)
  totalPages: number;  // (Tổng số trang)
}