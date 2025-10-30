"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { Star, Heart } from "lucide-react"
import { useState } from "react"
import { useWishlist } from "@/hooks/use-wishlist"
import type { Product } from "@/lib/products"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist, isLoaded } = useWishlist()
  const [isFavorited, setIsFavorited] = useState(false)

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isFavorited) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
    setIsFavorited(!isFavorited)
  }

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group cursor-pointer relative">
        {isLoaded && (
          <button
            onClick={handleWishlistClick}
            className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-muted transition"
          >
            <Heart
              className={`w-5 h-5 transition ${
                isFavorited || isInWishlist(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground"
              }`}
            />
          </button>
        )}

        <div className="relative overflow-hidden rounded-lg bg-muted aspect-square mb-4">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition mb-2 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{product.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  )
}
