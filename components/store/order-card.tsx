"use client"

import type { Order } from "@/hooks/use-orders"
import { formatDistanceToNow } from "date-fns"
import { Package, Truck, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "processing":
        return <Package className="w-5 h-5 text-blue-500" />
      case "shipped":
        return <Truck className="w-5 h-5 text-purple-500" />
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    }
    return labels[status] || status
  }

  return (
    <div className="border border-border rounded-lg p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Order ID</p>
          <p className="font-semibold text-lg">{order.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <span className="font-medium text-sm">{getStatusLabel(order.status)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Order Date</p>
          <p className="font-medium">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Estimated Delivery</p>
          <p className="font-medium">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-border">
        <p className="text-sm text-muted-foreground mb-2">Items ({order.items.length})</p>
        <div className="space-y-1">
          {order.items.slice(0, 2).map((item, idx) => (
            <p key={idx} className="text-sm">
              {item.name} x {item.quantity}
            </p>
          ))}
          {order.items.length > 2 && <p className="text-sm text-muted-foreground">+{order.items.length - 2} more</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-xl font-bold text-primary">${order.totalAmount.toFixed(2)}</p>
        </div>
        <Link href={`/orders/${order.id}`} className="text-primary hover:underline font-medium">
          View Details
        </Link>
      </div>
    </div>
  )
}
