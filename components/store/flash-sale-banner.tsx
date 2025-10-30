"use client"

import { useFlashSale } from "@/hooks/use-flash-sale"
import { products } from "@/lib/products"
import Link from "next/link"
import { Flame } from "lucide-react"

export function FlashSaleBanner() {
  const { getActiveFlashSales } = useFlashSale()
  const activeFlashSales = getActiveFlashSales()

  if (activeFlashSales.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 px-4 rounded-lg mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Flash Sale</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeFlashSales.map((sale) => {
            const product = products.find((p) => p.id === sale.productId)
            if (!product) return null

            const progress = (sale.sold / sale.quantity) * 100

            return (
              <Link key={sale.id} href={`/products/${product.id}`}>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/20 transition cursor-pointer">
                  <p className="text-sm font-semibold mb-1">{product.name}</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold">{sale.discount}%</span>
                    <span className="text-sm line-through opacity-75">
                      {sale.originalPrice.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <p className="text-lg font-bold mb-2">{sale.salePrice.toLocaleString("vi-VN")}₫</p>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs mt-1">
                    Đã bán {sale.sold}/{sale.quantity}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
