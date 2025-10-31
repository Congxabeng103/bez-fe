"use client";

import { useState, useEffect, Suspense } from "react"; 
import Image from "next/image";
import { Star, ShoppingCart, Heart, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth"; // (Dùng hook giả lập đã sửa)
import { useReviews } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { ReviewForm } from "@/components/store/review-form";
import { ProductReviews } from "@/components/store/product-reviews";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
// Import DTOs thật
import { ProductResponseDTO, ProductDetailResponseDTO } from "@/types/productDTO"; 
import { VariantResponseDTO } from "@/types/variantDTO"; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Component Con (để dùng useParams)
function ProductDetailContent() {
  const params = useParams();
  const id = params.id as string;

  // --- State cho dữ liệu thật ---
  const [productData, setProductData] = useState<ProductDetailResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // ---

  // State cho Variant
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, number>>({});
  const [selectedVariant, setSelectedVariant] = useState<VariantResponseDTO | null>(null); 
  const [isFindingVariant, setIsFindingVariant] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist, isLoaded: wishlistLoaded } = useWishlist();
  const { user, isLoggedIn, isLoaded: authLoaded } = useAuth(); // Dùng hook giả lập
  const { getProductReviews, hasUserReviewed, isLoaded: reviewsLoaded } = useReviews();
  const [reviewsRefresh, setReviewsRefresh] = useState(0);

  // --- Logic Fetch Dữ liệu thật ---
  useEffect(() => {
    if (!id) return;

    const fetchProductDetail = async () => {
      setIsLoading(true);
      try {
        // 1. Gọi API Lấy chi tiết (đã tạo ở Backend)
        const response = await fetch(`${API_URL}/v1/products/detail/${id}`); 
        if (!response.ok) throw new Error("Không tìm thấy sản phẩm (404)");
        
        const result = await response.json();
        if (result.status !== 'SUCCESS') throw new Error(result.message);
        
        const data: ProductDetailResponseDTO = result.data;
        setProductData(data);
        
        // 2. Set giá trị thuộc tính mặc định (ví dụ: chọn giá trị đầu tiên)
        const defaultAttributes: Record<string, number> = {};
        data.attributes.forEach(attr => {
          if (attr.values.length > 0) {
            defaultAttributes[attr.name] = attr.values[0].id;
          }
        });
        setSelectedAttributes(defaultAttributes);

      } catch (err: any) {
        toast.error(err.message);
        setProductData(null); // Set = null nếu lỗi
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductDetail();
  }, [id]);

  // --- Logic Tìm Biến thể (Variant) ---
  useEffect(() => {
    // Nếu chưa có data sản phẩm hoặc chưa chọn đủ thuộc tính -> Reset
    if (!productData || Object.keys(selectedAttributes).length < productData.attributes.length) {
      setSelectedVariant(null);
      return;
    }

    const findVariant = async () => {
      setIsFindingVariant(true);
      const attributeValueIds = Object.values(selectedAttributes);
      
      try {
        // 2. Gọi API Tìm Variant (API này bạn cần tự tạo ở Backend)
        const response = await fetch(`${API_URL}/v1/variants/find?productId=${id}&valueIds=${attributeValueIds.join(',')}`);
        
        if (response.status === 404) { // Không tìm thấy
            setSelectedVariant(null); // Reset
            toast.error("Biến thể này không tồn tại (vd: Size L, Đỏ)");
            return;
        }
        if (!response.ok) throw new Error("Lỗi khi tìm biến thể");
        
        const result = await response.json();
        if (result.status === 'SUCCESS') {
            setSelectedVariant(result.data); // Lưu variant tìm được
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
  // ---

  // Hiển thị Loading
  if (isLoading || !authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Không tìm thấy sản phẩm
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
  
  // Sửa: Gán product từ state
  const { product, relatedProducts, attributes } = productData;

  // --- SỬA LOGIC GIÁ BÁN (Dòng 141) ---
  const isVariantSelected = !!selectedVariant;

  // (Lấy giá của đối tượng đang được chọn)
  const basePrice = isVariantSelected ? selectedVariant.price : product.price; 
  const salePrice = isVariantSelected ? selectedVariant.salePrice : product.salePrice;
  const isPromoValid = isVariantSelected ? selectedVariant.isPromotionStillValid : product.isPromotionStillValid;

  // (Quyết định giá hiển thị)
  const displayPrice = (isPromoValid && salePrice != null) ? salePrice : basePrice;
  const displayOriginalPrice = (isPromoValid && salePrice != null) ? basePrice : null; // (Giá gốc để gạch đi)

  const displayImage = selectedVariant?.imageUrl ?? product.imageUrl;
  const displayStock = selectedVariant?.stockQuantity ?? 0;
  const isOutOfStock = (selectedVariant === null && productData.attributes.length > 0) || (selectedVariant !== null && displayStock === 0); 
  // --- KẾT THÚC SỬA LOGIC GIÁ ---

  // --- SỬA LỖI 'selected' ---
  const handleAddToCart = () => {
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

    // Helper function để lấy tên ("M", "Đỏ") từ ID (4, 1)
    const getAttributeValueName = (attrName: string) => {
        const attr = attributes.find(a => a.name === attrName);
        if (!attr) return "";
        const valueId = selectedAttributes[attrName];
        return attr.values.find(v => v.id === valueId)?.value || "";
    };

    addToCart({
      id: String(selectedVariant.id), // ID của BIẾN THỂ
      name: product.name,
      price: displayPrice, // (Dùng giá đã tính)
      image: displayImage,
      quantity,
      size: getAttributeValueName("Size"), // Sửa: Lấy tên Size
      color: getAttributeValueName("Color"), // Sửa: Lấy tên Color
      selected: true, // <-- ĐÃ SỬA
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };
  // ---

  const handleWishlistToggle = () => {
    if (wishlistLoaded) {
      if (isInWishlist(String(product.id))) {
        removeFromWishlist(String(product.id));
      } else {
        addToWishlist(String(product.id));
      }
    }
  };

  const productReviews = getProductReviews(String(product.id));
  const userHasReviewed = user ? hasUserReviewed(String(product.id), user.id) : false;
  const productRating = 4.5; // (Dữ liệu giả)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Product Detail */}
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

          {/* Product Info (Sửa: Dùng DTO thật) */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">{product.categoryName}</p>
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                {/* (Rating) */}
                <div className="flex items-center gap-4 mb-6">
                  {/* ... (Code Rating) ... */}
                </div>
                
                {/* --- SỬA HIỂN THỊ GIÁ (Dòng 267) --- */}
                {/* Price (Hiển thị giá Sale nếu có) */}
                {displayOriginalPrice ? (
                  <div className="flex items-baseline gap-3 mb-6">
                      <p className="text-4xl font-bold text-destructive">{displayPrice.toLocaleString('vi-VN')}₫</p>
                      <p className="text-2xl font-medium text-muted-foreground line-through">{displayOriginalPrice.toLocaleString('vi-VN')}₫</p>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-primary mb-6">{displayPrice.toLocaleString('vi-VN')}₫</p>
                )}
                {/* --- KẾT THÚC SỬA --- */}

                <p className="text-muted-foreground mb-8">{product.description}</p>
              </div>

              {/* --- SỬA: LỰA CHỌN BIẾN THỂ (ATTRIBUTE) --- */}
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
              
              {/* Quantity Selection */}
              <div className="mb-8">
                {/* ... (Code nút +/-) ... */}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isFindingVariant} // (Disable nếu hết hàng)
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isFindingVariant ? "Đang kiểm tra..." : isOutOfStock ? "Hết hàng" : isAdded ? "Đã thêm!" : "Thêm vào giỏ"}
              </Button>
              {/* ... (Nút Wishlist) ... */}
            </div>
          </div>
        </div>

        <div className="mb-16">
          {/* ... (Code Customer Reviews) ... */}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            {/* ... (Code Related Products) ... */}
          </section>
        )}
      </div>
    </div>
  );
}

// Component Gốc (Bọc trong Suspense)
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