"use client"

import { useDiscounts } from "@/hooks/use-discounts"
import { Zap } from "lucide-react"

export function PromoBanner() {
  const { getActivePromotions } = useDiscounts()
  const activePromos = getActivePromotions()

  if (activePromos.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
        {activePromos.map((promo) => (
          <div key={promo.id} className="flex items-center gap-2 whitespace-nowrap">
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{promo.title}</span>
            <span className="text-xs opacity-90">
              {promo.discountType === "percentage" ? `${promo.discountValue}% OFF` : `$${promo.discountValue} OFF`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
