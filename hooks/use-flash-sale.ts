"use client"

import { useState, useEffect } from "react"

export interface FlashSale {
  id: string
  productId: string
  originalPrice: number
  salePrice: number
  discount: number
  startTime: string
  endTime: string
  quantity: number
  sold: number
}

export function useFlashSale() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedFlashSales = localStorage.getItem("flashSales")
    if (savedFlashSales) {
      setFlashSales(JSON.parse(savedFlashSales))
    } else {
      // Initialize with demo flash sales
      const demoFlashSales: FlashSale[] = [
        {
          id: "fs1",
          productId: "1",
          originalPrice: 299000,
          salePrice: 199000,
          discount: 33,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          quantity: 50,
          sold: 23,
        },
        {
          id: "fs2",
          productId: "3",
          originalPrice: 599000,
          salePrice: 399000,
          discount: 33,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          quantity: 30,
          sold: 15,
        },
      ]
      setFlashSales(demoFlashSales)
      localStorage.setItem("flashSales", JSON.stringify(demoFlashSales))
    }
    setIsLoaded(true)
  }, [])

  const getActiveFlashSales = () => {
    const now = new Date()
    return flashSales.filter((fs) => new Date(fs.startTime) <= now && new Date(fs.endTime) > now)
  }

  const getFlashSaleByProductId = (productId: string) => {
    return getActiveFlashSales().find((fs) => fs.productId === productId)
  }

  const updateSoldCount = (flashSaleId: string) => {
    setFlashSales((prev) => prev.map((fs) => (fs.id === flashSaleId ? { ...fs, sold: fs.sold + 1 } : fs)))
  }

  return {
    flashSales,
    getActiveFlashSales,
    getFlashSaleByProductId,
    updateSoldCount,
    isLoaded,
  }
}
