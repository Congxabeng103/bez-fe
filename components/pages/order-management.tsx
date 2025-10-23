"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, Download, Trash2, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { Pagination } from "@/components/pagination"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 5

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusLabels = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đã gửi",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
}

export function OrderManagement() {
  const { orders, updateOrderStatus, deleteOrder } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.orderNumber.includes(searchTerm) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [orders, searchTerm],
  )

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleStatusChange = (orderId: string, newStatus: any) => {
    updateOrderStatus(orderId, newStatus)
    toast.success("Cập nhật trạng thái đơn hàng thành công")
  }

  const exportToExcel = () => {
    const headers = ["Mã đơn", "Khách hàng", "Ngày", "Số lượng", "Tổng tiền", "Trạng thái"]
    const data = filteredOrders.map((order) => [
      order.orderNumber,
      order.customerName,
      order.createdAt,
      order.items,
      order.total,
      statusLabels[order.status],
    ])

    let csv = headers.join(",") + "\n"
    data.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(",") + "\n"
    })

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `orders_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground">Quản lý tất cả đơn hàng từ khách hàng</p>
        </div>
        <Button onClick={exportToExcel} className="gap-2">
          <Download size={20} />
          Xuất Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({filteredOrders.length})</CardTitle>
          <div className="mt-4 flex gap-2">
            <Search size={20} className="text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Mã đơn</th>
                  <th className="text-left py-3 px-4">Khách hàng</th>
                  <th className="text-left py-3 px-4">Ngày</th>
                  <th className="text-left py-3 px-4">Số lượng</th>
                  <th className="text-left py-3 px-4">Tổng tiền</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                    <td className="py-3 px-4">{order.customerName}</td>
                    <td className="py-3 px-4">{order.createdAt}</td>
                    <td className="py-3 px-4">{order.items}</td>
                    <td className="py-3 px-4">₫{order.total.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                          statusColors[order.status]
                        }`}
                      >
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowDetails(true)
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          deleteOrder(order.id)
                          toast.success("Xóa đơn hàng thành công")
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </CardContent>
      </Card>

      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chi tiết đơn hàng</CardTitle>
              <button onClick={() => setShowDetails(false)}>
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mã đơn</p>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày đặt</p>
                  <p className="font-medium">{selectedOrder.createdAt}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng</p>
                  <p className="font-medium">{selectedOrder.items} sản phẩm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng tiền</p>
                  <p className="font-medium">₫{selectedOrder.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <p className={`font-medium px-2 py-1 rounded text-xs w-fit ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowDetails(false)} className="w-full">
                Đóng
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
