"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { useStore } from "@/lib/store"
import { useMemo } from "react"

export function Analytics() {
  const { orders, variants, customers, products } = useStore()

  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const newCustomers = customers.length
    const conversionRate = totalOrders > 0 ? ((newCustomers / totalOrders) * 100).toFixed(1) : "0"

    // Monthly stats (mock data for demonstration)
    const monthlyStats = [
      { month: "Jan", revenue: 4000, customers: 240, orders: 120 },
      { month: "Feb", revenue: 3000, customers: 221, orders: 100 },
      { month: "Mar", revenue: 2000, customers: 229, orders: 80 },
      { month: "Apr", revenue: 2780, customers: 200, orders: 95 },
      { month: "May", revenue: 1890, customers: 229, orders: 75 },
      { month: "Jun", revenue: 2390, customers: 200, orders: 110 },
    ]

    // Top products by sales
    const topProducts = variants.slice(0, 5).map((v) => ({
      name: v.productName,
      sales: v.price * v.stock,
      quantity: v.stock,
    }))

    return {
      totalRevenue,
      totalOrders,
      newCustomers,
      conversionRate,
      monthlyStats,
      topProducts,
    }
  }, [orders, variants, customers])

  const salesByCategory = useMemo(() => {
    const categoryMap: Record<string, { sales: number; orders: number }> = {}

    products.forEach((product) => {
      if (!categoryMap[product.category]) {
        categoryMap[product.category] = { sales: 0, orders: 0 }
      }
    })

    variants.forEach((variant) => {
      const product = products.find((p) => p.id === variant.productId)
      if (product && categoryMap[product.category]) {
        categoryMap[product.category].sales += variant.price * variant.stock
        categoryMap[product.category].orders += 1
      }
    })

    return Object.entries(categoryMap).map(([category, data]) => ({
      category,
      sales: data.sales,
      orders: data.orders,
    }))
  }, [products, variants])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Thống kê</h1>
        <p className="text-muted-foreground">Phân tích chi tiết về doanh số và hiệu suất bán hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₫{(analytics.totalRevenue / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-green-600">+15% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-green-600">+12% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.newCustomers}</div>
            <p className="text-xs text-green-600">+8% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ lệ chuyển đổi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-red-600">-0.5% so với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Doanh số theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByCategory.length > 0 ? (
              <ChartContainer
                config={{
                  sales: { label: "Doanh số", color: "hsl(var(--chart-1))" },
                  orders: { label: "Đơn hàng", color: "hsl(var(--chart-2))" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="var(--color-sales)" />
                    <Bar dataKey="orders" fill="var(--color-orders)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 biến thể bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topProducts.length > 0 ? (
                analytics.topProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.quantity} sản phẩm</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₫{(product.sales / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thống kê theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: { label: "Doanh thu (triệu)", color: "hsl(var(--chart-1))" },
              customers: { label: "Khách hàng", color: "hsl(var(--chart-2))" },
              orders: { label: "Đơn hàng", color: "hsl(var(--chart-3))" },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" />
                <Line type="monotone" dataKey="customers" stroke="var(--color-customers)" />
                <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
