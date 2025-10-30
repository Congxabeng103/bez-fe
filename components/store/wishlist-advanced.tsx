"use client"

import { useWishlist } from "@/hooks/use-wishlist"
import { products } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Heart, Trash2, Bell, BellOff } from "lucide-react"
import Link from "next/link"
import { translations as t } from "@/lib/translations"

export function WishlistAdvanced() {
  const { wishlist, removeFromWishlist, togglePriceAlert } = useWishlist()

  const wishlistProducts = wishlist
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId),
    }))
    .filter((item) => item.product)

  if (wishlistProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg mb-4">{t.emptyWishlist}</p>
        <Link href="/products">
          <Button>{t.continueShopping}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {wishlistProducts.map((item) => (
        <div key={item.productId} className="bg-card border border-border rounded-lg p-4 flex gap-4">
          <img
            src={item.product?.image || "/placeholder.svg"}
            alt={item.product?.name}
            className="w-24 h-24 object-cover rounded-lg"
          />

          <div className="flex-1">
            <Link href={`/products/${item.productId}`}>
              <h3 className="font-semibold hover:text-primary transition">{item.product?.name}</h3>
            </Link>
            <p className="text-primary font-bold mt-2">{item.product?.price.toLocaleString("vi-VN")}₫</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                {item.product?.rating} ⭐ ({item.product?.reviews} đánh giá)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Thêm vào: {new Date(item.addedAt).toLocaleDateString("vi-VN")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href={`/products/${item.productId}`}>
              <Button size="sm" className="w-full">
                {t.addToCart}
              </Button>
            </Link>

            <button
              onClick={() => togglePriceAlert(item.productId)}
              className={`p-2 rounded-lg transition ${
                item.priceAlert ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
              }`}
              title={item.priceAlert ? "Tắt thông báo giá" : "Bật thông báo giá"}
            >
              {item.priceAlert ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => removeFromWishlist(item.productId)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
