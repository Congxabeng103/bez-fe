"use client"

import { useState, useEffect } from "react"

export interface Address {
  id: string
  name: string
  phone: string
  address: string
  ward: string
  district: string
  city: string
  zipCode: string
  isDefault: boolean
  createdAt: string
}

export function useAddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedAddresses = localStorage.getItem("addressBook")
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses))
    } else {
      // Initialize with demo address
      const demoAddresses: Address[] = [
        {
          id: "addr-1",
          name: "Nhà riêng",
          phone: "0123456789",
          address: "123 Đường Nguyễn Huệ",
          ward: "Phường Bến Nghé",
          district: "Quận 1",
          city: "TP. Hồ Chí Minh",
          zipCode: "700000",
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ]
      setAddresses(demoAddresses)
      localStorage.setItem("addressBook", JSON.stringify(demoAddresses))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("addressBook", JSON.stringify(addresses))
    }
  }, [addresses, isLoaded])

  const addAddress = (address: Omit<Address, "id" | "createdAt">) => {
    const newAddress: Address = {
      ...address,
      id: `addr-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    setAddresses((prev) => [...prev, newAddress])
    return newAddress
  }

  const updateAddress = (id: string, updates: Partial<Address>) => {
    setAddresses((prev) => prev.map((addr) => (addr.id === id ? { ...addr, ...updates } : addr)))
  }

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== id))
  }

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      })),
    )
  }

  const getDefaultAddress = () => {
    return addresses.find((addr) => addr.isDefault) || addresses[0]
  }

  const getAddressById = (id: string) => {
    return addresses.find((addr) => addr.id === id)
  }

  return {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    getAddressById,
    isLoaded,
  }
}
