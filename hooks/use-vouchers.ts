"use client"

import { useState, useEffect } from "react"

export interface Voucher {
  id: string
  code: string
  title: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minPurchase: number
  maxUses: number
  usedCount: number
  expiryDate: string
  active: boolean
}

export function useVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedVouchers = localStorage.getItem("vouchers")
    if (savedVouchers) {
      setVouchers(JSON.parse(savedVouchers))
    } else {
      // Initialize with demo vouchers
      const demoVouchers: Voucher[] = [
        {
          id: "v1",
          code: "WELCOME20",
          title: "Giảm 20% cho khách hàng mới",
          description: "Giảm 20% cho đơn hàng đầu tiên",
          discountType: "percentage",
          discountValue: 20,
          minPurchase: 100000,
          maxUses: 1000,
          usedCount: 234,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
        },
        {
          id: "v2",
          code: "SUMMER50K",
          title: "Giảm 50.000₫",
          description: "Giảm 50.000₫ cho đơn hàng từ 500.000₫",
          discountType: "fixed",
          discountValue: 50000,
          minPurchase: 500000,
          maxUses: 500,
          usedCount: 312,
          expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
        },
        {
          id: "v3",
          code: "FREESHIP",
          title: "Miễn phí vận chuyển",
          description: "Miễn phí vận chuyển cho đơn hàng từ 300.000₫",
          discountType: "fixed",
          discountValue: 50000,
          minPurchase: 300000,
          maxUses: 2000,
          usedCount: 1456,
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
        },
      ]
      setVouchers(demoVouchers)
      localStorage.setItem("vouchers", JSON.stringify(demoVouchers))
    }
    setIsLoaded(true)
  }, [])

  const getActiveVouchers = () => {
    const now = new Date()
    return vouchers.filter((v) => v.active && new Date(v.expiryDate) > now && v.usedCount < v.maxUses)
  }

  const getVoucherByCode = (code: string) => {
    return getActiveVouchers().find((v) => v.code.toUpperCase() === code.toUpperCase())
  }

  const useVoucher = (voucherId: string) => {
    setVouchers((prev) => prev.map((v) => (v.id === voucherId ? { ...v, usedCount: v.usedCount + 1 } : v)))
  }

  return {
    vouchers,
    getActiveVouchers,
    getVoucherByCode,
    useVoucher,
    isLoaded,
  }
}
