"use client"

import { useState, useEffect } from "react"

export interface CampaignDiscount {
  id: string
  name: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  applicableCategories: string[]
  applicableProducts?: string[]
  startDate: string
  endDate: string
  active: boolean
  banner?: string
}

export function useCampaignDiscount() {
  const [campaigns, setCampaigns] = useState<CampaignDiscount[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedCampaigns = localStorage.getItem("campaignDiscounts")
    if (savedCampaigns) {
      setCampaigns(JSON.parse(savedCampaigns))
    } else {
      // Initialize with demo campaigns
      const demoCampaigns: CampaignDiscount[] = [
        {
          id: "camp1",
          name: "Khuyến mãi Hè 2024",
          description: "Giảm 30% cho tất cả sản phẩm mùa hè",
          discountType: "percentage",
          discountValue: 30,
          applicableCategories: ["Áo phông", "Váy", "Quần short"],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
          banner: "🌞",
        },
        {
          id: "camp2",
          name: "Khuyến mãi Áo khoác",
          description: "Giảm 200.000₫ cho mỗi áo khoác",
          discountType: "fixed",
          discountValue: 200000,
          applicableCategories: ["Áo khoác"],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
          banner: "🧥",
        },
        {
          id: "camp3",
          name: "Khuyến mãi Quần Jean",
          description: "Mua 2 tặng 1 cho quần jean",
          discountType: "percentage",
          discountValue: 50,
          applicableCategories: ["Quần jean"],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
          banner: "👖",
        },
      ]
      setCampaigns(demoCampaigns)
      localStorage.setItem("campaignDiscounts", JSON.stringify(demoCampaigns))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("campaignDiscounts", JSON.stringify(campaigns))
    }
  }, [campaigns, isLoaded])

  const getActiveCampaigns = () => {
    const now = new Date()
    return campaigns.filter((c) => c.active && new Date(c.startDate) <= now && new Date(c.endDate) > now)
  }

  const getCampaignByCategory = (category: string) => {
    return getActiveCampaigns().find((c) => c.applicableCategories.includes(category))
  }

  const getCampaignByProduct = (productId: string) => {
    return getActiveCampaigns().find((c) => c.applicableProducts?.includes(productId))
  }

  const calculateCampaignDiscount = (amount: number, campaign: CampaignDiscount) => {
    if (campaign.discountType === "percentage") {
      return (amount * campaign.discountValue) / 100
    } else {
      return Math.min(campaign.discountValue, amount)
    }
  }

  return {
    campaigns,
    getActiveCampaigns,
    getCampaignByCategory,
    getCampaignByProduct,
    calculateCampaignDiscount,
    isLoaded,
  }
}
