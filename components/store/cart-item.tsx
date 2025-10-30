"use client"

import Image from "next/image"
import { Trash2 } from "lucide-react"
import type { CartItem } from "@/hooks/use-cart"

interface CartItemComponentProps {
  item: CartItem
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
  onToggleSelected: () => void
}

export function CartItemComponent({ item, onUpdateQuantity, onRemove, onToggleSelected }: CartItemComponentProps) {
  return (
    <div className="flex gap-4 py-4 border-b border-border items-center">
      <input
        type="checkbox"
        checked={item.selected}
        onChange={onToggleSelected}
        className="w-5 h-5 rounded border-border cursor-pointer"
      />

      {/* Product Image */}
      <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
      </div>

      {/* Product Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {item.color} - Size {item.size}
        </p>
        <p className="font-semibold text-primary">{item.price.toLocaleString("vi-VN")}₫</p>
      </div>

      {/* Quantity Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.quantity - 1)}
          className="px-2 py-1 border border-border rounded hover:bg-muted transition"
        >
          -
        </button>
        <span className="w-8 text-center font-semibold">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          className="px-2 py-1 border border-border rounded hover:bg-muted transition"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right min-w-24">
        <p className="font-semibold">{(item.price * item.quantity).toLocaleString("vi-VN")}₫</p>
      </div>

      {/* Remove Button */}
      <button onClick={onRemove} className="p-2 text-destructive hover:bg-destructive/10 rounded transition">
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}
