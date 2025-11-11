import { useAuthStore } from "@/lib/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/**
 * Hàm fetch API "chuẩn" cho toàn bộ admin
 * Tự động thêm Authorization header
 */
export const manualFetchApi = async (url: string, options: RequestInit = {}) => {
  // Lấy token từ store (cách này an toàn, không phải hook)
  const { token } = useAuthStore.getState(); 
  
  if (!token) {
    // Tùy chọn: Bạn có thể cho chuyển hướng login ở đây
    console.error("Không tìm thấy token, hủy request");
    throw new Error("Bạn cần đăng nhập");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  
  // Sửa lại logic check lỗi cho "chuẩn"
  if (!response.ok) {
     try {
        // Thử đọc lỗi JSON từ body
        const errorData = await response.json();
        throw new Error(errorData.message || "Có lỗi server");
     } catch (e) {
        // Nếu body không có JSON, ném lỗi theo status
        throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
     }
  }

  // Nếu response không có body (vd: 204 No Content), trả về null
  if (response.status === 204) {
    return null;
  }
  
  // Nếu thành công, trả về JSON
  const responseData = await response.json();
  
  // (Logic check 'SUCCESS' của bạn là cho ApiResponseDTO)
  if (responseData.status && responseData.status !== 'SUCCESS') {
     throw new Error(responseData.message || "Lỗi API");
  }
  
  return responseData;
};