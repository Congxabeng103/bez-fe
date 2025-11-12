"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { useState, useEffect } from "react"
import { manualFetchApi } from "@/lib/api" 
import { Loader2, AlertTriangle } from "lucide-react" // <-- Thêm AlertTriangle
import { useAuthStore } from "@/lib/authStore" // <-- 1. IMPORT AUTH STORE

// --- 1. Định nghĩa DTOs (Typescript) ---
type DashboardStatsDTO = {
  totalRevenue: number;
  totalCompletedOrders: number;
  totalCustomers: number;
  totalProducts: number;
}
type MonthlyRevenueDTO = {
  month: string;
  revenue: number;
  orders: number;
}
type CategorySalesDTO = {
  name: string;
  value: number;
}
type TopSellingProductDTO = {
  productName: string;
  totalSold: number;
}
// ---

// (Hàm format tiền)
const formatCurrency = (amount: number) => `₫${Math.round(amount).toLocaleString('vi-VN')}`;

// (Màu cho PieChart)
const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export function Dashboard() {
  
  // --- 2. Tạo State cho 4 nguồn dữ liệu ---
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueDTO[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySalesDTO[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- 3. SỬA PHÂN QUYỀN ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { user } = useAuthStore();
  // ---

  // --- 4. SỬA API Call (Kiểm tra quyền trước) ---
  useEffect(() => {
    
    // 4.1. Kiểm tra quyền
    const roles = user?.roles || [];
    const canView = roles.includes("ADMIN") || roles.includes("MANAGER");
    setIsAuthorized(canView);

    if (!canView) {
      setIsLoading(false);
      return; // Dừng lại, không gọi API nếu là STAFF
    }

    // 4.2. Chỉ gọi API nếu có quyền
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, monthlyRes, categoryRes, topProductsRes] = await Promise.all([
          manualFetchApi("/v1/dashboard/stats"),
          manualFetchApi("/v1/dashboard/monthly-revenue"),
          manualFetchApi("/v1/dashboard/category-sales"),
          manualFetchApi("/v1/dashboard/top-products") 
        ]);
        
        setStats(statsRes.data);
        setMonthlyData(monthlyRes.data);
        setCategoryData(categoryRes.data);
        setTopProducts(topProductsRes.data); 
        
      } catch (error) {
        console.error("Lỗi tải dữ liệu dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]); // Chạy lại khi 'user' thay đổi
  // ---

  // Component Loading
  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    )
  }
  
  // --- 5. THÊM MỚI: Màn hình Từ chối Truy cập ---
  if (!isAuthorized) {
    return (
       <div className="flex flex-col h-[80vh] w-full items-center justify-center p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            Bạn không có quyền truy cập
          </h2>
          <p className="mt-2 text-muted-foreground">
            Chức năng này chỉ dành cho cấp Quản lý (Manager) và Quản trị viên (Admin).
          </p>
      </div>
    )
  }
  // ---

  // (Phần JSX còn lại giữ nguyên)
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan về cửa hàng của bạn</p>
      </div>

      {/* --- 5. Gắn dữ liệu THẬT vào 4 Card KPI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Tính trên đơn đã hoàn thành</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng đơn hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalCompletedOrders ?? 0}
            </div>
             <p className="text-xs text-muted-foreground">Các đơn đã giao thành công</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalCustomers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Tổng số tài khoản khách</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalProducts ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Tổng số sản phẩm</p>
          </CardContent>
        </Card>
      </div>
      {/* --- Kết thúc 4 Card --- */}


      {/* --- 6. Gắn dữ liệu THẬT vào 2 Biểu đồ + 1 List Mới --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu theo tháng (Năm nay)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" label={{ value: 'Doanh thu (VND)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" label={{ value: 'Đơn hàng', angle: -90, position: 'insideRight' }} />
                  <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value as number) : value} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Doanh thu" />
                  <Bar yAxisId="right" dataKey="orders" fill="#ef4444" name="Đơn hàng" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bán hàng theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* --- CARD TOP 5 SẢN PHẨM MỚI --- */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top 5 Sản phẩm bán chạy (Theo số lượng)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <div key={product.productName} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{product.productName}</span>
                    <span className="text-sm font-semibold text-primary">{product.totalSold} lượt bán</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
              )}
            </div>
          </CardContent>
        </Card>
        {/* --- Kết thúc Card Top 5 --- */}
      </div>
    </div>
  )
}