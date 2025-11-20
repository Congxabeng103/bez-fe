"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { manualFetchApi } from "@/lib/api";
import { ImageUpload } from "./image-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductImage {
  id: number;
  imageUrl: string;
}

interface AlbumManagerDialogProps {
  isOpen: boolean;
  onClose: (didChange: boolean) => void;
  productId: number;
  productName: string;
  canEdit: boolean;
}

interface DeleteDialogState {
  isOpen: boolean;
  image: ProductImage | null;
}

export function AlbumManagerDialog({ isOpen, onClose, productId, productName, canEdit }: AlbumManagerDialogProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ isOpen: false, image: null });

  const fetchImages = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const result = await manualFetchApi(`/v1/products/${productId}/images`);
      if (result.status === 'SUCCESS') {
        setImages(result.data || []);
      } else {
        toast.error(result.message || "Lỗi tải album ảnh");
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
      setHasChanged(false);
    }
  }, [isOpen, fetchImages]);

  const handleUploadComplete = async (newImageUrl: string) => {
    if (!canEdit) return;
    if (!newImageUrl || newImageUrl === "loading") {
        if (newImageUrl === "loading") {
            setIsUploading(true);
        } else {
            setIsUploading(false);
        }
        return; 
    }
    
    setIsUploading(true);
    try {
      const result = await manualFetchApi(`/v1/products/${productId}/images`, {
        method: 'POST',
        body: JSON.stringify({ imageUrl: newImageUrl })
      });
      if (result.status === 'SUCCESS') {
        toast.success("Đã thêm ảnh vào album.");
        setHasChanged(true);
        fetchImages();
      } else {
        throw new Error(result.message || "Lỗi đăng ký ảnh vào album");
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    const image = deleteDialog.image;
    if (!image || !canEdit) return;

    try {
      const result = await manualFetchApi(`/v1/products/images/${image.id}`, {
        method: "DELETE",
      });
      if (result.status === 'SUCCESS') {
        toast.success("Đã xóa ảnh khỏi album.");
        setHasChanged(true);
        fetchImages();
      } else {
        throw new Error(result.message || "Xóa thất bại");
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setDeleteDialog({ isOpen: false, image: null });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose(hasChanged)}>
        <DialogContent 
          className={`h-[90vh] flex flex-col ${canEdit ? 'max-w-4xl' : 'max-w-2xl'}`}
        >
          {/* ĐÃ SỬA: Bỏ nút X thủ công, chỉ giữ lại Title và Description */}
          <DialogHeader className="space-y-1 pr-6">
            <DialogTitle>Album ảnh: {productName}</DialogTitle>
            <DialogDescription>
              {canEdit ? "Thêm/Xóa ảnh phụ cho sản phẩm này." : "Xem danh sách ảnh phụ của sản phẩm."}
            </DialogDescription>
          </DialogHeader>
          
          <div 
            className={`grid grid-cols-1 flex-1 overflow-hidden pt-4 ${canEdit ? 'md:grid-cols-3 md:gap-6' : ''}`}
          >
            {/* Cột 1: Tải lên (Chỉ hiện khi 'canEdit') */}
            {canEdit && (
              <div className="md:col-span-1 space-y-4">
                <h3 className="font-semibold text-foreground">Thêm ảnh mới</h3>
                <ImageUpload
                  value={isUploading ? "loading" : ""} 
                  onChange={handleUploadComplete}
                  label="Tải ảnh lên (tự động lưu)"
                />
                {isUploading && (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Đang xử lý ảnh...
                  </p>
                )}
              </div>
            )}
            
            {/* Cột 2: Lưới ảnh (Luôn hiển thị) */}
            <div 
              className={`space-y-4 flex flex-col overflow-hidden ${canEdit ? 'md:col-span-2' : 'col-span-1'}`}
            >
              <h3 className="font-semibold text-foreground">Ảnh hiện tại ({images.length})</h3>
              
              <div className="flex-1 overflow-y-auto pr-2 border-t pt-4">
                {isLoading && (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoading && images.length === 0 && (
                  <p className="text-center text-muted-foreground py-10">Sản phẩm này chưa có ảnh trong album.</p>
                )}
                {!isLoading && images.length > 0 && (
                  <div className={`grid gap-2 ${canEdit ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
                    {images.map((image) => (
                      <div key={image.id} className="relative aspect-square group">
                        <img
                          src={image.imageUrl}
                          alt="Album"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        {/* Nút Xóa (Chỉ hiện khi 'canEdit') */}
                        {canEdit && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="w-8 h-8"
                              title="Xóa ảnh này"
                              onClick={() => setDeleteDialog({ isOpen: true, image: image })}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => onClose(hasChanged)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Xác nhận Xóa ảnh */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, image: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận XÓA ẢNH?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa ảnh này khỏi album? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Xác nhận Xóa
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}