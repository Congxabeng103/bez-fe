"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function ActivatePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token"); // Lấy token từ URL Frontend (link email)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("Đang xác thực tài khoản...");
  
  // Chặn gọi API 2 lần (fix lỗi React Strict Mode)
  const hasFetched = useRef(false);

  useEffect(() => {
    // 1. Kiểm tra token
    if (!token) {
      setStatus('error');
      setMessage("Link kích hoạt không hợp lệ (thiếu token).");
      return;
    }

    // 2. Chặn gọi lại nếu đã chạy rồi
    if (hasFetched.current) return;
    hasFetched.current = true;

    const activateAccount = async () => {
      try {
        // 3. GỌI API KHỚP VỚI CONTROLLER CỦA BẠN
        // Controller: @GetMapping("/activate/{token}")
        // Nên fetch url phải là: .../activate/${token}
        const response = await fetch(`${API_URL}/v1/auth/activate/${token}`, {
          method: 'GET', 
          headers: { 'Content-Type': 'application/json' }
        });

        // 4. Xử lý kết quả JSON từ ApiResponseDTO
        const data = await response.json(); // Controller trả về JSON chuẩn rồi, yên tâm parse

        if (response.ok) {
          // Thành công (HTTP 200)
          setStatus('success');
          // Lấy message từ data.message (hoặc fallback)
          setMessage(data.message || "Kích hoạt tài khoản thành công!");
          toast.success("Kích hoạt thành công!");
          
          // Chuyển trang sau 3s
          setTimeout(() => {
            router.push('/login'); 
          }, 3000);
        } else {
          // Thất bại (HTTP 400, 404, 500...)
          setStatus('error');
          setMessage(data.message || "Token không hợp lệ hoặc đã hết hạn.");
          toast.error("Kích hoạt thất bại");
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage("Lỗi kết nối đến máy chủ.");
      }
    };

    activateAccount();
  }, [token, router]);

  // --- GIAO DIỆN ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-slate-100">
        
        {/* LOADING */}
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="h-16 w-16 text-blue-500 mx-auto animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Đang xử lý...</h2>
            <p className="text-slate-500 mt-2">Đang kiểm tra mã kích hoạt của bạn</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div className="py-4 animate-in zoom-in-95 duration-300">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Thành công!</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <p className="text-sm text-slate-400 mb-4">Đang chuyển hướng đăng nhập...</p>
            <Button onClick={() => router.push('/login')} className="w-full bg-green-600 hover:bg-green-700">
              Đăng nhập ngay
            </Button>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div className="py-4 animate-in zoom-in-95 duration-300">
            <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Kích hoạt thất bại</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
                    Thử lại
                </Button>
                <Button onClick={() => router.push('/register')} className="flex-1">
                    Đăng ký lại
                </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>}>
      <ActivatePageContent />
    </Suspense>
  );
}