"use client"

import { useState, useEffect, useCallback } from "react"; // 1. Thêm hooks
import { ProductCard } from "@/components/store/product-card"
import { CampaignDiscountBanner } from "@/components/store/campaign-discount-banner"
import { VoucherList } from "@/components/store/voucher-list"
// import { products } from "@/lib/products" // 2. Xóa mock data
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { translations as t } from "@/lib/translations"
import { ProductResponseDTO } from "@/types/productDTO"; // 3. Import DTO
import { toast } from "sonner"; // 4. Import toast
import { Loader2 } from "lucide-react"; // 5. Import Loader

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  // 6. State cho dữ liệu thật
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const categories = ["Áo phông", "Quần jean", "Áo hoodie", "Váy", "Áo khoác", "Áo len"]; // (Tạm thời giữ mock category)

  // 7. Logic gọi API (chỉ lấy 8 sản phẩm mới nhất)
  const fetchFeaturedProducts = useCallback(async () => {
    setIsLoading(true);
    const url = new URL(`${API_URL}/v1/products`);
    url.searchParams.append("page", "0");
    url.searchParams.append("size", "8"); // Chỉ lấy 8 sản phẩm
    url.searchParams.append("sort", "createdAt,desc");
    url.searchParams.append("status", "ACTIVE"); 

    try {
      const response = await fetch(url.toString()); 
      if (!response.ok) throw new Error("Không thể tải sản phẩm nổi bật");
      
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setFeaturedProducts(result.data.content);
      } else {
        toast.error(result.message || "Lỗi tải sản phẩm");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 8. Chạy API
  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t.welcomeTitle}</h1>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">{t.welcomeDesc}</p>
            <Link href="/products">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">{t.shopNow}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Campaign Discount Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CampaignDiscountBanner />
      </section>

      {/* Voucher List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VoucherList />
      </section>

      {/* Featured Products Section (Sửa) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">{t.featuredProducts}</h2>
          <p className="text-muted-foreground">{t.checkOutLatest}</p>
        </div>

        {/* 9. Sửa Logic Hiển thị */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/products">
            <Button variant="outline">{t.viewAllProducts}</Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.shopByCategory}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/products?category=${encodeURIComponent(category)}`}
                className="group relative overflow-hidden rounded-lg h-48 bg-primary flex items-center justify-center hover:shadow-lg transition"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
                <h3 className="text-2xl font-bold text-primary-foreground relative z-10">{category}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{t.subscribeNewsletter}</h2>
          <p className="mb-6 opacity-90">{t.getExclusiveOffers}</p>
          <div className="flex gap-2">
            <input type="email" placeholder={t.enterEmail} className="flex-1 px-4 py-2 rounded-lg text-foreground" />
            <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">{t.subscribe}</Button>
          </div>
        </div>
      </section>
    </div>
  )
}