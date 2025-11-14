"use client";

import { useState, useEffect, useCallback } from "react"; // Bỏ useMemo
import { ProductCard } from "@/components/store/product-card";
import { Pagination } from "@/components/store/pagination";
import { Search, Loader2 } from "lucide-react";
import { translations as t } from "@/lib/translations";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import { ProductResponseDTO } from "@/types/productDTO";

// Interface cho Category
interface Category {
  id: number;
  name: string;
}

const ITEMS_PER_PAGE = 12;
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_PRICE = 5000000; // Định nghĩa giá tối đa

export default function ProductsPage() {
  const { token } = useAuthStore.getState();

  const [products, setProducts] = useState<ProductResponseDTO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // --- LOGIC GỌI API ĐÚNG (Đã sửa) ---
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const url = new URL(`${API_URL}/v1/products`);
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", sortBy);
    url.searchParams.append("status", "ACTIVE"); // Trang shop chỉ lấy Active

    if (searchQuery) {
      url.searchParams.append("search", searchQuery);
    }

    // Gửi bộ lọc lên backend
    if (selectedCategory) {
      url.searchParams.append("categoryName", selectedCategory);
    }
    if (priceRange[0] > 0) {
      url.searchParams.append("minPrice", priceRange[0].toString());
    }
    if (priceRange[1] < MAX_PRICE) {
      url.searchParams.append("maxPrice", priceRange[1].toString());
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Không thể tải sản phẩm");

      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setProducts(result.data.content);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(result.message || "Lỗi tải sản phẩm");
        setProducts([]); // Xóa sản phẩm cũ nếu có lỗi
        setTotalPages(0);
      }
    } catch (err: any) {
      toast.error(err.message);
      setProducts([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
    // Thêm các state lọc vào dependency array
  }, [currentPage, sortBy, searchQuery, selectedCategory, priceRange]);

  // Logic gọi API Category (Giữ nguyên)
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/v1/categories/all-brief`);
      if (!response.ok) throw new Error("Không thể tải danh mục");

      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setCategories(result.data);
      } else {
        toast.error(result.message || "Lỗi tải danh mục");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }, []);

  // Chạy API khi filter thay đổi
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // fetchProducts giờ đã phụ thuộc vào các bộ lọc

  // Chạy API Category (chỉ 1 lần)
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- ĐÃ BỎ `useMemo` ---
  // 'products' giờ đã là dữ liệu được lọc chính xác từ API
  const filteredProducts = products;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">{t.shop}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 border border-border sticky top-20">
              {/* Tìm kiếm */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Tìm kiếm</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t.searchProducts}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset trang khi tìm kiếm
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

                            {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Danh mục</h3>
                {/* Thêm max-h-60 (hoặc 72, 80 tùy bạn) và overflow-y-auto */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2"> {/* <--- ĐÃ SỬA */}
                  <button
                    onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                    className={`block w-full text-left px-3 py-2 rounded transition ${
                      selectedCategory === null ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => { setSelectedCategory(category.name); setCurrentPage(1); }}
                      className={`block w-full text-left px-3 py-2 rounded transition ${
                        selectedCategory === category.name ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      {category.name}
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
                    max={MAX_PRICE}
                    step="50000"
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
                  <option value="createdAt,desc">Mới nhất</option>
                  <option value="price,asc">Giá: Thấp đến Cao</option>
                  <option value="price,desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-muted-foreground">
                Hiển thị {filteredProducts.length} kết quả
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Không tìm thấy sản phẩm phù hợp.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}