"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { products } from "@/lib/products"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useAuth } from "@/hooks/use-auth"
import { useReviews } from "@/hooks/use-reviews"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/store/product-card"
import { ReviewForm } from "@/components/store/review-form"
import { ProductReviews } from "@/components/store/product-reviews"
import Link from "next/link"
import { useParams } from "next/navigation" // <-- 1. IMPORT HOOK
export default function ProductDetailPage() {
  const params = useParams() // <-- 3. SỬ DỤNG HOOK
  const id = params.id as string // Lấy id từ params

  // 4. SỬ DỤNG 'id' ĐÃ LẤY
  const product = products.find((p) => p.id === id) 
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] || "")
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] || "")
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist, isLoaded: wishlistLoaded } = useWishlist()
  const { user, isLoggedIn } = useAuth()
  const { getProductReviews, hasUserReviewed, isLoaded: reviewsLoaded } = useReviews()
  const [reviewsRefresh, setReviewsRefresh] = useState(0)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
       price: product.price,
      image: product.image,
      quantity,
      size: selectedSize,
      color: selectedColor,
      selected: true, // <-- THÊM DÒNG NÀY
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleWishlistToggle = () => {
    if (wishlistLoaded) {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id)
      } else {
        addToWishlist(product.id)
      }
    }
  }

  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
  const productReviews = getProductReviews(product.id)
  const userHasReviewed = user ? hasUserReviewed(product.id, user.id) : false

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
          {/* Product Image */}
          <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden aspect-square">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(product.rating) ? "fill-primary text-primary" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-muted-foreground">({productReviews.length} reviews)</span>
                </div>

                {/* Price */}
                <p className="text-4xl font-bold text-primary mb-6">${product.price.toFixed(2)}</p>

                {/* Description */}
                <p className="text-muted-foreground mb-8">{product.description}</p>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg transition ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">Color</label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border rounded-lg transition ${
                        selectedColor === color
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isAdded ? "Added to Cart!" : "Add to Cart"}
              </Button>
              <Button onClick={handleWishlistToggle} variant="outline" className="px-6 py-6 bg-transparent">
                <Heart
                  className={`w-5 h-5 ${
                    wishlistLoaded && isInWishlist(product.id) ? "fill-destructive text-destructive" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Customer Reviews</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ProductReviews productId={product.id} />
            </div>

            {/* Review Form */}
            <div>
              {isLoggedIn && user && !userHasReviewed && reviewsLoaded ? (
                <ReviewForm
                  productId={product.id}
                  userId={user.id}
                  userName={user.name}
                  isLoggedIn={isLoggedIn} // <-- THÊM DÒNG NÀY
                  onReviewAdded={() => setReviewsRefresh((prev) => prev + 1)}
                />
              ) : isLoggedIn && userHasReviewed ? (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">You have already reviewed this product</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground mb-4">Sign in to write a review</p>
                  <Link href="/">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
