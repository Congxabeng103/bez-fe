"use client";
import { ScrollText, User, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // Nhớ import cn để xử lý class cho gọn

type OrderAuditLogResponseDTO = {
  id: number;
  staffName: string;
  staffEmail?: string; // Email có thể null
  description: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
};

type Props = {
  logs: OrderAuditLogResponseDTO[];
  isLoading: boolean;
};

const formatDateTime = (isoString: string) => {
  return new Date(isoString).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
};

export function OrderHistoryTimeline({ logs, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Đang tải lịch sử...</span>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-muted-foreground italic text-center py-4">Chưa có lịch sử thao tác cho đơn này.</p>;
  }

  return (
    <div className="space-y-6">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3">
          <div className="flex-shrink-0 pt-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ScrollText size={16} />
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{log.description}</p>
            
            {/* Hiển thị thay đổi giá trị (nếu có) */}
            {log.fieldChanged && (
              <div className="text-xs text-muted-foreground mt-0.5">
                <span>Trường thay đổi: </span>
                <span className="font-semibold line-through">{log.oldValue}</span>
                <span> → </span>
                <span className="font-semibold text-green-600">{log.newValue}</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
              <div className="flex items-center gap-1">
                <User size={12} />
                
                {/* --- SỬA Ở ĐÂY --- */}
                <span 
                  // Logic: Nếu có email (Admin/Staff) thì gán title, không thì undefined (ko hiện gì)
                  title={log.staffEmail || undefined} 
                  
                  className={cn(
                    "font-medium", // Style mặc định
                    // Nếu có email: Thêm hover đổi màu nhẹ để biết là tương tác được, con trỏ mặc định
                    log.staffEmail ? "hover:text-blue-600 cursor-default transition-colors" : ""
                  )}
                >
                  {log.staffName}
                </span>
                {/* ---------------- */}

              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{formatDateTime(log.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}