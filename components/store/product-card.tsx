// (path: components/store/product-card.tsx)
"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, Heart } from "lucide-react" // Đã xóa ShoppingCart
// Đã xóa import Button và useCart để tránh lỗi
import { useWishlist } from "@/hooks/use-wishlist"
import { toast } from "sonner"
import { ProductResponseDTO } from "@/types/productDTO";

interface ProductCardProps {
  product: ProductResponseDTO
}

export function ProductCard({ product }: ProductCardProps) {
  // Đã xóa const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()

  // Đã xóa hàm handleAddToCart gây lỗi

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault() // Ngăn Link chạy khi bấm tim
    const idStr = String(product.id);
    if (isInWishlist(idStr)) {
      removeFromWishlist(idStr)
      toast.success("Đã xóa khỏi danh sách yêu thích")
    } else {
      addToWishlist(idStr)
      toast.success("Đã thêm vào danh sách yêu thích")
    }
  }
  
  const productRating = 4.5; 

  return (
    <Link href={`/products/${product.id}`} className="group relative block overflow-hidden rounded-lg bg-card border border-border shadow-sm hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.imageUrl || "/placeholder.svg"}
          alt={product.name}
          width={300}
          height={300}
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
        />
        
        {/* Nút Yêu thích */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 bg-background/80 rounded-full backdrop-blur-sm transition hover:bg-background z-10"
        >
          <Heart className={`w-5 h-5 ${isInWishlist(String(product.id)) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}/>
        </button>

        {/* Giá Sale (nếu có) */}
        {product.salePrice != null && product.salePrice < product.price && (
            <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
                SALE
            </div>
        )}
      </div>
      
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.categoryName}</p>
        <h3 className="text-base font-semibold mb-2 truncate" title={product.name}>
          {product.name}
        </h3>

        {/* Hiển thị Giá */}
        {product.salePrice != null && product.salePrice < product.price ? (
            <div className="flex items-baseline gap-2">
                <p className="font-bold text-lg text-destructive">{product.salePrice.toLocaleString('vi-VN')}₫</p>
                <p className="text-sm text-muted-foreground line-through">{product.price.toLocaleString('vi-VN')}₫</p>
            </div>
        ) : (
            <p className="font-bold text-lg text-foreground">{product.price.toLocaleString('vi-VN')}₫</p>
        )}
        
        {/* Footer: Chỉ còn Rating, nút Add to Cart đã bị xóa */}
        <div className="flex items-center mt-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium">{productRating}</span> 
            <span className="text-sm text-muted-foreground ml-1">(0 đánh giá)</span> 
          </div>
        </div>
      </div>
    </Link>
  )
}