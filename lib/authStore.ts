// File: lib/authStore.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
// KHÔNG CẦN 'jwt-decode' nữa

// --- SỬA 1: Cập nhật User interface cho khớp ---
export interface AuthenticatedUser {
  id: number | string 
  name: string
  email: string
  roles: string[]
  // avatar?: string // (Thêm nếu có)
}

// Interface cho AuthStore
interface AuthStore {
  user: AuthenticatedUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // --- SỬA 2: Sửa lại hoàn toàn hàm login ---
      login: async (email, password) => {
        const response = await fetch(`${API_URL}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        // 'responseData' là { data: { ... }, message: "...", status: ... }
        const responseData = await response.json()

        if (!response.ok || responseData.status >= 400) {
          throw new Error(responseData.message || "Email hoặc mật khẩu không chính xác")
        }

        // 1. Lấy dữ liệu từ 'responseData.data'
        const apiData = responseData.data 
        // apiData lúc này là { accessToken, tokenType, id, name, email, roles }

        const token = apiData.accessToken

        if (!token) {
          throw new Error("API không trả về token")
        }
        
        // 2. Lưu token và tự nhóm object 'user' lại
        set({
          user: {
            id: apiData.id,
            name: apiData.name,
            email: apiData.email,
            roles: apiData.roles,
            // avatar: apiData.avatar, // (Thêm nếu có)
          },
          token: token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)