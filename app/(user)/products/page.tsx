"use client"

import { useState, useMemo } from "react"
import { ProductCard } from "@/components/store/product-card"
import { Pagination } from "@/components/store/pagination"
import { products } from "@/lib/products"
import { Search } from "lucide-react"
import { translations as t } from "@/lib/translations"

const ITEMS_PER_PAGE = 12

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("featured")
  const [priceRange, setPriceRange] = useState([0, 2000000])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const categories = Array.from(new Set(products.map((p) => p.category)))

  const filteredProducts = useMemo(() => {
    let filtered = products

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    // Filter by price
    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Sort
    if (sortBy === "price-low") {
      filtered = [...filtered].sort((a, b) => a.price - b.price)
    } else if (sortBy === "price-high") {
      filtered = [...filtered].sort((a, b) => b.price - a.price)
    } else if (sortBy === "rating") {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating)
    } else if (sortBy === "newest") {
      filtered = [...filtered].reverse()
    }

    return filtered
  }, [selectedCategory, sortBy, priceRange, searchQuery])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">{t.shop}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 border border-border sticky top-20">
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Tìm kiếm</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t.searchProducts}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Danh mục</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setCurrentPage(1)
                    }}
                    className={`block w-full text-left px-3 py-2 rounded transition ${
                      selectedCategory === null ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-3 py-2 rounded transition ${
                        selectedCategory === category ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Khoảng giá</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="2000000"
                    value={priceRange[1]}
                    onChange={(e) => {
                      setPriceRange([priceRange[0], Number(e.target.value)])
                      setCurrentPage(1)
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span>{priceRange[0].toLocaleString("vi-VN")}₫</span>
                    <span>{priceRange[1].toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <h3 className="font-semibold mb-4">Sắp xếp</h3>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="featured">Nổi bật</option>
                  <option value="price-low">Giá: Thấp đến Cao</option>
                  <option value="price-high">Giá: Cao đến Thấp</option>
                  <option value="rating">Xếp hạng cao nhất</option>
                  <option value="newest">Mới nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-muted-foreground">
                Hiển thị {paginatedProducts.length} / {filteredProducts.length} sản phẩm
              </p>
            </div>

            {paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Không tìm thấy sản phẩm phù hợp với bộ lọc của bạn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
