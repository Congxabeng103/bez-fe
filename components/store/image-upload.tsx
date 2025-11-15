"use client";

import type React from "react";
import { Upload, X, Loader2 } from "lucide-react"; // 1. Thêm Loader2
import { toast } from "sonner"; // 2. Thêm toast
import { useState, useEffect } from "react"; // <-- SỬA 1: Thêm useEffect
// --- Lấy biến môi trường ---
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  label = "Tải lên hình ảnh",
  className = "" // 3. Thêm className mặc định
}: ImageUploadProps) {
  
  // 4. Thêm state loading
  const [isLoading, setIsLoading] = useState(false);

  // --- 5. SỬA HÀM NÀY: Dùng Cloudinary ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra biến môi trường
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        toast.error("Lỗi cấu hình: Cloudinary chưa được thiết lập.");
        console.error("Cloudinary CLOUD_NAME hoặc UPLOAD_PRESET chưa được set trong .env.local");
        return;
    }

    setIsLoading(true); // Bắt đầu loading

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("phash", "true"); // 
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Tải ảnh lên thất bại.");
      }

      const data = await response.json();
      
      // Lấy URL an toàn (https) từ Cloudinary
      const secureUrl = data.secure_url; 

      // Cập nhật giá trị
      onChange(secureUrl);
      // (Không cần setPreview vì value sẽ tự động cập nhật)
      
    } catch (error: any) {
      toast.error(`Lỗi tải ảnh: ${error.message}`);
      console.error("Cloudinary upload error:", error);
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };

  // 6. Sửa JSX để dùng value (thay vì preview) và thêm loading
  return (
    <div className={`space-y-2 ${className}`}> {/* 7. Áp dụng className */}
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex gap-4">
        
        {/* Khung hiển thị ảnh */}
        {value && !isLoading && ( // Chỉ hiển thị khi có ảnh và không loading
          <div className="relative w-24 h-24">
           <img 
              src={value || "/placeholder.svg"} 
              alt="Preview" 
              // Đổi 'object-cover' thành 'object-contain'
              className="w-full h-full object-contain rounded-lg" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <button
              type="button" // Thêm type="button"
              onClick={() => onChange("")} // Chỉ cần gọi onChange
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Khung Loading */}
        {isLoading && (
          <div className="flex items-center justify-center w-24 h-24 border border-dashed border-input rounded-lg">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Nút Tải lên (chỉ hiện khi chưa có ảnh) */}
        {!value && !isLoading && (
          <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 transition">
            <div className="text-center">
              <Upload size={20} className="mx-auto mb-1" />
              <span className="text-xs">Tải lên</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              disabled={isLoading} // 8. Vô hiệu hóa khi đang tải
            />
          </label>
        )}
      </div>
    </div>
  );
}