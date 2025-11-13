"use client";

// Bọc component trong Suspense vì chúng ta dùng useSearchParams
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner"; // Dùng toast để thông báo
import { Loader2, CheckCircle, XCircle } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button"; // Import Button

// URL API Backend của bạn
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Component con chứa logic, phải bọc trong <Suspense>
function ActivatePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Dùng để chuyển hướng
  const token = searchParams.get("token"); // Lấy token từ URL

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Đang xác thực tài khoản của bạn...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem có token trên URL không
    if (!token) {
      setMessage("Link kích hoạt không hợp lệ hoặc bị thiếu token.");
      setIsError(true);
      setIsLoading(false);
      toast.error("Link kích hoạt không hợp lệ.");
      return;
    }

    // 2. Định nghĩa hàm gọi API backend
    const activateAccount = async () => {
      try {
        // Gọi API backend (Spring Boot)
        const response = await fetch(`${API_URL}/v1/auth/activate/${token}`, {
          method: 'GET',
        });

        // Backend của bạn trả về message dạng text (String)
        const resultMessage = await response.text(); 

        if (response.ok) {
          // Backend trả về message: "Tài khoản của bạn đã được kích hoạt..."
          setMessage(resultMessage);
          setIsError(false);
          toast.success("Kích hoạt thành công!");
          
          // Tự động chuyển về trang login sau 3 giây
          setTimeout(() => {
            router.push('/'); // Về trang chủ (sẽ tự động sang login nếu chưa auth)
          }, 3000);
        } else {
          // Lỗi 404 (Token không hợp lệ) hoặc lỗi khác
          setMessage(resultMessage || "Token không hợp lệ hoặc đã hết hạn.");
          setIsError(true);
          toast.error(resultMessage || "Token không hợp lệ.");
        }
      } catch (err) {
        console.error(err);
        setMessage("Lỗi kết nối đến server. Vui lòng thử lại.");
        setIsError(true);
        toast.error("Lỗi kết nối server.");
      } finally {
        setIsLoading(false);
      }
    };

    // 3. Chạy hàm kích hoạt
    activateAccount();
    
  }, [token, router]); // Chạy 1 lần khi có token

  // Giao diện (UI) hiển thị cho người dùng
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-xl max-w-md w-full text-center border">
        {/* Loading Spinner */}
        {isLoading && (
          <>
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
            <h2 className="text-xl font-semibold mt-4">Đang xử lý...</h2>
          </>
        )}

        {/* Lỗi (Error) */}
        {!isLoading && isError && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold mt-4 text-destructive">Kích hoạt thất bại</h2>
          </>
        )}

        {/* Thành công (Success) */}
        {!isLoading && !isError && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold mt-4 text-green-600">Kích hoạt thành công!</h2>
          </>
        )}

        {/* Thông báo chi tiết */}
        <p className="text-muted-foreground mt-2">{message}</p>

        {/* Nút quay lại (chỉ hiện sau khi loading xong) */}
        {!isLoading && (
          <Button asChild className="mt-6 w-full">
            <Link href="/">Quay về trang Đăng nhập</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Component chính để export ---
// Phải bọc trong <Suspense> vì ActivatePageContent dùng useSearchParams
export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ActivatePageContent />
    </Suspense>
  );
}