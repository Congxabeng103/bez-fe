"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Thêm useRouter, useSearchParams
import Link from "next/link"; // Thêm Link
import { ProductCard } from "@/components/store/product-card";
import { Pagination } from "@/components/store/pagination";
import { Search, Loader2, PartyPopper, Tag } from "lucide-react"; // Thêm icon
import { translations as t } from "@/lib/translations";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import { ProductResponseDTO } from "@/types/productDTO";

// --- Hook useDebounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Interface cho Category
interface Category {
  id: number;
  name: string;
}

const ITEMS_PER_PAGE = 12;
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_MAX_PRICE = 100000;
const PRICE_STEP = 1000;

// --- TÁCH COMPONENT CON ĐỂ BỌC SUSPENSE ---
function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Lấy giá trị từ URL
  const urlCategory = searchParams.get("category");
  const urlBrand = searchParams.get("brand");
  const urlPromotionId = searchParams.get("promotionId");
  const urlSearch = searchParams.get("search"); // Lấy search từ URL nếu có

  const { token } = useAuthStore.getState();

  const [products, setProducts] = useState<ProductResponseDTO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  // Khởi tạo state từ URL hoặc mặc định
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const [sortBy, setSortBy] = useState("createdAt,desc");
  const [apiMaxPrice, setApiMaxPrice] = useState(DEFAULT_MAX_PRICE);
  const [priceRange, setPriceRange] = useState([0, DEFAULT_MAX_PRICE]);

  const [searchQuery, setSearchQuery] = useState(urlSearch || ""); 
  const [searchTerm, setSearchTerm] = useState(urlSearch || ""); 
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // --- 1. SỬA: Hàm fetchProducts nhận diện Brand và Promotion ---
  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    const url = new URL(`${API_URL}/v1/products`);
    
    // Các params cơ bản
    url.searchParams.append("page", (currentPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("sort", sortBy);
    url.searchParams.append("status", "ACTIVE");
    url.searchParams.append("hasVariants", "true");

    // Search
    if (searchQuery) {
      url.searchParams.append("search", searchQuery);
    }

    // Category (Ưu tiên state local -> URL)
    const activeCategory = selectedCategory || urlCategory;
    if (activeCategory) {
      url.searchParams.append("categoryName", activeCategory);
    }

    // Price
    if (priceRange[0] > 0) {
      url.searchParams.append("minPrice", priceRange[0].toString());
    }
    if (priceRange[1] < apiMaxPrice) {
      url.searchParams.append("maxPrice", priceRange[1].toString());
    }

    // === LOGIC MỚI: BRAND & PROMOTION ===
    // Lấy trực tiếp từ URL params (vì chúng ta không làm state riêng cho nó ở sidebar)
    if (urlBrand) {
      url.searchParams.append("brandName", urlBrand);
    }
    if (urlPromotionId) {
      url.searchParams.append("promotionId", urlPromotionId);
    }
    // ====================================

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
  }, [currentPage, sortBy, searchQuery, selectedCategory, priceRange, apiMaxPrice, urlCategory, urlBrand, urlPromotionId]);

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


  // Effect cập nhật search query
  useEffect(() => {
    setSearchQuery(debouncedSearchTerm);
    if (debouncedSearchTerm !== urlSearch) {
       setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Effect chính để fetch sản phẩm
  useEffect(() => {
    if (isPriceLoading) return;
    fetchProducts();
  }, [fetchProducts, isPriceLoading]);

  // Effect lấy max price & categories
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
        // toast.error(err.message); // Ẩn lỗi này cho đỡ phiền
        setApiMaxPrice(DEFAULT_MAX_PRICE);
        setPriceRange([0, DEFAULT_MAX_PRICE]);
      } finally {
        setIsPriceLoading(false);
      }
    };
    fetchMaxPrice();
  }, [fetchCategories]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Hàm reset filter (Về trang gốc)
  const clearFilters = () => {
    router.push('/products');
    setSelectedCategory(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">{t.shop}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 border border-border sticky top-20">

              <div className="mb-6">
                <h3 className="font-semibold mb-4">Tìm kiếm</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-4">Danh mục</h3>
                {isCategoriesLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    <button
                      onClick={() => { 
                        setSelectedCategory(null); 
                        setCurrentPage(1); 
                        // Nếu đang có brand/promotion trên URL, việc set null này chỉ bỏ chọn category
                      }}
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
            {/* --- 2. SỬA: THÔNG BÁO FILTER ẨN --- */}
            <div className="mb-6 space-y-3">
              
              {/* Thông báo Khuyến mãi */}
              {urlPromotionId && (
                <div className="bg-orange-100 text-orange-800 px-4 py-3 rounded-md flex justify-between items-center border border-orange-200 shadow-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <PartyPopper className="h-5 w-5 text-orange-600" /> 
                    Đang xem sản phẩm trong chương trình khuyến mãi
                  </span>
                  <button onClick={clearFilters} className="text-sm font-semibold hover:underline text-orange-900">
                    Xóa
                  </button>
                </div>
              )}

              {/* Thông báo Thương hiệu */}
              {urlBrand && (
                <div className="bg-blue-100 text-blue-800 px-4 py-3 rounded-md flex justify-between items-center border border-blue-200 shadow-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Tag className="h-5 w-5 text-blue-600" />
                    Thương hiệu: {urlBrand}
                  </span>
                  <button onClick={clearFilters} className="text-sm font-semibold hover:underline text-blue-900">
                    Xóa
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  {!isProductsLoading && `Hiển thị ${products.length} kết quả`}
                </p>
              </div>
            </div>
            {/* ------------------------------------ */}

            {isProductsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <p className="text-muted-foreground text-lg">Không tìm thấy sản phẩm phù hợp.</p>
                {(urlBrand || urlPromotionId) && (
                  <button onClick={clearFilters} className="mt-4 text-primary hover:underline">
                    Quay lại xem tất cả sản phẩm
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT CHÍNH (WRAPPER) ---
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}