// (path: src/components/store/cart-item.tsx)

"use client";

import Image from "next/image";
import Link from "next/link";
import { CartItem } from "@/hooks/use-cart"; // Import interface MỚI
import { X, AlertCircle, Trash2 } from "lucide-react"; 

// Định nghĩa Props
interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onToggleSelected: () => void;
}

export function CartItemComponent({
  item,
  onUpdateQuantity,
  onRemove,
  onToggleSelected,
}: CartItemProps) {
  
  const handleQuantityChange = (newQuantity: number) => {
    // Chỉ cho phép tăng nếu số lượng mới <= tồn kho
    if (newQuantity <= item.stockQuantity) {
      onUpdateQuantity(newQuantity);
    }
    // Nếu giảm thì luôn cho phép (hook useCart sẽ xử lý nếu <= 0)
    if (newQuantity < item.quantity) {
      onUpdateQuantity(newQuantity);
    }
  };

  return (
    <div className="flex items-center justify-between py-6 border-b border-border">
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={item.selected}
          onChange={onToggleSelected}
          className="w-5 h-5 rounded border-border cursor-pointer"
        />

        {/* Image */}
        <Link href={`/products/${item.productId}`}>
          <Image
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.productName}
            width={80}
            height={80}
            className="rounded-lg object-cover"
          />
        </Link>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <Link href={`/products/${item.productId}`} className="font-semibold hover:underline">
            {item.productName}
          </Link>
          <span className="text-sm text-muted-foreground">
            {/* SỬA: Dùng thuộc tính động */}
            {item.attributesDescription}
          </span>
          
          {/* Cảnh báo tồn kho */}
          {item.quantity > item.stockQuantity && (
             <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3"/> Chỉ còn {item.stockQuantity} sản phẩm
             </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Quantity Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="px-3 py-1 border rounded-lg hover:bg-muted disabled:opacity-50"
          > - </button>
          
          <span className="text-lg font-semibold w-8 text-center">
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= item.stockQuantity} // Disable khi >= tồn kho
            className="px-3 py-1 border rounded-lg hover:bg-muted disabled:opacity-50"
          > + </button>
        </div>

        {/* --- SỬA LỖI LOGIC GIÁ Ở ĐÂY --- */}
        <div className="flex flex-col items-end w-32">
          {item.priceChanged ? (
            // Nếu giá thay đổi (hiển thị 2 giá + cảnh báo)
            <>
              <span className="text-xl font-bold text-destructive">
                {item.currentPrice.toLocaleString("vi-VN")}₫
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {item.originalPrice.toLocaleString("vi-VN")}₫
              </span>
              <span className="text-xs text-destructive/80 text-right">
                Giá đã thay đổi
              </span>
            </>
          ) : (
            // Nếu giá không đổi (hiển thị bình thường)
            <span className="text-xl font-bold text-primary">
              {item.currentPrice.toLocaleString("vi-VN")}₫
            </span>
          )}
        </div>
        {/* --- KẾT THÚC SỬA LỖI --- */}

        {/* Remove Button */}
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}