"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Image from "next/image";
import { ShoppingCart, Heart, Loader2, Check } from "lucide-react"; // Thêm Check icon
import { useCart } from "@/hooks/use-cart";
import { useAuthStore } from "@/lib/authStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation"; // Thêm useRouter
import { toast } from "sonner";

import {
  ProductDetailResponseDTO,
  AttributeData,
} from "@/types/productDTO";
import { VariantResponseDTO } from "@/types/variantDTO";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface GalleryItem {
  id: string;
  url: string;
}

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter(); // Dùng để điều hướng
  const id = params.id as string;

  const [productData, setProductData] = useState<ProductDetailResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, number>>({});
  const [selectedVariant, setSelectedVariant] = useState<VariantResponseDTO | null>(null);
  const [isFindingVariant, setIsFindingVariant] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  // State Carousel
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  const { addToCart, isMutating: isCartMutating } = useCart();
  
  // --- Wishlist Hook ---
  

  useEffect(() => {
    setHydrated(true);
  }, []);

  // 1. Fetch Product Detail & Build Gallery
  useEffect(() => {
    if (!id) return;
    const fetchProductDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/v1/products/detail/${id}`);
        if (!response.ok) throw new Error("Không tìm thấy sản phẩm (404)");

        const result = await response.json();
        if (result.status !== "SUCCESS") throw new Error(result.message);

        const data: ProductDetailResponseDTO = result.data;
        setProductData(data);

        // Build Gallery
        const initialGallery: GalleryItem[] = [];
        const seenUrls = new Set<string>();

        if (data.product.imageUrl) {
          initialGallery.push({
            id: `product-${data.product.id}`,
            url: data.product.imageUrl,
          });
          seenUrls.add(data.product.imageUrl);
        }

        if (data.galleryImages) {
          data.galleryImages.forEach((img) => {
            if (img.imageUrl && !seenUrls.has(img.imageUrl)) {
              initialGallery.push({
                id: `gallery-${img.id}`,
                url: img.imageUrl,
              });
              seenUrls.add(img.imageUrl);
            }
          });
        }

        if (initialGallery.length === 0) {
          initialGallery.push({ id: "placeholder", url: "/placeholder.svg" });
        }

        setGalleryItems(initialGallery);

        // Default Attributes
        const defaultAttributes: Record<string, number> = {};
        if (data.attributes) {
          data.attributes.forEach((attr) => {
            if (attr.values.length > 0) {
              defaultAttributes[attr.name] = attr.values[0].id;
            }
          });
        }
        setSelectedAttributes(defaultAttributes);
      } catch (err: any) {
        toast.error(err.message);
        setProductData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductDetail();
  }, [id]);

  // 2. Find Variant Logic
  useEffect(() => {
    if (
      !productData ||
      !productData.attributes ||
      Object.keys(selectedAttributes).length < productData.attributes.length
    ) {
      setSelectedVariant(null);
      return;
    }
    const findVariant = async () => {
      setIsFindingVariant(true);
      const attributeValueIds = Object.values(selectedAttributes);
      try {
        const response = await fetch(
          `${API_URL}/v1/variants/find?productId=${id}&valueIds=${attributeValueIds.join(",")}`
        );
        if (response.status === 404) {
          setSelectedVariant(null);
          // Không toast lỗi ở đây để tránh spam khi user mới click 1 thuộc tính
          return;
        }
        if (!response.ok) throw new Error("Lỗi khi tìm biến thể");

        const result = await response.json();
        if (result.status === "SUCCESS") {
          const variant: VariantResponseDTO = result.data;
          setSelectedVariant(variant);

          // Update Gallery if variant has image
          if (variant.imageUrl) {
            const variantImage: GalleryItem = {
              id: `variant-${variant.id}`,
              url: variant.imageUrl,
            };

            setGalleryItems((prevGallery) => {
              const existingIndex = prevGallery.findIndex(
                (img) => img.url === variantImage.url
              );

              if (existingIndex > -1) {
                const item = prevGallery[existingIndex];
                const rest = prevGallery.filter((_, i) => i !== existingIndex);
                carouselApi?.scrollTo(0, true);
                return [item, ...rest];
              } else {
                carouselApi?.scrollTo(0, true);
                return [variantImage, ...prevGallery];
              }
            });
          }
        } else {
          setSelectedVariant(null);
        }
      } catch (err) {
        console.error(err);
        setSelectedVariant(null);
      } finally {
        setIsFindingVariant(false);
      }
    };
    findVariant();
  }, [id, selectedAttributes, productData, carouselApi]);

  // Sync Carousel State
  useEffect(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Loading State
  if (isLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Not Found State
  if (!productData || !productData.product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { product, attributes } = productData;

  // Price & Stock Logic
  const isVariantSelected = !!selectedVariant;
  const basePrice = isVariantSelected ? selectedVariant.price : product.price;
  const salePrice = isVariantSelected ? selectedVariant.salePrice : product.salePrice;
  const isPromoValid = isVariantSelected ? selectedVariant.isPromotionStillValid : product.isPromotionStillValid;
  
  const displayPrice = isPromoValid && salePrice != null ? salePrice : basePrice;
  const displayOriginalPrice = isPromoValid && salePrice != null ? basePrice : null;
  
  const displayStock = selectedVariant?.stockQuantity ?? 0;
  const isOutOfStock = (productData.attributes.length > 0 && !selectedVariant) || 
                       (selectedVariant !== null && displayStock === 0);

  // Add to Cart Handler
  const handleAddToCart = async () => {
    if (isFindingVariant) {
      toast.error("Đang kiểm tra kho, vui lòng đợi...");
      return;
    }
    if (isOutOfStock) {
      toast.error("Biến thể này đã hết hàng hoặc chưa chọn đủ thuộc tính!");
      return;
    }
    if (!selectedVariant?.id) {
      toast.error("Vui lòng chọn đầy đủ thuộc tính");
      return;
    }

    try {
      await addToCart(selectedVariant.id, quantity);
      toast.success("Đã thêm vào giỏ hàng thành công!");
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

 

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* === LEFT COLUMN: IMAGES === */}
          <div className="flex flex-col gap-4 sticky top-20">
            <Carousel
              setApi={setCarouselApi}
              plugins={galleryItems.length > 1 ? [autoplayPlugin.current] : []}
              opts={{ loop: galleryItems.length > 1 }}
              className="w-full"
              onMouseEnter={autoplayPlugin.current.stop}
              onMouseLeave={autoplayPlugin.current.reset}
            >
              <CarouselContent>
                {galleryItems.map((image, index) => (
                  <CarouselItem key={image.id}>
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                      <Image
                        src={image.url}
                        alt={`${product.name} - ${index}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {galleryItems.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex" />
                  <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex" />
                </>
              )}
            </Carousel>

            {/* Thumbnails */}
            {galleryItems.length > 1 && (
              <Carousel
                opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {galleryItems.map((image, index) => (
                    <CarouselItem key={image.id} className="pl-2 basis-1/4 md:basis-1/5 lg:basis-1/6">
                      <button
                        onClick={() => carouselApi?.scrollTo(index)}
                        className={`relative block aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          index === currentSlide ? "border-primary opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt="Thumb"
                          fill
                          className="object-cover"
                        />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}
          </div>

          {/* === RIGHT COLUMN: INFO === */}
          <div className="flex flex-col h-full">
            <div className="flex-1">
              {/* SỬA: Làm cho Brand và Category Click được để lọc */}
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                {product.brandName && (
                  <Link 
                    href={`/products?brand=${encodeURIComponent(product.brandName)}`}
                    className="hover:text-primary hover:underline"
                  >
                    {product.brandName}
                  </Link>
                )}
                
                {product.brandName && product.categoryName && <span>•</span>}
                
                {product.categoryName && (
                  <Link 
                    href={`/products?category=${encodeURIComponent(product.categoryName)}`}
                    className="hover:text-primary hover:underline"
                  >
                    {product.categoryName}
                  </Link>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">{product.name}</h1>

              {/* Price Display */}
              <div className="mb-6">
                {displayOriginalPrice ? (
                  <div className="flex items-end gap-3">
                    <p className="text-3xl sm:text-4xl font-bold text-red-600">
                      {displayPrice.toLocaleString("vi-VN")}₫
                    </p>
                    <p className="text-xl font-medium text-muted-foreground line-through mb-1">
                      {displayOriginalPrice.toLocaleString("vi-VN")}₫
                    </p>
                    {/* Hiển thị % giảm giá */}
                     <span className="mb-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                        -{Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)}%
                     </span>
                  </div>
                ) : (
                  <p className="text-3xl sm:text-4xl font-bold text-primary">
                    {displayPrice.toLocaleString("vi-VN")}₫
                  </p>
                )}
              </div>

              <p className="text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              <div className="h-px bg-border mb-8" />

              {/* Attributes Selection */}
              {attributes && attributes.map((attr: AttributeData) => (
                <div className="mb-6" key={attr.id}>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-semibold">{attr.name}</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {attr.values.map((value) => {
                      const isSelected = selectedAttributes[attr.name] === value.id;
                      return (
                        <button
                          key={value.id}
                          onClick={() =>
                            setSelectedAttributes((prev) => ({
                              ...prev,
                              [attr.name]: value.id,
                            }))
                          }
                          className={`relative px-4 py-2 border rounded-lg text-sm font-medium transition-all
                            ${isSelected 
                              ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                              : "border-input hover:border-primary/50 hover:bg-accent"
                            }
                          `}
                        >
                          {value.value}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3">Số lượng</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-muted transition disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 hover:bg-muted transition disabled:opacity-50"
                      disabled={isOutOfStock || !!(selectedVariant && quantity >= displayStock)}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {isFindingVariant
                      ? "Đang kiểm tra..."
                      : isOutOfStock
                      ? <span className="text-red-500 font-medium">Hết hàng</span>
                      : `(Sẵn có: ${displayStock})`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-border">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isFindingVariant || isCartMutating}
                className="flex-1 h-14 text-lg font-semibold shadow-lg shadow-primary/20"
                size="lg"
              >
                {isCartMutating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                {isFindingVariant
                  ? "Đang tải..."
                  : isCartMutating
                  ? "Đang thêm..."
                  : isOutOfStock
                  ? "Hết hàng"
                  : "Thêm vào giỏ hàng"}
              </Button>

             
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}