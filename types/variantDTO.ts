// File: types/variantDTO.ts (TẠO MỚI)

// Khớp với VariantResponseDTO (File 196)
export interface VariantResponseDTO {
    id: number;
    sku: string;
    price: number;
    stockQuantity: number;
    imageUrl: string;
    active: boolean;
    createdAt: string;
    
    // Map<Tên Thuộc tính, Giá trị>, vd: {"Màu sắc": "Đỏ", "Size": "XL"}
    attributes: Record<string, string>;
    orderCount: number;
    // --- THÊM 2 DÒNG NÀY ---
    salePrice: number | null;
    isPromotionStillValid: boolean | null;
}