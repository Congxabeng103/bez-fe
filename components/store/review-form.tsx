"use client"

import type React from "react"

import { useState } from "react"
import { useReviews } from "@/hooks/use-reviews"
import { useOrders } from "@/hooks/use-orders"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { translations as t } from "@/lib/translations"

interface ReviewFormProps {
  productId: string
  userId: string
  userName: string
  isLoggedIn: boolean
  onReviewAdded?: () => void
}

export function ReviewForm({ productId, userId, userName, isLoggedIn, onReviewAdded }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addReview, hasUserReviewed } = useReviews()
  const { hasUserPurchasedProduct } = useOrders()

  const canReview = isLoggedIn && hasUserPurchasedProduct(userId, productId)
  const alreadyReviewed = hasUserReviewed(productId, userId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canReview) return

    setIsSubmitting(true)

    try {
      addReview({
        productId,
        userId,
        userName,
        rating,
        title,
        comment,
      })

      setRating(5)
      setTitle("")
      setComment("")
      onReviewAdded?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-muted-foreground">{t.pleaseLoginToReview}</p>
      </div>
    )
  }

  if (!canReview) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-muted-foreground">{t.canOnlyReviewAfterPurchase}</p>
      </div>
    )
  }

  if (alreadyReviewed) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-muted-foreground">{t.youHaveAlreadyReviewed}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">{t.writeReview}</h3>

      <div>
        <label className="block text-sm font-medium mb-2">{t.rating}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} className="transition">
              <Star className={`w-6 h-6 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t.reviewTitle}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tóm tắt đánh giá của bạn"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t.reviewComment}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này"
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Đang gửi..." : t.submitReview}
      </Button>
    </form>
  )
}
