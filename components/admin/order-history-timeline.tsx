"use client";
import { ScrollText, User, Clock, Loader2 } from "lucide-react";

// DTO này phải khớp với DTO Backend (OrderAuditLogResponseDTO)
type OrderAuditLogResponseDTO = {
  id: number;
  staffName: string; // Tên nhân viên
  description: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string; // ISO String
};

type Props = {
  logs: OrderAuditLogResponseDTO[];
  isLoading: boolean;
};

// Helper định dạng ngày
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

  // Hiển thị danh sách log
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
                <span>{log.staffName}</span>
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