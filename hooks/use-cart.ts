"use client"

import { useState, useEffect } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  size: string
  color: string
  selected: boolean
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
    setIsLoaded(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [cart, isLoaded])

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.id === item.id && cartItem.size === item.size && cartItem.color === item.color,
      )

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem === existingItem ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem,
        )
      }

      return [...prevCart, { ...item, selected: true }]
    })
  }

  const removeFromCart = (id: string, size: string, color: string) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.size === size && item.color === color)))
  }

  const updateQuantity = (id: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.size === size && item.color === color ? { ...item, quantity } : item,
      ),
    )
  }

  const toggleSelected = (id: string, size: string, color: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.size === size && item.color === color ? { ...item, selected: !item.selected } : item,
      ),
    )
  }

  const selectAll = () => {
    setCart((prevCart) => prevCart.map((item) => ({ ...item, selected: true })))
  }

  const deselectAll = () => {
    setCart((prevCart) => prevCart.map((item) => ({ ...item, selected: false })))
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => (item.selected ? total + item.price * item.quantity : total), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => (item.selected ? total + item.quantity : total), 0)
  }

  const getSelectedCount = () => {
    return cart.filter((item) => item.selected).length
  }

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleSelected,
    selectAll,
    deselectAll,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getSelectedCount,
  }
}
