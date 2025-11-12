// (path: app/(user)/checkout/page.tsx)
"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuthStore } from "@/lib/authStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CreditCard, Truck, Tag } from "lucide-react";
import { toast } from "sonner";
// --- BƯỚC 1: THÊM IMPORT VÀ CÁC TYPE ---
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Các Type cho API Địa chỉ
interface Province {
  code: number;
  name: string;
}
interface District {
  code: number;
  name: string;
}
interface Ward {
  code: number;
  name: string;
}
// --- KẾT THÚC BƯỚC 1 ---


// --- Thêm Helper API Call ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const manualFetchApi = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState();
  if (!token) throw new Error("Bạn cần đăng nhập");
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  const responseData = await response.json();
  if (!response.ok || responseData.status !== 'SUCCESS') {
    throw new Error(responseData.message || "Có lỗi xảy ra");
  }
  return responseData;
};
// --- Hết Helper ---


// --- Định nghĩa Input/Label (Giữ nguyên) ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    />
  )
);
Label.displayName = "Label";
// --- Kết thúc Input/Label ---


export default function CheckoutPage() {
  const router = useRouter();

  const { cart, getTotalPrice, clearCart, isLoaded: isCartLoaded } = useCart();
  const { user, isAuthenticated } = useAuthStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');
  const [isReady, setIsReady] = useState(false);

  // --- BƯỚC 2: SỬA LẠI STATE FORM DATA ---
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    // Xóa "address"
    streetAddress: "", // Thêm ô này cho "Số nhà, tên đường"
    note: "",
  });

  // --- BƯỚC 3: THÊM STATE CHO VIỆC CHỌN ĐỊA CHỈ ---
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // State lưu lựa chọn (chỉ cần lưu object đầy đủ)
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // State loading cho các select
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  // --- KẾT THÚC BƯỚC 3 ---


  // --- (State Coupon giữ nguyên) ---
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  // --- KẾT THÚC STATE COUPON ---

  // (useEffect điền form... giữ nguyên)
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // (useEffect check giỏ hàng... giữ nguyên)
  useEffect(() => {
    if (isCartLoaded && !isProcessing) {
      if (!isAuthenticated) {
        toast.error("Vui lòng đăng nhập để thanh toán");
        router.push("/login");
        return;
      }
      if (cart.length === 0) {
        toast.error("Giỏ hàng của bạn đang rỗng");
        router.push("/products");
        return;
      }
      setIsReady(true);
    }
  }, [isCartLoaded, isAuthenticated, cart.length, router, isProcessing]);


  // --- BƯỚC 4: THÊM CÁC HÀM TẢI ĐỊA CHỈ ---
  const PROVINCE_API_URL = "https://provinces.open-api.vn/api";

  // 1. Tải Tỉnh/Thành phố khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await fetch(`${PROVINCE_API_URL}/p/`);
        const data = await response.json();
        setProvinces(data || []);
      } catch (error) {
        toast.error("Lỗi khi tải danh sách tỉnh/thành");
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []); // Chạy 1 lần

  // 2. Tải Quận/Huyện khi Tỉnh thay đổi
  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        setIsLoadingDistricts(true);
        setDistricts([]); // Xóa quận cũ
        setWards([]); // Xóa phường cũ
        setSelectedDistrict(null);
        setSelectedWard(null);
        try {
          const response = await fetch(`${PROVINCE_API_URL}/p/${selectedProvince.code}?depth=2`);
          const data = await response.json();
          setDistricts(data.districts || []);
        } catch (error) {
          toast.error("Lỗi khi tải danh sách quận/huyện");
        } finally {
          setIsLoadingDistricts(false);
        }
      };
      fetchDistricts();
    }
  }, [selectedProvince]); // Chạy khi selectedProvince thay đổi

  // 3. Tải Phường/Xã khi Quận thay đổi
  useEffect(() => {
    if (selectedDistrict) {
      const fetchWards = async () => {
        setIsLoadingWards(true);
        setWards([]); // Xóa phường cũ
        setSelectedWard(null);
        try {
          const response = await fetch(`${PROVINCE_API_URL}/d/${selectedDistrict.code}?depth=2`);
          const data = await response.json();
          setWards(data.wards || []);
        } catch (error) {
          toast.error("Lỗi khi tải danh sách phường/xã");
        } finally {
          setIsLoadingWards(false);
        }
      };
      fetchWards();
    }
  }, [selectedDistrict]); // Chạy khi selectedDistrict thay đổi
  // --- KẾT THÚC BƯỚC 4 ---


  // --- (Tính toán tiền... giữ nguyên) ---
  const total = getTotalPrice(); // Tạm tính
  const shipping = total > 0 ? 30000 : 0;
  const grandTotal = total + shipping - couponDiscount;
  // --- KẾT THÚC TÍNH TOÁN ---

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- (Hàm Coupon... giữ nguyên) ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsCheckingCoupon(true);
    setCouponError("");
    setCouponDiscount(0);
    setAppliedCouponCode(null);

    try {
      const response = await manualFetchApi(
        `/v1/coupons/validate?code=${couponCode.trim()}&subtotal=${total}`
      );
      const discountAmount = response.data;
      if (discountAmount >= 0) {
        setCouponDiscount(discountAmount);
        setAppliedCouponCode(couponCode.trim().toUpperCase());
        toast.success(`Áp dụng mã thành công! Bạn được giảm ${discountAmount.toLocaleString("vi-VN")}₫`);
      }
    } catch (err: any) {
      setCouponError(err.message || "Mã giảm giá không hợp lệ");
      toast.error(err.message || "Mã giảm giá không hợp lệ");
    } finally {
      setIsCheckingCoupon(false);
    }
  };
  // --- KẾT THÚC HÀM COUPON ---

  // --- BƯỚC 6: CẬP NHẬT HÀM SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Sửa lại kiểm tra validation
    if (!formData.fullName || !formData.phone || !formData.streetAddress || !selectedWard || !selectedDistrict || !selectedProvince) {
      toast.error("Vui lòng điền đầy đủ Họ tên, SĐT và Địa chỉ chi tiết (Tỉnh, Quận, Phường, Số nhà)");
      return;
    }

    setIsProcessing(true);

    // 2. Ghép 4 trường địa chỉ thành 1 chuỗi
    const fullAddress = `${formData.streetAddress}, ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;

    const orderRequestDTO = {
      customerName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      address: fullAddress, // <-- 3. Gửi chuỗi đã ghép
      note: formData.note,
      paymentMethod: paymentMethod,
      couponCode: appliedCouponCode,
    };

    try {
      const response = await manualFetchApi("/v1/orders/create", {
        method: 'POST',
        body: JSON.stringify(orderRequestDTO),
      });

      if (paymentMethod === 'COD') {
        const newOrder = response.data;
        toast.success("Đặt hàng thành công!");
        clearCart();
        router.push(`/order-confirmation?orderId=${newOrder.orderId}&method=COD`);
      } else if (paymentMethod === 'VNPAY') {
        const paymentUrl = response.data.paymentUrl;
        if (paymentUrl) {
          clearCart();
          window.location.href = paymentUrl;
        } else {
          throw new Error("Không nhận được link thanh toán VNPAY.");
        }
      }
    } catch (err: any) {
      console.error("Lỗi khi đặt hàng:", err);
      toast.error(err.message || "Đặt hàng thất bại, vui lòng thử lại.");
      setIsProcessing(false);
    }
  };
  // --- KẾT THÚC BƯỚC 6 ---

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/cart" className="flex items-center gap-2 text-sm text-primary mb-4">
          <ArrowLeft className="w-4 h-4" />
          Quay lại giỏ hàng
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Cột trái (Form) */}
            <div className="lg:col-span-2 space-y-8">

              {/* (Form Thông tin giao hàng) */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Thông tin giao hàng</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên *</Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Không bắt buộc)</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                    </div>
                  </div>

                  {/* --- BƯỚC 5: THAY THẾ Ô ĐỊA CHỈ --- */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tỉnh/Thành */}
                    <div className="space-y-2">
                      <Label htmlFor="province">Tỉnh/Thành phố *</Label>
                      <Select
                        value={selectedProvince?.code.toString()}
                        onValueChange={(value) => {
                          const province = provinces.find(p => p.code === parseInt(value));
                          setSelectedProvince(province || null);
                        }}
                        disabled={isLoadingProvinces}
                        required
                      >
                        <SelectTrigger id="province">
                          <SelectValue placeholder={isLoadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành"} />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map(p => (
                            <SelectItem key={p.code} value={p.code.toString()}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Quận/Huyện */}
                    <div className="space-y-2">
                      <Label htmlFor="district">Quận/Huyện *</Label>
                      <Select
                        value={selectedDistrict?.code.toString()}
                        onValueChange={(value) => {
                          const district = districts.find(d => d.code === parseInt(value));
                          setSelectedDistrict(district || null);
                        }}
                        disabled={!selectedProvince || isLoadingDistricts}
                        required
                      >
                        <SelectTrigger id="district">
                          <SelectValue placeholder={isLoadingDistricts ? "Đang tải..." : "Chọn Quận/Huyện"} />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map(d => (
                            <SelectItem key={d.code} value={d.code.toString()}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Phường/Xã */}
                    <div className="space-y-2">
                      <Label htmlFor="ward">Phường/Xã *</Label>
                      <Select
                        value={selectedWard?.code.toString()}
                        onValueChange={(value) => {
                          const ward = wards.find(w => w.code === parseInt(value));
                          setSelectedWard(ward || null);
                        }}
                        disabled={!selectedDistrict || isLoadingWards}
                        required
                      >
                        <SelectTrigger id="ward">
                          <SelectValue placeholder={isLoadingWards ? "Đang tải..." : "Chọn Phường/Xã"} />
                        </SelectTrigger>
                        <SelectContent>
                          {wards.map(w => (
                            <SelectItem key={w.code} value={w.code.toString()}>{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Số nhà, tên đường */}
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Số nhà, tên đường *</Label>
                    <Input 
                      id="streetAddress" 
                      name="streetAddress" // <-- Sửa name
                      placeholder="Ví dụ: 123 Đường Nguyễn Huệ" 
                      value={formData.streetAddress} // <-- Sửa value
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  {/* --- KẾT THÚC BƯỚC 5 --- */}

                  <div className="space-y-2">
                    <Label htmlFor="note">Ghi chú (Tùy chọn)</Label>
                    <textarea id="note" name="note" rows={3} value={formData.note} onChange={handleInputChange} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                </div>
              </div>

              {/* (Form Phương thức thanh toán - Giữ nguyên) */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Phương thức thanh toán</h2>
                <div className="space-y-4">
                  <button type="button" onClick={() => setPaymentMethod('COD')} className={`flex items-center justify-between w-full p-4 border rounded-lg transition ${paymentMethod === 'COD' ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'}`}>
                    <div className="flex items-center gap-3">
                      <Truck className="w-6 h-6 text-primary" />
                      <span className="font-semibold">Thanh toán khi nhận hàng (COD)</span>
                    </div>
                    {paymentMethod === 'COD' && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('VNPAY')} className={`flex items-center justify-between w-full p-4 border rounded-lg transition ${paymentMethod === 'VNPAY' ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'}`}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <span className="font-semibold">Thanh toán qua VNPAY</span>
                    </div>
                    {paymentMethod === 'VNPAY' && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </button>
                </div>
              </div>

              {/* (Nút Submit - Giữ nguyên) */}
              <div className="flex gap-4">
                <Link href="/cart" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent gap-2 py-6 text-base">
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                  </Button>
                </Link>
                <Button type="submit" disabled={isProcessing} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg">
                  {isProcessing ? (<Loader2 className="w-5 h-5 animate-spin mr-2" />) : (paymentMethod === 'COD' ? 'Đặt hàng' : 'Tiếp tục với VNPAY')}
                </Button>
              </div>
            </div>

            {/* Cột phải: Tóm tắt đơn hàng (Giữ nguyên) */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-6 sticky top-28 space-y-6 shadow-sm">
                <h2 className="text-2xl font-bold">Tóm tắt đơn hàng</h2>

                {/* (Danh sách sản phẩm) */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.variantId} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <img src={item.imageUrl || "/placeholder.svg"} alt={item.productName} width={48} height={48} className="rounded-md object-cover" />
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.productName}</span>
                          <span className="text-xs text-muted-foreground">{item.attributesDescription} x {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-semibold">{(item.currentPrice * item.quantity).toLocaleString("vi-VN")}₫</span>
                    </div>
                  ))}
                </div>

                {/* (UI COUPON - Giữ nguyên) */}
                <div className="border-t border-border pt-4">
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="text"
                      placeholder="Mã giảm giá"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      disabled={isCheckingCoupon}
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      variant="outline"
                      className="gap-1 bg-transparent"
                      disabled={isCheckingCoupon || !couponCode.trim()}
                    >
                      {isCheckingCoupon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Tag className="w-4 h-4" />
                      )}
                      Áp dụng
                    </Button>
                  </div>
                  {couponError && <p className="text-destructive text-xs">{couponError}</p>}
                  {appliedCouponCode && (
                    <p className="text-green-600 text-xs">
                      Đã áp dụng mã: {appliedCouponCode}
                    </p>
                  )}
                </div>
                {/* (Chi tiết giá - Giữ nguyên) */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-semibold">{total.toLocaleString("vi-VN")}₫</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-muted-foreground">Giảm giá</span>
                      <span className="font-semibold">
                        -{couponDiscount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="font-semibold">{shipping.toLocaleString("vi-VN")}₫</span>
                  </div>

                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="text-lg font-bold">Tổng cộng</span>
                    <span className="text-2xl font-bold text-primary">
                      {grandTotal.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}