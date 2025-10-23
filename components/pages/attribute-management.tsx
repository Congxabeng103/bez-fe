"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, X } from "lucide-react"
// --- THAY ĐỔI 1: Import hook xác thực ---
import { useAuthStore } from "@/lib/authStore" 
// --- (Bỏ import useStore) ---
// import { Pagination } from "@/components/pagination" // (Component này không dùng phân trang server-side)
import { toast } from "sonner"

// const ITEMS_PER_PAGE = 4 // (Không cần phân trang server-side cho thuộc tính)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

// --- THAY ĐỔI 2: Định nghĩa Type khớp với DTO backend ---
interface AttributeValueResponse {
  id: number;
  value: string;
}

interface AttributeResponse {
  id: number;
  name: string;
  values: AttributeValueResponse[];
}

export function AttributeManagement() {
  const { token } = useAuthStore() // Lấy token

  // State cho dữ liệu thuộc tính
  const [attributes, setAttributes] = useState<AttributeResponse[]>([])
  
  // State cho Form thêm thuộc tính mới
  const [showForm, setShowForm] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState("")

  // State cho Form thêm giá trị mới (cho thuộc tính nào, giá trị là gì)
  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(null) // Lưu ID thuộc tính đang muốn thêm giá trị
  const [newValue, setNewValue] = useState("")

  // State cho UI
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- THAY ĐỔI 3: Hàm Fetch dữ liệu (GET) ---
  const fetchAttributes = async () => {
    if (!token) return;

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/v1/attributes`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      const result = await response.json()

      if (result.status === 'SUCCESS' && result.data) {
        setAttributes(result.data) // Lưu danh sách thuộc tính
      } else {
        throw new Error(result.message || "Không thể tải danh sách thuộc tính")
      }
    } catch (err: any) {
      setError(err.message)
      toast.error(`Lỗi tải thuộc tính: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Gọi fetchAttributes khi component mount và có token
  useEffect(() => {
    if (token) {
      fetchAttributes()
    }
  }, [token]) // Phụ thuộc vào token

  // --- THAY ĐỔI 4: Viết lại các hàm xử lý để gọi API ---

  // Hàm Thêm Thuộc tính mới (POST /attributes)
  const handleAddAttribute = async () => {
    if (!newAttributeName.trim()) return toast.error("Vui lòng nhập tên thuộc tính.");
    if (!token) return toast.error("Vui lòng đăng nhập lại.");

    try {
      const response = await fetch(`${API_URL}/v1/attributes`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newAttributeName.trim() }),
      })
      const result = await response.json()

      if (result.status === 'SUCCESS' && result.data) {
        toast.success("Thêm thuộc tính thành công!")
        // Cập nhật state ở client ngay lập tức
        setAttributes([...attributes, result.data]) 
        setNewAttributeName("")
        setShowForm(false)
      } else {
        throw new Error(result.message || "Thêm thuộc tính thất bại")
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`)
    }
  }

  // Hàm Thêm Giá trị mới cho Thuộc tính (POST /attributes/{id}/values)
  const handleAddValue = async (attributeId: number) => {
    if (!newValue.trim()) return toast.error("Vui lòng nhập giá trị.");
    if (!token) return toast.error("Vui lòng đăng nhập lại.");

    try {
      const response = await fetch(`${API_URL}/v1/attributes/${attributeId}/values`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: newValue.trim() }),
      })
      const result = await response.json()

      if (result.status === 'SUCCESS' && result.data) {
        toast.success("Thêm giá trị thành công!")
        // Cập nhật state ở client
        setAttributes(attributes.map(attr => 
          attr.id === attributeId 
            ? { ...attr, values: [...attr.values, result.data] } // Thêm giá trị mới vào mảng values
            : attr
        ))
        setNewValue("")
        setEditingAttributeId(null) // Đóng input thêm giá trị
      } else {
        throw new Error(result.message || "Thêm giá trị thất bại")
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`)
    }
  }

  // Hàm Xóa Thuộc tính (DELETE /attributes/{id})
  const handleDeleteAttribute = async (id: number) => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    if (!confirm(`Bạn có chắc muốn xóa thuộc tính này? Tất cả giá trị và liên kết với biến thể cũng sẽ bị xóa.`)) return;

    try {
      const response = await fetch(`${API_URL}/v1/attributes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })
      const result = await response.json()

      if (result.status === 'SUCCESS') {
        toast.success("Xóa thuộc tính thành công!")
        // Cập nhật state ở client
        setAttributes(attributes.filter(attr => attr.id !== id))
      } else {
        throw new Error(result.message || "Xóa thuộc tính thất bại")
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`)
    }
  }

  // Hàm Xóa Giá trị của Thuộc tính (DELETE /attributes/values/{valueId})
  const handleDeleteValue = async (attributeId: number, valueId: number) => {
    if (!token) return toast.error("Vui lòng đăng nhập lại.");
    // Không cần confirm cho thao tác nhỏ này

    try {
      const response = await fetch(`${API_URL}/v1/attributes/values/${valueId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })
      const result = await response.json()

      if (result.status === 'SUCCESS') {
        toast.success("Xóa giá trị thành công")
        // Cập nhật state ở client
        setAttributes(attributes.map(attr => 
          attr.id === attributeId 
            ? { ...attr, values: attr.values.filter(val => val.id !== valueId) } // Xóa giá trị khỏi mảng
            : attr
        ))
      } else {
        throw new Error(result.message || "Xóa giá trị thất bại")
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`)
    }
  }

  // --- JSX (Giao diện) ---
  return (
    <div className="p-6 space-y-6">
      {/* --- Header & Nút Thêm Thuộc Tính --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý thuộc tính</h1>
          <p className="text-muted-foreground">Quản lý thuộc tính sản phẩm và giá trị của chúng</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={20} />
          Thêm thuộc tính
        </Button>
      </div>

      {/* --- Form Thêm Thuộc Tính Mới --- */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Thêm thuộc tính mới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Tên thuộc tính (vd: Kích cỡ, Màu sắc)"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
              />
              <Button onClick={handleAddAttribute}>Tạo</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Hiển thị Danh sách Thuộc tính & Giá trị --- */}
      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-center py-6 text-red-600">Lỗi: {error}</div>
      ) : attributes.length === 0 ? (
         <div className="text-center py-6 text-muted-foreground">Chưa có thuộc tính nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Tăng số cột */}
          {attributes.map((attribute) => (
            <Card key={attribute.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{attribute.name}</CardTitle>
                  <Button 
                    variant="ghost" // Ít nổi bật hơn
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive" // Màu xám, đỏ khi hover
                    onClick={() => handleDeleteAttribute(attribute.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Danh sách giá trị hiện có */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2"> {/* Thêm scroll */}
                  {attribute.values.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Chưa có giá trị nào.</p>
                  ) : (
                    attribute.values.map((value) => (
                      <div key={value.id} className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm"> {/* Nền nhạt hơn */}
                        <span>{value.value}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" // Nút icon nhỏ
                          className="w-6 h-6 text-muted-foreground hover:text-destructive" // Kích thước cố định
                          onClick={() => handleDeleteValue(attribute.id, value.id)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Form thêm giá trị mới */}
                {editingAttributeId === attribute.id ? (
                  <div className="flex gap-2 pt-2 border-t"> {/* Thêm border top */}
                    <Input 
                      placeholder="Giá trị mới (vd: XL)" 
                      value={newValue} 
                      onChange={(e) => setNewValue(e.target.value)} 
                      className="h-9 text-sm" // Input nhỏ hơn
                    />
                    <Button onClick={() => handleAddValue(attribute.id)} size="sm">Thêm</Button> {/* Nút nhỏ hơn */}
                    <Button
                      variant="ghost" // Nút hủy ít nổi bật
                      size="sm"
                      onClick={() => {
                        setEditingAttributeId(null)
                        setNewValue("")
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  // Nút "Thêm giá trị"
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm h-9" // Nút nhỏ hơn
                    onClick={() => { 
                      setEditingAttributeId(attribute.id); // Mở form cho attribute này
                      setNewValue(""); // Reset input
                    }} 
                  >
                    <Plus size={16} className="mr-2" />
                    Thêm giá trị
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* --- (Bỏ Pagination vì thường không cần cho thuộc tính) --- */}
      {/* {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />} */}
    </div>
  )
}