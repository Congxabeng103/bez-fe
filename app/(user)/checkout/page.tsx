"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuthStore } from "@/lib/authStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CreditCard, Truck, Tag, TicketPercent, CalendarClock, X } from "lucide-react"; // Thêm icon
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- 1. IMPORT DIALOG (Popup chọn voucher) ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

// --- Interfaces ---
// (Giữ nguyên các interface cũ)
interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward { code: number; name: string; }

// Thêm interface Coupon
interface CouponResponseDTO {
    id: number;
    code: string;
    discountValue: number;
    description: string;
    startDate: string;
    endDate: string;
    quantity: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    active: boolean;
}

const PROVINCE_API_URL = "https://provinces.open-api.vn/api";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helper: Manual Fetch API (Giữ nguyên) ---
const manualFetchApi = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState();
  // ... (Giữ nguyên logic fetch cũ của bạn)
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

// --- Helper Component: Voucher Card Item trong danh sách ---
const VoucherItem = ({ 
    coupon, 
    onSelect, 
    currentTotal 
}: { 
    coupon: CouponResponseDTO, 
    onSelect: (code: string) => void,
    currentTotal: number
}) => {
    const isEligible = currentTotal >= coupon.minOrderAmount;

    return (
        <div className={`border rounded-lg p-3 flex gap-3 items-center justify-between ${isEligible ? 'bg-card border-border' : 'bg-muted border-transparent opacity-70'}`}>
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                 {/* Cột trái: Icon % */}
                <div className={`flex flex-col items-center justify-center p-2 rounded-md min-w-[60px] h-[60px] ${isEligible ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                    <TicketPercent className="h-5 w-5" />
                    <span className="text-sm font-bold mt-1">{coupon.discountValue}%</span>
                </div>
                
                {/* Cột giữa: Thông tin */}
                <div className="flex flex-col min-w-0">
                    <p className="font-semibold text-sm truncate">{coupon.code}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1" title={coupon.description}>{coupon.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <span className="bg-muted px-1 rounded border">Đơn từ {coupon.minOrderAmount.toLocaleString('vi-VN')}đ</span>
                        {coupon.maxDiscountAmount && <span>Tối đa {coupon.maxDiscountAmount.toLocaleString('vi-VN')}đ</span>}
                    </div>
                    {!isEligible && (
                         <span className="text-[10px] text-red-500 mt-1">Mua thêm {(coupon.minOrderAmount - currentTotal).toLocaleString('vi-VN')}đ để dùng</span>
                    )}
                </div>
            </div>

            {/* Cột phải: Nút chọn */}
            <Button 
                size="sm" 
                disabled={!isEligible}
                onClick={() => onSelect(coupon.code)}
                className={isEligible ? "bg-primary" : "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"}
            >
                Dùng ngay
            </Button>
        </div>
    )
}

// --- Components Input/Label Custom (Giữ nguyên) ---
// ... (Giữ nguyên code Input và Label của bạn ở đây)
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

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getTotalPrice, clearCart, isLoaded: isCartLoaded } = useCart();
  const { isAuthenticated } = useAuthStore();

  // --- States ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');
  const [isReady, setIsReady] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({ fullName: "", phone: "", note: "" });
  const [streetAddress, setStreetAddress] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Address States
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  
  // 2. STATE DANH SÁCH COUPON & MODAL
  const [availableCoupons, setAvailableCoupons] = useState<CouponResponseDTO[]>([]);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  const total = getTotalPrice();
  const shipping = cart.length > 0 ? 30000 : 0;
  const grandTotal = total + shipping - couponDiscount;

  // --- Logic: Init & Fetch Address (Giữ nguyên phần useEffect check auth và address) ---
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

  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
        setFormData((prev) => ({
            ...prev,
            fullName: currentUser.name || "",
            phone: currentUser.phone || "",
        }));
        setStreetAddress(currentUser.streetAddress || "");
        // ... (Phần fetch Province giữ nguyên như code cũ của bạn)
        const fetchProvinces = async () => {
            setIsLoadingProvinces(true);
            try {
                const response = await fetch(`${PROVINCE_API_URL}/p/`);
                const data = await response.json();
                setProvinces(data || []);
                if (currentUser.provinceCode) {
                    const province = data.find((p: Province) => p.code === currentUser.provinceCode);
                    if (province) setSelectedProvince(province);
                }
            } catch (error) { toast.error("Lỗi khi tải danh sách tỉnh/thành"); } 
            finally { setIsLoadingProvinces(false); }
        };
        fetchProvinces();
    }
  }, [isAuthenticated]);

  // (Giữ nguyên useEffect fetch Districts và Wards)
  useEffect(() => {
    if (!selectedProvince) { setDistricts([]); setWards([]); return; }
    const fetchDistricts = async () => {
      setIsLoadingDistricts(true); setDistricts([]); setWards([]); setSelectedDistrict(null); setSelectedWard(null);
      try {
        const response = await fetch(`${PROVINCE_API_URL}/p/${selectedProvince.code}?depth=2`);
        const data = await response.json();
        const newDistricts = data.districts || [];
        setDistricts(newDistricts);
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.districtCode && selectedProvince.code === currentUser.provinceCode) {
          const district = newDistricts.find((d: District) => d.code === currentUser.districtCode);
          if (district) setSelectedDistrict(district);
        }
      } catch (error) { toast.error("Lỗi khi tải danh sách quận/huyện"); }
      finally { setIsLoadingDistricts(false); }
    };
    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict) { setWards([]); return; }
    const fetchWards = async () => {
      setIsLoadingWards(true); setWards([]); setSelectedWard(null);
      try {
        const response = await fetch(`${PROVINCE_API_URL}/d/${selectedDistrict.code}?depth=2`);
        const data = await response.json();
        const newWards = data.wards || [];
        setWards(newWards);
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.wardCode && selectedDistrict.code === currentUser.districtCode) {
          const ward = newWards.find((w: Ward) => w.code === currentUser.wardCode);
          if (ward) setSelectedWard(ward);
        }
      } catch (error) { toast.error("Lỗi khi tải danh sách phường/xã"); }
      finally { setIsLoadingWards(false); }
    };
    fetchWards();
  }, [selectedDistrict]);

  // --- 3. LOGIC FETCH COUPONS MỚI ---
  useEffect(() => {
      if (isReady) {
          const fetchCoupons = async () => {
              setIsLoadingCoupons(true);
              try {
                  // SỬA LẠI URL CHO KHỚP VỚI TRANG CHỦ
                  // Trang chủ dùng: /v1/coupons/public/all
                  const response = await manualFetchApi("/v1/coupons/public/all"); 
                  
                  // Kiểm tra cấu trúc dữ liệu trả về
                  if (response.status === 'SUCCESS' && Array.isArray(response.data)) {
                      setAvailableCoupons(response.data);
                  } else {
                      setAvailableCoupons([]);
                  }
              } catch (error) {
                  console.error("Failed to fetch coupons", error);
                  // Không cần toast lỗi ở đây để tránh làm phiền user nếu API lỗi nhẹ
              } finally {
                  setIsLoadingCoupons(false);
              }
          };
          fetchCoupons();
      }
  }, [isReady]);


  // --- Logic Validate Form (Giữ nguyên) ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const phoneRegex = /^(84|0[3|5|7|8|9])([0-9]{8})$/;
    const nameRegex = /^[\p{L}\s]+$/u;

    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
    else if (!nameRegex.test(formData.fullName.trim())) newErrors.fullName = "Họ tên không hợp lệ";
    
    if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!phoneRegex.test(formData.phone)) newErrors.phone = "SĐT không đúng định dạng";

    if (!selectedProvince) newErrors.province = "Vui lòng chọn Tỉnh/Thành phố";
    if (!selectedDistrict) newErrors.district = "Vui lòng chọn Quận/Huyện";
    if (!selectedWard) newErrors.ward = "Vui lòng chọn Phường/Xã";
    if (!streetAddress.trim()) newErrors.streetAddress = "Vui lòng nhập số nhà, tên đường";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // --- Coupon Logic ---
  const applyCouponLogic = async (codeToApply: string) => {
    setIsCheckingCoupon(true); setCouponError(""); setCouponDiscount(0); setAppliedCouponCode(null);
    try {
      const response = await manualFetchApi(`/v1/coupons/validate?code=${codeToApply}&subtotal=${total}`);
      const discountAmount = response.data;
      if (discountAmount >= 0) {
        setCouponDiscount(discountAmount);
        setAppliedCouponCode(codeToApply.toUpperCase());
        setCouponCode(codeToApply.toUpperCase()); // Update input field visually
        toast.success(`Áp dụng mã thành công! Giảm ${discountAmount.toLocaleString("vi-VN")}₫`);
        setIsCouponDialogOpen(false); // Đóng dialog nếu chọn từ list
      }
    } catch (err: any) {
      setCouponError(err.message || "Mã giảm giá không hợp lệ");
      toast.error(err.message || "Mã giảm giá không hợp lệ");
    } finally { setIsCheckingCoupon(false); }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    await applyCouponLogic(couponCode.trim());
  };
  
  // 4. Hàm xử lý khi chọn từ Dialog
  const handleSelectCouponFromList = (code: string) => {
      applyCouponLogic(code);
  }

  // --- Submit Order (Giữ nguyên) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsProcessing(true);
    const fullAddress = `${streetAddress}, ${selectedWard!.name}, ${selectedDistrict!.name}, ${selectedProvince!.name}`;
    const currentUser = useAuthStore.getState().user;

    const orderRequestDTO = {
      customerName: formData.fullName,
      phone: formData.phone,
      email: currentUser?.email,
      address: fullAddress,
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
        } else { throw new Error("Không nhận được link thanh toán VNPAY."); }
      }
    } catch (err: any) {
      console.error("Lỗi khi đặt hàng:", err);
      toast.error(err.message || "Đặt hàng thất bại");
      setIsProcessing(false);
    }
  };

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

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* CỘT TRÁI: FORM (Giữ nguyên UI Form nhập liệu) */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Thông tin giao hàng</h2>
                {/* ... (Giữ nguyên phần render Input Họ tên, Phone, Địa chỉ của bạn) ... */}
                <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="fullName">Họ và tên người nhận *</Label>
                       <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} className={errors.fullName ? "border-red-500" : ""} />
                       {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="phone">Số điện thoại *</Label>
                       <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className={errors.phone ? "border-red-500" : ""} />
                       {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
                     </div>
                     {/* (Phần Select Tỉnh/Huyện/Xã bạn giữ nguyên nhé, tôi rút gọn để tập trung vào Coupon) */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Render Select Tỉnh */}
                         <div className="space-y-2">
                           <Label>Tỉnh/Thành phố *</Label>
                           <Select value={selectedProvince?.code.toString()} onValueChange={(v) => { 
                               const p = provinces.find(i => i.code === parseInt(v)); 
                               setSelectedProvince(p || null); 
                           }}>
                             <SelectTrigger><SelectValue placeholder="Chọn Tỉnh/Thành" /></SelectTrigger>
                             <SelectContent>{provinces.map(p => <SelectItem key={p.code} value={p.code.toString()}>{p.name}</SelectItem>)}</SelectContent>
                           </Select>
                         </div>
                         {/* Render Select Quận */}
                         <div className="space-y-2">
                            <Label>Quận/Huyện *</Label>
                            <Select value={selectedDistrict?.code.toString()} disabled={!selectedProvince} onValueChange={(v) => {
                                const d = districts.find(i => i.code === parseInt(v));
                                setSelectedDistrict(d || null);
                            }}>
                                <SelectTrigger><SelectValue placeholder="Chọn Quận/Huyện" /></SelectTrigger>
                                <SelectContent>{districts.map(d => <SelectItem key={d.code} value={d.code.toString()}>{d.name}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                         {/* Render Select Phường */}
                         <div className="space-y-2">
                            <Label>Phường/Xã *</Label>
                            <Select value={selectedWard?.code.toString()} disabled={!selectedDistrict} onValueChange={(v) => {
                                const w = wards.find(i => i.code === parseInt(v));
                                setSelectedWard(w || null);
                            }}>
                                <SelectTrigger><SelectValue placeholder="Chọn Phường/Xã" /></SelectTrigger>
                                <SelectContent>{wards.map(w => <SelectItem key={w.code} value={w.code.toString()}>{w.name}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                     </div>

                     <div className="space-y-2">
                        <Label>Số nhà, tên đường *</Label>
                        <Input name="streetAddress" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                        <Label>Ghi chú</Label>
                        <textarea name="note" rows={3} value={formData.note} onChange={handleInputChange} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                     </div>
                </div>
              </div>

              {/* PHƯƠNG THỨC THANH TOÁN (Giữ nguyên) */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Phương thức thanh toán</h2>
                <div className="space-y-4">
                  <button type="button" onClick={() => setPaymentMethod('COD')} className={`flex items-center justify-between w-full p-4 border rounded-lg transition ${paymentMethod === 'COD' ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'}`}>
                    <div className="flex items-center gap-3"><Truck className="w-6 h-6 text-primary" /><span className="font-semibold">Thanh toán khi nhận hàng (COD)</span></div>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('VNPAY')} className={`flex items-center justify-between w-full p-4 border rounded-lg transition ${paymentMethod === 'VNPAY' ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'}`}>
                    <div className="flex items-center gap-3"><CreditCard className="w-6 h-6 text-blue-600" /><span className="font-semibold">Thanh toán qua VNPAY</span></div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Link href="/cart" className="flex-1"><Button variant="outline" className="w-full py-6">Quay lại</Button></Link>
                <Button type="submit" disabled={isProcessing} className="flex-1 py-6 text-lg">{isProcessing ? <Loader2 className="animate-spin" /> : "Đặt hàng"}</Button>
              </div>
            </div>

            {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-6 sticky top-28 space-y-6 shadow-sm">
                <h2 className="text-2xl font-bold">Tóm tắt đơn hàng</h2>
                
                {/* LIST SP */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.variantId} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-md overflow-hidden border">
                            <img src={item.imageUrl || "/placeholder.svg"} alt="" className="object-cover w-full h-full" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold line-clamp-1">{item.productName}</span>
                          <span className="text-xs text-muted-foreground">x {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-semibold">{(item.currentPrice * item.quantity).toLocaleString("vi-VN")}₫</span>
                    </div>
                  ))}
                </div>

                {/* 5. UI COUPON CẢI TIẾN */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Mã ưu đãi</span>
                      
                      {/* Nút mở Popup chọn mã */}
                      <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="link" className="text-primary p-0 h-auto font-semibold">
                                <TicketPercent className="w-4 h-4 mr-1" />
                                Chọn mã
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Chọn mã giảm giá</DialogTitle>
                            </DialogHeader>
                            
                            {/* Danh sách Voucher trong Popup */}
                            <div className="flex-1 overflow-y-auto py-4 pr-2 space-y-3">
                                {isLoadingCoupons ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                                ) : availableCoupons.length > 0 ? (
                                    availableCoupons.map(coupon => (
                                        <VoucherItem 
                                            key={coupon.id} 
                                            coupon={coupon} 
                                            currentTotal={total}
                                            onSelect={handleSelectCouponFromList}
                                        />
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Hiện không có mã giảm giá nào.</p>
                                )}
                            </div>
                        </DialogContent>
                      </Dialog>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Nhập mã giảm giá"
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
                      disabled={isCheckingCoupon || !couponCode.trim()}
                    >
                      {isCheckingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                    </Button>
                  </div>
                  
                  {couponError && <p className="text-destructive text-xs">{couponError}</p>}
                  {appliedCouponCode && (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm mt-2">
                        <span>Mã: <b>{appliedCouponCode}</b></span>
                        <button type="button" onClick={() => {
                            setAppliedCouponCode(null); 
                            setCouponDiscount(0); 
                            setCouponCode("");
                        }}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                  )}
                </div>

                {/* CHI TIẾT GIÁ */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-semibold">{total.toLocaleString("vi-VN")}₫</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-muted-foreground">Giảm giá</span>
                      <span className="font-semibold">-{couponDiscount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="font-semibold">{shipping.toLocaleString("vi-VN")}₫</span>
                  </div>

                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold">Tổng cộng</span>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary block">{grandTotal.toLocaleString("vi-VN")}₫</span>
                        <span className="text-xs text-muted-foreground">(Đã bao gồm VAT)</span>
                    </div>
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