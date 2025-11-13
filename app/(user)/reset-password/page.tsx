"use client";

// Bọc component trong Suspense vì chúng ta dùng useSearchParams
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, KeyRound, ArrowLeft } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link"; // Import Link

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

// Component con chứa logic, phải bọc trong <Suspense>
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Lấy token từ URL

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Báo thành công

  // Kiểm tra token ngay khi tải trang
  useEffect(() => {
    if (!token) {
      setMessage("Token không hợp lệ hoặc bị thiếu.");
      setIsError(true);
      setIsLoading(false);
    }
  }, [token]);

  // Hàm xử lý khi nhấn nút "Đặt lại mật khẩu"
  const handleResetPassword = async () => {
    if (!token) return toast.error("Token không hợp lệ.");
    if (!password) {
        setMessage("Vui lòng nhập mật khẩu mới.");
        setIsError(true);
        return;
    }
    if (password.length < 6) {
        setMessage("Mật khẩu phải có ít nhất 6 ký tự.");
        setIsError(true);
        return;
    }
    if (password !== confirmPassword) {
        setMessage("Mật khẩu xác nhận không khớp.");
        setIsError(true);
        return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      // Gọi API backend (Spring Boot)
      const response = await fetch(`${API_URL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Backend (AuthenticationService) cần token và newPassword
        body: JSON.stringify({ token: token, newPassword: password }), 
      });

      // Backend trả về message dạng text (String)
      const resultMessage = await response.text();

      if (response.ok) {
        // Backend trả về: "Đặt lại mật khẩu thành công!"
        setMessage(resultMessage);
        setIsError(false);
        setIsSuccess(true); // Đánh dấu thành công
        toast.success("Đặt lại mật khẩu thành công!");
        
        // Tự động chuyển về trang login (là trang '/') sau 3 giây
        setTimeout(() => {
          router.push('/'); 
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

  // Giao diện
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
           <KeyRound size={40} className="mx-auto text-primary" />
          <CardTitle className="text-2xl">Đặt lại Mật khẩu</CardTitle>
          <CardDescription>Vui lòng nhập mật khẩu mới của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Nếu thành công, chỉ hiển thị thông báo */}
          {isSuccess ? (
            <div className="space-y-4">
              <div className="bg-green-100 text-green-800 p-4 rounded text-sm text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">{message}</p>
                <p className="text-xs mt-1">Đang tự động chuyển hướng về trang đăng nhập...</p>
              </div>
              <Button onClick={() => router.push('/')} className="w-full">
                Về trang Đăng nhập ngay
              </Button>
            </div>
          ) : (
            // Ngược lại, hiển thị form nhập mật khẩu
            <>
              {/* Chỉ hiển thị form nếu token hợp lệ (isError = false ban đầu) */}
              {(!isError || message) && ( // Hiện form nếu chưa có lỗi token ban đầu, hoặc đã có lỗi validate
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu mới</Label>
                    <Input
                      id="password"
                      placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirmPassword"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              {/* Hiển thị thông báo (lỗi) */}
              {message && (
                <div
                  className={`p-3 rounded text-sm ${
                    isError ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Nút bấm */}
              {!isError && ( // Chỉ hiển thị nút Submit nếu token ban đầu OK
                <Button onClick={handleResetPassword} className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                  {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </Button>
              )}
              
              {/* Nút quay lại Login */}
              <Link href="/" className="text-primary hover:underline text-sm w-full text-center block pt-2">
                  <ArrowLeft size={14} className="inline mr-1" />
                  Quay lại Đăng nhập
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Component chính để export (BẮT BUỘC) ---
// Phải bọc trong <Suspense> vì ResetPasswordContent dùng useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}