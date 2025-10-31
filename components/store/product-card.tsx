"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { toast } from "sonner"
// 1. Import DTO thật (Giả sử bạn tạo file types/productDTO.ts)
import { ProductResponseDTO } from "@/types/productDTO"; 

// 2. Sửa: Dùng ProductResponseDTO
interface ProductCardProps {
  product: ProductResponseDTO
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()

  // 3. Sửa: Thêm 'selected: true'
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault() // Ngăn Link chạy
    addToCart({
      id: String(product.id),
      name: product.name,
      price: product.salePrice ?? product.price, // Dùng giá sale (nếu có)
      image: product.imageUrl,
      quantity: 1,
      size: "default", // (Trang list không chọn size/color)
      color: "default",
      selected: true, // <-- SỬA LỖI Ở ĐÂY
    })
    toast.success(`${product.name} đã được thêm vào giỏ hàng!`)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault() // Ngăn Link chạy
    const idStr = String(product.id);
    if (isInWishlist(idStr)) {
      removeFromWishlist(idStr)
      toast.success("Đã xóa khỏi danh sách yêu thích")
    } else {
      addToWishlist(idStr)
      toast.success("Đã thêm vào danh sách yêu thích")
    }
  }
  
  const productRating = 4.5; // (DTO list không có rating)

  return (
    <Link href={`/products/${product.id}`} className="group relative block overflow-hidden rounded-lg bg-card border border-border shadow-sm hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.imageUrl || "/placeholder.svg"} // Sửa: imageUrl
          alt={product.name}
          width={300}
          height={300}
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
        />
        {/* Nút Yêu thích */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 bg-background/80 rounded-full backdrop-blur-sm transition hover:bg-background"
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

        {/* Giá (Sửa: Dùng salePrice) */}
        {product.salePrice != null && product.salePrice < product.price ? (
            <div className="flex items-baseline gap-2">
                <p className="font-bold text-lg text-destructive">{product.salePrice.toLocaleString('vi-VN')}₫</p>
                <p className="text-sm text-muted-foreground line-through">{product.price.toLocaleString('vi-VN')}₫</p>
            </div>
        ) : (
            <p className="font-bold text-lg text-foreground">{product.price.toLocaleString('vi-VN')}₫</p>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium">{productRating}</span> 
            <span className="text-sm text-muted-foreground">(0)</span> 
          </div>
          <Button variant="outline" size="icon" className="w-9 h-9" onClick={handleAddToCart}>
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Link>
  )
}