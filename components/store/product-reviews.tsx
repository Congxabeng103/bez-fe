"use client"

import { useReviews } from "@/hooks/use-reviews"
import { Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { getProductReviews } = useReviews()
  const productReviews = getProductReviews(productId)

  if (productReviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {productReviews.map((review) => (
        <div key={review.id} className="border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{review.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                by {review.userName} • {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <p className="text-foreground">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}
