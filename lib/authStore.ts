"use client"; 

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import Cookies from 'js-cookie'; // <-- 1. THÊM DÒNG NÀY  
// --- Interface cho User (sau khi đăng nhập) ---
export interface AuthenticatedUser {
  id: number | string;
  name: string;
  firstName: string; // Tên
  lastName: string;  // Họ
  email: string;
  roles: string[];
  avatar?: string; 
  phone: string | null;
  gender: string | null; // (vd: "MALE")
  dob: string | null; // (vd: "YYYY-MM-DD")
}

// --- Interface cho Store (Đã thêm 2 hàm mới) ---
interface AuthStore {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // Sửa: Đã đổi thành 4 tham số
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>; 
  resetPassword: (email: string) => Promise<void>;
updateProfile: (data: { firstName: string, lastName: string, phone: string | null, gender: string, dob: string | null }) => Promise<void>;  updatePassword: (data: { currentPassword: string, newPassword: string, confirmationPassword: string }) => Promise<void>;
  initialize: () => Promise<void>; 
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 1. SỬA INTERFACE NÀY ---
// (Interface này phải khớp với AuthenticationResponseDTO của Backend)
interface LoginResponseData {
  accessToken: string;
  // (Không có 'user' lồng nhau)
  id: number | string;
  name: string;
  firstName: string; // Tên
  lastName: string;  // Họ
  email: string;
  roles: string[];
  avatar?: string;
  phone: string | null;
  gender: string | null;
  dob: string | null;
}
// --- KẾT THÚC SỬA 1 ---

interface ApiResponseDTO<T> {
    status: string;
    data: T;
    message: string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // --- 2. SỬA HÀM LOGIN ---
      login: async (email, password) => {
        const response = await fetch(`${API_URL}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const responseData: ApiResponseDTO<LoginResponseData> = await response.json(); 
        
        if (!response.ok || responseData.status !== 'SUCCESS') {
          throw new Error(responseData.message || "Email hoặc mật khẩu không chính xác");
        }

        const apiData = responseData.data; // apiData LÀ LoginResponseData
        const token = apiData.accessToken;

        if (!token) {
          throw new Error("API không trả về token");
        }
        
        // Sửa: Đọc trực tiếp từ apiData (không qua apiData.user)
        set({
          user: { 
              id: apiData.id,
              name: apiData.name,
              firstName: apiData.firstName, // Tên
              lastName: apiData.lastName, // Họ
              email: apiData.email,
              roles: apiData.roles,
              avatar: apiData.avatar,
              phone: apiData.phone,
              gender: apiData.gender,
              dob: apiData.dob,
          },
          token: token,
          isAuthenticated: true,
        });
        //(Middleware của bạn (File 168) đang tìm 'authToken')
        Cookies.set('authToken', token, { 
            expires: 7, // (Hết hạn sau 7 ngày)
            secure: process.env.NODE_ENV === 'production', 

        });
       
      },
      // --- KẾT THÚC SỬA 2 ---

     // --- 3. HÀM ĐĂNG XUẤT (LOGOUT) ---
      logout: () => {
        Cookies.remove('authToken');
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
            window.location.href = '/'; // Đẩy về trang chủ (/)
        }
      },

      // --- 4. HÀM ĐĂNG KÝ (REGISTER) ---
      // (Sửa: Đã đổi thành 4 tham số)
     register: async (firstName: string, lastName: string, email: string, password: string) => {
    try {
        const response = await fetch(`${API_URL}/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName }),
        });

        if (!response.ok) {
            let errorMessage = "Lỗi hệ thống";
            try {
                // 1. Thử đọc JSON
                const data = await response.json();
                // Ưu tiên lấy data.message (VD: "Email đã được xử dụng")
                errorMessage = data.message || JSON.stringify(data);
            } catch (e) {
                // 2. Nếu không phải JSON, đọc text thô
                const text = await response.text();
                if (text) errorMessage = text;
            }
            // Ném nguyên văn lỗi nhận được ra ngoài
            throw new Error(errorMessage);
        }
    } catch (error: any) {
        throw error;
    }
},
      
      // --- 5. HÀM QUÊN MẬT KHẨU (RESET PASSWORD) ---
      resetPassword: async (email) => {
          const response = await fetch(`${API_URL}/v1/auth/forgot-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
          });
          
          if (!response.ok) {
              let errorMessage = "Lỗi máy chủ, không thể gửi yêu cầu.";
              try {
                const errJson = await response.json();
                errorMessage = errJson.message || errorMessage;
             } catch(e) {
                 errorMessage = await response.text() || errorMessage;
             }
             throw new Error(errorMessage);
          }
          // (Không set state, chỉ trả về thành công)
      },

      // --- 6. HÀM CẬP NHẬT PROFILE ---
      updateProfile: async (data: { firstName: string, lastName: string, phone: string | null, gender: string, dob: string | null }) => {
        const { token } = get();
        if (!token) throw new Error("Chưa đăng nhập");

        // Gộp lại 'name' trước khi gửi, vì API /profile (UserService) đang nhận 'name'
        const dataToSubmit = {
            ...data,
            name: (data.lastName + " " + data.firstName).trim()
        };

        const response = await fetch(`${API_URL}/v1/users/profile`, { 
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataToSubmit) // Gửi 'name' đã gộp
        });

        const result: ApiResponseDTO<AuthenticatedUser> = await response.json(); 
        if (!response.ok || result.status !== 'SUCCESS') {
          throw new Error(result.message || 'Cập nhật thất bại');
        }
        
        // Cập nhật state 'user' cục bộ
        set(state => ({
          // @ts-ignore
          user: { ...(state.user as AuthenticatedUser), ...result.data } 
        }));
      },

      // --- 7. HÀM ĐỔI MẬT KHẨU ---
      updatePassword: async (data: { currentPassword: string, newPassword: string, confirmationPassword: string }) => {
        const { token } = get();
        if (!token) throw new Error("Chưa đăng nhập");
        
        const response = await fetch(`${API_URL}/v1/users/update-password`, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          let errorMessage = 'Đổi mật khẩu thất bại';
          try {
             const err = await response.json(); 
             errorMessage = err.message || errorMessage;
          } catch(e) {
             const errText = await response.text();
             errorMessage = errText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        // (Không cần làm gì, API chỉ trả về message thành công)
      },

      // --- 8. HÀM KHỞI TẠO (KIỂM TRA TOKEN) ---
      initialize: async () => {
          const { token, isAuthenticated, logout } = get(); 
          
          if (isAuthenticated && token) {
              try {
                  const response = await fetch(`${API_URL}/v1/categories/all-brief`, {
                      method: 'GET',
                      headers: { 'Authorization': `Bearer ${token}` },
                  });

                  if (response.status === 401) { 
                      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                      logout(); 
                  } else if (!response.ok) {
                      throw new Error("Lỗi máy chủ khi xác thực lại");
                  }
                  
              } catch (e) {
                  console.error("Lỗi mạng khi xác thực lại:", e);
                  toast.error("Mất kết nối máy chủ. Vui lòng đăng nhập lại.");
                  logout(); 
              }
          }
      }
    }),
    {
      name: "auth-storage", 
      storage: createJSONStorage(() => localStorage),
      
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state && !error) {
            // (Tắt 'initialize' để tránh lỗi Hydration)
            // state.initialize(); 
          }
        };
      },

      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)