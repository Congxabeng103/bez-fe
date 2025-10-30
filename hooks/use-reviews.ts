"use client"

import { useState, useEffect } from "react"

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  createdAt: string
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load reviews from localStorage on mount
  useEffect(() => {
    const savedReviews = localStorage.getItem("reviews")
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews))
    }
    setIsLoaded(true)
  }, [])

  // Save reviews to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("reviews", JSON.stringify(reviews))
    }
  }, [reviews, isLoaded])

  const addReview = (review: Omit<Review, "id" | "createdAt">) => {
    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
    setReviews((prev) => [newReview, ...prev])
    return newReview
  }

  const getProductReviews = (productId: string) => {
    return reviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getAverageRating = (productId: string) => {
    const productReviews = getProductReviews(productId)
    if (productReviews.length === 0) return 0
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / productReviews.length) * 10) / 10
  }

  const getReviewCount = (productId: string) => {
    return getProductReviews(productId).length
  }

  const hasUserReviewed = (productId: string, userId: string) => {
    return reviews.some((r) => r.productId === productId && r.userId === userId)
  }

  return {
    reviews,
    addReview,
    getProductReviews,
    getAverageRating,
    getReviewCount,
    hasUserReviewed,
    isLoaded,
  }
}
