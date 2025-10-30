"use client"

import { useCampaignDiscount } from "@/hooks/use-campaign-discount"
import { Zap } from "lucide-react"

export function CampaignDiscountBanner() {
  const { getActiveCampaigns } = useCampaignDiscount()
  const activeCampaigns = getActiveCampaigns()

  if (activeCampaigns.length === 0) return null

  return (
    <div className="space-y-4">
      {activeCampaigns.map((campaign) => (
        <div key={campaign.id} className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-6 px-4 rounded-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6" />
              <h2 className="text-2xl font-bold">{campaign.name}</h2>
              {campaign.banner && <span className="text-3xl">{campaign.banner}</span>}
            </div>

            <p className="text-white/90 mb-4">{campaign.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {campaign.discountType === "percentage"
                    ? `${campaign.discountValue}%`
                    : `${campaign.discountValue.toLocaleString("vi-VN")}₫`}
                </span>
                <span className="text-white/75">Giảm giá</span>
              </div>

              <div className="text-sm text-white/75">Áp dụng cho: {campaign.applicableCategories.join(", ")}</div>
            </div>

            <div className="mt-4 text-xs text-white/60">
              Kết thúc: {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
