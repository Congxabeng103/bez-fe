"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, X, Search, ArrowLeft, ArrowRight, RotateCcw, XCircle } from "lucide-react"; // <-- THÊM XCircle
import { useAuthStore } from "@/lib/authStore";
import { ImageUpload } from "@/components/store/image-upload";
import { Pagination } from "@/components/store/pagination";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label"; 
import { Checkbox } from "@/components/ui/checkbox"; 
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { manualFetchApi } from "@/lib/api";
// THÊM: Import Alert Dialog
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

// === SỬA LỖI 1: DI CHUYỂN INTERFACE RA NGOÀI ===
const ITEMS_PER_PAGE = 5;
const PRODUCTS_PER_PAGE = 5;
const CLEAR_SELECTION_VALUE = "__CLEAR__"; // (Thêm hằng số)

interface ProductOptionValueResponse { id: number; value: string; }
interface ProductOptionResponse { id: number; name: string; values: ProductOptionValueResponse[]; }
interface ProductBrief { id: number; name: string; variantCount: number; }

interface VariantResponse {
  id: number; sku: string; price: number; stockQuantity: number;
  imageUrl: string | null; // <-- Sửa: Cho phép null
  attributes: Record<string, string>; createdAt: string;
  active: boolean; 
  orderCount: number;
  salePrice: number | null; 
  isPromotionStillValid: boolean | null;
}

interface ProductDetailResponse {
  product: ProductBrief;
  attributes: ProductOptionResponse[];
}

interface Combination {
  attributes: Record<string, string>; sku: string; price: number | string;
  stock: number | string; image: string;
}

interface EditingVariantData {
  sku: string; price: number | string; stockQuantity: number | string; 
  imageUrl: string; active: boolean; 
}

// Kiểu cho state của Dialog
interface DialogState<T> {
  isOpen: boolean;
  action: 'delete' | 'reactivate' | 'permanentDelete' | 'cancelCreate' | 'cancelBatch' | null;
  data: T | null;
}
// === KẾT THÚC SỬA LỖI 1 ===


// --- Component Chính: Quản lý Biến thể ---
export function VariantManagement() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canEdit = roles.includes("ADMIN") || roles.includes("MANAGER");
  const isAdmin = roles.includes("ADMIN");

  // --- States ---
  const [productsBrief, setProductsBrief] = useState<ProductBrief[]>([]);
  const [productSpecificOptions, setProductSpecificOptions] = useState<ProductOptionResponse[]>([]);
  const [productVariants, setProductVariants] = useState<VariantResponse[]>([]);
  
  const [productPage, setProductPage] = useState(1);
  const [totalProductPages, setTotalProductPages] = useState(0);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  
  const [variantPage, setVariantPage] = useState(1);
  const [totalVariantPages, setTotalVariantPages] = useState(0);
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [isFetchingVariants, setIsFetchingVariants] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedAttributesMap, setSelectedAttributesMap] = useState<Record<string, string[]>>({});
  const [generatedCombinations, setGeneratedCombinations] = useState<Combination[]>([]);
  
  const [isLoadingProductOptions, setIsLoadingProductOptions] = useState(false);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false); // (Thêm state loading cho batch)
  
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingVariantData, setEditingVariantData] = useState<EditingVariantData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [viewingProductId, setViewingProductId] = useState<number | null>(null);
  const [viewingProductName, setViewingProductName] = useState<string>("");
  
  const [apiError, setApiError] = useState<string | null>(null); // <-- Sửa: Dùng tên này
  const [filterStatus, setFilterStatus] = useState("ALL"); 
  
  // (Các state cho modal/dialog)
  const [modalError, setModalError] = useState<string | null>(null); 
  const [variantDialogState, setVariantDialogState] = useState<DialogState<VariantResponse>>({ isOpen: false, action: null, data: null });
  const [batchDialogState, setBatchDialogState] = useState<DialogState<null>>({ isOpen: false, action: null, data: null });

  // --- Fetch Data ---
  const fetchProductsBrief = useCallback(async () => {
    setIsFetchingProducts(true);
    const query = new URLSearchParams();
    query.append("page", (productPage - 1).toString());
    query.append("size", PRODUCTS_PER_PAGE.toString());
    if (productSearchTerm) query.append("search", productSearchTerm);
    
    try {
      const result = await manualFetchApi(`/v1/products/brief?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        setProductsBrief(result.data.content || []); 
        setTotalProductPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải DS sản phẩm");
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setIsFetchingProducts(false); 
    }
  }, [productPage, productSearchTerm]);
  
  const fetchProductVariants = useCallback(async () => {
    if (!viewingProductId) return;
    setIsFetchingVariants(true); setApiError(null);
    const query = new URLSearchParams();
    query.append("page", (variantPage - 1).toString());
    query.append("size", ITEMS_PER_PAGE.toString());
    query.append("status", filterStatus); 
    if (variantSearchTerm) query.append("search", variantSearchTerm);
    
    try {
      const result = await manualFetchApi(`/v1/variants/product/${viewingProductId}?${query.toString()}`);
      if (result.status === 'SUCCESS' && result.data) {
        setProductVariants(result.data.content || []);
        setTotalVariantPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải biến thể");
    } catch (err: any) { 
      setApiError(err.message); 
      toast.error(`Lỗi tải biến thể: ${err.message}`); 
    } finally { 
      setIsFetchingVariants(false); 
    }
  }, [viewingProductId, variantPage, variantSearchTerm, filterStatus]); 

  const fetchProductDetailsAndOptions = useCallback(async (productId: string) => {
    setIsLoadingProductOptions(true);
    setProductSpecificOptions([]); 
    try {
      const result = await manualFetchApi(`/v1/products/detail/${productId}`);
      if (result.status === 'SUCCESS' && result.data) {
        setProductSpecificOptions(result.data.attributes || []); 
        if (!result.data.attributes || result.data.attributes.length === 0) {
          toast.warning("Sản phẩm này chưa được định nghĩa thuộc tính.");
        }
      } else {
        throw new Error(result.message || "Lỗi tải thuộc tính của sản phẩm");
      }
    } catch (err: any) { 
      toast.error(err.message); 
      setSelectedProductId(""); 
    } finally { 
      setIsLoadingProductOptions(false); 
    }
  }, []);

  // --- useEffect Hooks ---
  useEffect(() => { fetchProductsBrief(); }, [fetchProductsBrief]);
  useEffect(() => { if (viewingProductId) fetchProductVariants(); }, [fetchProductVariants]);

  useEffect(() => {
    if (selectedProductId && showForm) {
      setSelectedAttributesMap({});
      setGeneratedCombinations([]);
      fetchProductDetailsAndOptions(selectedProductId);
    }
  }, [selectedProductId, showForm, fetchProductDetailsAndOptions]);

  // --- Handlers ---
  const findOptionValueId = (attrName: string, attrValue: string): number | null => {
    const attribute = productSpecificOptions.find(a => a.name === attrName);
    if (!attribute) return null;
    const valueObj = attribute.values.find(v => v.value === attrValue);
    return valueObj ? valueObj.id : null;
  };
  
  // (Logic tạo Batch + Validate)
  const handleSaveVariants = async () => {
    if (!canEdit) { toast.error("Bạn không có quyền."); return; }
    if (!selectedProductId || generatedCombinations.length === 0) { toast.error("Thiếu thông tin sản phẩm hoặc biến thể."); return; }
    
    let invalid = false;
    for (let i = 0; i < generatedCombinations.length; i++) {
      const combo = generatedCombinations[i];
      const sku = combo.sku.trim(); const price = Number(combo.price); const stock = Number(combo.stock);
      if (!sku) { toast.error(`Lỗi dòng ${i + 1}: SKU không được để trống.`); invalid = true; break; }
      if (isNaN(price) || price <= 0) { toast.error(`Lỗi dòng ${i + 1}: Giá "${combo.price}" không hợp lệ.`); invalid = true; break; }
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) { toast.error(`Lỗi dòng ${i + 1}: Tồn kho "${combo.stock}" không hợp lệ.`); invalid = true; break; }
    }
    if (invalid) return;

    setIsLoadingBatch(true); // <-- Bật loading

    const variantsRawData = generatedCombinations.map(combo => {
      const originalAttributes = combo.attributes; 
      const optionValueIds = Object.entries(originalAttributes)
        .map(([attrName, attrValue]) => findOptionValueId(attrName, attrValue))
        .filter((id): id is number => id !== null);
      return {
        sku: combo.sku.trim(), price: Number(combo.price), stockQuantity: Number(combo.stock),
        imageUrl: combo.image || null, optionValueIds: optionValueIds,
        _originalAttributeCount: Object.keys(originalAttributes).length 
      };
    });

    if (variantsRawData.some(v => v.optionValueIds.length !== v._originalAttributeCount)) {
        toast.error("Lỗi: Không tìm thấy ID cho một số giá trị thuộc tính. Vui lòng thử lại.");
        setIsLoadingBatch(false); return;
    }
    
    const batchRequest = {
      productId: Number(selectedProductId),
      variants: variantsRawData.map(v => ({
        sku: v.sku, price: v.price, stockQuantity: v.stockQuantity,
        imageUrl: v.imageUrl, optionValueIds: v.optionValueIds
      }))
    };

    try {
      const result = await manualFetchApi("/v1/variants/batch", {
        method: "POST", body: JSON.stringify(batchRequest) 
      });
      if (result.status !== 'SUCCESS') {
        throw new Error(result.message || "Thêm biến thể thất bại");
      }
      toast.success(`Đã thêm thành công ${result.data?.length || generatedCombinations.length} biến thể!`);
      setShowForm(false);
      setSelectedProductId("");
      setSelectedAttributesMap({});
      setGeneratedCombinations([]);
      setProductPage(1); 
      fetchProductsBrief(); 
    } catch (err: any) {
      toast.error(`Lỗi khi lưu biến thể: ${err.message}`);
    } finally {
      setIsLoadingBatch(false); // <-- Tắt loading
    }
  };
  
  const handleViewProductVariants = (product: ProductBrief) => {
    setViewingProductId(product.id); setViewingProductName(product.name);
    setVariantPage(1); setVariantSearchTerm(""); setFilterStatus("ALL"); // <-- Sửa: Reset filter
  };
  const handleBackToList = () => {
    setViewingProductId(null); setViewingProductName("");
    setProductVariants([]); setTotalVariantPages(0);
    setProductPage(1); setProductSearchTerm("");
    fetchProductsBrief();
  };
  const handleToggleAttributeValueSelection = (attributeName: string, valueString: string) => {
    setSelectedAttributesMap(prev => {
        const currentValues = prev[attributeName] || [];
        const isSelected = currentValues.includes(valueString);
        let newValues;
        if (isSelected) { newValues = currentValues.filter(v => v !== valueString); } 
        else { newValues = [...currentValues, valueString]; }
        return { ...prev, [attributeName]: newValues };
    });
    setGeneratedCombinations([]); 
  };
  const generateCombinations = () => {
    const selectedAttrs = productSpecificOptions.map(option => ({ name: option.name, values: selectedAttributesMap[option.name] || [] })).filter(opt => opt.values.length > 0);
    if (selectedAttrs.length === 0) { toast.warning("Vui lòng chọn ít nhất một giá trị thuộc tính."); return; }
    if (selectedAttrs.length < productSpecificOptions.length) { toast.warning("Bạn phải chọn giá trị cho tất cả các thuộc tính."); return; }
    const combinations: Record<string, string>[] = [];
    const attributeNames = selectedAttrs.map(opt => opt.name);
    const valueArrays = selectedAttrs.map(opt => opt.values);
    const getCombinations = (index: number, currentCombination: Record<string, string>) => {
        if (index === attributeNames.length) { combinations.push({ ...currentCombination }); return; }
        const currentAttributeName = attributeNames[index];
        const currentValues = valueArrays[index];
        for (const value of currentValues) { currentCombination[currentAttributeName] = value; getCombinations(index + 1, currentCombination); }
    };
    getCombinations(0, {});
    const newGeneratedCombinations: Combination[] = combinations.map(combo => ({ attributes: combo, sku: "", price: "", stock: "", image: "" }));
    setGeneratedCombinations(newGeneratedCombinations);
  };
  
  // (Mở Modal Sửa)
  const handleEditVariant = (variant: VariantResponse) => {
    if (!canEdit) { toast.error("Bạn không có quyền sửa."); return; }
    setEditingVariantId(variant.id);
    setEditingVariantData({ 
        sku: variant.sku, price: variant.price, stockQuantity: variant.stockQuantity, 
        imageUrl: variant.imageUrl || "", active: variant.active 
    });
    setModalError(null); // <-- Reset lỗi
    setShowEditModal(true);
  };
  
  // === SỬA: handleSaveEditedVariant (Tích hợp Inline Modal Validation) ===
  const handleSaveEditedVariant = async () => {
    if (!canEdit || !editingVariantId || !editingVariantData) {
      toast.error("Không có quyền hoặc thiếu dữ liệu."); return;
    }
    setModalError(null); // Reset lỗi
    
    const updateRequest = { 
        sku: editingVariantData.sku.trim(), price: Number(editingVariantData.price), 
        stockQuantity: Number(editingVariantData.stockQuantity), 
        imageUrl: editingVariantData.imageUrl || null,
        active: editingVariantData.active 
    };
    
    // Validate
    if (!updateRequest.sku) { setModalError("SKU là bắt buộc"); return; }
    if (isNaN(updateRequest.price) || updateRequest.price <= 0) { setModalError("Giá không hợp lệ"); return; }
    if (isNaN(updateRequest.stockQuantity) || updateRequest.stockQuantity < 0 || !Number.isInteger(updateRequest.stockQuantity)) { setModalError("Tồn kho không hợp lệ"); return; }

    try {
        const result = await manualFetchApi(`/v1/variants/${editingVariantId}`, { 
            method: "PUT", body: JSON.stringify(updateRequest) 
        });
        if (result.status === 'SUCCESS') {
            toast.success("Cập nhật biến thể thành công!"); 
            setShowEditModal(false); setEditingVariantId(null); setEditingVariantData(null);
            fetchProductVariants(); 
        } else throw new Error(result.message || "Cập nhật thất bại");
    } catch (err: any) { 
        setModalError(err.message); // <-- Gán lỗi vào modal
    }
  };
  
  // === SỬA: Logic Dialog cho BIẾN THỂ ===
  const closeVariantDialog = () => {
    setVariantDialogState({ isOpen: false, action: null, data: null });
  };

  const handleVariantConfirmAction = async () => {
    const { action, data: variant } = variantDialogState;
    if (!variant) return;
    
    try {
      if (action === 'delete') {
        if (!canEdit) { toast.error("Bạn không có quyền."); return; }
        const result = await manualFetchApi(`/v1/variants/${variant.id}`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
            toast.success("Đã ngừng hoạt động biến thể!"); 
            if (productVariants.length === 1 && variantPage > 1) setVariantPage(variantPage - 1); 
            else fetchProductVariants(); 
        } else throw new Error(result.message || "Xóa thất bại");
      }
      
      else if (action === 'reactivate') {
        if (!canEdit) { toast.error("Bạn không có quyền."); return; }
        const requestBody = { 
            sku: variant.sku, price: variant.price, stockQuantity: variant.stockQuantity,
            imageUrl: variant.imageUrl, active: true 
        };
        const result = await manualFetchApi(`/v1/variants/${variant.id}`, { method: "PUT", body: JSON.stringify(requestBody) });
        if (result.status === 'SUCCESS') { toast.success("Kích hoạt lại thành công!"); fetchProductVariants(); }
        else throw new Error(result.message || "Kích hoạt thất bại");
      }
      
      else if (action === 'permanentDelete') {
        if (!isAdmin) { toast.error("Bạn không có quyền."); return; }
        const result = await manualFetchApi(`/v1/variants/${variant.id}/permanent`, { method: "DELETE" });
        if (result.status === 'SUCCESS') {
          toast.success("Đã xóa vĩnh viễn biến thể.");
          fetchProductVariants(); 
        } else {
          throw new Error(result.message || "Xóa vĩnh viễn thất bại. Biến thể có thể đã được bán.");
        }
      }
    } catch (err: any) { 
      toast.error(`Lỗi: ${err.message}`); 
    } finally {
      closeVariantDialog();
    }
  };

  // === SỬA: Logic Dialog Hủy Batch ===
  const closeBatchDialog = () => {
    setBatchDialogState({ isOpen: false, action: null, data: null });
  };
  const handleBatchConfirmAction = () => {
    if(batchDialogState.action === 'cancelBatch') {
       setGeneratedCombinations([]);
    } else if (batchDialogState.action === 'cancelCreate') {
       setShowForm(false);
       // Reset toàn bộ state của form tạo
       setSelectedProductId("");
       setProductSpecificOptions([]); 
       setSelectedAttributesMap({});
       setGeneratedCombinations([]);
       setProductSearchTerm(""); // Reset search
       setProductPage(1);
    }
    closeBatchDialog();
  };
  
  const handleTabChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    setVariantPage(1);
    setVariantSearchTerm("");
    setProductVariants([]);
  };
  
  // --- JSX Rendering ---

  // *** Màn hình 2: Xem Danh sách Biến thể (ĐÃ "CHỈNH CHU") ***
  if (viewingProductId && viewingProductName) {
    return (
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 mb-4">
          <Button variant="outline" onClick={handleBackToList} className="gap-1.5 self-start sm:self-center"> <ArrowLeft size={18} /> <span className="hidden sm:inline">Quay lại DS Sản phẩm</span><span className="sm:hidden">Quay lại</span> </Button>
          <div className="flex-1 min-w-0 order-first sm:order-none"> <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate text-center sm:text-left" title={viewingProductName}> Biến thể của: {viewingProductName} </h1> </div>
        </div>
        <Tabs value={filterStatus} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
            <TabsTrigger value="INACTIVE">Ngừng hoạt động</TabsTrigger>
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 items-center">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <Input placeholder="Tìm SKU..." value={variantSearchTerm} onChange={(e) => { setVariantSearchTerm(e.target.value); setVariantPage(1); }} className="flex-1 h-9" />
        </div>
        
        {apiError && !isFetchingVariants && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30">{apiError}</div> )}
        
        {isFetchingVariants ? ( <div className="text-center py-10 text-muted-foreground animate-pulse">Đang tải biến thể...</div>
        ) : productVariants.length === 0 ? (
          <Card className="shadow-none border-dashed border-border/50"> <CardContent className="py-10 text-center text-muted-foreground"> {variantSearchTerm ? `Không tìm thấy biến thể khớp với "${variantSearchTerm}".` : `Không có biến thể nào (${filterStatus.toLowerCase()}).`} </CardContent> </Card>
        ) : (
          <>
            <Card className="overflow-hidden border shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr className="border-b">
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ảnh</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Thuộc tính</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">SKU</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giá</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Tồn kho</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-foreground/80">SL Đơn</th>
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th>
                        {canEdit && (
                          <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[120px]">Hành động</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {productVariants.map((variant) => (
                        <tr key={variant.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!variant.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                          <td className="py-2 px-3"><img src={variant.imageUrl || "/placeholder.svg"} alt={variant.sku} className="w-10 h-10 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}/></td>
                          <td className="py-2 px-3 align-top"><div className="text-xs space-y-0.5 max-w-[180px] break-words text-foreground/90">{Object.entries(variant.attributes).map(([key, value]) => (<div key={key}><span className="font-medium text-foreground/70">{key}:</span> {value}</div>))}</div></td>
                          <td className="py-2 px-3 font-medium text-foreground">{variant.sku}</td>
                          <td className="py-2 px-3 text-right">
                              {variant.isPromotionStillValid && variant.salePrice != null && variant.salePrice < variant.price ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-destructive">{variant.salePrice.toLocaleString('vi-VN')}₫</span>
                                  <span className="text-xs text-muted-foreground line-through">{variant.price.toLocaleString('vi-VN')}₫</span>
                                </div>
                              ) : (
                                <span>{variant.price.toLocaleString('vi-VN')}₫</span>
                              )}
                          </td>
                          <td className="py-2 px-3 text-right">{variant.stockQuantity}</td>
                          <td className="py-2 px-3 text-right text-muted-foreground">{variant.orderCount}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${variant.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                              {variant.active ? "Hoạt động" : "Ngừng HĐ"}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="py-2 px-3">
                              <div className="flex gap-1.5 justify-center">
                                <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa biến thể" onClick={() => handleEditVariant(variant)}>
                                  <Edit2 size={14} />
                                </Button>
                                {variant.active ? (
                                  <Button variant="outline" size="icon" className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" title="Ngừng hoạt động"
                                    onClick={() => setVariantDialogState({ isOpen: true, action: 'delete', data: variant })}> 
                                    <Trash2 size={14} /> 
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="icon" className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50" title="Kích hoạt lại"
                                    onClick={() => setVariantDialogState({ isOpen: true, action: 'reactivate', data: variant })}> 
                                    <RotateCcw size={14} /> 
                                  </Button>
                                )}
                                {/* Nút Xóa vĩnh viễn (ĐÃ SỬA ICON VÀ LOGIC) */}
                                {!variant.active && variant.orderCount === 0 && isAdmin && (
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="w-7 h-7 text-red-700 border-red-700 hover:bg-red-100/50 dark:text-red-500 dark:border-red-500 dark:hover:bg-red-900/30" 
                                    title="Xóa vĩnh viễn" 
                                    onClick={() => setVariantDialogState({ isOpen: true, action: 'permanentDelete', data: variant })}
                                  >
                                    <XCircle size={14} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            {totalVariantPages > 1 && ( <div className="flex justify-center pt-4"><Pagination currentPage={variantPage} totalPages={totalVariantPages} onPageChange={setVariantPage} /></div> )}
          </>
        )}

        {/* Modal Sửa Biến Thể (ĐÃ THÊM HIỂN THỊ LỖI) */}
        {showEditModal && editingVariantData && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in duration-200">
            <Card className="w-full max-w-md bg-card shadow-xl animate-scale-in duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b"><CardTitle className="text-base font-semibold">Chỉnh sửa biến thể</CardTitle><Button variant="ghost" size="icon" className="w-6 h-6 -mr-2 -mt-1 text-muted-foreground hover:bg-muted" onClick={() => setShowEditModal(false)}><X size={16} /></Button></CardHeader>
              <CardContent className="pt-6 space-y-4">
                
                {modalError && ( <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30 animate-shake">{modalError}</div> )}
                
                <div>
                  <Label htmlFor="editSku" className={`text-sm font-medium mb-1.5 ${modalError && modalError.toLowerCase().includes('sku') ? 'text-destructive' : 'text-foreground/90'}`}>SKU *</Label>
                  <Input id="editSku" value={editingVariantData.sku} onChange={(e) => { setEditingVariantData({ ...editingVariantData, sku: e.target.value }); if(modalError) setModalError(null); }} className={modalError && modalError.toLowerCase().includes('sku') ? 'border-destructive' : ''}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editPrice" className={`text-sm font-medium mb-1.5 ${modalError && modalError.toLowerCase().includes('giá') ? 'text-destructive' : 'text-foreground/90'}`}>Giá *</Label>
                    <Input id="editPrice" type="number" value={editingVariantData.price} onChange={(e) => setEditingVariantData({ ...editingVariantData, price: e.target.value })} min="1" placeholder="vd: 150000" className={modalError && modalError.toLowerCase().includes('giá') ? 'border-destructive' : ''}/>
                  </div>
                  <div>
                    <Label htmlFor="editStock" className={`text-sm font-medium mb-1.5 ${modalError && modalError.toLowerCase().includes('tồn kho') ? 'text-destructive' : 'text-foreground/90'}`}>Tồn kho *</Label>
                    <Input id="editStock" type="number" value={editingVariantData.stockQuantity} onChange={(e) => setEditingVariantData({ ...editingVariantData, stockQuantity: e.target.value })} min="0" placeholder="vd: 50" className={modalError && modalError.toLowerCase().includes('tồn kho') ? 'border-destructive' : ''}/>
                  </div>
                </div>
                <div><Label className="block text-sm font-medium mb-1.5 text-foreground/90">Hình ảnh (URL)</Label><ImageUpload value={editingVariantData.imageUrl} onChange={(value) => setEditingVariantData({ ...editingVariantData, imageUrl: value })} label="" className="h-24"/></div>
                <div className="flex items-center gap-2">
                  <Checkbox id="variantActiveForm" checked={editingVariantData.active} onCheckedChange={(checked) => setEditingVariantData({ ...editingVariantData, active: Boolean(checked) })}/>
                  <Label htmlFor="variantActiveForm" className="text-sm">Đang hoạt động</Label>
                </div>
                <div className="flex gap-3 pt-3 border-t"><Button onClick={handleSaveEditedVariant} className="flex-1">Lưu thay đổi</Button><Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Hủy</Button></div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Dialog Xác nhận cho BIẾN THỂ */}
        <AlertDialog open={variantDialogState.isOpen} onOpenChange={(open) => !open && closeVariantDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {variantDialogState.action === 'delete' && "Xác nhận ngừng hoạt động?"}
                {variantDialogState.action === 'reactivate' && "Xác nhận kích hoạt lại?"}
                {variantDialogState.action === 'permanentDelete' && "Xác nhận XÓA VĨNH VIỄN?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {variantDialogState.action === 'delete' && `Bạn có chắc muốn ngừng hoạt động SKU "${variantDialogState.data?.sku}"?`}
                {variantDialogState.action === 'reactivate' && `Bạn có chắc muốn kích hoạt lại SKU "${variantDialogState.data?.sku}"?`}
                {variantDialogState.action === 'permanentDelete' && (
                  <span className="text-red-600 font-medium dark:text-red-400">
                    Hành động này KHÔNG THỂ hoàn tác. Biến thể "{variantDialogState.data?.sku}" sẽ bị xóa vĩnh viễn (vì chưa có đơn hàng nào).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeVariantDialog}>Hủy</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  onClick={handleVariantConfirmAction}
                  variant={ (variantDialogState.action === 'delete' || variantDialogState.action === 'permanentDelete') ? "destructive" : "default" }
                >
                  {variantDialogState.action === 'delete' && "Xác nhận ngừng HĐ"}
                  {variantDialogState.action === 'reactivate' && "Xác nhận kích hoạt"}
                  {variantDialogState.action === 'permanentDelete' && "Xóa vĩnh viễn"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // *** Màn hình 1: Danh sách Sản phẩm & Form Tạo Biến thể Mới (ĐÃ "CHỈNH CHU") ***
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý biến thể sản phẩm</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các biến thể cho sản phẩm</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setShowForm(true); }} className="gap-2 self-start sm:self-center">
            <Plus size={18} /> Tạo biến thể
          </Button>
        )}
      </div>

      {/* --- FORM TẠO BIẾN THỂ --- */}
      {showForm && canEdit && (
        <Card className="border-primary/40 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">Tạo biến thể mới</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Bước 1: Chọn Sản phẩm */}
            <div className="p-4 border rounded-md bg-muted/20">
              <Label htmlFor="productSearchInput" className="block text-sm font-semibold mb-2 text-foreground">1. Chọn sản phẩm cha *</Label>
              <div className="flex gap-2 mb-2 items-center">
                <Input id="productSearchInput" placeholder="Tìm kiếm sản phẩm theo tên..." value={productSearchTerm} onChange={(e) => { setProductSearchTerm(e.target.value); setProductPage(1); }} className="flex-1 h-9"/>
                {isFetchingProducts && <span className="text-xs text-muted-foreground animate-pulse">Đang tìm...</span>}
              </div>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="-- Chọn sản phẩm từ danh sách --" /></SelectTrigger>
                <SelectContent>
                  {productsBrief.length === 0 && !isFetchingProducts && <div className="p-2 text-sm text-muted-foreground text-center">Không có sản phẩm nào.</div>}
                  {productsBrief.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                  {totalProductPages > 1 && (
                    <div className="p-1 pt-2 text-center border-t mt-1">
                      <Pagination currentPage={productPage} totalPages={totalProductPages} onPageChange={setProductPage} />
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Bước 2: Chọn Giá trị */}
            {selectedProductId && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <Label className="block text-sm font-semibold text-foreground">2. Chọn giá trị để tạo tổ hợp *</Label>
                {isLoadingProductOptions && ( <div className="py-4 text-center text-muted-foreground text-sm animate-pulse">Đang tải thuộc tính...</div> )}
                {!isLoadingProductOptions && productSpecificOptions.length === 0 && (
                  <div className="py-4 text-center text-muted-foreground text-sm">Sản phẩm này chưa có thuộc tính nào.</div>
                )}
                {!isLoadingProductOptions && productSpecificOptions.length > 0 && (
                  <div className="space-y-4">
                    {productSpecificOptions.map((option) => (
                        <div key={option.id} className="p-3 bg-background/50 rounded-md border">
                          <Label className="font-medium">{option.name}</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {option.values.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Thuộc tính này chưa có giá trị.</span>
                            ) : option.values.map((value) => (
                              <Button 
                                key={value.id} 
                                variant={selectedAttributesMap[option.name]?.includes(value.value) ? "default" : "outline"} 
                                size="sm" 
                                className="h-8 px-3 text-xs"
                                onClick={() => handleToggleAttributeValueSelection(option.name, value.value)}
                              >
                                {value.value}
                              </Button>
                            ))}
                          </div>
                        </div>
                    ))}
                  </div>
                )}
                {productSpecificOptions.length > 0 && (
                  <Button onClick={generateCombinations} className="w-full gap-1.5" disabled={Object.values(selectedAttributesMap).every(v => v.length === 0)}>
                    <ArrowRight size={16} /> Tạo tổ hợp
                  </Button>
                )}
              </div>
            )}

            {/* Bước 3: Bảng Nhập liệu */}
            {generatedCombinations.length > 0 && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20 animate-fade-in">
                <Label className="block text-sm font-semibold text-foreground">3. Nhập thông tin cho biến thể</Label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Thuộc tính</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">SKU *</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Giá *</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Tồn kho *</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Ảnh (URL)</th>
                        <th className="py-2 px-1 w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedCombinations.map((combo, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-background/50">
                          <td className="py-2 px-2 text-xs font-medium text-foreground/90 whitespace-nowrap">
                            {Object.values(combo.attributes).join(' / ')}
                          </td>
                          <td className="py-1.5 px-2 w-[120px]">
                            <Input 
                              placeholder="SKU-001" className="h-8 text-xs" value={combo.sku} 
                              onChange={(e) => {
                                const newCombos = [...generatedCombinations]; newCombos[index].sku = e.target.value;
                                setGeneratedCombinations(newCombos);
                              }}
                            />
                          </td>
                          <td className="py-1.5 px-2 w-[120px]">
                            <Input 
                              type="number" placeholder="150000" className="h-8 text-xs" value={combo.price} min="1"
                              onChange={(e) => {
                                const newCombos = [...generatedCombinations]; newCombos[index].price = e.target.value;
                                setGeneratedCombinations(newCombos);
                              }}
                            />
                          </td>
                          <td className="py-1.5 px-2 w-[100px]">
                            <Input 
                              type="number" placeholder="50" className="h-8 text-xs" value={combo.stock} min="0"
                              onChange={(e) => {
                                const newCombos = [...generatedCombinations]; newCombos[index].stock = e.target.value;
                                setGeneratedCombinations(newCombos);
                              }}
                            />
                          </td>
                          <td className="py-1.5 px-2 w-[180px]">
                            <ImageUpload 
                              value={combo.image} 
                              onChange={(value) => {
                                const newCombos = [...generatedCombinations]; newCombos[index].image = value;
                                setGeneratedCombinations(newCombos);
                              }}
                              label="" className="h-8 text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <Button 
                              variant="ghost" size="icon" className="w-7 h-7 text-destructive/70 hover:text-destructive" title="Xóa dòng"
                              onClick={() => { setGeneratedCombinations(prev => prev.filter((_, i) => i !== index)); }}
                            >
                              <X size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSaveVariants} className="flex-1" disabled={isLoadingBatch}>
                    {isLoadingBatch ? "Đang lưu..." : `Lưu ${generatedCombinations.length} biến thể`}
                  </Button>
                  <Button variant="outline" onClick={() => setBatchDialogState({ isOpen: true, action: 'cancelBatch', data: null })} className="flex-1" disabled={isLoadingBatch}>Hủy</Button>
                </div>
              </div>
            )}

            {/* Nút Đóng Form */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                if (generatedCombinations.length > 0) {
                  setBatchDialogState({ isOpen: true, action: 'cancelCreate', data: null });
                } else {
                  setShowForm(false); // (Reset form được gọi trong hàm dialog)
                  setSelectedProductId("");
                  setProductSpecificOptions([]); 
                  setSelectedAttributesMap({});
                  setGeneratedCombinations([]);
                }
              }}>Đóng</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Danh sách Sản phẩm (Đã "Chỉnh Chu") --- */}
      {!showForm && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Danh sách sản phẩm</CardTitle>
            <p className="text-sm text-muted-foreground pt-1">Chọn một sản phẩm để xem các biến thể.</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center mb-4">
              <Search size={18} className="text-muted-foreground flex-shrink-0" />
              <Input 
                placeholder="Tìm kiếm sản phẩm theo tên..." 
                value={productSearchTerm} 
                onChange={(e) => { setProductSearchTerm(e.target.value); setProductPage(1); }} 
                className="flex-1 h-9" 
              />
            </div>

            {isFetchingProducts && productsBrief.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground animate-pulse">Đang tải sản phẩm...</div>
            ) : productsBrief.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">{productSearchTerm ? "Không tìm thấy sản phẩm." : "Chưa có sản phẩm nào."}</div>
            ) : (
              <>
                <div className="space-y-2">
                  {productsBrief.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{product.name}</span>
                        <p className="text-xs text-muted-foreground">Đã có {product.variantCount} biến thể</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5 h-8 text-xs px-3"
                        onClick={() => handleViewProductVariants(product as any)} // (Cast 'any' vì ProductBrief thiếu nhiều trường so với ProductResponse)
                      >
                        Xem biến thể <ArrowRight size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {totalProductPages > 1 && (
                  <div className="flex justify-center pt-6">
                    <Pagination
                      currentPage={productPage}
                      totalPages={totalProductPages}
                      onPageChange={setProductPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* === THÊM: 3 Dialog Xác nhận === */}
      {/* (Dialog 1 và 2 đã có ở Màn hình 2, Dialog 3 ở đây) */}
      <AlertDialog open={batchDialogState.isOpen} onOpenChange={(open) => !open && closeBatchDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận hủy?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn hủy? Mọi thông tin đã nhập trong form này sẽ bị mất.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeBatchDialog}>Tiếp tục chỉnh sửa</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" onClick={handleBatchConfirmAction}>
                  Xác nhận Hủy
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

    </div>
  )
}