"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, X, Search, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"; // 1. Thêm RotateCcw
import { useAuthStore } from "@/lib/authStore";
import { ImageUpload } from "@/components/image-upload";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label"; // 2. Thêm Label
import { Checkbox } from "@/components/ui/checkbox"; // 3. Thêm Checkbox
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // 4. Thêm Tabs

// --- Constants ---
const ITEMS_PER_PAGE = 5;
const PRODUCTS_PER_PAGE = 10;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// --- Interfaces ---
interface AttributeValueResponse { id: number; value: string; }
interface AttributeResponse { id: number; name: string; values: AttributeValueResponse[]; }
interface ProductBrief { id: number; name: string; variantCount: number; }

// 5. Sửa Interfaces (Thêm 'active')
interface VariantResponse {
  id: number; sku: string; price: number; stockQuantity: number;
  imageUrl: string; attributes: Record<string, string>; createdAt: string;
  active: boolean; // <-- Thêm
}
interface Combination {
  attributes: Record<string, string>; sku: string; price: number | string;
  stock: number | string; image: string;
}
interface EditingVariantData {
  sku: string; price: number | string; stockQuantity: number | string; 
  imageUrl: string; active: boolean; // <-- Thêm
}

// --- Component Chính: Quản lý Biến thể ---
export function VariantManagement() {
  const { token } = useAuthStore();

  // --- States ---
  const [productsBrief, setProductsBrief] = useState<ProductBrief[]>([]);
  const [attributes, setAttributes] = useState<AttributeResponse[]>([]);
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
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingVariantData, setEditingVariantData] = useState<EditingVariantData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingProductId, setViewingProductId] = useState<number | null>(null);
  const [viewingProductName, setViewingProductName] = useState<string>("");
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 6. Thêm state lọc status
  const [filterStatus, setFilterStatus] = useState("ALL"); // Mặc định xem Tất cả

  // --- Lấy danh sách sản phẩm (Sửa lỗi null.length) ---
  const fetchProductsBrief = useCallback(async () => {
    if (!token) return;
    setIsFetchingProducts(true);
    const url = new URL(`${API_URL}/v1/products/brief`);
    url.searchParams.append("page", (productPage - 1).toString());
    url.searchParams.append("size", PRODUCTS_PER_PAGE.toString());
    if (productSearchTerm) url.searchParams.append("search", productSearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      if (!response.ok) { /* ... (Xử lý lỗi) ... */ }
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        const newContent = result.data.content || []; // <-- Sửa lỗi null.length
        setProductsBrief(prev => productPage === 1 ? newContent : [...prev, ...newContent]);
        setTotalProductPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải DS sản phẩm");
    } catch (err: any) { toast.error(err.message); }
    finally { setIsFetchingProducts(false); }
  }, [token, productPage, productSearchTerm]);

  // Lấy danh sách Thuộc tính
  const fetchAttributes = useCallback(async () => {
    if (!token) return;
    setIsLoadingAttributes(true);
    try {
      const response = await fetch(`${API_URL}/v1/attributes`, { headers: { "Authorization": `Bearer ${token}` } });
      if (!response.ok) { /* ... (Xử lý lỗi) ... */ }
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) setAttributes(result.data || []);
      else throw new Error(result.message || "Lỗi tải thuộc tính");
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoadingAttributes(false); }
  }, [token]);

  // 7. Lấy danh sách Biến thể (Sửa: Thêm 'status')
  const fetchProductVariants = useCallback(async () => {
    if (!token || !viewingProductId) return;
    setIsFetchingVariants(true); setError(null);
    const url = new URL(`${API_URL}/v1/variants/product/${viewingProductId}`);
    url.searchParams.append("page", (variantPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    url.searchParams.append("status", filterStatus); // <-- Gửi status
    if (variantSearchTerm) url.searchParams.append("search", variantSearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      if (!response.ok) { /* ... (Xử lý lỗi) ... */ }
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setProductVariants(result.data.content || []);
        setTotalVariantPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải biến thể");
    } catch (err: any) { setError(err.message); toast.error(`Lỗi tải biến thể: ${err.message}`); }
    finally { setIsFetchingVariants(false); }
  }, [token, viewingProductId, variantPage, variantSearchTerm, filterStatus]); // <-- Thêm filterStatus

  // --- useEffect Hooks ---
  useEffect(() => { fetchProductsBrief(); }, [fetchProductsBrief]);
  useEffect(() => { if (token) fetchAttributes(); }, [fetchAttributes]);
  useEffect(() => { if (viewingProductId) fetchProductVariants(); }, [fetchProductVariants]);

const handleSaveVariants = async () => {
    if (!token || !selectedProductId || generatedCombinations.length === 0) {
      toast.error("Thiếu thông tin sản phẩm hoặc biến thể.");
      return;
    }

    // --- Validation ---
    const invalidCombination = generatedCombinations.find((combo, index) => {
      const sku = combo.sku.trim();
      const price = Number(combo.price);
      const stock = Number(combo.stock);

      if (!sku) {
        toast.error(`Lỗi dòng ${index + 1}: SKU không được để trống.`);
        return true;
      }
      if (isNaN(price) || price <= 0) {
        toast.error(`Lỗi dòng ${index + 1}: Giá "${combo.price}" không hợp lệ.`);
        return true;
      }
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
          toast.error(`Lỗi dòng ${index + 1}: Tồn kho "${combo.stock}" không hợp lệ (phải là số nguyên >= 0).`);
        return true;
      }
      return false;
    });

    if (invalidCombination) {
      return; // Dừng lại nếu có lỗi
    }
    // --- End Validation ---

    // Chuẩn bị batch request (Khớp với VariantBatchRequestDTO)
    const batchRequest = {
      productId: Number(selectedProductId),
      variants: generatedCombinations.map(combo => ({
        sku: combo.sku.trim(),
        price: Number(combo.price),
        stockQuantity: Number(combo.stock),
        imageUrl: combo.image || null,
        // Map attribute names/values to attribute value IDs
        attributeValueIds: Object.entries(combo.attributes)
          .map(([attrName, attrValue]) => findAttributeValueId(attrName, attrValue))
          .filter((id): id is number => id !== null) // Lọc bỏ null nếu có lỗi
      }))
    };

    // Kiểm tra lại attributeValueIds (phòng trường hợp findAttributeValueId bị lỗi)
    if (batchRequest.variants.some(v => v.attributeValueIds.length !== Object.keys(v.attributeValueIds).length)) {
        // Nếu số lượng ID không khớp số lượng thuộc tính -> có lỗi tìm ID
        toast.error("Lỗi: Không tìm thấy ID cho một số giá trị thuộc tính. Vui lòng thử lại.");
        console.error("Failed to find attribute value IDs for some combinations:", batchRequest);
        return;
    }


    try {
      const response = await fetch(`${API_URL}/v1/variants/batch`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(batchRequest)
      });

      const result = await response.json();

      if (response.status === 409) { // Lỗi trùng SKU
         toast.error(`Lỗi trùng lặp: ${result.message || 'Một hoặc nhiều SKU đã tồn tại.'}`);
         return;
      }
      if (!response.ok) {
         throw new Error(result.message || `Lỗi ${response.status}`);
      }

      if (result.status === 'SUCCESS') {
        toast.success(`Đã thêm thành công ${result.data?.length || generatedCombinations.length} biến thể!`);
        // Reset form và quay lại danh sách sản phẩm hoặc xem biến thể vừa tạo
        setShowForm(false);
        setSelectedProductId("");
        setSelectedAttributesMap({});
        setGeneratedCombinations([]);
        // Tùy chọn: Chuyển sang xem biến thể của sản phẩm này luôn
        // handleViewProductVariants({ id: Number(selectedProductId), name: productsBrief.find(p=>String(p.id) === selectedProductId)?.name || "Sản phẩm", variantCount: 0});
        // Hoặc tải lại danh sách product brief (để cập nhật variantCount)
        setProductPage(1); // Reset trang để fetch lại từ đầu
        fetchProductsBrief();

      } else {
        throw new Error(result.message || "Thêm biến thể thất bại");
      }
    } catch (err: any) {
      toast.error(`Lỗi khi lưu biến thể: ${err.message}`);
      console.error("Error saving variants:", err);
    }
  };// --- Hàm Hỗ trợ ---
const findAttributeValueId = (attrName: string, attrValue: string): number | null => {
    const attribute = attributes.find(a => a.name === attrName);
    if (!attribute) return null;
    const valueObj = attribute.values.find(v => v.value === attrValue);
    return valueObj ? valueObj.id : null;
};
  // --- Các Hàm Xử lý Sự kiện ---
  const handleViewProductVariants = (product: ProductBrief) => {
    setViewingProductId(product.id); setViewingProductName(product.name);
    setVariantPage(1); setVariantSearchTerm("");
  };
  const handleBackToList = () => {
    setViewingProductId(null); setViewingProductName("");
    setProductVariants([]); setTotalVariantPages(0);
    setProductPage(1); setProductSearchTerm("");
    fetchProductsBrief();
  };
// -- Xử lý Form Tạo --

// Thêm một nhóm thuộc tính vào lựa chọn (vd: Thêm "Màu sắc")
const handleAddAttributeToSelection = (attributeId: string) => {
    const attribute = attributes.find(attr => String(attr.id) === attributeId);
    if (!attribute) return;
    // Thêm attribute vào map với mảng value rỗng
    setSelectedAttributesMap(prev => ({
        ...prev,
        [attribute.name]: [] // Khởi tạo mảng giá trị rỗng
    }));
    setGeneratedCombinations([]); // Reset combinations khi thay đổi lựa chọn
};

// Xóa một nhóm thuộc tính khỏi lựa chọn (vd: Xóa "Màu sắc")
const handleRemoveAttributeFromSelection = (attributeName: string) => {
    setSelectedAttributesMap(prev => {
        const newState = { ...prev };
        delete newState[attributeName]; // Xóa key khỏi object
        return newState;
    });
    setGeneratedCombinations([]); // Reset combinations
};

// Bật/tắt một giá trị cụ thể trong nhóm thuộc tính (vd: Chọn/Bỏ chọn "Đỏ")
const handleToggleAttributeValueSelection = (attributeName: string, valueString: string) => {
    setSelectedAttributesMap(prev => {
        const currentValues = prev[attributeName] || [];
        const isSelected = currentValues.includes(valueString);
        let newValues;
        if (isSelected) {
            // Bỏ chọn: lọc valueString ra khỏi mảng
            newValues = currentValues.filter(v => v !== valueString);
        } else {
            // Chọn: thêm valueString vào mảng
            newValues = [...currentValues, valueString];
        }
        // Cập nhật lại map
        return {
            ...prev,
            [attributeName]: newValues
        };
    });
    setGeneratedCombinations([]); // Reset combinations
};

// Hàm tạo các tổ hợp biến thể dựa trên thuộc tính đã chọn
const generateCombinations = () => {
    const selectedAttrs = Object.entries(selectedAttributesMap)
        .filter(([name, values]) => values.length > 0); // Chỉ lấy những attr có chọn value

    if (selectedAttrs.length === 0) {
        toast.warning("Vui lòng chọn ít nhất một giá trị thuộc tính.");
        return;
    }

    const combinations: Record<string, string>[] = [];
    const attributeNames = selectedAttrs.map(([name]) => name);
    const valueArrays = selectedAttrs.map(([, values]) => values);

    // Hàm đệ quy để tạo tổ hợp
    const getCombinations = (index: number, currentCombination: Record<string, string>) => {
        if (index === attributeNames.length) {
            combinations.push({ ...currentCombination });
            return;
        }

        const currentAttributeName = attributeNames[index];
        const currentValues = valueArrays[index];

        for (const value of currentValues) {
            currentCombination[currentAttributeName] = value;
            getCombinations(index + 1, currentCombination);
        }
    };

    getCombinations(0, {});

    // Tạo state cho bảng nhập liệu
    const newGeneratedCombinations: Combination[] = combinations.map(combo => ({
        attributes: combo,
        sku: "", // Để trống cho người dùng nhập
        price: "",
        stock: "",
        image: ""
    }));

    setGeneratedCombinations(newGeneratedCombinations);
};

  // 9. Mở Modal Sửa (Sửa: Thêm 'active')
  const handleEditVariant = (variant: VariantResponse) => {
    setEditingVariantId(variant.id);
    setEditingVariantData({ 
        sku: variant.sku, 
        price: variant.price, 
        stockQuantity: variant.stockQuantity, 
        imageUrl: variant.imageUrl || "",
        active: variant.active // <-- Lấy trạng thái active
    });
    setShowEditModal(true);
  };

  // 10. Lưu Biến thể đã Sửa (Sửa: Thêm 'active')
  const handleSaveEditedVariant = async () => {
    if (!token || !editingVariantId || !editingVariantData) return;
    // ... (Validate SKU, price, stock)
    // Khớp với VariantUpdateRequestDTO
    const updateRequest = { 
        sku: editingVariantData.sku.trim(), 
        price: Number(editingVariantData.price), 
        stockQuantity: Number(editingVariantData.stockQuantity), 
        imageUrl: editingVariantData.imageUrl || null,
        active: editingVariantData.active // <-- Gửi trạng thái active
    };
    try {
        const response = await fetch(`${API_URL}/v1/variants/${editingVariantId}`, { method: "PUT", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(updateRequest) });
        if (!response.ok) { /* ... (Xử lý lỗi) ... */ }
        const result = await response.json();
        if (result.status === 'SUCCESS') {
            toast.success("Cập nhật biến thể thành công!"); 
            setShowEditModal(false); setEditingVariantId(null); setEditingVariantData(null);
            fetchProductVariants(); // Tải lại
        } else throw new Error(result.message || "Cập nhật thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // 11. Xóa Biến thể (Sửa: Soft Delete)
  const handleDeleteVariant = async (id: number) => {
     if (!token || !confirm("Ngừng hoạt động biến thể này?")) return; // Đổi confirm
     try {
       // Gọi API DELETE (Backend sẽ set active=false)
       const response = await fetch(`${API_URL}/v1/variants/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
       if (!response.ok) { /* ... (Xử lý lỗi) ... */ }
       const result = await response.json();
       if (result.status === 'SUCCESS') {
           toast.success("Đã ngừng hoạt động biến thể!"); // Đổi toast
           if (productVariants.length === 1 && variantPage > 1) setVariantPage(variantPage - 1); 
           else fetchProductVariants(); // Tải lại
           // Không cần tải lại Product Brief
       } else throw new Error(result.message || "Xóa thất bại");
     } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // 12. THÊM: Kích hoạt lại (PUT)
  const handleReactivateVariant = async (variant: VariantResponse) => {
      if (!token || !confirm(`Kích hoạt lại SKU "${variant.sku}"?`)) return;
      const url = `${API_URL}/v1/variants/${variant.id}`;
      // Gửi lại data cũ, chỉ đổi active = true
      const requestBody = { 
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          imageUrl: variant.imageUrl,
          active: true // <-- Set active
      };
      try {
        const response = await fetch(url, { method: "PUT", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
        if (!response.ok) { /* ... (Xử lý lỗi) ... */ }
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          toast.success("Kích hoạt lại thành công!");
          fetchProductVariants(); // Tải lại
        } else throw new Error(result.message || "Kích hoạt thất bại");
      } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };
  
  // 13. THÊM: Đổi Tab
  const handleTabChange = (newStatus: string) => {
      setFilterStatus(newStatus);
      setVariantPage(1);
      setVariantSearchTerm("");
      setProductVariants([]);
  };

  // --- JSX Rendering (Giao diện) ---

  // *** Màn hình 1: Xem Danh sách Biến thể ***
  if (viewingProductId && viewingProductName) {
    return (
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* ... (Header: Quay lại, Tên SP) ... */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 mb-4">
          <Button variant="outline" onClick={handleBackToList} className="gap-1.5 self-start sm:self-center"> <ArrowLeft size={18} /> <span className="hidden sm:inline">Quay lại DS Sản phẩm</span><span className="sm:hidden">Quay lại</span> </Button>
          <div className="flex-1 min-w-0 order-first sm:order-none"> <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate text-center sm:text-left" title={viewingProductName}> Biến thể của: {viewingProductName} </h1> </div>
        </div>

        {/* --- 14. THÊM TABS LỌC --- */}
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

        {isFetchingVariants ? ( <div className="text-center py-10 text-muted-foreground animate-pulse">Đang tải biến thể...</div>
        ) : error ? ( <div className="text-center py-10 text-red-600">Lỗi: {error}</div>
        ) : productVariants.length === 0 ? (
          <Card className="shadow-none border-dashed border-border/50"> <CardContent className="py-10 text-center text-muted-foreground"> {variantSearchTerm ? `Không tìm thấy biến thể khớp với "${variantSearchTerm}".` : `Không có biến thể nào (${filterStatus.toLowerCase()}).`} </CardContent> </Card>
        ) : (
          <>
            <Card className="overflow-hidden border shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      {/* --- 15. SỬA LỖI HYDRATION + THÊM CỘT --- */}
                      <tr className="border-b">
                        <th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Ảnh</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">Thuộc tính</th><th className="text-left py-2.5 px-3 font-semibold text-foreground/80">SKU</th><th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Giá</th><th className="text-right py-2.5 px-3 font-semibold text-foreground/80">Tồn kho</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80">Trạng thái</th><th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productVariants.map((variant) => (
                        <tr key={variant.id} className={`border-b last:border-b-0 hover:bg-muted/20 transition-colors ${!variant.active ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''}`}>
                          {/* --- 15. SỬA LỖI HYDRATION + THÊM CỘT --- */}
                          <td className="py-2 px-3"><img src={variant.imageUrl || "/placeholder.svg"} alt={variant.sku} className="w-10 h-10 object-cover rounded border"/></td><td className="py-2 px-3 align-top"><div className="text-xs space-y-0.5 max-w-[180px] break-words text-foreground/90">{Object.entries(variant.attributes).map(([key, value]) => (<div key={key}><span className="font-medium text-foreground/70">{key}:</span> {value}</div>))}</div></td><td className="py-2 px-3 font-medium text-foreground">{variant.sku}</td><td className="py-2 px-3 text-right">{variant.price.toLocaleString('vi-VN')}₫</td><td className="py-2 px-3 text-right">{variant.stockQuantity}</td>
                          {/* Cột Trạng thái */}
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${variant.active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                              {variant.active ? "Hoạt động" : "Ngừng HĐ"}
                            </span>
                          </td>
                          {/* Cột Hành động (Sửa logic) */}
                          <td className="py-2 px-3">
                            <div className="flex gap-1.5 justify-center">
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa biến thể" onClick={() => handleEditVariant(variant)}>
                                  <Edit2 size={14} />
                              </Button>
                              {variant.active ? (
                                <Button
                                  variant="outline" size="icon"
                                  className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10"
                                  title="Ngừng hoạt động"
                                  onClick={() => handleDeleteVariant(variant.id)}
                                > <Trash2 size={14} /> </Button>
                              ) : (
                                <Button
                                  variant="outline" size="icon"
                                  className="w-7 h-7 text-green-600 border-green-600 hover:bg-green-100/50"
                                  title="Kích hoạt lại"
                                  onClick={() => handleReactivateVariant(variant)}
                                > <RotateCcw size={14} /> </Button>
                              )}
                            </div>
                          </td>
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

        {/* --- 16. Modal Sửa Biến Thể (Thêm Checkbox 'active') --- */}
        {showEditModal && editingVariantData && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in duration-200">
            <Card className="w-full max-w-md bg-card shadow-xl animate-scale-in duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b"><CardTitle className="text-base font-semibold">Chỉnh sửa biến thể</CardTitle><Button variant="ghost" size="icon" className="w-6 h-6 -mr-2 -mt-1 text-muted-foreground hover:bg-muted" onClick={() => setShowEditModal(false)}><X size={16} /></Button></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div><Label htmlFor="editSku" className="block text-sm font-medium mb-1.5 text-foreground/90">SKU *</Label><Input id="editSku" value={editingVariantData.sku} onChange={(e) => setEditingVariantData({ ...editingVariantData, sku: e.target.value })}/></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="editPrice" className="block text-sm font-medium mb-1.5 text-foreground/90">Giá *</Label><Input id="editPrice" type="number" value={editingVariantData.price} onChange={(e) => setEditingVariantData({ ...editingVariantData, price: e.target.value })} min="1" placeholder="vd: 150000"/></div>
                    <div><Label htmlFor="editStock" className="block text-sm font-medium mb-1.5 text-foreground/90">Tồn kho *</Label><Input id="editStock" type="number" value={editingVariantData.stockQuantity} onChange={(e) => setEditingVariantData({ ...editingVariantData, stockQuantity: e.target.value })} min="0" placeholder="vd: 50"/></div>
                </div>
                <div><Label className="block text-sm font-medium mb-1.5 text-foreground/90">Hình ảnh (URL)</Label><ImageUpload value={editingVariantData.imageUrl} onChange={(value) => setEditingVariantData({ ...editingVariantData, imageUrl: value })} label="" className="h-24"/></div>
                
                {/* Thêm Checkbox Active */}
                <div className="flex items-center gap-2">
                    <Checkbox id="variantActiveForm" checked={editingVariantData.active} onCheckedChange={(checked) => setEditingVariantData({ ...editingVariantData, active: Boolean(checked) })}/>
                    <Label htmlFor="variantActiveForm" className="text-sm">Đang hoạt động</Label>
                </div>
                
                <div className="flex gap-3 pt-3 border-t"><Button onClick={handleSaveEditedVariant} className="flex-1">Lưu thay đổi</Button><Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Hủy</Button></div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // *** Màn hình 2: Danh sách Sản phẩm & Form Tạo Biến thể Mới ***
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ... (Header) ... */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý biến thể sản phẩm</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các biến thể cho sản phẩm</p>
        </div>
        <Button onClick={() => { setShowForm(true); }} className="gap-2 self-start sm:self-center">
          <Plus size={18} /> Tạo biến thể
        </Button>
      </div>

      {/* --- Form Tạo Biến Thể Mới --- */}
      {showForm && (
        <Card className="border-primary/40 shadow-md animate-fade-in">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">Tạo biến thể mới</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Bước 1: Chọn Sản phẩm cha (Đã thêm Label) */}
            <div className="p-4 border rounded-md bg-muted/20">
              <Label htmlFor="productSearchInput" className="block text-sm font-semibold mb-2 text-foreground">1. Chọn sản phẩm cha *</Label>
              <div className="flex gap-2 mb-2 items-center">
                <Input id="productSearchInput" placeholder="Tìm kiếm sản phẩm theo tên..." value={productSearchTerm} onChange={(e) => { setProductSearchTerm(e.target.value); setProductPage(1); }} className="flex-1 h-9"/>
                {isFetchingProducts && <span className="text-xs text-muted-foreground animate-pulse">Đang tìm...</span>}
              </div>
              <Select value={selectedProductId} onValueChange={(value) => { setSelectedProductId(value); setSelectedAttributesMap({}); setGeneratedCombinations([]); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="-- Chọn sản phẩm từ danh sách --" /></SelectTrigger>
                <SelectContent>
                  {productsBrief.length === 0 && !isFetchingProducts && <div className="p-2 text-sm text-muted-foreground text-center">Không có sản phẩm nào.</div>}
                  {productsBrief.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                  {totalProductPages > productPage && (<div className="p-1 text-center border-t mt-1"><Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={() => setProductPage(productPage + 1)} disabled={isFetchingProducts}>{isFetchingProducts ? "Đang tải..." : "Tải thêm sản phẩm"}</Button></div>)}
                </SelectContent>
              </Select>
            </div>

          {/* Bước 2: Chọn Thuộc tính & Giá trị */}
        {selectedProductId && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <Label className="block text-sm font-semibold text-foreground">2. Chọn thuộc tính và giá trị *</Label>
            <Select onValueChange={(value) => { if (value) handleAddAttributeToSelection(value); }} value="" disabled={isLoadingAttributes || attributes.length === 0}>
              <SelectTrigger className="h-9"><SelectValue placeholder={isLoadingAttributes ? "Đang tải..." : (attributes.length === 0 ? "Không có thuộc tính" : "-- Thêm thuộc tính --")} /></SelectTrigger>
              <SelectContent>
                {attributes.filter((attr) => !selectedAttributesMap[attr.name]).map((attr) => (<SelectItem key={attr.id} value={String(attr.id)}>{attr.name}</SelectItem>))}
                {attributes.filter((attr) => !selectedAttributesMap[attr.name]).length === 0 && attributes.length > 0 && <div className="p-2 text-xs text-muted-foreground text-center">Đã thêm hết.</div>}
              </SelectContent>
            </Select>

            {/* --- HIỂN THỊ CÁC THUỘC TÍNH ĐÃ CHỌN --- */}
            {Object.keys(selectedAttributesMap).length > 0 && (
              <div className="space-y-3 pt-2">
                {attributes
                  .filter(attr => selectedAttributesMap[attr.name]) // Chỉ lấy những attr có trong map
                  .map((attribute) => (
                    <div key={attribute.id} className="border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium">{attribute.name}</Label>
                        <Button
                          variant="ghost" size="icon"
                          className="w-6 h-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title={`Xóa thuộc tính ${attribute.name}`}
                          onClick={() => handleRemoveAttributeFromSelection(attribute.name)}
                        > <X size={14} /> </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {attribute.values.map((value) => {
                          const isSelected = selectedAttributesMap[attribute.name]?.includes(value.value);
                          return (
                            <Button
                              key={value.id}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`h-8 text-xs ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                              onClick={() => handleToggleAttributeValueSelection(attribute.name, value.value)}
                            > {value.value} </Button>
                          );
                        })}
                      </div>
                    </div>
                ))}
                {/* Nút Tạo Tổ Hợp */}
                <div className="pt-3 border-t">
                  <Button onClick={generateCombinations} disabled={Object.values(selectedAttributesMap).every(vals => vals.length === 0)}>
                    Tạo các biến thể
                  </Button>
                </div>
              </div>
            )}
            {/* --- KẾT THÚC HIỂN THỊ --- */}
          </div>
        )}

           {/* Bước 3: Nhập thông tin chi tiết */}
            {generatedCombinations.length > 0 && (
              <div className="space-y-4 p-4 border rounded-md bg-background">
                <Label className="block text-sm font-semibold text-foreground mb-3">3. Nhập thông tin chi tiết cho từng biến thể</Label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted/30">
                      <tr>
                        {/* Tự động tạo header cột thuộc tính */}
                        {Object.keys(generatedCombinations[0].attributes).map(attrName => (
                          <th key={attrName} className="py-2 px-3 border text-left font-semibold text-foreground/80">{attrName}</th>
                        ))}
                        {/* Các cột cố định */}
                        <th className="py-2 px-3 border text-left font-semibold text-foreground/80">SKU *</th>
                        <th className="py-2 px-3 border text-left font-semibold text-foreground/80">Giá *</th>
                        <th className="py-2 px-3 border text-left font-semibold text-foreground/80">Tồn kho *</th>
                        <th className="py-2 px-3 border text-left font-semibold text-foreground/80">Ảnh (URL)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedCombinations.map((combo, index) => (
                        <tr key={index} className="bg-background hover:bg-muted/20">
                          {/* Tự động tạo cell giá trị thuộc tính */}
                          {Object.values(combo.attributes).map((value, idx) => (
                            <td key={idx} className="py-1.5 px-3 border text-foreground/90">{value}</td>
                          ))}
                          {/* Các cell input */}
                          <td className="py-1.5 px-3 border">
                            <Input
                              type="text"
                              value={combo.sku}
                              onChange={(e) => {
                                const newCombos = [...generatedCombinations];
                                newCombos[index].sku = e.target.value;
                                setGeneratedCombinations(newCombos);
                              }}
                              className="h-8 text-xs min-w-[100px]"
                              placeholder="VD: TSHIRT-RED-S"/>
                          </td>
                          <td className="py-1.5 px-3 border">
                            <Input
                              type="number"
                              value={combo.price}
                              onChange={(e) => {
                                const newCombos = [...generatedCombinations];
                                newCombos[index].price = e.target.value;
                                setGeneratedCombinations(newCombos);
                              }}
                              className="h-8 text-xs min-w-[100px]"
                              placeholder="Giá bán" min="1"/>
                          </td>
                          <td className="py-1.5 px-3 border">
                            <Input
                              type="number"
                              value={combo.stock}
                              onChange={(e) => {
                                const newCombos = [...generatedCombinations];
                                newCombos[index].stock = e.target.value;
                                setGeneratedCombinations(newCombos);
                              }}
                              className="h-8 text-xs min-w-[70px]"
                              placeholder="Số lượng" min="0"/>
                          </td>
                          <td className="py-1.5 px-3 border">
                             {/* Component ImageUpload đã có sẵn */}
                             <ImageUpload
                                value={combo.image}
                                onChange={(value) => {
                                  const newCombos = [...generatedCombinations];
                                  newCombos[index].image = value;
                                  setGeneratedCombinations(newCombos);
                                }}
                                label="" // Không cần label ở đây
                                className="h-10 w-24"/> {/* Điều chỉnh kích thước nếu cần */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Nút Lưu và Hủy */}
                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                   {/* Sửa: Thêm hàm handleSaveVariants vào onClick */}
                   <Button onClick={handleSaveVariants}> Lưu {generatedCombinations.length} biến thể </Button>
                   <Button variant="outline" onClick={() => { setGeneratedCombinations([]); setSelectedAttributesMap({}); setSelectedProductId(""); setShowForm(false); }}> Hủy </Button>
                </div>
              </div>
            )}
            
            
            {!selectedProductId && (<div className="flex justify-end pt-4 border-t mt-4"><Button variant="outline" onClick={() => setShowForm(false)}> Hủy </Button></div>)}
          </CardContent>
        </Card>
      )}

      {/* --- DANH SÁCH SẢN PHẨM --- */}
      {!showForm && (
          <div className="space-y-4 pt-6">
            <h2 className="text-xl font-semibold text-foreground">Chọn sản phẩm để xem/quản lý biến thể</h2>
            <div className="flex gap-2 items-center sticky top-[60px] sm:top-[68px] bg-background py-2 z-10 border-b -mx-6 px-6">
              <Search size={18} className="text-muted-foreground flex-shrink-0" />
              <Input placeholder="Tìm kiếm sản phẩm theo tên..." value={productSearchTerm} onChange={(e) => { setProductSearchTerm(e.target.value); setProductPage(1); }} className="flex-1 h-9"/>
              {isFetchingProducts && <span className="text-xs text-muted-foreground animate-pulse">Đang tải...</span>}
            </div>
            
            {/* Dòng 546 (Đã sửa): productsBrief luôn là mảng [] */}
            {isFetchingProducts && productsBrief.length === 0 ? ( <div className="text-center py-8 text-muted-foreground">Đang tải danh sách sản phẩm...</div>
            ) : productsBrief.length === 0 ? ( <div className="text-center py-8 text-muted-foreground">{productSearchTerm ? `Không tìm thấy sản phẩm nào với tên "${productSearchTerm}".` : "Chưa có sản phẩm nào."}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {productsBrief.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow duration-150">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-foreground truncate" title={product.name}>{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.variantCount ?? 0} biến thể</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleViewProductVariants(product)} className="gap-1 flex-shrink-0 h-8 px-3"> Quản lý <ArrowRight size={14} className="ml-1"/> </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {totalProductPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={productPage} totalPages={totalProductPages} onPageChange={setProductPage} /></div>)}
          </div>
      )}
    </div>
  );
}