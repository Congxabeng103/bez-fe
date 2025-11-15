"use client";

import { useState, useEffect, useCallback } from "react";
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
// --- SỬA: Thay đổi hằng số giá ---
const DEFAULT_MAX_PRICE = 100000; // Đổi tên thành giá trị dự phòng
const PRICE_STEP = 1000; // Định nghĩa bước nhảy

export default function ProductsPage() {
  const { token } = useAuthStore.getState();

  const [products, setProducts] = useState<ProductResponseDTO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // --- SỬA: Tách riêng các state loading ---
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  // --- KẾT THÚC SỬA ---

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("createdAt,desc");

  // --- SỬA: Thêm state cho giá API và cập nhật state priceRange ---
  const [apiMaxPrice, setApiMaxPrice] = useState(DEFAULT_MAX_PRICE);
  const [priceRange, setPriceRange] = useState([0, DEFAULT_MAX_PRICE]);
  // --- KẾT THÚC SỬA ---

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // --- SỬA: Cập nhật fetchProducts ---
  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true); // Dùng state riêng
    const url = new URL(`${API_URL}/v1/products`);
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", sortBy);
    url.searchParams.append("status", "ACTIVE");
    url.searchParams.append("hasVariants", "true");
    if (searchQuery) {
      url.searchParams.append("search", searchQuery);
    }

    if (selectedCategory) {
      url.searchParams.append("categoryName", selectedCategory);
    }
    if (priceRange[0] > 0) {
      url.searchParams.append("minPrice", priceRange[0].toString());
    }
    
    // Dùng apiMaxPrice (state động) thay vì hằng số
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
      setIsProductsLoading(false); // Dùng state riêng
    }
    // Thêm apiMaxPrice vào dependency array
  }, [currentPage, sortBy, searchQuery, selectedCategory, priceRange, apiMaxPrice]);

  // --- SỬA: Cập nhật fetchCategories ---
  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true); // Dùng state riêng
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
      setIsCategoriesLoading(false); // Dùng state riêng
    }
  }, []);

  // --- SỬA: Thay đổi logic useEffect ---

  // 1. useEffect này chỉ chạy fetchProducts KHI filter thay đổi
  //    HOẶC khi giá tối đa vừa load xong
  useEffect(() => {
    // Không chạy fetchProducts cho đến khi giá max được load xong
    if (isPriceLoading) {
      return;
    }
    fetchProducts();
  }, [fetchProducts, isPriceLoading]); // Phụ thuộc vào fetchProducts VÀ isPriceLoading

  // 2. useEffect này chạy 1 LẦN KHI MOUNT
  //    Nó sẽ load Categories và Max Price cùng lúc
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
          // Làm tròn lên 50,000 gần nhất để khớp với 'step'
          const roundedMaxPrice = Math.ceil(rawMaxPrice / PRICE_STEP) * PRICE_STEP;
          setApiMaxPrice(roundedMaxPrice);
          setPriceRange([0, roundedMaxPrice]); // Cập nhật thanh trượt
        } else {
          // Fallback nếu API trả về 0 hoặc lỗi
          setApiMaxPrice(DEFAULT_MAX_PRICE);
          setPriceRange([0, DEFAULT_MAX_PRICE]);
        }
      } catch (err: any) {
        toast.error(err.message || "Lỗi tải giá tối đa, dùng giá trị mặc định.");
        setApiMaxPrice(DEFAULT_MAX_PRICE);
        setPriceRange([0, DEFAULT_MAX_PRICE]);
      } finally {
        setIsPriceLoading(false); // Hoàn tất load giá
      }
    };
    
    fetchMaxPrice();

  }, [fetchCategories]); // fetchCategories là useCallback rỗng, nên đây chỉ chạy 1 lần

  // --- KẾT THÚC SỬA ---

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
              {/* Tìm kiếm (Giữ nguyên) */}
              <div className="mb-6">
                 {/* ... (code tìm kiếm) ... */}
              </div>

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
                    max={apiMaxPrice} // SỬA: Dùng giá max động
                    step={PRICE_STEP} // SỬA: Dùng hằng số step
                    value={priceRange[1]}
                    onChange={(e) => {
                      setPriceRange([priceRange[0], Number(e.target.value)])
                      setCurrentPage(1)
                    }}
                    className="w-full"
                    disabled={isPriceLoading} // SỬA: Vô hiệu hóa khi đang load giá
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
                {/* Chúng ta chỉ hiển thị số lượng khi loading xong 
                  Nếu đang loading, filteredProducts.length là 0 (của lần render trước)
                */}
                {!isProductsLoading && `Hiển thị ${filteredProducts.length} kết quả`}
              </p>
            </div>

            {/* SỬA: Dùng state isProductsLoading */}
            {isProductsLoading ? (
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