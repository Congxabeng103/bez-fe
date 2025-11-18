"use client";

// Bọc component trong Suspense vì chúng ta dùng useSearchParams
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, KeyRound, ArrowLeft, Check } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

// --- Helper Component: Hiển thị yêu cầu mật khẩu ---
function Req({met, label}: {met: boolean, label: string}) {
    return (
        <div className={`flex items-center transition-colors duration-300 ${met?"text-green-600 font-medium":"text-slate-500"}`}>
            {met ? <Check size={12} className="mr-1.5 text-green-600"/> : <div className="w-2 h-2 rounded-full border border-slate-300 mr-2"/>}
            {label}
        </div>
    )
}

// Component con chứa logic
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); 

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [isTokenError, setIsTokenError] = useState(false); // Lỗi token ban đầu

  // State lỗi inline
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  // --- Logic Check Password Strength (Giống trang Đăng ký) ---
  const checkPasswordStrength = (pwd: string) => ({
      length: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^a-zA-Z0-9]/.test(pwd), // Regex phủ định chuẩn
  })
  const pwdStrength = checkPasswordStrength(password);
  const isStrongPassword = Object.values(pwdStrength).every(Boolean);

  // Kiểm tra token ngay khi tải trang
  useEffect(() => {
    if (!token) {
      setIsTokenError(true);
      toast.error("Token không hợp lệ hoặc bị thiếu.");
    }
  }, [token]);

  // Hàm xử lý đổi mật khẩu
  const handleResetPassword = async () => {
    if (!token) return;

    // 1. Validate
    const newErrors = { password: "", confirmPassword: "" };
    let hasError = false;

    if (!password) {
        newErrors.password = "Vui lòng nhập mật khẩu mới"; hasError = true;
    } else if (!isStrongPassword) {
        newErrors.password = "Mật khẩu chưa đủ mạnh"; hasError = true;
    }

    if (password !== confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"; hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    // 2. Call API
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, newPassword: password }), 
      });

      const resultMessage = await response.text();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Đặt lại mật khẩu thành công!");
        setTimeout(() => { router.push('/'); }, 3000);
      } else {
        toast.error(resultMessage || "Token không hợp lệ.");
        // Nếu lỗi do token hết hạn, khóa form lại
        if (resultMessage.toLowerCase().includes("token")) {
            setIsTokenError(true);
        }
      }
    } catch (err) {
      toast.error("Lỗi kết nối server.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Update State và xóa lỗi khi nhập ---
  const handlePwdChange = (val: string) => {
      setPassword(val);
      if (errors.password) setErrors(prev => ({...prev, password: ""}));
  }
  const handleConfirmChange = (val: string) => {
      setConfirmPassword(val);
      if (errors.confirmPassword) setErrors(prev => ({...prev, confirmPassword: ""}));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
           <KeyRound size={40} className="mx-auto text-primary" />
          <CardTitle className="text-2xl">Đặt lại Mật khẩu</CardTitle>
          <CardDescription>Vui lòng nhập mật khẩu mới của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* TRƯỜNG HỢP 1: Token Lỗi */}
          {isTokenError ? (
            <div className="space-y-4 text-center">
                <div className="bg-red-100 text-red-800 p-4 rounded text-sm">
                    Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.
                </div>
                <Link href="/forgot-password">
                    <Button variant="outline" className="w-full">Gửi lại yêu cầu</Button>
                </Link>
            </div>
          ) : isSuccess ? (
            /* TRƯỜNG HỢP 2: Thành công */
            <div className="space-y-4">
              <div className="bg-green-100 text-green-800 p-4 rounded text-sm text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">Đổi mật khẩu thành công!</p>
                <p className="text-xs mt-1">Đang chuyển hướng về trang đăng nhập...</p>
              </div>
              <Button onClick={() => router.push('/')} className="w-full">
                Về trang Đăng nhập ngay
              </Button>
            </div>
          ) : (
            /* TRƯỜNG HỢP 3: Form nhập mật khẩu */
            <>
                {/* Mật khẩu mới */}
                <div className="space-y-1.5">
                    <Label htmlFor="password" className={errors.password ? "text-red-500" : ""}>Mật khẩu mới</Label>
                    <Input
                        id="password" type="password" placeholder="••••••••"
                        value={password}
                        onChange={(e) => handlePwdChange(e.target.value)}
                        onFocus={() => setShowPasswordHints(true)}
                        disabled={isLoading}
                        className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

                    {/* Password Hints */}
                    {(showPasswordHints || (password.length > 0 && !isStrongPassword)) && (
                        <div className="bg-slate-50 p-3 rounded-md mt-2 text-[11px] space-y-1.5 border border-slate-200">
                            <p className="font-semibold text-slate-700 mb-1">Yêu cầu:</p>
                            <Req met={pwdStrength.length} label="Tối thiểu 8 ký tự" />
                            <Req met={pwdStrength.hasUpper} label="Chữ hoa (A-Z)" />
                            <Req met={pwdStrength.hasLower} label="Chữ thường (a-z)" />
                            <Req met={pwdStrength.hasNumber} label="Số (0-9)" />
                            <Req met={pwdStrength.hasSpecial} label="Ký tự đặc biệt (!@#_-%...)" />
                        </div>
                    )}
                </div>

                {/* Xác nhận mật khẩu */}
                <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className={errors.confirmPassword ? "text-red-500" : ""}>Xác nhận mật khẩu mới</Label>
                    <Input
                        id="confirmPassword" type="password" placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmChange(e.target.value)}
                        disabled={isLoading}
                        className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                <Button onClick={handleResetPassword} className="w-full mt-4" disabled={isLoading}>
                    {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </Button>
              
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