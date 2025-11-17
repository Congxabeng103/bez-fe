// (path: app/(routes)/product/[id]/page.tsx)
"use client";

// SỬA: Thêm React, useRef
import React, { useState, useEffect, Suspense, useRef } from "react";
import Image from "next/image";
import { Star, ShoppingCart, Heart, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuthStore } from "@/lib/authStore";
import { useReviews } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { ReviewForm } from "@/components/store/review-form";
import { ProductReviews } from "@/components/store/product-reviews";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

// SỬA: Import thêm 'ProductImage' từ file types của bạn
import {
  ProductResponseDTO,
  ProductDetailResponseDTO,
  ProductImage,
  AttributeData, // Đảm bảo bạn đã export type này
} from "@/types/productDTO";
import { VariantResponseDTO } from "@/types/variantDTO";

// SỬA: Import Carousel
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"; // SỬA: Import Autoplay

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// SỬA: Định nghĩa kiểu cho ảnh trong gallery (để gộp ảnh bìa, ảnh gallery, ảnh variant)
interface GalleryItem {
  id: string; // id duy nhất (product-id, gallery-id, variant-id)
  url: string;
}

// Component Con (để dùng useParams)
function ProductDetailContent() {
  const params = useParams();
  const id = params.id as string;

  const [productData, setProductData] = useState<ProductDetailResponseDTO | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, number>
  >({});
  const [selectedVariant, setSelectedVariant] =
    useState<VariantResponseDTO | null>(null);
  const [isFindingVariant, setIsFindingVariant] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  // SỬA: Thêm state cho Carousel
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // SỬA: Thêm plugin Autoplay
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  const { addToCart, isMutating: isCartMutating } = useCart();
  const {
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    isLoaded: wishlistLoaded,
  } = useWishlist();
  const { getProductReviews, hasUserReviewed, isLoaded: reviewsLoaded } =
    useReviews();

  useEffect(() => {
    setHydrated(true);
  }, []);

  // --- Logic Fetch Dữ liệu (SỬA: để build gallery) ---
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

        // SỬA: Xây dựng Gallery ban đầu
        const initialGallery: GalleryItem[] = [];
        const seenUrls = new Set<string>(); // Dùng để lọc ảnh trùng

        // 1. Thêm ảnh bìa (cover image) của sản phẩm
        if (data.product.imageUrl) {
          initialGallery.push({
            id: `product-${data.product.id}`,
            url: data.product.imageUrl,
          });
          seenUrls.add(data.product.imageUrl);
        }

        // 2. Thêm các ảnh từ album (galleryImages)
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

        // 3. Nếu không có ảnh nào, dùng placeholder
        if (initialGallery.length === 0) {
          initialGallery.push({ id: "placeholder", url: "/placeholder.svg" });
        }

        setGalleryItems(initialGallery);

        // Logic set thuộc tính mặc định
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

  // --- Logic Tìm Biến thể (SỬA: để cập nhật gallery) ---
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
          `${API_URL}/v1/variants/find?productId=${id}&valueIds=${attributeValueIds.join(
            ","
          )}`
        );
        if (response.status === 404) {
          setSelectedVariant(null);
          toast.error("Biến thể này không tồn tại");
          return;
        }
        if (!response.ok) throw new Error("Lỗi khi tìm biến thể");

        const result = await response.json();
        if (result.status === "SUCCESS") {
          const variant: VariantResponseDTO = result.data;
          setSelectedVariant(variant);

          // SỬA: Cập nhật gallery khi tìm thấy biến thể
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
                // Nếu đã có, di chuyển nó lên đầu
                const item = prevGallery[existingIndex];
                const rest = prevGallery.filter((_, i) => i !== existingIndex);
                // Cuộn carousel về ảnh đầu tiên (ảnh biến thể)
                carouselApi?.scrollTo(0, true); // true = no animation
                return [item, ...rest];
              } else {
                // Nếu là ảnh mới, thêm vào đầu
                carouselApi?.scrollTo(0, true); // true = no animation
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
    // SỬA: Thêm carouselApi vào dependency
  }, [id, selectedAttributes, productData, carouselApi]);

  // SỬA: Effect để sync carousel
  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    setCurrentSlide(carouselApi.selectedScrollSnap());
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // --- Hiển thị Loading ---
  if (isLoading || !hydrated) {
    // Chờ hydrated
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // --- Không tìm thấy sản phẩm ---
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

  const { product, relatedProducts, attributes } = productData;

  // --- Logic giá bán ---
  const isVariantSelected = !!selectedVariant;
  const basePrice = isVariantSelected ? selectedVariant.price : product.price;
  const salePrice = isVariantSelected
    ? selectedVariant.salePrice
    : product.salePrice;
  const isPromoValid = isVariantSelected
    ? selectedVariant.isPromotionStillValid
    : product.isPromotionStillValid;
  const displayPrice = isPromoValid && salePrice != null ? salePrice : basePrice;
  const displayOriginalPrice =
    isPromoValid && salePrice != null ? basePrice : null;
  const displayStock = selectedVariant?.stockQuantity ?? 0;
  
  // (Đã sửa logic isOutOfStock)
  const isOutOfStock =
    (productData.attributes.length > 0 && !selectedVariant) ||
    (selectedVariant !== null && displayStock === 0);
  // --- KẾT THÚC LOGIC GIÁ ---

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

    // ⭐ BỌC TRONG TRY...CATCH
    try {
      // 1. Chờ cho hook chạy xong
      await addToCart(selectedVariant.id, quantity);
      
      // 2. Chỉ báo thành công nếu hook không ném lỗi
      toast.success("Đã thêm vào giỏ hàng thành công!");

    } catch (err: any) {
      // 3. Bắt lỗi (từ BE hoặc từ hook) và hiển thị
      // err.message sẽ là "Bạn vui lòng đăng nhập lại"
      // hoặc "Hết hàng"
      toast.error(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* ======================================= */}
          {/* SỬA: KHỐI ẢNH ĐÃ SỬA LỖI VÀ TỐI ƯU */}
          <div className="flex flex-col gap-4 sticky top-20">
            {/* Ảnh chính (Carousel chính) */}
            <Carousel
              setApi={setCarouselApi} // Lấy API để điều khiển
              // 🔥 TỐI ƯU: Chỉ 'autoplay' khi có nhiều hơn 1 ảnh
              plugins={galleryItems.length > 1 ? [autoplayPlugin.current] : []}
              // Tắt các nút bấm khi chỉ có 1 ảnh
              opts={{
                loop: galleryItems.length > 1,
              }}
              className="w-full"
              onMouseEnter={autoplayPlugin.current.stop} // Dừng khi hover
              onMouseLeave={autoplayPlugin.current.reset} // Chạy lại khi rời
            >
              <CarouselContent>
                {galleryItems.map((image, index) => (
                  <CarouselItem key={image.id}>
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={`${product.name} - ảnh ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0} // Ưu tiên load ảnh đầu tiên
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* 🔥 TỐI ƯU: Chỉ hiện nút Prev/Next khi có nhiều hơn 1 ảnh */}
              {galleryItems.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex" />
                  <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex" />
                </>
              )}
            </Carousel>

            {/* Ảnh nhỏ (Thumbnails) - Chỉ hiện khi có nhiều hơn 1 ảnh */}
            {galleryItems.length > 1 && (
              <Carousel
                opts={{
                  align: "start",
                  dragFree: true,
                  containScroll: "trimSnaps",
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {galleryItems.map((image, index) => (
                    <CarouselItem
                      key={image.id}
                      className="pl-2 basis-1/4 md:basis-1/5 lg:basis-1/6"
                    >
                      <button
                        onClick={() => carouselApi?.scrollTo(index)} // Click để chuyển ảnh
                        className={`block aspect-square rounded-md overflow-hidden border-2
                          ${
                            index === currentSlide
                              ? "border-primary"
                              : "border-transparent"
                          }
                          opacity-${index === currentSlide ? "100" : "60"}
                          hover:opacity-100 transition-all
                        `}
                      >
                        <Image
                          src={image.url}
                          alt={`Thumbnail ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}
          </div>
          {/* KẾT THÚC KHỐI ẢNH */}
          {/* ======================================= */}

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {product.brandName}
                  {product.brandName && product.categoryName && " • "}
                  {product.categoryName}
                </p>
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                <div className="flex items-center gap-4 mb-6">
                  {/* ... (Rating) ... */}
                </div>

                {/* Hiển thị giá */}
                {displayOriginalPrice ? (
                  <div className="flex items-baseline gap-3 mb-6">
                    <p className="text-4xl font-bold text-destructive">
                      {displayPrice.toLocaleString("vi-VN")}₫
                    </p>
                    <p className="text-2xl font-medium text-muted-foreground line-through">
                      {displayOriginalPrice.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-primary mb-6">
                    {displayPrice.toLocaleString("vi-VN")}₫
                  </p>
                )}
                <p className="text-muted-foreground mb-8">
                  {product.description}
                </p>
              </div>

              {/* Lựa chọn biến thể (SỬA: thêm kiểm tra null) */}
              {attributes &&
                attributes.map((attr: AttributeData) => (
                  <div className="mb-6" key={attr.id}>
                    <label className="block text-sm font-semibold mb-3">
                      {attr.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((value) => (
                        <button
                          key={value.id}
                          onClick={() =>
                            setSelectedAttributes((prev) => ({
                              ...prev,
                              [attr.name]: value.id,
                            }))
                          }
                          className={`px-4 py-2 border rounded-lg transition ${
                            selectedAttributes[attr.name] === value.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          {value.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Quantity Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3">
                  Số lượng
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                    disabled={quantity <= 1}
                  >
                    {" "}
                    -{" "}
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={
                      isOutOfStock ||
                      !!(selectedVariant && quantity >= displayStock)
                    }
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                  >
                    {" "}
                    +{" "}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {isFindingVariant
                      ? "Đang kiểm tra..."
                      : isOutOfStock
                      ? "Hết hàng / Chưa chọn"
                      : `(Còn ${displayStock} sản phẩm)`}
                  </span>
                </div>
              </div>
            </div>

            {/* --- NÚT ACTION --- */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isFindingVariant || isCartMutating}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isFindingVariant
                  ? "Đang kiểm tra..."
                  : isCartMutating
                  ? "Đang thêm..."
                  : isOutOfStock
                  ? "Hết hàng / Chọn thuộc tính"
                  : "Thêm vào giỏ"}
              </Button>

              
            </div>
            {/* --- KẾT THÚC NÚT ACTION --- */}
          </div>
        </div>

        {/* ... (Reviews và Related Products giữ nguyên) ... */}
        {/* Bạn có thể đặt component ReviewForm và ProductReviews ở đây */}
      </div>
    </div>
  );
}

// Component Gốc (Giữ nguyên)
export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}