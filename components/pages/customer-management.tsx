"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Mail, Phone, Edit2, Trash2, Plus } from "lucide-react"
import { useStore, type Customer } from "@/lib/store"
import { Pagination } from "@/components/pagination"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 5

export function CustomerManagement() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    totalOrders: 0,
    totalSpent: 0,
  })

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm),
      ),
    [customers, searchTerm],
  )

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleSubmit = () => {
    if (!formData.name || !formData.email) return

    if (editingId) {
      updateCustomer(editingId, formData)
      toast.success("Cập nhật khách hàng thành công")
      setEditingId(null)
    } else {
      addCustomer({
        id: Date.now().toString(),
        name: formData.name || "",
        email: formData.email || "",
        phone: formData.phone || "",
        totalOrders: formData.totalOrders || 0,
        totalSpent: formData.totalSpent || 0,
        joinDate: new Date().toISOString().split("T")[0],
      })
      toast.success("Thêm khách hàng thành công")
    }

    setFormData({ name: "", email: "", phone: "", totalOrders: 0, totalSpent: 0 })
    setShowForm(false)
  }

  const handleEdit = (customer: Customer) => {
    setFormData(customer)
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    deleteCustomer(id)
    toast.success("Xóa khách hàng thành công")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý khách hàng</h1>
          <p className="text-muted-foreground">Quản lý thông tin khách hàng và lịch sử mua hàng</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ name: "", email: "", phone: "", totalOrders: 0, totalSpent: 0 })
          }}
          className="gap-2"
        >
          <Plus size={20} />
          Thêm khách hàng
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Tên khách hàng"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                placeholder="Email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                placeholder="Số điện thoại"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                placeholder="Tổng đơn hàng"
                type="number"
                value={formData.totalOrders || ""}
                onChange={(e) => setFormData({ ...formData, totalOrders: Number(e.target.value) })}
              />
              <Input
                placeholder="Tổng chi tiêu"
                type="number"
                value={formData.totalSpent || ""}
                onChange={(e) => setFormData({ ...formData, totalSpent: Number(e.target.value) })}
              />
              <Button onClick={handleSubmit} className="md:col-span-2">
                {editingId ? "Cập nhật" : "Lưu"} khách hàng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách khách hàng ({filteredCustomers.length})</CardTitle>
          <div className="mt-4 flex gap-2">
            <Search size={20} className="text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
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
                  <th className="text-left py-3 px-4">Tên khách hàng</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Điện thoại</th>
                  <th className="text-left py-3 px-4">Đơn hàng</th>
                  <th className="text-left py-3 px-4">Tổng chi tiêu</th>
                  <th className="text-left py-3 px-4">Ngày tham gia</th>
                  <th className="text-left py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{customer.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-muted-foreground" />
                        {customer.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-muted-foreground" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">{customer.totalOrders}</td>
                    <td className="py-3 px-4">₫{customer.totalSpent.toLocaleString()}</td>
                    <td className="py-3 px-4">{customer.joinDate}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(customer)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(customer.id)}>
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
    </div>
  )
}
