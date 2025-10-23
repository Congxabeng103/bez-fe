// File: components/pages/variant-management.tsx
"use client"; // Đánh dấu là Client Component vì sử dụng hooks và state

// --- Imports ---
import { useState, useEffect, useCallback } from "react"; // React Hooks
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea"; // Không dùng trong component này
import { Plus, Edit2, Trash2, X, Search, ArrowLeft, ArrowRight } from "lucide-react"; // Icons (Đã thêm ArrowRight)
import { useAuthStore } from "@/lib/authStore"; // Hook để lấy token (Đã thêm import)
import { ImageUpload } from "@/components/image-upload"; // Component tải ảnh
import { Pagination } from "@/components/pagination"; // Component phân trang
import { toast } from "sonner"; // Thư viện hiển thị thông báo
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Component Dropdown

// --- Constants ---
const ITEMS_PER_PAGE = 5; // Số biến thể hiển thị mỗi trang (trong bảng chi tiết)
const PRODUCTS_PER_PAGE = 10; // Số sản phẩm hiển thị mỗi trang (trong dropdown/danh sách chọn)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"; // URL gốc của API backend

// --- Interfaces (Định nghĩa kiểu dữ liệu TypeScript) ---

// Kiểu dữ liệu cho Giá trị Thuộc tính (phản ánh AttributeValueResponseDTO)
interface AttributeValueResponse {
  id: number;
  value: string;
}

// Kiểu dữ liệu cho Thuộc tính (phản ánh AttributeResponseDTO)
interface AttributeResponse {
  id: number;
  name: string;
  values: AttributeValueResponse[];
}

// Kiểu dữ liệu rút gọn của Sản phẩm (phản ánh ProductBriefDTO)
interface ProductBrief {
  id: number;
  name: string;
  variantCount: number; // Số lượng biến thể
}

// Kiểu dữ liệu cho Biến thể Sản phẩm (phản ánh VariantResponseDTO)
interface VariantResponse {
  id: number;
  sku: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  attributes: Record<string, string>; // { "Tên Thuộc Tính": "Giá Trị" }
  createdAt: string;
}

// Kiểu dữ liệu cho state lưu trữ các tổ hợp biến thể được tạo ra ở client
interface Combination {
  attributes: Record<string, string>;
  sku: string;
  price: number | string; // Dùng string cho input
  stock: number | string; // Dùng string cho input
  image: string;
}

// Kiểu dữ liệu cho state lưu trữ dữ liệu của biến thể đang được sửa trong Modal
interface EditingVariantData {
  sku: string;
  price: number | string;
  stockQuantity: number | string;
  imageUrl: string;
}

// --- Component Chính: Quản lý Biến thể ---
export function VariantManagement() {
  // Lấy token từ store xác thực
  const { token } = useAuthStore();

  // --- State Variables ---

  // State lưu trữ dữ liệu lấy từ API
  const [productsBrief, setProductsBrief] = useState<ProductBrief[]>([]);
  const [attributes, setAttributes] = useState<AttributeResponse[]>([]);
  const [productVariants, setProductVariants] = useState<VariantResponse[]>([]);

  // State cho Phân trang & Tìm kiếm Danh sách Sản phẩm
  const [productPage, setProductPage] = useState(1);
  const [totalProductPages, setTotalProductPages] = useState(0);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  // State cho Phân trang & Tìm kiếm Danh sách Biến thể
  const [variantPage, setVariantPage] = useState(1);
  const [totalVariantPages, setTotalVariantPages] = useState(0);
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [isFetchingVariants, setIsFetchingVariants] = useState(false);

  // State cho Form Tạo Biến thể Mới
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedAttributesMap, setSelectedAttributesMap] = useState<Record<string, string[]>>({});
  const [generatedCombinations, setGeneratedCombinations] = useState<Combination[]>([]);

  // State cho Modal Sửa Biến thể
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingVariantData, setEditingVariantData] = useState<EditingVariantData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // State quản lý màn hình hiển thị
  const [viewingProductId, setViewingProductId] = useState<number | null>(null);
  const [viewingProductName, setViewingProductName] = useState<string>("");

  // State UI chung
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null); // Lưu lỗi fetch biến thể

  // --- Các Hàm Gọi API (Sử dụng useCallback) ---

  // Lấy danh sách sản phẩm rút gọn (GET /products/brief)
  const fetchProductsBrief = useCallback(async () => {
    if (!token) return;
    setIsFetchingProducts(true);
    const url = new URL(`${API_URL}/v1/products/brief`);
    url.searchParams.append("page", (productPage - 1).toString());
    url.searchParams.append("size", PRODUCTS_PER_PAGE.toString());
    if (productSearchTerm) url.searchParams.append("search", productSearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        // Nếu là trang 1 thì thay thế, nếu không thì nối vào danh sách cũ (cho nút "Tải thêm")
        setProductsBrief(prev => productPage === 1 ? result.data.content : [...prev, ...result.data.content]);
        setTotalProductPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải danh sách sản phẩm");
    } catch (err: any) { toast.error(err.message); }
    finally { setIsFetchingProducts(false); }
  }, [token, productPage, productSearchTerm]);

  // Lấy danh sách tất cả Thuộc tính (GET /attributes)
  const fetchAttributes = useCallback(async () => {
    if (!token) return;
    setIsLoadingAttributes(true);
    try {
      const response = await fetch(`${API_URL}/v1/attributes`, { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) setAttributes(result.data);
      else throw new Error(result.message || "Lỗi tải thuộc tính");
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoadingAttributes(false); }
  }, [token]);

  // Lấy danh sách Biến thể của Sản phẩm đang xem (GET /variants/product/{id})
  const fetchProductVariants = useCallback(async () => {
    if (!token || !viewingProductId) return;
    setIsFetchingVariants(true); setError(null);
    const url = new URL(`${API_URL}/v1/variants/product/${viewingProductId}`);
    url.searchParams.append("page", (variantPage - 1).toString());
    url.searchParams.append("size", ITEMS_PER_PAGE.toString());
    if (variantSearchTerm) url.searchParams.append("search", variantSearchTerm);
    try {
      const response = await fetch(url.toString(), { headers: { "Authorization": `Bearer ${token}` } });
      const result = await response.json();
      if (result.status === 'SUCCESS' && result.data) {
        setProductVariants(result.data.content);
        setTotalVariantPages(result.data.totalPages);
      } else throw new Error(result.message || "Lỗi tải biến thể");
    } catch (err: any) { setError(err.message); toast.error(`Lỗi tải biến thể: ${err.message}`); }
    finally { setIsFetchingVariants(false); }
  }, [token, viewingProductId, variantPage, variantSearchTerm]);

  // --- useEffect Hooks ---
  useEffect(() => { fetchProductsBrief(); }, [fetchProductsBrief]); // Gọi khi component mount và dependencies thay đổi
  useEffect(() => { if (token) fetchAttributes(); }, [fetchAttributes]); // Gọi khi có token
  useEffect(() => { if (viewingProductId) fetchProductVariants(); }, [fetchProductVariants]); // Gọi khi xem chi tiết sản phẩm

  // --- Hàm Hỗ trợ ---
  // Tìm ID của AttributeValue dựa vào AttributeID (string) và Value (string)
  const findAttributeValueId = (attributeIdString: string, valueString: string): number | null => {
    const attribute = attributes.find(a => String(a.id) === attributeIdString);
    if (!attribute) return null;
    const attributeValue = attribute.values.find(v => v.value === valueString);
    return attributeValue ? attributeValue.id : null;
  };

  // --- Các Hàm Xử lý Sự kiện ---

  // Chuyển sang màn hình xem biến thể
  const handleViewProductVariants = (product: ProductBrief) => {
    setViewingProductId(product.id); setViewingProductName(product.name);
    setVariantPage(1); setVariantSearchTerm(""); // Reset state của màn hình xem biến thể
  };
  // Quay lại màn hình danh sách sản phẩm
  const handleBackToList = () => {
    setViewingProductId(null); setViewingProductName("");
    setProductVariants([]); setTotalVariantPages(0); // Reset state biến thể
    // Tải lại danh sách sản phẩm để cập nhật variantCount nếu có xóa/thêm
    setProductPage(1); // Quay về trang 1
    fetchProductsBrief(); // Gọi lại API
  };

  // -- Xử lý chọn Thuộc tính/Giá trị trong Form Tạo --
  const handleAddAttributeToSelection = (attributeId: string) => {
    if (!selectedAttributesMap[attributeId]) setSelectedAttributesMap({ ...selectedAttributesMap, [attributeId]: [] });
  };
  const handleRemoveAttributeFromSelection = (attributeId: string) => {
    const newMap = { ...selectedAttributesMap }; delete newMap[attributeId];
    setSelectedAttributesMap(newMap); setGeneratedCombinations([]); // Reset tổ hợp
  };
  const handleToggleAttributeValueSelection = (attributeId: string, valueString: string) => {
    const currentValues = selectedAttributesMap[attributeId] || [];
    const newValues = currentValues.includes(valueString) ? currentValues.filter((v) => v !== valueString) : [...currentValues, valueString];
    setSelectedAttributesMap({ ...selectedAttributesMap, [attributeId]: newValues });
    setGeneratedCombinations([]); // Reset tổ hợp
  };

  // Tạo tổ hợp biến thể (logic client-side)
  const generateCombinations = () => {
    if (!selectedProductId || Object.keys(selectedAttributesMap).length === 0) return;
    const attributeArrays = Object.entries(selectedAttributesMap)
      .map(([attrId, values]) => { const attr = attributes.find((a) => String(a.id) === attrId); return { name: attr?.name || `Thuộc tính ${attrId}`, values: values }; })
      .filter(a => a.values.length > 0); // Chỉ dùng thuộc tính có giá trị được chọn
    if (attributeArrays.length === 0) { toast.info("Vui lòng chọn ít nhất một giá trị cho mỗi thuộc tính."); return; }
    const combinations: Combination[] = [];
    const generateRecursive = (index: number, currentCombination: Record<string, string>) => {
      if (index === attributeArrays.length) { combinations.push({ attributes: { ...currentCombination }, sku: "", price: "", stock: "", image: "" }); return; }
      const currentAttribute = attributeArrays[index];
      currentAttribute.values.forEach((value) => generateRecursive(index + 1, { ...currentCombination, [currentAttribute.name]: value }));
    };
    generateRecursive(0, {});
    setGeneratedCombinations(combinations);
    if (combinations.length === 0 && attributeArrays.length > 0) toast.info("Không có tổ hợp nào được tạo.");
  };

  // Lưu hàng loạt biến thể (POST /variants/batch)
  const handleSaveVariants = async () => {
    if (!token || !selectedProductId || generatedCombinations.length === 0) return;
    const variantsToCreate: any[] = []; let hasValidationError = false;
    generatedCombinations.forEach((combo, index) => {
      if (hasValidationError) return;
      const sku = combo.sku ? combo.sku.trim() : ""; if (!sku) { toast.error(`Tổ hợp ${index + 1}: Vui lòng nhập SKU.`); hasValidationError = true; return; }
      const price = Number(combo.price); if (isNaN(price) || price <= 0) { toast.error(`Tổ hợp ${index + 1}: Giá không hợp lệ.`); hasValidationError = true; return; }
      const stock = Number(combo.stock); if (isNaN(stock) || stock < 0) { toast.error(`Tổ hợp ${index + 1}: Tồn kho không hợp lệ.`); hasValidationError = true; return; }
      const attributeValueIds: number[] = []; let mappingError = false;
      Object.entries(combo.attributes).forEach(([attributeName, valueString]) => {
        const attribute = attributes.find(a => a.name === attributeName);
        if (attribute) { const valueId = findAttributeValueId(String(attribute.id), valueString); if (valueId) attributeValueIds.push(valueId); else mappingError = true; } else mappingError = true;
      });
      if (mappingError || attributeValueIds.length === 0 || attributeValueIds.length !== Object.keys(combo.attributes).length) { toast.error(`Tổ hợp ${index + 1}: Lỗi xác định ID thuộc tính.`); hasValidationError = true; return; }
      variantsToCreate.push({ sku: sku, price: price, stockQuantity: stock, imageUrl: combo.image || null, attributeValueIds: attributeValueIds });
    });
    if (hasValidationError) return;
    const batchRequest = { productId: Number(selectedProductId), variants: variantsToCreate };
    try {
      const response = await fetch(`${API_URL}/v1/variants/batch`, { method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(batchRequest) });
      const result = await response.json();
      if (result.status === 'SUCCESS') {
        toast.success(`Thêm ${variantsToCreate.length} biến thể thành công!`);
        setShowForm(false); setSelectedProductId(""); setSelectedAttributesMap({}); setGeneratedCombinations([]);
        // Tải lại danh sách sản phẩm để cập nhật variantCount
        setProductPage(1); // Quay về trang 1 sp
        fetchProductsBrief();
      } else throw new Error(result.message || "Thêm biến thể thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // Mở Modal Sửa
  const handleEditVariant = (variant: VariantResponse) => {
    setEditingVariantId(variant.id);
    setEditingVariantData({ sku: variant.sku, price: variant.price, stockQuantity: variant.stockQuantity, imageUrl: variant.imageUrl || "" });
    setShowEditModal(true);
  };

  // Lưu Biến thể đã Sửa (PUT /variants/{id})
  const handleSaveEditedVariant = async () => {
    if (!token || !editingVariantId || !editingVariantData) return;
    const price = Number(editingVariantData.price); if (isNaN(price) || price <= 0) return toast.error("Giá không hợp lệ.");
    const stock = Number(editingVariantData.stockQuantity); if (isNaN(stock) || stock < 0) return toast.error("Tồn kho không hợp lệ.");
    const sku = editingVariantData.sku ? editingVariantData.sku.trim() : ""; if (!sku) return toast.error("SKU không được để trống.");
    const updateRequest = { sku: sku, price: price, stockQuantity: stock, imageUrl: editingVariantData.imageUrl || null };
    try {
        const response = await fetch(`${API_URL}/v1/variants/${editingVariantId}`, { method: "PUT", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(updateRequest) });
        const result = await response.json();
        if (result.status === 'SUCCESS') {
            toast.success("Cập nhật biến thể thành công!"); setShowEditModal(false); setEditingVariantId(null); setEditingVariantData(null);
            fetchProductVariants(); // Tải lại danh sách biến thể
        } else throw new Error(result.message || "Cập nhật thất bại");
    } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // Xóa Biến thể (DELETE /variants/{id})
  const handleDeleteVariant = async (id: number) => {
     if (!token || !confirm("Bạn có chắc muốn xóa biến thể này?")) return;
     try {
        const response = await fetch(`${API_URL}/v1/variants/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
        const result = await response.json();
        if (result.status === 'SUCCESS') {
            toast.success("Xóa biến thể thành công!");
            if (productVariants.length === 1 && variantPage > 1) setVariantPage(variantPage - 1); else fetchProductVariants();
            // Tải lại danh sách sản phẩm để cập nhật variantCount
             fetchProductsBrief(); // Gọi lại để cập nhật số lượng
        } else throw new Error(result.message || "Xóa thất bại");
     } catch (err: any) { toast.error(`Lỗi: ${err.message}`); }
  };

  // --- JSX Rendering (Giao diện) ---

  // *** Màn hình 1: Xem Danh sách Biến thể của một Sản phẩm đã chọn ***
  if (viewingProductId && viewingProductName) {
    return (
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Header: Tên sản phẩm & Nút Quay lại */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 mb-4">
          <Button variant="outline" onClick={handleBackToList} className="gap-1.5 self-start sm:self-center"> <ArrowLeft size={18} /> <span className="hidden sm:inline">Quay lại DS Sản phẩm</span><span className="sm:hidden">Quay lại</span> </Button>
          <div className="flex-1 min-w-0 order-first sm:order-none"> <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate text-center sm:text-left" title={viewingProductName}> Biến thể của: {viewingProductName} </h1> </div>
        </div>

        {/* Thanh tìm kiếm biến thể */}
        <div className="flex gap-2 items-center">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <Input placeholder="Tìm SKU, tên hoặc giá trị thuộc tính..." value={variantSearchTerm} onChange={(e) => { setVariantSearchTerm(e.target.value); setVariantPage(1); }} className="flex-1 h-9" />
        </div>

        {/* Bảng Danh sách Biến thể */}
        {isFetchingVariants ? ( <div className="text-center py-10 text-muted-foreground animate-pulse">Đang tải biến thể...</div>
        ) : error ? ( <div className="text-center py-10 text-red-600">Lỗi: {error}</div>
        ) : productVariants.length === 0 ? (
          <Card className="shadow-none border-dashed border-border/50"> <CardContent className="py-10 text-center text-muted-foreground"> {variantSearchTerm ? `Không tìm thấy biến thể khớp với "${variantSearchTerm}".` : "Sản phẩm này chưa có biến thể nào."} </CardContent> </Card>
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
                        <th className="text-center py-2.5 px-3 font-semibold text-foreground/80 w-[100px]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productVariants.map((variant) => (
                        <tr key={variant.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors duration-150">
                          <td className="py-2 px-3"><img src={variant.imageUrl || "/placeholder.svg"} alt={variant.sku} className="w-10 h-10 object-cover rounded border"/></td>
                          <td className="py-2 px-3 align-top"><div className="text-xs space-y-0.5 max-w-[180px] break-words text-foreground/90">{Object.entries(variant.attributes).map(([key, value]) => (<div key={key}><span className="font-medium text-foreground/70">{key}:</span> {value}</div>))}</div></td>
                          <td className="py-2 px-3 font-medium text-foreground">{variant.sku}</td>
                          <td className="py-2 px-3 text-right">{variant.price.toLocaleString('vi-VN')}₫</td>
                          <td className="py-2 px-3 text-right">{variant.stockQuantity}</td>
                          <td className="py-2 px-3">
                           <div className="flex gap-1.5 justify-center">
                              {/* Nút Sửa */}
                              <Button variant="outline" size="icon" className="w-7 h-7" title="Sửa biến thể" onClick={() => handleEditVariant(variant)}>
                                  <Edit2 size={14} />
                              </Button>
                              {/* --- SỬA NÚT XÓA --- */}
                              <Button
                                variant="outline" // Đổi thành 'outline'
                                size="icon"
                                className="w-7 h-7 text-destructive border-destructive hover:bg-destructive/10" // Thêm class màu đỏ
                                title="Xóa biến thể"
                                onClick={() => handleDeleteVariant(variant.id)}
                              >
                                  <Trash2 size={14} />
                              </Button>
                              {/* --- KẾT THÚC SỬA --- */}
                           </div>
                        </td>                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            {/* Phân trang cho Biến thể */}
            {totalVariantPages > 1 && ( <div className="flex justify-center pt-4"><Pagination currentPage={variantPage} totalPages={totalVariantPages} onPageChange={setVariantPage} /></div> )}
          </>
        )}

        {/* --- Modal Sửa Biến Thể --- */}
        {showEditModal && editingVariantData && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in duration-200">
            <Card className="w-full max-w-md bg-card shadow-xl animate-scale-in duration-200"> {/* Giảm max-w */}
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b"><CardTitle className="text-base font-semibold">Chỉnh sửa biến thể</CardTitle><Button variant="ghost" size="icon" className="w-6 h-6 -mr-2 -mt-1 text-muted-foreground hover:bg-muted" onClick={() => setShowEditModal(false)}><X size={16} /></Button></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1.5 text-foreground/90">SKU *</label><Input value={editingVariantData.sku} onChange={(e) => setEditingVariantData({ ...editingVariantData, sku: e.target.value })}/></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1.5 text-foreground/90">Giá *</label><Input type="number" value={editingVariantData.price} onChange={(e) => setEditingVariantData({ ...editingVariantData, price: e.target.value })} min="1" placeholder="vd: 150000"/></div>
                    <div><label className="block text-sm font-medium mb-1.5 text-foreground/90">Tồn kho *</label><Input type="number" value={editingVariantData.stockQuantity} onChange={(e) => setEditingVariantData({ ...editingVariantData, stockQuantity: e.target.value })} min="0" placeholder="vd: 50"/></div>
                </div>
                <div><label className="block text-sm font-medium mb-1.5 text-foreground/90">Hình ảnh (URL)</label><ImageUpload value={editingVariantData.imageUrl} onChange={(value) => setEditingVariantData({ ...editingVariantData, imageUrl: value })} label="" className="h-24"/></div>
                <div className="flex gap-3 pt-3 border-t"><Button onClick={handleSaveEditedVariant} className="flex-1">Lưu thay đổi</Button><Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Hủy</Button></div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // *** Màn hình 2: Danh sách Sản phẩm & Form Tạo Biến thể Mới ***
  // Render màn hình này nếu viewingProductId là null
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header & Nút Tạo Biến Thể */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quản lý biến thể sản phẩm</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các biến thể cho sản phẩm</p>
        </div>
        <Button onClick={() => { setShowForm(true); /* Đã fetch attributes lúc mount */ }} className="gap-2 self-start sm:self-center"> {/* Căn chỉnh nút */}
          <Plus size={18} /> Tạo biến thể
        </Button>
      </div>

      {/* --- Form Tạo Biến Thể Mới --- */}
      {showForm && (
        <Card className="border-primary/40 shadow-md animate-fade-in"> {/* Animation */}
          <CardHeader className="pb-4 border-b"> {/* Giảm padding, thêm border */}
            <CardTitle className="text-lg font-semibold">Tạo biến thể mới</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Bước 1: Chọn Sản phẩm cha */}
            <div className="p-4 border rounded-md bg-muted/20"> {/* Nền nhạt */}
              <label className="block text-sm font-semibold mb-2 text-foreground">1. Chọn sản phẩm cha *</label>
              <div className="flex gap-2 mb-2 items-center">
                <Input placeholder="Tìm kiếm sản phẩm theo tên..." value={productSearchTerm} onChange={(e) => { setProductSearchTerm(e.target.value); setProductPage(1); }} className="flex-1 h-9"/>
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
                <label className="block text-sm font-semibold text-foreground">2. Chọn thuộc tính và giá trị *</label>
                <Select onValueChange={(value) => { if (value) handleAddAttributeToSelection(value); }} value="" disabled={isLoadingAttributes || attributes.length === 0}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={isLoadingAttributes ? "Đang tải..." : (attributes.length === 0 ? "Không có thuộc tính" : "-- Thêm thuộc tính --")} /></SelectTrigger>
                  <SelectContent>
                    {attributes.filter((attr) => !selectedAttributesMap[String(attr.id)]).map((attr) => (<SelectItem key={attr.id} value={String(attr.id)}>{attr.name}</SelectItem>))}
                    {attributes.filter((attr) => !selectedAttributesMap[String(attr.id)]).length === 0 && attributes.length > 0 && <div className="p-2 text-xs text-muted-foreground text-center">Đã thêm hết.</div>}
                  </SelectContent>
                </Select>
                {Object.keys(selectedAttributesMap).length > 0 && (
                    <div className="space-y-3 pt-2">
                      {Object.keys(selectedAttributesMap).map((attrId) => {
                        const attribute = attributes.find((a) => String(a.id) === attrId); if (!attribute) return null;
                        const selectedValues = selectedAttributesMap[attrId] || [];
                        return (
                          <div key={attrId} className="border rounded-lg p-3 bg-background shadow-sm">
                            <div className="flex items-center justify-between mb-2"><h4 className="font-medium text-sm text-foreground">{attribute.name}</h4><Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveAttributeFromSelection(attrId)} title={`Xóa ${attribute.name}`}> <X size={15} /> </Button></div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 pl-1">
                              {attribute.values.map((val) => (<label key={val.id} className="flex items-center gap-2 cursor-pointer p-1 -ml-1 hover:bg-muted/50 rounded transition-colors"><input type="checkbox" checked={selectedValues.includes(val.value)} onChange={() => handleToggleAttributeValueSelection(attrId, val.value)} className="w-4 h-4 accent-primary shrink-0"/> <span className="text-sm text-foreground/90 truncate" title={val.value}>{val.value}</span></label>))}
                              {attribute.values.length === 0 && <span className="text-xs text-muted-foreground col-span-full italic">Chưa có giá trị.</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                )}
                {Object.keys(selectedAttributesMap).length > 0 && (<Button onClick={generateCombinations} variant="secondary" className="w-full h-9 mt-1">3. Tạo các tổ hợp biến thể</Button>)}
              </div>
            )}

           {/* Bước 3: Nhập thông tin chi tiết */}
            {generatedCombinations.length > 0 && (
              <div className="space-y-4 p-4 border rounded-md bg-background">
                 <h3 className="font-semibold text-sm text-foreground">4. Nhập thông tin chi tiết cho {generatedCombinations.length} tổ hợp:</h3>
                 {/* Container có scrollbar */}
                 <div className="space-y-3 max-h-[400px] overflow-y-auto p-1 border rounded-md bg-muted/20 shadow-inner">
                   {generatedCombinations.map((combo, idx) => (
                     // Card cho mỗi tổ hợp
                     <Card key={idx} className="bg-card overflow-hidden shadow-sm border relative group"> {/* Thêm relative group */}
                      {/* --- THÊM NÚT XÓA TỔ HỢP --- */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" // Hiện khi hover
                        onClick={() => {
                          // Lọc bỏ tổ hợp tại index này
                          const newCombos = generatedCombinations.filter((_, i) => i !== idx);
                          setGeneratedCombinations(newCombos); // Cập nhật state
                        }}
                        title="Xóa tổ hợp này"
                      >
                        <X size={14} />
                      </Button>
                      {/* --- KẾT THÚC THÊM NÚT --- */}

                      {/* Header hiển thị các thuộc tính/giá trị */}
                      <CardHeader className="p-3 bg-muted/30 border-b pr-8"> {/* Thêm padding phải để nút X không đè chữ */}
                        <p className="text-sm font-medium text-foreground truncate" title={Object.entries(combo.attributes).map(([k, v]) => `${k}: ${v}`).join(" / ")}>
                            {Object.entries(combo.attributes).map(([k, v]) => `${k}: ${v}`).join(" / ")}
                        </p>
                      </CardHeader>
                       {/* Nội dung nhập liệu */}
                       <CardContent className="p-3 space-y-2">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {/* Input SKU */}
                           <Input placeholder="SKU *" value={combo.sku} className="h-9 text-sm" onChange={(e) => { const nc = [...generatedCombinations]; nc[idx].sku = e.target.value; setGeneratedCombinations(nc); }}/>
                           {/* Input Giá */}
                           <Input placeholder="Giá *" type="number" value={combo.price} min="1" className="h-9 text-sm" onChange={(e) => { const nc = [...generatedCombinations]; nc[idx].price = e.target.value; setGeneratedCombinations(nc); }}/>
                           {/* Input Tồn kho */}
                           <Input placeholder="Tồn kho *" type="number" value={combo.stock} min="0" className="h-9 text-sm" onChange={(e) => { const nc = [...generatedCombinations]; nc[idx].stock = e.target.value; setGeneratedCombinations(nc); }}/>
                           {/* Input Hình ảnh (URL) */}
                           <div className="flex items-center"><ImageUpload value={combo.image} onChange={(value) => { const nc = [...generatedCombinations]; nc[idx].image = value; setGeneratedCombinations(nc); }} label="" className="w-full h-9 text-xs"/></div>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>

                {/* Nút Lưu / Hủy cuối cùng */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSaveVariants} className="flex-1" disabled={generatedCombinations.length === 0}> {/* Disable nếu không còn tổ hợp */}
                    {generatedCombinations.length > 0 ? `Lưu ${generatedCombinations.length} biến thể` : "Lưu biến thể"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setSelectedProductId(""); setSelectedAttributesMap({}); setGeneratedCombinations([]); }} className="flex-1"> Hủy </Button>
                </div>
              </div>
            )}

            {/* Nút Hủy chung */}
            {!selectedProductId && (<div className="flex justify-end pt-4 border-t mt-4"><Button variant="outline" onClick={() => setShowForm(false)}> Hủy </Button></div>)}
          </CardContent>
        </Card>
      )}

      {/* --- DANH SÁCH SẢN PHẨM (Để chọn xem biến thể) --- */}
      {!showForm && (
          <div className="space-y-4 pt-6">
            <h2 className="text-xl font-semibold text-foreground">Chọn sản phẩm để xem/quản lý biến thể</h2>
            <div className="flex gap-2 items-center sticky top-[60px] sm:top-[68px] bg-background py-2 z-10 border-b -mx-6 px-6"> {/* Sticky search bar */}
              <Search size={18} className="text-muted-foreground flex-shrink-0" />
              <Input placeholder="Tìm kiếm sản phẩm theo tên..." value={productSearchTerm} onChange={(e) => { setProductSearchTerm(e.target.value); setProductPage(1); }} className="flex-1 h-9"/>
              {isFetchingProducts && <span className="text-xs text-muted-foreground animate-pulse">Đang tải...</span>}
            </div>
            {isFetchingProducts && productsBrief.length === 0 ? ( <div className="text-center py-8 text-muted-foreground">Đang tải danh sách sản phẩm...</div>
            ) : productsBrief.length === 0 ? ( <div className="text-center py-8 text-muted-foreground">{productSearchTerm ? `Không tìm thấy sản phẩm nào với tên "${productSearchTerm}".` : "Chưa có sản phẩm nào."}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2"> {/* Thêm pt-2 */}
                {productsBrief.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow duration-150"> {/* Shadow nhẹ hơn */}
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
            {/* Phân trang sản phẩm */}
            {totalProductPages > 1 && (<div className="flex justify-center pt-4"><Pagination currentPage={productPage} totalPages={totalProductPages} onPageChange={setProductPage} /></div>)}
          </div>
      )}
    </div> // Div gốc
  );
}