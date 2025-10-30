"use client"

import { useState, useEffect } from "react"
import type { CartItem } from "@/hooks/use-cart"
import type { PaymentMethod } from "@/hooks/use-payment"

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  totalAmount: number
  discountAmount: number
  shippingCost: number
  tax: number
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: string
  estimatedDelivery: string
  shippingAddress: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    zipCode: string
    country: string
  }
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem("orders")
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders))
    }
    setIsLoaded(true)
  }, [])

  // Save orders to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("orders", JSON.stringify(orders))
    }
  }, [orders, isLoaded])

  const createOrder = (order: Omit<Order, "id" | "createdAt" | "estimatedDelivery">) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
    setOrders((prev) => [newOrder, ...prev])
    return newOrder
  }

  const getUserOrders = (userId: string) => {
    return orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getOrder = (orderId: string) => {
    return orders.find((o) => o.id === orderId)
  }

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
  }

  const getTotalSpent = (userId: string) => {
    return getUserOrders(userId).reduce((total, order) => total + order.totalAmount, 0)
  }

  const getOrderCount = (userId: string) => {
    return getUserOrders(userId).length
  }

  const hasUserPurchasedProduct = (userId: string, productId: string) => {
    return orders.some(
      (order) =>
        order.userId === userId && order.status === "delivered" && order.items.some((item) => item.id === productId),
    )
  }

  return {
    orders,
    createOrder,
    getUserOrders,
    getOrder,
    updateOrderStatus,
    getTotalSpent,
    getOrderCount,
    hasUserPurchasedProduct,
    isLoaded,
  }
}
