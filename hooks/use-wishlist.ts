"use client"

import { useState, useEffect } from "react"

export interface WishlistItem {
  productId: string
  addedAt: string
  notes?: string
  priceAlert?: boolean
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist")
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }
    setIsLoaded(true)
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist))
    }
  }, [wishlist, isLoaded])

  const addToWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.productId === productId)) {
        return prev
      }
      return [...prev, { productId, addedAt: new Date().toISOString(), priceAlert: false }]
    })
  }

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.productId !== productId))
  }

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.productId === productId)
  }

  const getWishlistItems = () => {
    return wishlist
  }

  const updateWishlistItem = (productId: string, updates: Partial<WishlistItem>) => {
    setWishlist((prev) => prev.map((item) => (item.productId === productId ? { ...item, ...updates } : item)))
  }

  const togglePriceAlert = (productId: string) => {
    setWishlist((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, priceAlert: !item.priceAlert } : item)),
    )
  }

  const clearWishlist = () => {
    setWishlist([])
  }

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistItems,
    updateWishlistItem,
    togglePriceAlert,
    clearWishlist,
    isLoaded,
  }
}
