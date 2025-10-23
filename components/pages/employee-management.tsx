"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, Mail, Phone, Search } from "lucide-react"
import { useStore, type Employee } from "@/lib/store"
import { Pagination } from "@/components/pagination"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 5

export function EmployeeManagement() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
  })

  const filteredEmployees = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.position.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [employees, searchTerm],
  )

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleSubmit = () => {
    if (!formData.name || !formData.email) return

    if (editingId) {
      updateEmployee(editingId, formData)
      toast.success("Cập nhật nhân viên thành công")
      setEditingId(null)
    } else {
      addEmployee({
        id: Date.now().toString(),
        name: formData.name || "",
        email: formData.email || "",
        phone: formData.phone || "",
        position: formData.position || "",
        department: formData.department || "",
        joinDate: new Date().toISOString().split("T")[0],
      })
      toast.success("Thêm nhân viên thành công")
    }

    setFormData({ name: "", email: "", phone: "", position: "", department: "" })
    setShowForm(false)
  }

  const handleEdit = (employee: Employee) => {
    setFormData(employee)
    setEditingId(employee.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    deleteEmployee(id)
    toast.success("Xóa nhân viên thành công")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý nhân viên</h1>
          <p className="text-muted-foreground">Quản lý thông tin nhân viên và phân công công việc</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ name: "", email: "", phone: "", position: "", department: "" })
          }}
          className="gap-2"
        >
          <Plus size={20} />
          Thêm nhân viên
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Tên nhân viên"
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
                placeholder="Chức vụ"
                value={formData.position || ""}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              <select
                value={formData.department || ""}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="px-3 py-2 border border-input rounded-md"
              >
                <option value="">Chọn phòng ban</option>
                <option value="Bán hàng">Bán hàng</option>
                <option value="Kho">Kho</option>
                <option value="Quản lý">Quản lý</option>
              </select>
              <Button onClick={handleSubmit} className="md:col-span-2">
                {editingId ? "Cập nhật" : "Lưu"} nhân viên
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân viên ({filteredEmployees.length})</CardTitle>
          <div className="mt-4 flex gap-2">
            <Search size={20} className="text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
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
                  <th className="text-left py-3 px-4">Tên nhân viên</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Điện thoại</th>
                  <th className="text-left py-3 px-4">Chức vụ</th>
                  <th className="text-left py-3 px-4">Phòng ban</th>
                  <th className="text-left py-3 px-4">Ngày tham gia</th>
                  <th className="text-left py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{employee.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-muted-foreground" />
                        {employee.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-muted-foreground" />
                        {employee.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">{employee.position}</td>
                    <td className="py-3 px-4">{employee.department}</td>
                    <td className="py-3 px-4">{employee.joinDate}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(employee.id)}>
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
