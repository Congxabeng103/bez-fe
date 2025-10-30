"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Pagination } from "@/components/store/pagination"

const ITEMS_PER_PAGE = 5

export function ActivityTracking() {
  const { activities, deleteActivity } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredActivities = useMemo(
    () =>
      activities.filter(
        (a) =>
          a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.orderId.includes(searchTerm) ||
          a.action.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [activities, searchTerm],
  )

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE)
  const paginatedActivities = filteredActivities.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Hoạt động nhân viên</h1>
        <p className="text-muted-foreground">Theo dõi các thay đổi đơn hàng của nhân viên</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử hoạt động ({filteredActivities.length})</CardTitle>
          <div className="mt-4 flex gap-2">
            <Search size={20} className="text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo nhân viên, mã đơn hoặc hành động..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedActivities.map((activity) => (
              <div
                key={activity.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">{activity.action}</h3>
                      <p className="text-sm text-muted-foreground">Nhân viên: {activity.employeeName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="bg-muted p-3 rounded text-sm">
                    <p>
                      <span className="font-medium">Đơn hàng:</span> {activity.orderId}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteActivity(activity.id)} className="ml-2">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
