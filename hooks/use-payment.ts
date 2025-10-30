"use client"

import { useState, useEffect } from "react"

export type PaymentMethod = "credit_card" | "debit_card" | "ewallet" | "bank_transfer" | "cash_on_delivery"

export interface PaymentMethodInfo {
  id: PaymentMethod
  name: string
  description: string
  icon: string
  type: "online" | "offline"
  processingTime: string
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: "credit_card",
    name: "Credit Card",
    description: "Visa, Mastercard, American Express",
    icon: "💳",
    type: "online",
    processingTime: "Instant",
  },
  {
    id: "debit_card",
    name: "Debit Card",
    description: "Direct bank debit",
    icon: "🏦",
    type: "online",
    processingTime: "Instant",
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    description: "PayPal, Apple Pay, Google Pay",
    icon: "📱",
    type: "online",
    processingTime: "Instant",
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    description: "Direct bank transfer",
    icon: "🏧",
    type: "online",
    processingTime: "1-2 business days",
  },
  {
    id: "cash_on_delivery",
    name: "Cash on Delivery",
    description: "Pay when you receive your order",
    icon: "💵",
    type: "offline",
    processingTime: "On delivery",
  },
]

export interface PaymentInfo {
  method: PaymentMethod
  cardNumber?: string
  cardHolder?: string
  expiryDate?: string
  cvv?: string
}

export function usePayment() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("credit_card")
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: "credit_card",
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load payment info from localStorage on mount
  useEffect(() => {
    const savedPayment = localStorage.getItem("paymentInfo")
    if (savedPayment) {
      const payment = JSON.parse(savedPayment)
      setPaymentInfo(payment)
      setSelectedMethod(payment.method)
    }
    setIsLoaded(true)
  }, [])

  // Save payment info to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("paymentInfo", JSON.stringify(paymentInfo))
    }
  }, [paymentInfo, isLoaded])

  const updatePaymentMethod = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setPaymentInfo({ ...paymentInfo, method })
  }

  const updateCardInfo = (cardNumber: string, cardHolder: string, expiryDate: string, cvv: string) => {
    setPaymentInfo({
      ...paymentInfo,
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
    })
  }

  const getPaymentMethodInfo = (method: PaymentMethod) => {
    return PAYMENT_METHODS.find((m) => m.id === method)
  }

  const validatePaymentInfo = () => {
    if (selectedMethod === "cash_on_delivery") {
      return { valid: true }
    }

    if (selectedMethod === "credit_card" || selectedMethod === "debit_card") {
      if (!paymentInfo.cardNumber || !paymentInfo.cardHolder || !paymentInfo.expiryDate || !paymentInfo.cvv) {
        return { valid: false, error: "Please fill in all card details" }
      }

      // Basic card validation
      if (paymentInfo.cardNumber.replace(/\s/g, "").length !== 16) {
        return { valid: false, error: "Invalid card number" }
      }

      if (paymentInfo.cvv.length !== 3) {
        return { valid: false, error: "Invalid CVV" }
      }
    }

    return { valid: true }
  }

  return {
    selectedMethod,
    paymentInfo,
    updatePaymentMethod,
    updateCardInfo,
    getPaymentMethodInfo,
    validatePaymentInfo,
    isLoaded,
  }
}
