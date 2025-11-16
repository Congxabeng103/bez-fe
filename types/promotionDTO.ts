export interface PromotionResponseDTO {
  id: number;
  name: string;
  description: string;
  discountValue: number; // (Cần cho banner)
  endDate: string; // (Cần cho thời gian)
}