"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import Cookies from 'js-cookie';

// --- 1. Interface User (Đã dọn dẹp) ---
export interface AuthenticatedUser {
    id: number | string;
    name: string;
    firstName: string; // Tên
    lastName: string;  // Họ
    email: string;
    roles: string[]; // <-- TRƯỜNG QUAN TRỌNG CẦN GIỮ
    avatar: string | null;
    phone: string | null;
    gender: string | null;
    dob: string | null; // <-- Đã xóa chữ 'g' rác
    
    // (Trường địa chỉ)
    streetAddress: string | null;
    provinceCode: number | null;
    provinceName: string | null;
    districtCode: number | null;
    districtName: string | null;
    wardCode: number | null;
    wardName: string | null;
}

// --- 2. Interface Store (Đã dọn dẹp) ---
interface AuthStore {
    user: AuthenticatedUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (data: { firstName: string, lastName: string, phone: string | null, gender: string, dob: string | null,avatar: string | null }) => Promise<void>;
    updatePassword: (data: { currentPassword: string, newPassword: string, confirmationPassword: string }) => Promise<void>;
    
    updateAddress: (data: {
        streetAddress: string;
        provinceCode: number;
        provinceName: string;
        districtCode: number;
        districtName: string;
        wardCode: number;
        wardName: string;
    }) => Promise<void>;
    initialize: () => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 3. Interface Login Response (Đã dọn dẹp) ---
interface LoginResponseData {
    accessToken: string;
    id: number | string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[]; 
    avatar: string | null; 
    phone: string | null;
    gender: string | null;
    dob: string | null;
    streetAddress: string | null;
    provinceCode: number | null;
    provinceName: string | null;
    districtCode: number | null;
    districtName: string | null;
    wardCode: number | null;
    wardName: string | null;
}

interface ApiResponseDTO<T> {
    status: string;
    data: T;
    message: string;
}

// --- Helper: Tự động thêm token ---
const fetchApi = async (url: string, options: RequestInit = {}) => {
    const { token } = useAuthStore.getState();
    if (!token) throw new Error("Bạn cần đăng nhập");

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && options.body) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${url}`, { ...options, headers });

    if (!response.ok) {
        let errorMessage = 'Lỗi không xác định';
        try {
            const err = await response.json();
            errorMessage = err.message || JSON.stringify(err);
        } catch (e) {
            errorMessage = await response.text() || `Lỗi ${response.status}`;
        }
        throw new Error(errorMessage);
    }

    const responseData: ApiResponseDTO<any> = await response.json();
    if (responseData.status !== 'SUCCESS') {
        throw new Error(responseData.message || 'Yêu cầu thất bại');
    }
    return responseData;
};


export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            // --- 4. HÀM LOGIN ---
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

                const apiData = responseData.data;
                const token = apiData.accessToken;

                if (!token) {
                    throw new Error("API không trả về token");
                }

                set({
                    user: {
                        id: apiData.id,
                        name: apiData.name,
                        firstName: apiData.firstName,
                        lastName: apiData.lastName,
                        email: apiData.email,
                        roles: apiData.roles, // <-- Set `roles`
                        avatar: apiData.avatar || null, 
                        phone: apiData.phone,
                        gender: apiData.gender,
                        dob: apiData.dob,
                        streetAddress: apiData.streetAddress,
                        provinceCode: apiData.provinceCode,
                        provinceName: apiData.provinceName,
                        districtCode: apiData.districtCode,
                        districtName: apiData.districtName,
                        wardCode: apiData.wardCode,
                        wardName: apiData.wardName,
                    },
                    token: token,
                    isAuthenticated: true,
                });
                
                Cookies.set('authToken', token, {
                    expires: 7,
                    secure: process.env.NODE_ENV === 'production',
                });
            },

            // --- 🚀 HÀM LOGOUT ĐÃ ĐƯỢC CẢI TIẾN ---
            logout: () => {
                // 1. Xóa cookie
                Cookies.remove('authToken');
                
                // 2. [FIX] XÓA "TRẮNG TRƠN" LOCALSTORAGE
                // Đây là dòng code quan trọng để xóa "mầm bệnh" cache
                localStorage.removeItem('auth-storage'); 

                // 3. Reset state (bộ nhớ tạm)
                set({ user: null, token: null, isAuthenticated: false });

                // 4. Điều hướng (tải lại sạch trang login)
                if (typeof window !== 'undefined') {
                    window.location.href = '/login'; 
                }
            },
            // --- KẾT THÚC CẢI TIẾN ---

            register: async (firstName: string, lastName: string, email: string, password: string) => {
                const response = await fetch(`${API_URL}/v1/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, firstName, lastName }),
                });

                if (!response.ok) {
                    let errorMessage = "Lỗi hệ thống";
                    try {
                        const data = await response.json();
                        errorMessage = data.message || JSON.stringify(data);
                    } catch (e) {
                        const text = await response.text();
                        if (text) errorMessage = text;
                    }
                    throw new Error(errorMessage);
                }
            },

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
                    } catch (e) {
                        errorMessage = await response.text() || errorMessage;
                    }
                    throw new Error(errorMessage);
                }
            },

            // --- SỬA 3: HÀM UPDATE PROFILE ---
            updateProfile: async (data) => {
                // 1. Gửi data đi
                await fetchApi("/v1/users/profile", {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });

                // 2. Cập nhật state bằng chính `data` đã gửi
                set((state: AuthStore) => {
                    const oldUser = state.user as AuthenticatedUser;
                    const newUser = { ...oldUser, ...data };
                    
                    if (data.firstName || data.lastName) {
                        newUser.name = `${data.lastName || oldUser.lastName} ${data.firstName || oldUser.firstName}`.trim();
                    }

                    return { user: newUser };
                });
            },

            updatePassword: async (data: { currentPassword: string, newPassword: string, confirmationPassword: string }) => {
                await fetchApi("/v1/users/update-password", {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },

            // --- SỬA 4: HÀM UPDATE ADDRESS ---
            updateAddress: async (data) => {
                // 1. Gửi data đi
                await fetchApi("/v1/users/profile/address", {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });

                // 2. Cập nhật state bằng chính `data` đã gửi
                set((state: AuthStore) => ({ 
                    user: { 
                        ...(state.user as AuthenticatedUser),
                        ...data // <-- Gộp `data` mới mà bạn vừa gửi
                    }
                }));
            },
            
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