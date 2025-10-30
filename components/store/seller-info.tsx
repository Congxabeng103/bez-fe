"use client"

import { useSellerRating } from "@/hooks/use-seller-rating"
import { Star, Users, Clock, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SellerInfoProps {
  sellerId: string
  onFollowClick?: () => void
  isFollowing?: boolean
}

export function SellerInfo({ sellerId, onFollowClick, isFollowing = false }: SellerInfoProps) {
  const { getSellerInfo, getAverageRating, getSellerRatings } = useSellerRating()
  const seller = getSellerInfo(sellerId)
  const averageRating = getAverageRating(sellerId)
  const ratingCount = getSellerRatings(sellerId).length

  if (!seller) return null

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{seller.name}</h2>
          <p className="text-muted-foreground">{seller.description}</p>
        </div>
        <Button variant={isFollowing ? "outline" : "default"} onClick={onFollowClick}>
          {isFollowing ? "Đang theo dõi" : "Theo dõi"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{averageRating}</span>
          </div>
          <p className="text-sm text-muted-foreground">{ratingCount} đánh giá</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-bold">{seller.followers.toLocaleString("vi-VN")}</span>
          </div>
          <p className="text-sm text-muted-foreground">Người theo dõi</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{seller.responseTime}</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <RotateCcw className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{seller.returnPolicy}</p>
        </div>
      </div>
    </div>
  )
}
