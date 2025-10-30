"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useDiscounts } from "@/hooks/use-discounts"
import { useOrders } from "@/hooks/use-orders"
import { usePayment } from "@/hooks/use-payment"
import { Button } from "@/components/ui/button"
import { PaymentMethodSelector } from "@/components/store/payment-method-selector"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Tag } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getTotalPrice, clearCart } = useCart()
  const { user, isLoggedIn, isLoaded: authLoaded } = useAuth()
  const { validateDiscountCode, applyDiscountCode, calculateDiscount } = useDiscounts()
  const { createOrder } = useOrders()
  const { selectedMethod, validatePaymentInfo } = usePayment()
  const [isProcessing, setIsProcessing] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [discountError, setDiscountError] = useState("")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  })

  useEffect(() => {
    if (authLoaded && !isLoggedIn) {
      router.push("/")
    }
  }, [authLoaded, isLoggedIn, router])

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.name.split(" ")[0],
        lastName: user.name.split(" ")[1] || "",
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        zipCode: user.zipCode,
        country: user.country,
      }))
    }
  }, [user])

  const total = getTotalPrice()
  const shipping = cart.length > 0 ? 10 : 0
  const tax = (total - (appliedDiscount?.amount || 0)) * 0.1
  const discountAmount = appliedDiscount?.amount || 0
  const grandTotal = total - discountAmount + shipping + tax

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleApplyDiscount = () => {
    setDiscountError("")
    const validation = validateDiscountCode(discountCode, total)

    if (!validation.valid) {
      setDiscountError(validation.error || "Invalid discount code")
      return
    }
// --- SỬA LỖI Ở ĐÂY ---
    // Thêm bước kiểm tra này để TypeScript "biết" 
    // `validation.discount` chắc chắn tồn tại và không phải là 'undefined'.
    if (!validation.discount) {
      // Trường hợp này không nên xảy ra nếu logic của bạn đúng,
      // nhưng cần thiết để làm TypeScript hài lòng.
      setDiscountError(validation.error || "Lỗi mã giảm giá không xác định.")
      return
    }
    // --- KẾT THÚC SỬA LỖI ---
    const discountAmount = calculateDiscount(validation.discount, total)
    setAppliedDiscount({
      code: discountCode,
      discount: validation.discount,
      amount: discountAmount,
    })
    applyDiscountCode(discountCode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Validate payment info
      const paymentValidation = validatePaymentInfo()
      if (!paymentValidation.valid) {
        alert(paymentValidation.error)
        setIsProcessing(false)
        return
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create order
      if (user) {
        const order = createOrder({
          userId: user.id,
          items: cart,
          totalAmount: grandTotal,
          discountAmount,
          shippingCost: shipping,
          tax,
          paymentMethod: selectedMethod,
          status: "pending",
          shippingAddress: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            country: formData.country,
          },
        })

        // Clear cart and redirect to confirmation
        clearCart()
        router.push(`/order-confirmation?orderId=${order.id}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (!authLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Checkout</h1>
            <p className="text-muted-foreground text-lg mb-8">Your cart is empty</p>
            <Link href="/products">
              <Button className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shipping Information */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                />

                <input
                  type="text"
                  name="address"
                  placeholder="Street Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <input
                  type="text"
                  name="zipCode"
                  placeholder="ZIP Code"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mt-4"
                />

                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mt-4"
                />
              </div>

              <PaymentMethodSelector />

              <div className="flex gap-4">
                <Link href="/cart" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Cart
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
                >
                  {isProcessing ? "Processing..." : `Pay $${grandTotal.toFixed(2)}`}
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-20 space-y-6">
              <h2 className="text-2xl font-bold">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase())
                      setDiscountError("")
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyDiscount}
                    variant="outline"
                    className="gap-1 bg-transparent"
                    disabled={!discountCode}
                  >
                    <Tag className="w-4 h-4" />
                    Apply
                  </Button>
                </div>
                {discountError && <p className="text-destructive text-xs">{discountError}</p>}
                {appliedDiscount && (
                  <p className="text-green-600 text-xs">
                    Discount applied: {appliedDiscount.code} (-${appliedDiscount.amount.toFixed(2)})
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${total.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
