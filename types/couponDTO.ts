export interface CouponResponseDTO {
  id: number;
  code: string;
  description: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  endDate: string; // (Cần cho thời gian)
}