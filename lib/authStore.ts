"use client"; // Thêm "use client" nếu file này được dùng ở Client Component (an toàn nhất là cứ thêm vào)

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner"; // Import toast để thông báo

// --- Interface cho User (sau khi đăng nhập) ---
export interface AuthenticatedUser {
  id: number | string;
  name: string;
  email: string;
  roles: string[];
  avatar?: string; // Thêm avatar nếu API trả về
}

// --- Interface cho Store (Thêm 'initialize', 'register', 'resetPassword') ---
interface AuthStore {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initialize: () => Promise<void>; // Hàm tự động kiểm tra token khi tải lại
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // --- 1. HÀM ĐĂNG NHẬP (LOGIN) ---
      login: async (email, password) => {
        const response = await fetch(`${API_URL}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const responseData = await response.json();
        if (!response.ok || responseData.status !== 'SUCCESS') { // Giả sử backend trả 'SUCCESS'
          throw new Error(responseData.message || "Email hoặc mật khẩu không chính xác");
        }

        const apiData = responseData.data;
        const token = apiData.accessToken || apiData.token; // Lấy accessToken hoặc token

        if (!token) {
          throw new Error("API không trả về token");
        }
        
        set({
          user: {
            id: apiData.id,
            name: apiData.name,
            email: apiData.email,
            roles: apiData.roles,
            avatar: apiData.avatar,
          },
          token: token,
          isAuthenticated: true,
        });
      },

     // --- 2. HÀM ĐĂNG XUẤT (LOGOUT) ---
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Sửa: Đẩy về trang chủ (là trang Login)
        if (typeof window !== 'undefined') {
            window.location.href = '/'; 
        }
      },

      // --- 3. HÀM ĐĂNG KÝ (REGISTER) ---
      register: async (email, password, name) => {
        const nameParts = name.trim().split(' ');
        const firstName = nameParts.shift() || "";
        const lastName = nameParts.join(' ');

        const response = await fetch(`${API_URL}/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName }),
        });

        const responseData = await response.json();
        
        if (response.status === 201 && responseData.status === 'SUCCESS') {
             return; // Thành công, yêu cầu kích hoạt email
        } else {
             throw new Error(responseData.message || "Đăng ký thất bại. Email đã tồn tại.");
        }
      },
      
      // --- 4. HÀM QUÊN MẬT KHẨU (RESET PASSWORD) ---
      resetPassword: async (email) => {
          const response = await fetch(`${API_URL}/v1/auth/forgot-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
          });
          
          const responseData = await response.json();
          if (response.ok && responseData.status === 'SUCCESS') {
              return; // Thành công
          } else {
              throw new Error(responseData.message || "Lỗi máy chủ, không thể gửi yêu cầu.");
          }
      },
      
      // --- 5. HÀM KHỞI TẠO (SỬA LỖI TỰ ĐỘNG ĐĂNG NHẬP) ---
      initialize: async () => {
          const { token, isAuthenticated } = get(); // Lấy state VỪA TẢI TỪ localStorage
          
          // Chỉ chạy nếu state nói "đã đăng nhập" VÀ "có token"
          if (isAuthenticated && token) {
              try {
                  // Gọi một API nhẹ (bất kỳ API nào cần xác thực)
                  // Ví dụ: Lấy 1 danh mục (ít dữ liệu)
                  const response = await fetch(`${API_URL}/v1/categories/all-brief`, {
                      method: 'GET',
                      headers: { 'Authorization': `Bearer ${token}` },
                  });

                  if (response.ok) {
                    // Token còn hạn, không cần làm gì
                    console.log("Token re-validation successful.");
                  } else if (response.status === 401) { 
                    // Nếu lỗi 401 Unauthorized (Token hết hạn/Không hợp lệ)
                    toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                    get().logout(); // Gọi hàm logout để xóa state
                  } else {
                    // Lỗi server khác (500, 404, v.v.)
                    throw new Error("Lỗi máy chủ khi xác thực lại");
                  }
              } catch (e) {
                  // Lỗi mạng (fetch thất bại)
                  console.error("Lỗi mạng khi xác thực lại:", e);
                  toast.error("Mất kết nối máy chủ. Vui lòng đăng nhập lại.");
                  get().logout(); // Đăng xuất nếu không thể kết nối
              }
          }
      }
    }),
    {
      name: "auth-storage", // Tên key trong localStorage
      storage: createJSONStorage(() => localStorage),
      
      // --- 6. KÍCH HOẠT HÀM INITIALIZE ---
      // Hàm này chạy ngay SAU KHI state được tải từ localStorage
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state && !error) {
            // Ngay sau khi tải (ví dụ: isAuthenticated=true),
            // gọi hàm initialize() để kiểm tra token với backend
            state.initialize(); 
          }
        };
      },

      partialize: (state) => ({ // Chỉ lưu 3 mục này vào localStorage
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)