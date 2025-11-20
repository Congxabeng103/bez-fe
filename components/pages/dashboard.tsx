"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/authStore"
import { manualFetchApi } from "@/lib/api"
import { cn } from "@/lib/utils"

// --- UI COMPONENTS ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- CHARTS ---
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { Loader2, AlertTriangle, Check, ChevronsUpDown, Calendar, Package, DollarSign, ShoppingBag, Users, Layers } from "lucide-react"

// --- TYPES ---
type DashboardStatsDTO = {
  totalRevenue: number;
  totalCompletedOrders: number;
  totalCustomers: number;
  totalProducts: number;
}
type MonthlyRevenueDTO = { month: string; revenue: number; orders: number; }
type CategorySalesDTO = { name: string; value: number; }
type TopSellingProductDTO = { productName: string; totalSold: number; }
type ProductFilterDTO = { id: number; name: string; }

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

// --- FORMATTERS ---
const formatCurrencyFull = (amount: number) => amount.toLocaleString('vi-VN') + ' đ';
const formatCurrencyCompact = (amount: number) => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Tỷ`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} Tr`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)} K`;
  return amount.toString();
};

export function Dashboard() {
  // --- STATES ---
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueDTO[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySalesDTO[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProductDTO[]>([]);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [openProductBox, setOpenProductBox] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [productList, setProductList] = useState<ProductFilterDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { user } = useAuthStore();

  // --- LOAD DATA ---
  useEffect(() => {
    const initData = async () => {
      const roles = user?.roles || [];
      const canView = roles.includes("ADMIN") || roles.includes("MANAGER");
      setIsAuthorized(canView);
      if (!canView) { setIsLoading(false); return; }

      setIsLoading(true);
      try {
        const [statsRes, categoryRes, topProductsRes, yearsRes, productsRes] = await Promise.all([
          manualFetchApi("/v1/dashboard/stats"),
          manualFetchApi("/v1/dashboard/category-sales"),
          manualFetchApi("/v1/dashboard/top-products"),
          manualFetchApi("/v1/dashboard/years"),
          manualFetchApi("/v1/dashboard/products-filter")
        ]);
        setStats(statsRes.data);
        setCategoryData(categoryRes.data);
        setTopProducts(topProductsRes.data);
        setAvailableYears(yearsRes.data);
        setProductList(productsRes.data);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    initData();
  }, [user]);

  // --- LOAD CHART ---
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchChart = async () => {
      try {
        let url = `/v1/dashboard/monthly-revenue?year=${selectedYear}`;
        if (selectedProductId !== "all") url += `&productId=${selectedProductId}`;
        const res = await manualFetchApi(url);
        setMonthlyData(res.data);
      } catch (e) { console.error(e); }
    };
    fetchChart();
  }, [isAuthorized, selectedYear, selectedProductId]);

  if (isLoading) return <div className="flex h-[80vh] justify-center items-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAuthorized) return <div className="flex h-[80vh] justify-center items-center flex-col"><AlertTriangle className="h-12 w-12 text-red-500 mb-4"/><h2>Không có quyền truy cập</h2></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Doanh thu" value={formatCurrencyFull(stats?.totalRevenue ?? 0)} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard title="Đơn thành công" value={stats?.totalCompletedOrders ?? 0} icon={ShoppingBag} color="text-green-600" bg="bg-green-50" />
        <KpiCard title="Khách hàng" value={stats?.totalCustomers ?? 0} icon={Users} color="text-orange-600" bg="bg-orange-50" />
        <KpiCard title="Sản phẩm" value={stats?.totalProducts ?? 0} icon={Layers} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. BIỂU ĐỒ CỘT KÉP (DOANH THU & ĐƠN HÀNG) */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Doanh thu & Đơn hàng</CardTitle>
                <CardDescription>Biểu đồ so sánh theo tháng</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[160px] h-9"><Calendar className="mr-2 h-3.5 w-3.5 opacity-70" /><SelectValue placeholder="Chọn năm" /></SelectTrigger>
                  <SelectContent>{availableYears.map(y => <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>)}</SelectContent>
                </Select>
                <Popover open={openProductBox} onOpenChange={setOpenProductBox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-[220px] h-9 justify-between font-normal">
                      <div className="flex items-center truncate"><Package className="mr-2 h-3.5 w-3.5 opacity-70 shrink-0" /><span className="truncate">{selectedProductId === "all" ? "Tất cả sản phẩm" : productList.find(p => p.id.toString() === selectedProductId)?.name || "Chọn..."}</span></div>
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0">
                    <Command>
                      <CommandInput placeholder="Tìm sản phẩm..." />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="all" onSelect={() => {setSelectedProductId("all"); setOpenProductBox(false)}}><Check className={cn("mr-2 h-4 w-4", selectedProductId === "all" ? "opacity-100" : "opacity-0")}/> Tất cả</CommandItem>
                          {productList.map(p => (<CommandItem key={p.id} value={p.name} onSelect={() => {setSelectedProductId(p.id.toString()); setOpenProductBox(false)}}><Check className={cn("mr-2 h-4 w-4", selectedProductId === p.id.toString() ? "opacity-100" : "opacity-0")}/> {p.name}</CommandItem>))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  
                  {/* TRỤC NGANG */}
                  <XAxis dataKey="month" interval={0} tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12, fill: "#6b7280" }} />
                  
                  {/* TRỤC TRÁI (DOANH THU - XANH DƯƠNG) */}
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#3b82f6" // Màu trục xanh
                    tickFormatter={formatCurrencyCompact} 
                    width={50} 
                    tickLine={false} axisLine={false} 
                    tick={{ fontSize: 12, fill: "#3b82f6" }} // Màu chữ xanh
                  />

                  {/* TRỤC PHẢI (SỐ ĐƠN - ĐỎ) */}
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#ef4444" // Màu trục đỏ
                    tickLine={false} axisLine={false} 
                    width={40}
                    allowDecimals={false} // <-- QUAN TRỌNG: Không hiện số lẻ (1.5 đơn)
                    tick={{ fontSize: 12, fill: "#ef4444" }} // Màu chữ đỏ
                  />
                  
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number, name: string) => {
                        if (name === "Doanh thu") return [formatCurrencyFull(value), "Doanh thu"];
                        if (name === "Số đơn") return [value, "Số đơn"];
                        return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  
                  {/* CỘT DOANH THU (TRÁI) */}
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Doanh thu" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  
                  {/* CỘT SỐ ĐƠN (PHẢI) */}
                  <Bar yAxisId="right" dataKey="orders" fill="#ef4444" name="Số đơn" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 2. CỘT PHẢI (BIỂU ĐỒ TRÒN & TOP SP) */}
        <div className="space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader><CardTitle>Tỷ trọng danh mục</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData} cx="50%" cy="50%" innerRadius={0} outerRadius={80}
                      dataKey="value" nameKey="name"
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true}
                    >
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0}/>)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrencyFull(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200 flex-1">
            <CardHeader><CardTitle>Top Bán Chạy</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i===0?'bg-yellow-100 text-yellow-700':i===1?'bg-gray-100 text-gray-700':'bg-orange-50 text-orange-700'}`}>{i + 1}</span>
                        <span className="truncate font-medium" title={p.productName}>{p.productName}</span>
                      </div>
                      <span className="font-bold text-gray-900 shrink-0">{p.totalSold}</span>
                    </div>
                  ))
                ) : <p className="text-gray-500 text-sm text-center">Chưa có dữ liệu</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="shadow-sm border-gray-200">
      <CardContent className="p-4 flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500">{title}</p><h3 className="text-xl font-bold mt-1">{value}</h3></div>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
      </CardContent>
    </Card>
  )
}