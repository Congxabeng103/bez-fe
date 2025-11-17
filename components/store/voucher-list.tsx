"use client"

import { CouponResponseDTO } from "@/types/couponDTO"
import { TicketPercent, Copy, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import React from "react" // (Không cần useState nữa)

// 1. IMPORT CAROUSEL
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface VoucherListProps {
  coupons: CouponResponseDTO[];
}

// (Các hàm helper giữ nguyên)
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateString;
  }
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('vi-VN') + "đ";
}

const handleCopy = (code: string) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      toast.success(`Đã sao chép mã: ${code}`);
    }).catch(() => {
      toast.error("Lỗi khi sao chép");
    });
  } else {
    // (Logic copy dự phòng giữ nguyên)
    try {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast.success(`Đã sao chép mã: ${code}`);
    } catch (e) {
      toast.error("Lỗi khi sao chép mã");
    }
  }
}

export function VoucherList({ coupons }: VoucherListProps) {
  // 2. BỎ CÁC STATE VÀ LOGIC PHÂN TRANG (Carousel tự lo)
  // const [currentPage, setCurrentPage] = useState(0);
  // const totalPages = ...
  // const currentVouchers = ...
  // const goToNextPage = ...

  if (!coupons || coupons.length === 0) {
    return null;
  }

  return (
    // 3. THAY THẾ BẰNG CAROUSEL
    <div className="bg-muted p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">🎉 Voucher Dành Cho Bạn</h3>
      
      <Carousel
        opts={{
          align: "start",
          loop: false, // Không lặp lại khi hết
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {coupons.map((coupon) => ( // 4. Map toàn bộ 'coupons'
            <CarouselItem 
              key={coupon.id} 
              className="pl-4 basis-full md:basis-1/3" // 5. Set kích thước (1 trên mobile, 3 trên desktop)
            >
              {/* Mã JSX của thẻ voucher (giữ nguyên) */}
              <div 
                className="bg-background border border-border p-4 rounded-lg flex flex-col justify-between gap-2 shadow-sm h-full"
              >
                {/* Phần trên: Icon và Giảm giá */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center p-3 bg-primary/10 text-primary rounded-lg min-w-[70px]">
                    <TicketPercent className="h-6 w-6" />
                    <span className="text-lg font-bold mt-1">
                      {coupon.discountValue}%
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate" title={coupon.description}>
                      {coupon.description}
                    </p>
                    {coupon.maxDiscountAmount && (
                      <p className="text-xs text-muted-foreground">
                        Tối đa: {formatCurrency(coupon.maxDiscountAmount)}
                      </p>
                    )}
                    {coupon.minOrderAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Đơn từ: {formatCurrency(coupon.minOrderAmount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phần dưới: HSD và Nút Copy */}
                <div className="flex justify-between items-center pt-2 border-t border-dashed">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="h-3 w-3" />
                    <span>HSD: {formatDate(coupon.endDate)}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary font-bold"
                    onClick={() => handleCopy(coupon.code)}
                  >
                    {coupon.code}
                    <Copy className="h-3 w-3 ml-1.5" />
                  </Button>
                </div>
              </div>
              {/* Kết thúc mã JSX của thẻ voucher */}
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* 6. THÊM NÚT ĐIỀU KHIỂN */}
        <CarouselPrevious className="absolute left-[-20px] sm:left-[-50px] top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-[-20px] sm:right-[-50px] top-1/2 -translate-y-1/2" />
      </Carousel>
    </div>
  )
}