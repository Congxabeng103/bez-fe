"use client";

import type React from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

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
  className = ""
}: ImageUploadProps) {
  
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error("Lỗi cấu hình: Cloudinary chưa được thiết lập.");
      console.error("Cloudinary CLOUD_NAME hoặc UPLOAD_PRESET chưa được set trong .env.local");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    // formData.append("phash", "true"); // <-- ĐÃ XÓA DÒNG LỖI NÀY

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      // --- CẢI THIỆN BÁO LỖI VÀ XỬ LÝ LỖI CLOUDINARY ---
      if (!response.ok) {
        let errorMessage = "Tải ảnh lên thất bại.";
        try {
          // Thử đọc lỗi chi tiết từ Cloudinary
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          /* Bỏ qua */
        }
        throw new Error(errorMessage); 
      }
      // --- KẾT THÚC CẢI THIỆN ---

      const data = await response.json();
      const secureUrl = data.secure_url; 
      onChange(secureUrl);
      
    } catch (error: any) {
      toast.error(`Lỗi tải ảnh: ${error.message}`);
      console.error("Cloudinary upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 'className' sẽ kiểm soát kích thước của khối ngoài
    <div className={`space-y-2 ${className}`}> 
      {label && (
        <label className="block text-sm font-medium">{label}</label>
      )}
      
      {/* Container bên trong sẽ chiếm toàn bộ kích thước của khối ngoài */}
      <div className="flex w-full h-full"> 
        
        {/* Khung hiển thị ảnh (KHÔI PHỤC CSS GỐC) */}
        {value && !isLoading && (
          <div className="relative w-full h-full">
            <img 
              src={value || "/placeholder.svg"} 
              alt="Preview" 
              // KHÔI PHỤC: object-contain và rounded-lg
              className="w-full h-full object-contain rounded-lg border border-input" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              // Giữ nguyên rounded-full cho nút xóa
              className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Khung Loading */}
        {isLoading && (
          <div className="flex items-center justify-center w-full h-full border border-dashed border-input rounded-lg">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Nút Tải lên (chỉ hiện khi chưa có ảnh) */}
        {!value && !isLoading && (
          <label className="flex items-center justify-center w-full h-full border-2 border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 transition">
            <div className="text-center">
              <Upload size={20} className="mx-auto mb-1" />
              <span className="text-xs">Tải lên</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              disabled={isLoading}
            />
          </label>
        )}
      </div>
    </div>
  );
}