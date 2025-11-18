"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image"; // <-- 1. IMPORT
import { Button } from "@/components/ui/button";
import { Loader2, Truck, ShieldCheck, Headset } from "lucide-react";
import { toast } from "sonner";
import { translations as t } from "@/lib/translations";

import { ProductCard } from "@/components/store/product-card";
import { CampaignSlider } from "@/components/store/campaign-slider"; 
import { VoucherList } from "@/components/store/voucher-list"; 
// <-- 2. IMPORT TOOLTIP
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// <-- 3. IMPORT CAROUSEL
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { ProductResponseDTO } from "@/types/productDTO";
import { CategoryResponseDTO } from "@/types/categoryDTO";
import { BrandResponseDTO } from "@/types/brandDTO";
import { PromotionResponseDTO } from "@/types/promotionDTO";
import { CouponResponseDTO } from "@/types/couponDTO"; 

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  // (State giữ nguyên)
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponseDTO[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [categories, setCategories] = useState<CategoryResponseDTO[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [promotions, setPromotions] = useState<PromotionResponseDTO[]>([]);
  const [isLoadingPromotion, setIsLoadingPromotion] = useState(true);
  const [brands, setBrands] = useState<BrandResponseDTO[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [coupons, setCoupons] = useState<CouponResponseDTO[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);

  // (Tất cả các hàm fetch của bạn giữ nguyên)
  const fetchFeaturedProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    const url = new URL(`${API_URL}/v1/products`);
    url.searchParams.append("page", "0");
    url.searchParams.append("size", "4");
    url.searchParams.append("sort", "createdAt,desc");
    url.searchParams.append("status", "ACTIVE");
    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Lỗi tải sản phẩm");
      const result = await res.json();
      if (result.status === 'SUCCESS' && result.data) {
        setFeaturedProducts(result.data.content);
      } else { toast.error(result.message || "Lỗi tải sản phẩm"); }
    } catch (err: any) { toast.error(err.message); } 
    finally { setIsLoadingProducts(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    const url = `${API_URL}/v1/categories/all-brief`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Lỗi tải danh mục");
      const result = await res.json();
      if (result.status === 'SUCCESS' && result.data) {
        setCategories(result.data);
      } else { toast.error(result.message || "Lỗi tải danh mục"); }
    } catch (err: any) { toast.error(err.message); } 
    finally { setIsLoadingCategories(false); }
  }, []);

  const fetchActivePromotions = useCallback(async () => {
    setIsLoadingPromotion(true);
    const url = `${API_URL}/v1/promotions/public/active`; 
    try {
      const res = await fetch(url);
      if (!res.ok) { throw new Error("Lỗi tải khuyến mãi"); }
      const result = await res.json();
      if (result.status === 'SUCCESS' && result.data) {
        setPromotions(result.data);
      } else { setPromotions([]); }
    } catch (err: any) { setPromotions([]); } 
    finally { setIsLoadingPromotion(false); }
  }, []);
  
  const fetchBrands = useCallback(async () => {
    setIsLoadingBrands(true);
    const url = `${API_URL}/v1/brands/all-brief`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Lỗi tải thương hiệu");
      const result = await res.json();
      if (result.status === 'SUCCESS' && result.data) {
        setBrands(result.data);
      } else { toast.error(result.message || "Lỗi tải thương hiệu"); }
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoadingBrands(false); }
  }, []);

  
  const fetchPublicCoupons = useCallback(async () => {
    setIsLoadingCoupons(true);
    const url = new URL(`${API_URL}/v1/coupons/public/all`);
    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Lỗi tải voucher");
      const result = await res.json();
      if (result.status === 'SUCCESS' && result.data) {
        setCoupons(result.data);
      } else { toast.error(result.message || "Lỗi tải voucher"); }
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoadingCoupons(false); }
  }, []);

  // (useEffect giữ nguyên)
  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
    fetchActivePromotions();
    fetchBrands();
    fetchPublicCoupons();
  }, [
    fetchFeaturedProducts, 
    fetchCategories, 
    fetchActivePromotions,
    fetchBrands, 
    fetchPublicCoupons
  ]);

  return (
    <div className="min-h-screen">
      
      {/* Hero Section (Giữ nguyên) */}
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

      {/* Trust Banner (Giữ nguyên) */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <span className="font-medium">Miễn phí vận chuyển</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-medium">Thanh toán bảo mật</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Headset className="h-6 w-6 text-primary" />
            <span className="font-medium">Hỗ trợ 24/7</span>
          </div>
        </div>
      </section>

      {/* Campaign Slider Section (Giữ nguyên) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isLoadingPromotion && (
          <CampaignSlider promotions={promotions} />
        )}
      </section>

      {/* Voucher List Section (Giữ nguyên) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {!isLoadingCoupons && (
          <VoucherList coupons={coupons} />
        )}
      </section>

      {/* Hàng Mới Về (Giữ nguyên) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">Hàng Mới Về</h2>
          <p className="text-muted-foreground">{t.checkOutLatest}</p>
        </div>
        {isLoadingProducts ? (
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

      {/* ======================================= */}
      {/* 4. SỬA: KHỐI DANH MỤC (Dùng Carousel) */}
      <section className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.shopByCategory}</h2>
          {isLoadingCategories ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Carousel
              opts={{
                align: "start", // Căn lề trái
                loop: false, // Chỉ lặp lại nếu có nhiều hơn 6
              }}
              className="w-full" // Carousel chiếm toàn bộ chiều rộng
            >
              <CarouselContent className="-ml-4">
                {categories.map((category) => (
                  // Mỗi item là 1 cột trong slider
                  <CarouselItem key={category.id} className="pl-4 basis-1/3 sm:basis-1/4 md:basis-1/6">
                    <Link
                      href={`/products?category=${encodeURIComponent(category.name)}`}
                      className="group block text-center"
                    >
                      <div className="aspect-square overflow-hidden rounded-lg border bg-card group-hover:shadow-lg transition-shadow">
                        <Image
                          src={category.imageUrl || "/placeholder.svg"}
                          alt={category.name}
                          width={200}
                          height={200}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold mt-3 group-hover:text-primary transition-colors truncate">
                        {category.name}
                      </h3>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-20px] sm:left-[-50px] top-1/2 -translate-y-[120%]" />
              <CarouselNext className="absolute right-[-20px] sm:right-[-50px] top-1/2 -translate-y-[120%]" />
            </Carousel>
          )}
        </div>
      </section>
      {/* ======================================= */}


      {/* ======================================= */}
      {/* 5. SỬA: KHỐI THƯƠNG HIỆU (Dùng Carousel) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Thương Hiệu Nổi Bật</h2>
          {isLoadingBrands ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TooltipProvider>
              <Carousel
                opts={{
                  align: "start",
                  loop: false, // Chỉ lặp lại nếu có nhiều hơn 6
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {brands.map((brand) => (
                    <CarouselItem key={brand.id} className="pl-4 basis-1/3 sm:basis-1/4 md:basis-1/6">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/products?brand=${encodeURIComponent(brand.name)}`}
                            className="group"
                          >
                            <div className="flex items-center justify-center p-4 aspect-video border bg-card rounded-lg hover:shadow-md transition-shadow overflow-hidden">
                              <Image
                                src={brand.imageUrl || "/placeholder.svg"}
                                alt={brand.name}
                                width={150}
                                height={84} // Tỉ lệ 16:9
                                className="object-contain w-full h-auto transition-transform group-hover:scale-110"
                              />
                            </div>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{brand.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-[-20px] sm:left-[-50px] top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-[-20px] sm:right-[-50px] top-1/2 -translate-y-1/2" />
              </Carousel>
            </TooltipProvider>
          )}
        </div>
      </section>
     

    </div>
  )
}