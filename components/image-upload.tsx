"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = "Tải lên hình ảnh" }: ImageUploadProps) {
  const [preview, setPreview] = useState(value)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        onChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex gap-4">
        {preview && (
          <div className="relative w-24 h-24">
            <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover rounded-lg" />
            <button
              onClick={() => {
                setPreview("")
                onChange("")
              }}
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-input rounded-lg cursor-pointer hover:bg-muted/50 transition">
          <div className="text-center">
            <Upload size={20} className="mx-auto mb-1" />
            <span className="text-xs">Tải lên</span>
          </div>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
    </div>
  )
}
