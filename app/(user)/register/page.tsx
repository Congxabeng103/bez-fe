"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/authStore"

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, AlertCircle, Check, Mail } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const { register } = useAuthStore()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: ""
  })
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPasswordHints, setShowPasswordHints] = useState(false)

  // Check password strength
  const checkPasswordStrength = (pwd: string) => ({
      length: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  })
  const pwdStrength = checkPasswordStrength(formData.password)
  const isStrongPassword = Object.values(pwdStrength).every(Boolean)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = {...prev}; delete n[field]; return n; })
  }

  const handleRegister = async () => {
    setErrors({})
    const cleanData = { ...formData, firstName: formData.firstName.trim(), lastName: formData.lastName.trim(), email: formData.email.trim() }
    const newErrors: any = {}

    if (!cleanData.firstName) newErrors.firstName = "Vui lòng nhập tên"
    if (!cleanData.lastName) newErrors.lastName = "Vui lòng nhập họ"
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cleanData.email) newErrors.email = "Vui lòng nhập email"
    else if (!emailRegex.test(cleanData.email)) newErrors.email = "Email không đúng định dạng"

    if (!cleanData.password) newErrors.password = "Vui lòng nhập mật khẩu"
    else if (!isStrongPassword) newErrors.password = "Mật khẩu chưa đủ mạnh"
    
    if (cleanData.password !== cleanData.confirmPassword) newErrors.confirmPassword = "Mật khẩu không khớp"

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
    }

    setLoading(true)
    try {
      await register(cleanData.firstName, cleanData.lastName, cleanData.email, cleanData.password)
      setIsSuccess(true)
      toast.success("Đăng ký thành công!")
    } catch (error: any) {
      const msg = error.message || "Lỗi hệ thống";
      const lowerMsg = msg.toLowerCase();

      if (lowerMsg.includes("email") || lowerMsg.includes("tồn tại") || lowerMsg.includes("sử dụng")) {
          setErrors(prev => ({ ...prev, email: msg }))
          toast.error("Email đã được sử dụng")
      } else {
          toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-6 pt-8">
          <CardTitle className="text-2xl font-bold text-primary">
            {isSuccess ? "Kiểm tra Email" : "Đăng ký tài khoản"}
          </CardTitle>
          <CardDescription>
            {isSuccess ? "Vui lòng kích hoạt tài khoản để tiếp tục" : "Điền thông tin để tạo tài khoản mới"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-5"> {/* Tăng khoảng cách giữa các khối lớn */}
          {isSuccess ? (
            /* --- GIAO DIỆN THÀNH CÔNG --- */
            <div className="flex flex-col items-center text-center space-y-5 py-4 animate-in zoom-in-95">
               <div className="h-20 w-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                 <Mail size={40} />
              </div>
              <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-800">Xác thực tài khoản</h3>
                  <p className="text-sm text-slate-600 px-2">
                    Link kích hoạt đã được gửi đến <span className="font-bold text-slate-900">{formData.email}</span>
                  </p>
              </div>
              <div className="w-full pt-4">
                <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
                  Quay về Đăng nhập
                </Button>
              </div>
            </div>
          ) : (
            /* --- FORM ĐĂNG KÝ --- */
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* HỌ & TÊN */}
                <div className="space-y-1.5"> {/* THÊM space-y-1.5 ĐỂ KÉO LABEL GẦN INPUT */}
                  <Label className={errors.firstName && "text-red-500"}>Tên *</Label>
                  <Input 
                    placeholder="Tên"
                    value={formData.firstName} onChange={(e)=>handleChange("firstName", e.target.value)} 
                    className={errors.firstName && "border-red-500 ring-red-500"} disabled={loading}
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className={errors.lastName && "text-red-500"}>Họ *</Label>
                  <Input 
                    placeholder="Họ"
                    value={formData.lastName} onChange={(e)=>handleChange("lastName", e.target.value)} 
                    className={errors.lastName && "border-red-500 ring-red-500"} disabled={loading}
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-1.5"> {/* KÉO GẦN */}
                <Label className={errors.email && "text-red-500"}>Email *</Label>
                <Input 
                    type="email" placeholder="example@gmail.com"
                    value={formData.email} onChange={(e)=>handleChange("email", e.target.value)} 
                    className={errors.email ? "border-red-500 bg-red-50" : ""} disabled={loading}
                />
                {errors.email && (
                    <div className="text-xs text-red-600 flex items-center font-medium animate-in slide-in-from-left-1">
                        <AlertCircle size={12} className="mr-1"/> {errors.email}
                    </div>
                )}
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5"> {/* KÉO GẦN */}
                <Label className={errors.password && "text-red-500"}>Mật khẩu *</Label>
                <Input 
                    type="password" placeholder="••••••••"
                    value={formData.password} 
                    onChange={(e)=>handleChange("password", e.target.value)}
                    onFocus={()=>setShowPasswordHints(true)}
                    className={errors.password && "border-red-500"} disabled={loading}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                
                {/* Password Hints */}
                {(showPasswordHints || (formData.password.length > 0 && !isStrongPassword)) && (
                    <div className="bg-slate-50 p-3 rounded-md mt-2 text-[11px] space-y-1.5 border border-slate-200">
                        <p className="font-semibold text-slate-700 mb-1">Yêu cầu:</p>
                        <Req met={pwdStrength.length} label="Tối thiểu 8 ký tự" />
                        <Req met={pwdStrength.hasUpper} label="Chữ hoa (A-Z)" />
                        <Req met={pwdStrength.hasLower} label="Chữ thường (a-z)" />
                        <Req met={pwdStrength.hasNumber} label="Số (0-9)" />
                        <Req met={pwdStrength.hasSpecial} label="Ký tự đặc biệt" />
                    </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-1.5"> {/* KÉO GẦN */}
                <Label className={errors.confirmPassword && "text-red-500"}>Nhập lại mật khẩu *</Label>
                <Input 
                    type="password" placeholder="••••••••"
                    value={formData.confirmPassword} 
                    onChange={(e)=>handleChange("confirmPassword", e.target.value)} 
                    className={errors.confirmPassword && "border-red-500"} disabled={loading}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              <div className="pt-2">
                <Button onClick={handleRegister} disabled={loading} className="w-full h-11 shadow-sm font-medium text-base">
                    {loading ? <Loader2 className="animate-spin mr-2"/> : "Đăng ký ngay"}
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Đã có tài khoản? <Link href="/login" className="text-primary font-semibold hover:underline hover:text-blue-600 transition-colors">Đăng nhập</Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Req({met, label}: {met: boolean, label: string}) {
    return (
        <div className={`flex items-center transition-colors duration-300 ${met?"text-green-600 font-medium":"text-slate-500"}`}>
            {met ? <Check size={12} className="mr-1.5 text-green-600"/> : <div className="w-2 h-2 rounded-full border border-slate-300 mr-2"/>}
            {label}
        </div>
    )
}