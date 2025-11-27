"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  
  // Hàm tính toán để hiển thị: 1 2 ... 5 6 ... 10
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Chỉ hiện tối đa 5-7 nút

    if (totalPages <= 7) {
      // Ít trang thì hiện hết
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Nhiều trang thì rút gọn
      if (currentPage <= 4) {
        // Đang ở đầu: 1 2 3 4 5 ... 10
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Đang ở cuối: 1 ... 6 7 8 9 10
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Đang ở giữa: 1 ... 4 5 6 ... 10
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <div className="text-sm text-muted-foreground hidden sm:block">
        Trang {currentPage} trên {totalPages}
      </div>
      
      <div className="flex gap-1 justify-center w-full sm:w-auto">
        {/* Nút Previous */}
        <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)} 
            disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </Button>

        {/* Danh sách số trang (Đã rút gọn) */}
        {getPageNumbers().map((page, index) => {
            if (page === "...") {
                return <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground flex items-center">...</span>
            }

            return (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 ${currentPage === page ? "pointer-events-none" : ""}`}
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )
        })}

        {/* Nút Next */}
        <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}