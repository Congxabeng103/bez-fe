// (path: app/(routes)/cart/page.tsx)

"use client";

import { useCart } from "@/hooks/use-cart";
import { CartItemComponent } from "@/components/store/cart-item"; // Import component
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { translations as t } from "@/lib/translations"; // (Giả sử bạn có file này)

export default function CartPage() {
  const {
    cart,
    isLoaded,     // <-- Lấy thêm
    isMutating,   // <-- Lấy thêm
    removeFromCart,
    updateQuantity,
    toggleSelected,
    selectAll,
    deselectAll,
    getTotalPrice,
    clearCart,
    getSelectedCount,
  } = useCart();

  const total = getTotalPrice(); // Hook đã dùng currentPrice
  const selectedCount = getSelectedCount();
  const shipping = selectedCount > 0 ? 50000 : 0;
  const grandTotal = total + shipping ;

  // --- THÊM STATE LOADING ---
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // --- TRẠNG THÁI GIỎ HÀNG RỖNG ---
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t.shoppingCart}</h1>
            <p className="text-muted-foreground text-lg mb-8">{t.emptyCart}</p>
            <Link href="/products">
              <Button className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t.continueShopping}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- GIỎ HÀNG CÓ SẢN PHẨM ---
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">{t.shoppingCart}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          {/* Thêm isMutating để làm mờ khi đang cập nhật */}
          <div className={`lg:col-span-2 ${isMutating ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-card rounded-lg border border-border p-6">
              {/* Select All */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={cart.length > 0 && cart.every((item) => item.selected)}
                    onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                    className="w-5 h-5 rounded border-border cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    Chọn tất cả ({selectedCount}/{cart.length})
                  </span>
                </div>
              </div>

              {/* --- SỬA LOGIC LẶP --- */}
              {cart.map((item) => (
                <CartItemComponent
                  key={item.variantId} // Sửa: Dùng variantId làm key
                  item={item}
                  // Sửa: Truyền hàm với variantId
                  onUpdateQuantity={(quantity) => updateQuantity(item.variantId, quantity)}
                  onRemove={() => removeFromCart(item.variantId)}
                  onToggleSelected={() => toggleSelected(item.variantId)}
                />
              ))}
              {/* --- KẾT THÚC SỬA --- */}
              
            </div>

            <div className="mt-6">
              <Link href="/products">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <ArrowLeft className="w-4 h-4" />
                  {t.continueShopping}
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary (Giữ nguyên) */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-20">
              <h2 className="text-2xl font-bold mb-6">{t.orderSummary}</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.subtotal}</span>
                  <span className="font-semibold">{total.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.shipping}</span>
                  <span className="font-semibold">{shipping.toLocaleString("vi-VN")}₫</span>
                </div>               
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-bold">{t.total}</span>
                  <span className="text-2xl font-bold text-primary">{grandTotal.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
              <Link href={selectedCount > 0 ? "/checkout" : "#"} className="w-full block">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedCount === 0}
                >
                  {t.proceedCheckout}
                </Button>
              </Link>
              <button
                onClick={clearCart}
                className="w-full mt-3 px-4 py-2 text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition"
              >
                {t.remove}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}