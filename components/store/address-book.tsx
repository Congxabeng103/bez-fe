"use client"

import { useAddressBook, type Address } from "@/hooks/use-address-book"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Check } from "lucide-react"
import { useState } from "react"

export function AddressBook() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddressBook()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Address, "id" | "createdAt">>({
    name: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    city: "",
    zipCode: "",
    isDefault: false,
  })

  const handleAddAddress = () => {
    if (formData.name && formData.phone && formData.address && formData.city) {
      addAddress(formData)
      setFormData({
        name: "",
        phone: "",
        address: "",
        ward: "",
        district: "",
        city: "",
        zipCode: "",
        isDefault: false,
      })
      setIsAdding(false)
    }
  }

  const handleUpdateAddress = (id: string) => {
    updateAddress(id, formData)
    setEditingId(null)
    setFormData({
      name: "",
      phone: "",
      address: "",
      ward: "",
      district: "",
      city: "",
      zipCode: "",
      isDefault: false,
    })
  }

  const handleEditClick = (address: Address) => {
    setEditingId(address.id)
    setFormData({
      name: address.name,
      phone: address.phone,
      address: address.address,
      ward: address.ward,
      district: address.district,
      city: address.city,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sổ địa chỉ giao hàng</h3>
        {!isAdding && editingId === null && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            Thêm địa chỉ
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h4 className="font-semibold">{editingId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tên địa chỉ</label>
              <input
                type="text"
                placeholder="VD: Nhà riêng, Văn phòng"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Số điện thoại</label>
              <input
                type="tel"
                placeholder="0123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Địa chỉ chi tiết</label>
            <input
              type="text"
              placeholder="Số nhà, tên đường"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phường/Xã</label>
              <input
                type="text"
                placeholder="Phường/Xã"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quận/Huyện</label>
              <input
                type="text"
                placeholder="Quận/Huyện"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Thành phố/Tỉnh</label>
              <input
                type="text"
                placeholder="Thành phố/Tỉnh"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mã bưu điện</label>
              <input
                type="text"
                placeholder="Mã bưu điện"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="default-address"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 rounded border-border cursor-pointer"
            />
            <label htmlFor="default-address" className="text-sm cursor-pointer">
              Đặt làm địa chỉ mặc định
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => (editingId ? handleUpdateAddress(editingId) : handleAddAddress())}
              className="flex-1"
            >
              {editingId ? "Cập nhật" : "Thêm"}
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
                setFormData({
                  name: "",
                  phone: "",
                  address: "",
                  ward: "",
                  district: "",
                  city: "",
                  zipCode: "",
                  isDefault: false,
                })
              }}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Address List */}
      <div className="space-y-3">
        {addresses.map((address) => (
          <div key={address.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{address.name}</h4>
                  {address.isDefault && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Mặc định</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{address.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {address.address}, {address.ward}, {address.district}, {address.city} {address.zipCode}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(address)}
                  className="p-2 hover:bg-muted rounded transition"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteAddress(address.id)}
                  className="p-2 hover:bg-destructive/10 rounded transition text-destructive"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => setDefaultAddress(address.id)}
                    className="p-2 hover:bg-primary/10 rounded transition text-primary"
                    title="Đặt làm mặc định"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
