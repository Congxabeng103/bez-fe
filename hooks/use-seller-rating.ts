"use client"

import { useState, useEffect } from "react"

export interface SellerRating {
  id: string
  sellerId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface SellerInfo {
  id: string
  name: string
  description: string
  followers: number
  rating: number
  responseTime: string
  returnPolicy: string
}

export function useSellerRating() {
  const [ratings, setRatings] = useState<SellerRating[]>([])
  const [sellers, setSellers] = useState<SellerInfo[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedRatings = localStorage.getItem("sellerRatings")
    const savedSellers = localStorage.getItem("sellers")

    if (savedRatings) {
      setRatings(JSON.parse(savedRatings))
    }

    if (savedSellers) {
      setSellers(JSON.parse(savedSellers))
    } else {
      // Initialize with demo sellers
      const demoSellers: SellerInfo[] = [
        {
          id: "seller1",
          name: "FashionHub Official",
          description: "Cửa hàng chính thức bán quần áo chất lượng cao",
          followers: 15234,
          rating: 4.8,
          responseTime: "Trong vòng 1 giờ",
          returnPolicy: "Hoàn tiền 100% nếu không hài lòng",
        },
      ]
      setSellers(demoSellers)
      localStorage.setItem("sellers", JSON.stringify(demoSellers))
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sellerRatings", JSON.stringify(ratings))
    }
  }, [ratings, isLoaded])

  const addRating = (sellerId: string, userId: string, userName: string, rating: number, comment: string) => {
    const newRating: SellerRating = {
      id: Math.random().toString(36).substr(2, 9),
      sellerId,
      userId,
      userName,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    }
    setRatings((prev) => [newRating, ...prev])
  }

  const getSellerRatings = (sellerId: string) => {
    return ratings
      .filter((r) => r.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getAverageRating = (sellerId: string) => {
    const sellerRatings = getSellerRatings(sellerId)
    if (sellerRatings.length === 0) return 0
    const sum = sellerRatings.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / sellerRatings.length) * 10) / 10
  }

  const getSellerInfo = (sellerId: string) => {
    return sellers.find((s) => s.id === sellerId)
  }

  return {
    ratings,
    sellers,
    addRating,
    getSellerRatings,
    getAverageRating,
    getSellerInfo,
    isLoaded,
  }
}
