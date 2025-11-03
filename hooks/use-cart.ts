// (path: src/hooks/use-cart.ts)

"use client";

import { create } from "zustand"; // Import 'create' từ Zustand
import { toast } from "sonner";
import { useAuthStore } from "@/lib/authStore"; // Import store auth của bạn
import { CartResponseDTO } from "@/types/cartDTO";

// Định nghĩa CartItem của FE (thêm 'selected' cục bộ)
export interface CartItem extends CartResponseDTO {
  selected: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/**
 * Helper function để gọi API thủ công
 * Tự động lấy token từ useAuthStore
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

  const responseData = await response.json();
  if (!response.ok || responseData.status !== 'SUCCESS') {
    throw new Error(responseData.message || "Có lỗi xảy ra từ máy chủ");
  }
  return responseData.data; // Chỉ trả về 'data'
};


// --- TẠO STATE TOÀN CỤC (GLOBAL STORE) ---

// 1. Định nghĩa State và Actions
interface CartState {
  cart: CartItem[];
  isLoaded: boolean;
  isMutating: boolean;
  
  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (variantId: number, quantity: number) => Promise<void>;
  updateQuantity: (variantId: number, quantity: number) => Promise<void>;
  removeFromCart: (variantId: number) => Promise<void>;
  toggleSelected: (variantId: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  clearCart: () => void;

  // Getters (Hàm tính toán)
  getTotalPrice: () => number;
  getSelectedCount: () => number;
  getTotalItemsInCart: () => number; // Tính tổng SỐ LƯỢNG (cho icon header)
}

// 2. Tạo store (đổi tên từ 'useCart' thành 'useCartStore' bên trong,
// nhưng export vẫn là 'useCart' để các file cũ không bị lỗi)
export const useCart = create<CartState>((set, get) => ({
  // --- State mặc định ---
  cart: [],
  isLoaded: false,
  isMutating: false,

  // --- ACTIONS (Cập nhật state) ---
  
  fetchCart: async () => {
    // Luôn kiểm tra auth từ store
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      set({ cart: [], isLoaded: true }); // Nếu không login, set giỏ rỗng
      return;
    }

    try {
      const data: CartResponseDTO[] = await manualFetchApi("/v1/cart");
      const cartWithSelection = data.map((item) => ({
        ...item,
        selected: true, // Mặc định chọn tất cả
      }));
      set({ cart: cartWithSelection, isLoaded: true });
    } catch (error: any) {
      console.error("Lỗi khi tải giỏ hàng:", error.message);
      set({ cart: [], isLoaded: true }); // Set rỗng nếu lỗi
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
      await get().fetchCart(); // Tải lại state toàn cục
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
      await get().fetchCart(); // Tải lại state toàn cục
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi cập nhật");
      await get().fetchCart(); // Tải lại (reset) nếu lỗi
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
      await get().fetchCart(); // Tải lại state toàn cục
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xóa");
    } finally {
      set({ isMutating: false });
    }
  },

  // --- ACTIONS LOCAL (Chỉ sửa state, không gọi API) ---
  
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
    // TODO: Nên gọi API xóa hết
    set({ cart: [] });
    toast.success("Đã xóa giỏ hàng (local)");
  },

  // --- GETTERS (Hàm tính toán) ---
  
  getTotalPrice: () => {
    const { cart } = get(); // Lấy state 'cart' hiện tại
    return cart.reduce(
      (total, item) => (item.selected ? total + item.currentPrice * item.quantity : total),
      0
    );
  },

  getSelectedCount: () => {
    const { cart } = get();
    return cart.filter((item) => item.selected).length;
  },

  // Tính TỔNG SỐ LƯỢNG (5 áo + 2 quần = 7)
  getTotalItemsInCart: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },
}));


// --- TỰ ĐỘNG ĐỒNG BỘ VỚI AUTH STORE ---

// 1. Lắng nghe thay đổi của Auth Store
useAuthStore.subscribe((state, prevState) => {
  // Khi vừa đăng nhập (từ false -> true)
  if (state.isAuthenticated && !prevState.isAuthenticated) {
    useCart.getState().fetchCart(); // Tự động tải giỏ hàng
  }
  // Khi vừa đăng xuất (từ true -> false)
  if (!state.isAuthenticated && prevState.isAuthenticated) {
    useCart.setState({ cart: [], isLoaded: true }); // Xóa sạch giỏ hàng
  }
});

// 2. Tải giỏ hàng lần đầu khi load trang (nếu đã đăng nhập)
// (Code này chạy 1 lần khi app khởi động)
const { isAuthenticated } = useAuthStore.getState();
if (isAuthenticated) {
  useCart.getState().fetchCart();
}