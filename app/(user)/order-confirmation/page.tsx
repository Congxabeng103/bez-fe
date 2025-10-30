"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useOrders } from "@/hooks/use-orders"
import { useEffect, useState } from "react"

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const { getOrder } = useOrders()
  const [order, setOrder] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (orderId) {
      const foundOrder = getOrder(orderId)
      setOrder(foundOrder)
    }
    setIsLoaded(true)
  }, [orderId, getOrder])

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const orderNumber = order?.id || Math.random().toString(36).substring(2, 11).toUpperCase()
  const estimatedDelivery = order
    ? new Date(order.estimatedDelivery).toLocaleDateString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground text-lg">Thank you for your purchase</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 mb-8">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-muted-foreground text-sm mb-2">Order Number</p>
              <p className="text-2xl font-bold">{orderNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">Estimated Delivery</p>
              <p className="text-2xl font-bold">{estimatedDelivery}</p>
            </div>
          </div>

          {order && (
            <div className="border-t border-border py-8">
              <h2 className="text-xl font-bold mb-4">Order Details</h2>
              <div className="space-y-3 mb-6">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${(order.totalAmount - order.shippingCost - order.tax + order.discountAmount).toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border mt-6 pt-6">
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.name}
                  <br />
                  {order.shippingAddress.address}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.zipCode}
                  <br />
                  {order.shippingAddress.country}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-4">What's Next?</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">1.</span>
                <span>You will receive a confirmation email with your order details and tracking information.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">2.</span>
                <span>Your order will be processed and shipped within 1-2 business days.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">3.</span>
                <span>You can track your package using the tracking number provided in your email.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/products" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/orders" className="flex-1">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">View My Orders</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
