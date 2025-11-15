// File: types/productDTO.ts (TẠO MỚI)

// 1. Khớp với ProductResponseDTO (File 189)
export interface ProductResponseDTO {
  id: number; 
  name: string; 
  description: string; 
  price: number; 
  imageUrl: string;
  categoryId: number | null; 
  categoryName: string;
  brandId: number | null; 
  brandName: string; 
  promotionId: number | null; 
  promotionName: string | null;
  salePrice: number | null; 
  createdAt: string;
  active: boolean;
  isCategoryActive?: boolean | null; 
  isBrandActive?: boolean | null;
  isPromotionStillValid?: boolean | null; 
  variantCount: number;
}

// 2. DTO cho trang Chi tiết (Khớp ProductDetailResponseDTO - Backend)
export interface ProductDetailResponseDTO {
    product: ProductResponseDTO;
    relatedProducts: ProductResponseDTO[];
    attributes: AttributeData[];
}

// 3. DTO cho Thuộc tính động (Khớp AttributeResponseDTO - File 196)
export interface AttributeData {
    id: number;
    name: string; // vd: "Size"
    values: AttributeValueData[];
}

// 4. DTO cho Giá trị Thuộc tính (Khớp AttributeValueResponseDTO - File 196)
export interface AttributeValueData {
    id: number;
    value: string; // vd: "M"
}