"use client"

import { useWishlist } from "@/hooks/use-wishlist"
import { useAuth } from "@/hooks/use-auth"
import { products } from "@/lib/products"
import { ProductCard } from "@/components/store/product-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function WishlistPage() {
  const { wishlist, isLoaded } = useWishlist()
  const { isLoggedIn, isLoaded: authLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoaded && !isLoggedIn) {
      router.push("/")
    }
  }, [authLoaded, isLoggedIn, router])

  if (!authLoaded || !isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isLoggedIn) {
    return null
  }

  const wishlistProducts = products.filter((p) => wishlist.some((w) => w.productId === p.id))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Heart className="w-8 h-8 fill-destructive text-destructive" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground">
            {wishlistProducts.length} item{wishlistProducts.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Start adding items to your wishlist!</p>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
