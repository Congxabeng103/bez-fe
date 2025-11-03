// (path: app/(routes)/product/[id]/page.tsx)

"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { Star, ShoppingCart, Heart, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart"; 
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuthStore } from "@/lib/authStore"; // (Store auth của bạn)
import { useReviews } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { ReviewForm } from "@/components/store/review-form";
import { ProductReviews } from "@/components/store/product-reviews";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ProductResponseDTO, ProductDetailResponseDTO } from "@/types/productDTO";
import { VariantResponseDTO } from "@/types/variantDTO";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Component Con (để dùng useParams)
function ProductDetailContent() {
  const params = useParams();
  const id = params.id as string;

  const [productData, setProductData] = useState<ProductDetailResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, number>>({});
  const [selectedVariant, setSelectedVariant] = useState<VariantResponseDTO | null>(null);
  const [isFindingVariant, setIsFindingVariant] = useState(false);

  const [quantity, setQuantity] = useState(1);
  
  // SỬA: Thêm state hydrated
  const [hydrated, setHydrated] = useState(false);

  const { addToCart, isMutating: isCartMutating } = useCart(); 
  const { isInWishlist, addToWishlist, removeFromWishlist, isLoaded: wishlistLoaded } = useWishlist();
  
  // SỬA: Không lấy isLoaded từ store này
  // const { isLoaded: authLoaded } = useAuthStore(); 
  const { getProductReviews, hasUserReviewed, isLoaded: reviewsLoaded } = useReviews();

  // SỬA: Thêm useEffect để set hydrated
  useEffect(() => {
    setHydrated(true);
  }, []);

  // --- Logic Fetch Dữ liệu (Giữ nguyên) ---
  useEffect(() => {
    if (!id) return;
    const fetchProductDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/v1/products/detail/${id}`);
        if (!response.ok) throw new Error("Không tìm thấy sản phẩm (404)");
        
        const result = await response.json();
        if (result.status !== 'SUCCESS') throw new Error(result.message);
        
        const data: ProductDetailResponseDTO = result.data;
        setProductData(data);
        
        const defaultAttributes: Record<string, number> = {};
        data.attributes.forEach(attr => {
          if (attr.values.length > 0) {
            defaultAttributes[attr.name] = attr.values[0].id;
          }
        });
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

  // --- Logic Tìm Biến thể (Giữ nguyên) ---
  useEffect(() => {
    if (!productData || Object.keys(selectedAttributes).length < productData.attributes.length) {
      setSelectedVariant(null);
      return;
    }
    const findVariant = async () => {
      setIsFindingVariant(true);
      const attributeValueIds = Object.values(selectedAttributes);
      try {
        const response = await fetch(`${API_URL}/v1/variants/find?productId=${id}&valueIds=${attributeValueIds.join(',')}`);
        if (response.status === 404) {
          setSelectedVariant(null);
          toast.error("Biến thể này không tồn tại");
          return;
        }
        if (!response.ok) throw new Error("Lỗi khi tìm biến thể");
        
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          setSelectedVariant(result.data);
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
  }, [id, selectedAttributes, productData]);

  // --- SỬA: Hiển thị Loading ---
  if (isLoading || !hydrated) { // Chờ hydrated
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // --- Không tìm thấy sản phẩm (Giữ nguyên) ---
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

  // --- Logic giá bán (Giữ nguyên) ---
  const isVariantSelected = !!selectedVariant;
  const basePrice = isVariantSelected ? selectedVariant.price : product.price; 
  const salePrice = isVariantSelected ? selectedVariant.salePrice : product.salePrice;
  const isPromoValid = isVariantSelected ? selectedVariant.isPromotionStillValid : product.isPromotionStillValid;
  const displayPrice = (isPromoValid && salePrice != null) ? salePrice : basePrice;
  const displayOriginalPrice = (isPromoValid && salePrice != null) ? basePrice : null;
  const displayImage = selectedVariant?.imageUrl ?? product.imageUrl;
  const displayStock = selectedVariant?.stockQuantity ?? 0;
  const isOutOfStock = (selectedVariant === null && productData.attributes.length > 0) || (selectedVariant !== null && displayStock === 0); 
  // --- KẾT THÚC LOGIC GIÁ ---

  // --- SỬA HÀM ADD TO CART ---
  const handleAddToCart = async () => { // 1. Thêm async
    if (isFindingVariant) {
      toast.error("Đang kiểm tra kho, vui lòng đợi...");
      return;
    }
    if (isOutOfStock) {
      toast.error("Biến thể này đã hết hàng!");
      return;
    }
    if (!selectedVariant?.id) {
      toast.error("Vui lòng chọn đầy đủ thuộc tính");
      return;
    }

    // 2. Gọi hook mới
    await addToCart(selectedVariant.id, quantity);
  };
  // --- KẾT THÚC SỬA ---

  const handleWishlistToggle = () => { /* ... */ };
  const productReviews = getProductReviews(String(product.id));
  const productRating = 4.5; // (Dữ liệu giả)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb (Giữ nguyên) */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Product Detail (Giữ nguyên) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Product Image */}
          <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden aspect-square">
            <Image
              src={displayImage || "/placeholder.svg"}
              alt={product.name}
              width={500} height={500}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">{product.categoryName}</p>
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                <div className="flex items-center gap-4 mb-6">
                  {/* ... (Rating) ... */}
                </div>
                
                {/* Hiển thị giá (Giữ nguyên) */}
                {displayOriginalPrice ? (
                  <div className="flex items-baseline gap-3 mb-6">
                      <p className="text-4xl font-bold text-destructive">{displayPrice.toLocaleString('vi-VN')}₫</p>
                      <p className="text-2xl font-medium text-muted-foreground line-through">{displayOriginalPrice.toLocaleString('vi-VN')}₫</p>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-primary mb-6">{displayPrice.toLocaleString('vi-VN')}₫</p>
                )}
                <p className="text-muted-foreground mb-8">{product.description}</p>
              </div>

              {/* Lựa chọn biến thể (Giữ nguyên) */}
              {attributes.map((attr) => (
                <div className="mb-6" key={attr.id}>
                  <label className="block text-sm font-semibold mb-3">{attr.name}</label>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((value) => (
                      <button
                        key={value.id}
                        onClick={() => setSelectedAttributes(prev => ({
                            ...prev,
                            [attr.name]: value.id
                        }))}
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
              
              {/* Quantity Selection (Giữ nguyên) */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3">Số lượng</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                    disabled={quantity <= 1}
                  > - </button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock || quantity >= displayStock}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                  > + </button>
                  <span className="text-sm text-muted-foreground">
                    {isFindingVariant ? "Đang kiểm tra..." : isOutOfStock ? "Hết hàng" : `(Còn ${displayStock} sản phẩm)`}
                  </span>
                </div>
              </div>
            </div>

            {/* --- SỬA NÚT ACTION --- */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isFindingVariant || isCartMutating} // Thêm isCartMutating
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isFindingVariant ? "Đang kiểm tra..." : 
                 isCartMutating ? "Đang thêm..." : 
                 isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
              </Button>
              {/* ... (Nút Wishlist) ... */}
            </div>
            {/* --- KẾT THÚC SỬA --- */}
          </div>
        </div>

        {/* ... (Reviews và Related Products giữ nguyên) ... */}
      </div>
    </div>
  );
}

// Component Gốc (Giữ nguyên)
export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ProductDetailContent />
    </Suspense>
  );
}