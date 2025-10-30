"use client"

import { usePayment, PAYMENT_METHODS } from "@/hooks/use-payment"

export function PaymentMethodSelector() {
  const { selectedMethod, updatePaymentMethod, updateCardInfo, paymentInfo } = usePayment()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => updatePaymentMethod(method.id)}
              className={`p-4 border-2 rounded-lg transition text-left ${
                selectedMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold">{method.name}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Processing: {method.processingTime}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card Details Form */}
      {(selectedMethod === "credit_card" || selectedMethod === "debit_card") && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h4 className="font-semibold">Card Details</h4>

          <div>
            <label className="block text-sm font-medium mb-2">Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={paymentInfo.cardNumber || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, "").slice(0, 16)
                const formatted = value.replace(/(\d{4})/g, "$1 ").trim()
                updateCardInfo(
                  formatted,
                  paymentInfo.cardHolder || "",
                  paymentInfo.expiryDate || "",
                  paymentInfo.cvv || "",
                )
              }}
              maxLength={19}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Card Holder Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={paymentInfo.cardHolder || ""}
              onChange={(e) =>
                updateCardInfo(
                  paymentInfo.cardNumber || "",
                  e.target.value,
                  paymentInfo.expiryDate || "",
                  paymentInfo.cvv || "",
                )
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={paymentInfo.expiryDate || ""}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "").slice(0, 4)
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + "/" + value.slice(2)
                  }
                  updateCardInfo(
                    paymentInfo.cardNumber || "",
                    paymentInfo.cardHolder || "",
                    value,
                    paymentInfo.cvv || "",
                  )
                }}
                maxLength={5}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CVV</label>
              <input
                type="text"
                placeholder="123"
                value={paymentInfo.cvv || ""}
                onChange={(e) =>
                  updateCardInfo(
                    paymentInfo.cardNumber || "",
                    paymentInfo.cardHolder || "",
                    paymentInfo.expiryDate || "",
                    e.target.value.slice(0, 3),
                  )
                }
                maxLength={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Info */}
      {selectedMethod === "bank_transfer" && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Bank Transfer Details</h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Bank Name:</span> Fashion Bank International
            </p>
            <p>
              <span className="font-medium">Account Number:</span> 1234567890
            </p>
            <p>
              <span className="font-medium">Routing Number:</span> 021000021
            </p>
            <p className="text-muted-foreground mt-4">
              Please include your order number in the transfer reference. Your order will be confirmed once payment is
              received.
            </p>
          </div>
        </div>
      )}

      {/* Cash on Delivery Info */}
      {selectedMethod === "cash_on_delivery" && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="font-semibold mb-2">Cash on Delivery</h4>
          <p className="text-sm text-muted-foreground">
            You will pay the full amount when your order is delivered. Please have the exact amount ready.
          </p>
        </div>
      )}
    </div>
  )
}
