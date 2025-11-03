// (Trong file src/types/cartDTO.ts)

export interface CartResponseDTO {
  cartId: number;
  variantId: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  attributesDescription: string; 
  
  // --- SỬA CÁC TRƯỜNG NÀY ---
  currentPrice: number;   // Giá mới (live)
  originalPrice: number;  // Giá cũ (đã lưu)
  priceChanged: boolean;  // Cờ
  // --- KẾT THÚC SỬA ---
  
  quantity: number;
  stockQuantity: number;
}