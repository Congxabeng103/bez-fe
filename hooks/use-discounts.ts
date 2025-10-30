"use client"

import { useState, useEffect } from "react"

export interface DiscountCode {
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minPurchase: number
  expiryDate: string
  maxUses: number
  usedCount: number
  active: boolean
}

export interface Promotion {
  id: string
  title: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  applicableCategories: string[]
  startDate: string
  endDate: string
  active: boolean
}

const DEFAULT_DISCOUNT_CODES: DiscountCode[] = [
  {
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 0,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 100,
    usedCount: 0,
    active: true,
  },
  {
    code: "SUMMER20",
    discountType: "percentage",
    discountValue: 20,
    minPurchase: 50,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 50,
    usedCount: 0,
    active: true,
  },
  {
    code: "FLAT15",
    discountType: "fixed",
    discountValue: 15,
    minPurchase: 100,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 200,
    usedCount: 0,
    active: true,
  },
]

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: "promo-1",
    title: "Summer Sale",
    description: "Get 15% off on all summer collection items",
    discountType: "percentage",
    discountValue: 15,
    applicableCategories: ["Dresses", "T-Shirts"],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  },
  {
    id: "promo-2",
    title: "Jacket Clearance",
    description: "Save $20 on all jackets",
    discountType: "fixed",
    discountValue: 20,
    applicableCategories: ["Jackets"],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  },
]

export function useDiscounts() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedCodes = localStorage.getItem("discountCodes")
    const savedPromos = localStorage.getItem("promotions")

    setDiscountCodes(savedCodes ? JSON.parse(savedCodes) : DEFAULT_DISCOUNT_CODES)
    setPromotions(savedPromos ? JSON.parse(savedPromos) : DEFAULT_PROMOTIONS)
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("discountCodes", JSON.stringify(discountCodes))
      localStorage.setItem("promotions", JSON.stringify(promotions))
    }
  }, [discountCodes, promotions, isLoaded])

  const validateDiscountCode = (code: string, cartTotal: number) => {
    const discount = discountCodes.find((d) => d.code.toUpperCase() === code.toUpperCase())

    if (!discount) {
      return { valid: false, error: "Invalid discount code" }
    }

    if (!discount.active) {
      return { valid: false, error: "This discount code is no longer active" }
    }

    if (new Date(discount.expiryDate) < new Date()) {
      return { valid: false, error: "This discount code has expired" }
    }

    if (discount.usedCount >= discount.maxUses) {
      return { valid: false, error: "This discount code has reached its usage limit" }
    }

    if (cartTotal < discount.minPurchase) {
      return {
        valid: false,
        error: `Minimum purchase of $${discount.minPurchase} required`,
      }
    }

    return { valid: true, discount }
  }

  const applyDiscountCode = (code: string) => {
    const updatedCodes = discountCodes.map((d) =>
      d.code.toUpperCase() === code.toUpperCase() ? { ...d, usedCount: d.usedCount + 1 } : d,
    )
    setDiscountCodes(updatedCodes)
  }

  const calculateDiscount = (discount: DiscountCode | Promotion, amount: number) => {
    if (discount.discountType === "percentage") {
      return (amount * discount.discountValue) / 100
    } else {
      return Math.min(discount.discountValue, amount)
    }
  }

  const getActivePromotions = () => {
    return promotions.filter((p) => {
      const now = new Date()
      return p.active && new Date(p.startDate) <= now && new Date(p.endDate) >= now
    })
  }

  const getPromotionForCategory = (category: string) => {
    return getActivePromotions().find((p) => p.applicableCategories.includes(category))
  }

  return {
    discountCodes,
    promotions,
    validateDiscountCode,
    applyDiscountCode,
    calculateDiscount,
    getActivePromotions,
    getPromotionForCategory,
    isLoaded,
  }
}
