"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

// 1. IMPORT CÁC THƯ VIỆN FORM VÀ VALIDATE
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 2. ĐỊNH NGHĨA SCHEMA VALIDATE (ĐÃ NÂNG CẤP)
const formSchema = z.object({
  name: z.string()
    .trim() // Tự động cắt khoảng trắng thừa
    .min(2, { message: "Tên phải có ít nhất 2 ký tự." })
    // Regex: Chỉ chấp nhận chữ cái (Unicode tiếng Việt) và khoảng trắng
    .regex(/^[\p{L}\s]+$/u, { message: "Tên không được chứa số hoặc ký tự đặc biệt." }),
    
  email: z.string()
    .trim()
    .min(1, { message: "Vui lòng nhập email." })
    .email({ message: "Email không đúng định dạng." }),
    
  subject: z.string()
    .trim()
    .optional(), // Chủ đề không bắt buộc, nhưng nếu nhập thì sẽ trim
    
  message: z.string()
    .trim()
    .min(10, { message: "Nội dung tin nhắn phải có ít nhất 10 ký tự." })
    .max(1000, { message: "Nội dung không được quá 1000 ký tự." }), // Thêm giới hạn tối đa để tránh spam
});

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  // 3. KHỞI TẠO FORM
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // 4. HÀM SUBMIT
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Gửi tin nhắn thất bại. Vui lòng thử lại.");
      }

      toast.success("Đã gửi tin nhắn thành công!");
      form.reset(); 
    
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-muted py-20 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Liên Hệ Với Chúng Tôi</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe. Vui lòng liên hệ qua thông tin bên dưới hoặc gửi biểu mẫu.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          
          {/* Thông tin liên hệ (Bên trái) */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">Thông Tin Liên Hệ</h2>
            <div className="flex items-start gap-4">
              <MapPin className="h-7 w-7 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold">Địa chỉ</h3>
                <p className="text-muted-foreground">
                  Số 2A, Đường Bình Chiểu, Phường Bình Chiểu, Thành Phố Thủ Đức, Thành Phố Hồ Chí Minh
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="h-7 w-7 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold">Điện thoại</h3>
                <p className="text-muted-foreground">0393274615</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-7 w-7 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold">Email</h3>
                <p className="text-muted-foreground">congdt04@gmail.com</p>
              </div>
            </div>
            
            <div className="aspect-video w-full">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4206639995355!2d106.73210431480143!3d10.855574792267847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175278789a74d9f%3A0x4374b53614554858!2zMiBCw6xuaCBDaGnhu4N1LCBQaMaw4budbmcgQsOsbmggQ2hp4buDdSwgVGjhu6cgxJDhu6ljLCBUaMOgbmggcGjhu5EgSOG7kyBDaMOtIE1pbmg!5e0!3m2!1svi!2s!4v1678945612345!5m2!1svi!2s" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps"
                ></iframe>
            </div>
          </div>

          {/* FORM LIÊN HỆ (Bên phải) */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">Gửi Tin Nhắn</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                
                {/* TÊN */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nguyễn Văn A" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* EMAIL */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CHỦ ĐỀ */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chủ đề</FormLabel>
                      <FormControl>
                        <Input placeholder="V/v hỗ trợ sản phẩm..." {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* NỘI DUNG */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội dung <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nội dung tin nhắn của bạn..."
                          rows={6}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* NÚT GỬI */}
                <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Gửi Tin Nhắn"
                  )}
                </Button>
              </form>
            </Form>
          </div>

        </div>
      </section>
    </div>
  );
}