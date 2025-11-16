"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react" // 1. Đã xóa Star
import { useWishlist } from "@/hooks/use-wishlist"
import { toast } from "sonner"
import { ProductResponseDTO } from "@/types/productDTO";

interface ProductCardProps {
  product: ProductResponseDTO
}

export function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()

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
  
  // 2. Đã xóa mock data 'productRating'

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
        
        {/* 3. Đã xóa phần Rating và thay bằng 1 div giữ chỗ */}
        <div className="mt-3 h-5">
          {/* Trống - Dùng để giữ chiều cao card đồng đều */}
        </div>
      </div>
    </Link>
  )
}