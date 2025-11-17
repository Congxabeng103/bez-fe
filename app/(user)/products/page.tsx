"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductCard } from "@/components/store/product-card";
import { Pagination } from "@/components/store/pagination";
import { Search, Loader2 } from "lucide-react";
import { translations as t } from "@/lib/translations";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import { ProductResponseDTO } from "@/types/productDTO";

// --- BỔ SUNG: Hook useDebounce ---
// Bạn có thể đặt hook này ở đây, hoặc tách ra file riêng (ví dụ: hooks/useDebounce.ts)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Đặt một timer để cập nhật giá trị
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy timer nếu value thay đổi (ví dụ: người dùng gõ tiếp)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Chỉ chạy lại nếu value hoặc delay thay đổi

  return debouncedValue;
}
// --- KẾT THÚC BỔ SUNG ---


// Interface cho Category
interface Category {
  id: number;
  name: string;
}

const ITEMS_PER_PAGE = 12;
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_MAX_PRICE = 100000;
const PRICE_STEP = 1000;

export default function ProductsPage() {
  const { token } = useAuthStore.getState();

  const [products, setProducts] = useState<ProductResponseDTO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("createdAt,desc");

  const [apiMaxPrice, setApiMaxPrice] = useState(DEFAULT_MAX_PRICE);
  const [priceRange, setPriceRange] = useState([0, DEFAULT_MAX_PRICE]);

  // --- SỬA: Tách state cho Search và Debounce ---
  const [searchQuery, setSearchQuery] = useState(""); // State này dùng để gọi API
  const [searchTerm, setSearchTerm] = useState(""); // State này dùng cho ô input
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Chờ 500ms
  // --- KẾT THÚC SỬA ---

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // fetchProducts giữ nguyên, nó đã dùng `searchQuery`
  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    const url = new URL(`${API_URL}/v1/products`);
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", sortBy);
    url.searchParams.append("status", "ACTIVE");
    url.searchParams.append("hasVariants", "true");

    // `searchQuery` đã được cập nhật bởi debounce
    if (searchQuery) {
      url.searchParams.append("search", searchQuery);
    }

    if (selectedCategory) {
      url.searchParams.append("categoryName", selectedCategory);
    }
    if (priceRange[0] > 0) {
      url.searchParams.append("minPrice", priceRange[0].toString());
    }
    if (priceRange[1] < apiMaxPrice) {
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
        setProducts([]);
        setTotalPages(0);
      }
    } catch (err: any) {
      toast.error(err.message);
      setProducts([]);
      setTotalPages(0);
    } finally {
      setIsProductsLoading(false);
    }
  }, [currentPage, sortBy, searchQuery, selectedCategory, priceRange, apiMaxPrice]);

  // fetchCategories giữ nguyên
  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
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
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);


  // --- BỔ SUNG: useEffect cho Debounce Search ---
  useEffect(() => {
    // Cập nhật `searchQuery` (sẽ trigger fetch) khi người dùng ngừng gõ
    setSearchQuery(debouncedSearchTerm);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
  }, [debouncedSearchTerm]);
  // --- KẾT THÚC BỔ SUNG ---


  // useEffect này chạy fetchProducts khi filter thay đổi
  useEffect(() => {
    if (isPriceLoading) {
      return;
    }
    fetchProducts();
  }, [fetchProducts, isPriceLoading]);

  // useEffect này chạy 1 lần khi mount để load categories và max price
  useEffect(() => {
    fetchCategories();

    const fetchMaxPrice = async () => {
      setIsPriceLoading(true);
      try {
        const response = await fetch(`${API_URL}/v1/products/max-price`);
        if (!response.ok) throw new Error('Không thể tải giá tối đa');

        const maxPriceValue = await response.json();
        const rawMaxPrice = Number(maxPriceValue);

        if (rawMaxPrice > 0) {
          const roundedMaxPrice = Math.ceil(rawMaxPrice / PRICE_STEP) * PRICE_STEP;
          setApiMaxPrice(roundedMaxPrice);
          setPriceRange([0, roundedMaxPrice]);
        } else {
          setApiMaxPrice(DEFAULT_MAX_PRICE);
          setPriceRange([0, DEFAULT_MAX_PRICE]);
        }
      } catch (err: any) {
        toast.error(err.message || "Lỗi tải giá tối đa, dùng giá trị mặc định.");
        setApiMaxPrice(DEFAULT_MAX_PRICE);
        setPriceRange([0, DEFAULT_MAX_PRICE]);
      } finally {
        setIsPriceLoading(false);
      }
    };

    fetchMaxPrice();

  }, [fetchCategories]); // Chỉ chạy 1 lần


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

              {/* --- SỬA: Thêm UI cho ô tìm kiếm --- */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Tìm kiếm</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm..."
                    // Dùng state của input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              {/* --- KẾT THÚC SỬA --- */}

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Danh mục</h3>
                {isCategoriesLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
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
                )}
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Khoảng giá</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={apiMaxPrice}
                    step={PRICE_STEP}
                    value={priceRange[1]}
                    onChange={(e) => {
                      setPriceRange([priceRange[0], Number(e.target.value)])
                      setCurrentPage(1)
                    }}
                    className="w-full"
                    disabled={isPriceLoading}
                  />
                  <div className="flex justify-between text-sm">
                    <span>{priceRange[0].toLocaleString("vi-VN")}₫</span>
                    <span>{priceRange[1].toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>

              {/* Sort Filter (Giữ nguyên) */}
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
                {/* --- SỬA: Dùng `products.length` --- */}
                {!isProductsLoading && `Hiển thị ${products.length} kết quả`}
              </p>
            </div>

            {/* --- SỬA: Dùng `products.length` --- */}
            {isProductsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* --- SỬA: Dùng `products.map` --- */}
                  {products.map((product) => (
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