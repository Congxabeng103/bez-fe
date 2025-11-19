"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Images } from "lucide-react";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { manualFetchApi } from "@/lib/api";
import { AlbumManagerDialog } from "@/components/store/album-manager-dialog";
import { useAuthStore } from "@/lib/authStore";

interface ProductBrief {
  id: number;
  name: string;
  imageUrl: string | null;
  galleryImageCount: number; 
}

const ITEMS_PER_PAGE = 5;

export function ProductImageManagement() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  
  // === SỬA: Tách rõ quyền XEM và SỬA ===
  const canView = roles.includes("ADMIN") || roles.includes("MANAGER") || roles.includes("STAFF");
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  // ==================================

  const [products, setProducts] = useState<ProductBrief[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductBrief | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!canView) return; // <-- Sửa: Dùng canView
    setIsLoading(true);
    const query = new URLSearchParams();
    query.append("page", (currentPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("sort", "name,asc");
    query.append("status", "ALL"); 
    if (searchTerm) query.append("search", searchTerm);
    
    try {
      const result = await manualFetchApi(`/v1/products?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        setProducts(result.data.content);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(result.message || "Lỗi tải sản phẩm");
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, canView]); // <-- Sửa: Dùng canView

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAlbum = (product: ProductBrief) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = (didChange: boolean) => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    if (didChange) {
      fetchProducts();
    }
  };

  if (!canView) { // <-- Sửa: Dùng canView
    return (
      <div className="p-4 sm:p-6 space-y-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-destructive">Truy cập bị từ chối</h1>
        <p className="text-muted-foreground">Bạn không có quyền xem trang này.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Album Ảnh Sản phẩm</CardTitle>
          <p className="text-sm text-muted-foreground">
            Chọn một sản phẩm để thêm/xóa ảnh trong album.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center mb-4">
            <Search size={18} className="text-muted-foreground flex-shrink-0" />
            <Input 
              placeholder="Tìm kiếm sản phẩm theo tên..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="flex-1 h-9" 
            />
          </div>

          {isLoading && products.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse">Đang tải sản phẩm...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{searchTerm ? "Không tìm thấy sản phẩm." : "Chưa có sản phẩm nào."}</div>
          ) : (
            <>
              <div className="space-y-2">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                       <img 
                         src={product.imageUrl || "/placeholder.svg"} 
                         alt={product.name} 
                         className="w-12 h-12 object-contain rounded border"
                         onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                       />
                       <div>
                         <span className="font-semibold text-foreground">{product.name}</span>
                         <p className="text-xs text-muted-foreground">
                           Đang có {product.galleryImageCount} ảnh trong album
                         </p>
                       </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 h-8 text-xs px-3"
                      onClick={() => handleOpenAlbum(product)}
                    >
                      <Images size={14} /> 
                      {/* Sửa text: STAFF chỉ được Xem */}
                      {canEdit ? "Quản lý Album" : "Xem Album"} 
                    </Button>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center pt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {selectedProduct && (
        <AlbumManagerDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          canEdit={canEdit} // <-- SỬA: Truyền quyền 'canEdit' vào Dialog
        />
      )}
    </div>
  );
}