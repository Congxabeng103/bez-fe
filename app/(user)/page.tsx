"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Truck, ShieldCheck, Headset } from "lucide-react";
import { toast } from "sonner";
import { translations as t } from "@/lib/translations";

import { ProductCard } from "@/components/store/product-card";
import { CampaignSlider } from "@/components/store/campaign-slider"; 
import { VoucherList } from "@/components/store/voucher-list"; 

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

  // (Các hàm fetch khác giữ nguyên)
  const fetchFeaturedProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    const url = new URL(`${API_URL}/v1/products`);
    url.searchParams.append("page", "0");
    url.searchParams.append("size", "8");
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

  
  // (SỬA HÀM NÀY)
  const fetchPublicCoupons = useCallback(async () => {
    setIsLoadingCoupons(true);
    // (SỬA) Gọi API lấy TẤT CẢ voucher
    const url = new URL(`${API_URL}/v1/coupons/public/all`);
    // (Xóa dòng 'url.searchParams.append("size", "3")')
    
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

  // (Phần return giữ nguyên)
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

      {/* Trust Banner */}
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

      {/* Campaign Slider Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isLoadingPromotion && (
          <CampaignSlider promotions={promotions} />
        )}
      </section>

      {/* Voucher List Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {!isLoadingCoupons && (
          <VoucherList coupons={coupons} />
        )}
      </section>

      {/* (Các section còn lại: Hàng Mới Về, Categories, Brands, Newsletter giữ nguyên) */}
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

      <section className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.shopByCategory}</h2>
          {isLoadingCategories ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group relative overflow-hidden rounded-lg h-48 bg-primary flex items-center justify-center hover:shadow-lg transition"
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
                  <h3 className="text-2xl font-bold text-primary-foreground relative z-10">{category.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Thương Hiệu Nổi Bật</h2>
          {isLoadingBrands ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${encodeURIComponent(brand.name)}`}
                  className="group flex items-center justify-center p-6 border border-border rounded-lg hover:shadow-md transition-shadow"
                >
                  <span className="text-lg font-semibold text-muted-foreground group-hover:text-foreground">
                    {brand.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

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