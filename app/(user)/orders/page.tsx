"use client"

import { useAuth } from "@/hooks/use-auth"
import { useOrders } from "@/hooks/use-orders"
import { OrderCard } from "@/components/order-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Package } from "lucide-react"

export default function OrdersPage() {
  const { user, isLoggedIn, isLoaded } = useAuth()
  const { getUserOrders } = useOrders()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isLoggedIn) {
      router.push("/")
    }
  }, [isLoaded, isLoggedIn, router])

  if (!isLoaded || !isLoggedIn || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const userOrders = getUserOrders(user.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Package className="w-8 h-8" />
            My Orders
          </h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        {userOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to create your first order!</p>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
