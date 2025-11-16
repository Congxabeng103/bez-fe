"use client"

import { CouponResponseDTO } from "@/types/couponDTO"
import { TicketPercent, Copy, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import React, { useState } from "react" 

interface VoucherListProps {
  coupons: CouponResponseDTO[];
}

const VOUCHERS_PER_PAGE = 6; 

// (MỚI) Hàm định dạng ngày
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

export function VoucherList({ coupons }: VoucherListProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!coupons || coupons.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(coupons.length / VOUCHERS_PER_PAGE);
  const startIndex = currentPage * VOUCHERS_PER_PAGE;
  const endIndex = startIndex + VOUCHERS_PER_PAGE;
  const currentVouchers = coupons.slice(startIndex, endIndex); 

  const goToNextPage = () => {
    setCurrentPage((current) => (current + 1) % totalPages);
  };

  const goToPrevPage = () => {
    setCurrentPage((current) => (current - 1 + totalPages) % totalPages);
  };

  const handleCopy = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        toast.success(`Đã sao chép mã: ${code}`);
      }).catch(() => {
        toast.error("Lỗi khi sao chép");
      });
    } else {
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

  const formatCurrency = (value: number) => {
    return (value / 1000).toLocaleString('vi-VN') + "K";
  }

  return (
    <div className="bg-muted p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">🎉 Voucher Dành Cho Bạn</h3>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={goToPrevPage} aria-label="Trang trước">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextPage} aria-label="Trang sau">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[200px]">
        {currentVouchers.map((coupon) => (
          <div 
            key={coupon.id} 
            className="bg-background border border-border p-4 rounded-lg flex flex-col justify-between gap-2 shadow-sm"
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
              {/* (MỚI) Thêm Hạn Sử Dụng */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3 w-3" />
                <span>HSD: {formatDate(coupon.endDate)}</span>
              </div>
              
              {/* Nút Copy */}
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
        ))}
      </div>
    </div>
  )
}