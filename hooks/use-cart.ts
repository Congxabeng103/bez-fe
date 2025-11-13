// (path: src/hooks/use-cart.ts)

"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/authStore";
import { CartResponseDTO } from "@/types/cartDTO";

// Định nghĩa CartItem của FE (thêm 'selected' cục bộ)
export interface CartItem extends CartResponseDTO {
  selected: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Helper function để gọi API thủ công
 * Sửa lỗi "Unexpected end of JSON input"
 */
const manualFetchApi = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState();
  if (!token) {
    throw new Error("Bạn cần đăng nhập để thực hiện hành động này");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // --- [FIX 1] Xử lý trường hợp 404 (Chưa có giỏ hàng) ---
  // Nếu backend báo 404 -> Coi như giỏ hàng rỗng, trả về mảng rỗng luôn
  if (response.status === 404) {
    return []; 
  }

  // --- [FIX 2] Đọc text trước để tránh lỗi "Unexpected end of JSON" ---
  const text = await response.text();
  
  // Nếu body rỗng (Backend trả về null hoặc void)
  if (!text) {
      // Nếu status OK mà body rỗng -> trả về null hoặc mảng rỗng tùy logic
      return []; 
  }

  // Parse JSON an toàn
  let responseData;
  try {
      responseData = JSON.parse(text);
  } catch (e) {
      throw new Error("Lỗi định dạng dữ liệu từ server");
  }

  // --- [FIX 3] Kiểm tra cấu trúc trả về ---
  if (!response.ok) {
    // Ưu tiên lấy message từ backend, nếu không thì lấy statusText
    const errorMsg = responseData.message || responseData.error || "Có lỗi xảy ra";
    throw new Error(errorMsg);
  }

  // Nếu cấu trúc là ApiResponseDTO { status: 'SUCCESS', data: ... }
  if (responseData.status && responseData.data !== undefined) {
      // Nếu status != SUCCESS -> Ném lỗi
      if (responseData.status !== 'SUCCESS' && responseData.status !== 200) { // check linh hoạt
         throw new Error(responseData.message || "Lỗi nghiệp vụ");
      }
      return responseData.data;
  }

  // Trường hợp Backend trả về list trực tiếp (List<CartItem>)
  return responseData;
};


// --- TẠO STATE TOÀN CỤC ---

interface CartState {
  cart: CartItem[];
  isLoaded: boolean;
  isMutating: boolean;
  
  fetchCart: () => Promise<void>;
  addToCart: (variantId: number, quantity: number) => Promise<void>;
  updateQuantity: (variantId: number, quantity: number) => Promise<void>;
  removeFromCart: (variantId: number) => Promise<void>;
  toggleSelected: (variantId: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  clearCart: () => void;

  getTotalPrice: () => number;
  getSelectedCount: () => number;
  getTotalItemsInCart: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  cart: [],
  isLoaded: false,
  isMutating: false,

  fetchCart: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      set({ cart: [], isLoaded: true });
      return;
    }

    try {
      const data: any = await manualFetchApi("/v1/cart");
      
      // Đảm bảo data là mảng trước khi map
      const listCart = Array.isArray(data) ? data : [];

      const cartWithSelection = listCart.map((item: CartResponseDTO) => ({
        ...item,
        selected: true,
      }));
      
      set({ cart: cartWithSelection, isLoaded: true });
    } catch (error: any) {
      console.error("Lỗi khi tải giỏ hàng:", error.message);
      // Dù lỗi cũng set isLoaded = true để UI không quay mãi
      set({ cart: [], isLoaded: true }); 
    }
  },

  addToCart: async (variantId, quantity) => {
    set({ isMutating: true });
    try {
      await manualFetchApi("/v1/cart/add", {
        method: "POST",
        body: JSON.stringify({ variantId, quantity }),
      });
      toast.success("Đã thêm vào giỏ hàng!");
      await get().fetchCart();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi thêm sản phẩm");
    } finally {
      set({ isMutating: false });
    }
  },

  updateQuantity: async (variantId, quantity) => {
    if (quantity <= 0) {
      await get().removeFromCart(variantId);
      return;
    }
    set({ isMutating: true });
    try {
      await manualFetchApi("/v1/cart/update", {
        method: "PUT",
        body: JSON.stringify({ variantId, quantity }),
      });
      await get().fetchCart();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi cập nhật");
      await get().fetchCart(); 
    } finally {
      set({ isMutating: false });
    }
  },

  removeFromCart: async (variantId) => {
    set({ isMutating: true });
    try {
      await manualFetchApi(`/v1/cart/remove/${variantId}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa sản phẩm");
      await get().fetchCart();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xóa");
    } finally {
      set({ isMutating: false });
    }
  },

  toggleSelected: (variantId) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.variantId === variantId ? { ...item, selected: !item.selected } : item
      ),
    }));
  },

  selectAll: () => {
    set((state) => ({
      cart: state.cart.map((item) => ({ ...item, selected: true })),
    }));
  },

  deselectAll: () => {
    set((state) => ({
      cart: state.cart.map((item) => ({ ...item, selected: false })),
    }));
  },

  clearCart: () => {
    set({ cart: [] });
    toast.success("Đã xóa giỏ hàng (local)");
  },

  getTotalPrice: () => {
    const { cart } = get();
    return cart.reduce(
      (total, item) => (item.selected ? total + item.currentPrice * item.quantity : total),
      0
    );
  },

  getSelectedCount: () => {
    const { cart } = get();
    return cart.filter((item) => item.selected).length;
  },

  getTotalItemsInCart: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },
}));

// --- TỰ ĐỘNG ĐỒNG BỘ ---
if (typeof window !== 'undefined') {
    useAuthStore.subscribe((state, prevState) => {
      if (state.isAuthenticated && !prevState.isAuthenticated) {
        useCart.getState().fetchCart();
      }
      if (!state.isAuthenticated && prevState.isAuthenticated) {
        useCart.setState({ cart: [], isLoaded: true });
      }
    });

    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      useCart.getState().fetchCart();
    }
}