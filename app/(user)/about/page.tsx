// "use client" <-- ⭐ DÒNG NÀY ĐÃ ĐƯỢC XÓA ĐI

import { Target, Sparkles, Shirt, Users } from "lucide-react";
import Image from "next/image"; // Import Image cho các ảnh
import { Button } from "@/components/ui/button"; // Import Button
import Link from "next/link"; // Import Link để điều hướng

// Thêm metadata để tốt cho SEO (GIỮ NGUYÊN)
export const metadata = {
  title: "Về Chúng Tôi",
  description: "Khám phá câu chuyện đằng sau thương hiệu thời trang của chúng tôi.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-muted py-20 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Câu Chuyện Của Chúng Tôi</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chúng tôi tin rằng thời trang là cách để thể hiện bạn là ai. Khám phá hành trình và triết lý của chúng tôi.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          
          {/* Sứ Mệnh */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                <Target className="h-5 w-5" />
                <span>Sứ Mệnh</span>
              </div>
              <h2 className="text-3xl font-bold">Giúp Bạn Thể Hiện Cá Tính</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Sứ mệnh của chúng tôi là mang đến những bộ sưu tập thời trang độc đáo, chất lượng cao và bắt kịp xu hướng. Chúng tôi muốn truyền cảm hứng để bạn tự tin thể hiện phong cách cá nhân, biến mỗi ngày trở thành một sàn diễn.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/placeholder-fashion-mission.jpg" 
                  alt="Lookbook thời trang" 
                  width={600} 
                  height={400} 
                  className="w-full h-auto object-cover aspect-video" 
                />
            </div>
          </div>

          {/* Triết lý Thời trang */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="rounded-lg overflow-hidden shadow-lg md:order-last">
                <Image
                  src="/placeholder-fashion-values.jpg" 
                  alt="Chất liệu vải cao cấp" 
                  width={600} 
                  height={400} 
                  className="w-full h-auto object-cover aspect-video" 
                />
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                <Sparkles className="h-5 w-5" />
                <span>Triết Lý Của Chúng Tôi</span>
              </div>
              <h2 className="text-3xl font-bold">Hơn Cả Quần Áo</h2>
              <ul className="list-disc list-inside text-muted-foreground text-lg space-y-2">
                <li>**Phong cách:** Không chỉ chạy theo xu hướng, chúng tôi tạo ra những thiết kế có giá trị bền vững.</li>
                <li>**Chất lượng:** Tỉ mỉ từ khâu chọn chất liệu vải đến từng đường may.</li>
                <li>**Cá tính:** Tôn vinh sự khác biệt và khuyến khích bạn là chính mình.</li>
                <li>**Trải nghiệm:** Mang đến trải nghiệm mua sắm trực tuyến dễ dàng và đầy cảm hứng.</li>
              </ul>
            </div>
          </div>
          
          {/* Đội Ngũ */}
          <div className="text-center pt-10 border-t">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              <Users className="h-5 w-5" />
              <span>Đội Ngũ</span>
            </div>
            <h2 className="text-3xl font-bold mt-4 mb-6">Những Người Tạo Nên Phong Cách</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-8">
              Đội ngũ của chúng tôi là tập hợp những con người đam mê thời trang, từ các nhà thiết kế, stylist đến đội ngũ chăm sóc khách hàng. Chúng tôi làm việc mỗi ngày để tìm kiếm nguồn cảm hứng và biến những ý tưởng sáng tạo thành hiện thực.
            </p> 
          </div>

        </div>
      </section>

      {/* Call to Action - Khuyến khích mua sắm */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Tìm Thấy Phong Cách Của Bạn?</h2>
          <p className="mb-8 opacity-90 text-lg">
            Khám phá ngay bộ sưu tập mới nhất của chúng tôi và bắt đầu hành trình
            thể hiện cá tính của riêng bạn.
          </p>
          <Link href="/products"> 
            <Button 
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-8 py-6"
            >
              <Shirt className="mr-2 h-5 w-5" />
              Mua Sắm Ngay
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}