// File: types/categoryDTO.ts

export interface CategoryResponseDTO {
  id: number;
  name: string;
  imageUrl?: string; // Thêm '?' nếu trường này có thể null hoặc không có
}