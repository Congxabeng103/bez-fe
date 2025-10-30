"use client"

import { useVouchers } from "@/hooks/use-vouchers"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

export function VoucherList() {
  const { getActiveVouchers } = useVouchers()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const activeVouchers = getActiveVouchers()

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (activeVouchers.length === 0) return null

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">Mã giảm giá khả dụng</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeVouchers.map((voucher) => (
          <div key={voucher.id} className="border border-border rounded-lg p-4 hover:shadow-lg transition">
            <h3 className="font-semibold mb-2">{voucher.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{voucher.description}</p>

            <div className="bg-primary/10 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <code className="font-mono font-bold text-primary">{voucher.code}</code>
                <button
                  onClick={() => copyToClipboard(voucher.code)}
                  className="p-1 hover:bg-primary/20 rounded transition"
                >
                  {copiedCode === voucher.code ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 mb-3">
              <p>Tối thiểu: {voucher.minPurchase.toLocaleString("vi-VN")}₫</p>
              <p>Còn lại: {voucher.maxUses - voucher.usedCount} lượt</p>
            </div>

            <Button className="w-full text-xs bg-transparent" variant="outline">
              Sao chép mã
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
