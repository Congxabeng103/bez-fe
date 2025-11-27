"use client";

import React, { useState, useEffect } from "react";
import { Star, User, CheckCircle2, Loader2, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/authStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
// Import Pagination component chung
import { Pagination } from "@/components/store/pagination"; 

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Review {
  id: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  
  // --- QUAN TRỌNG: Đổi tên thành 'visible' để khớp JSON Backend ---
  visible: boolean; 
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  starCounts: Record<string, number>;
}

export default function ProductReviews({ productId }: { productId: string | number }) {
  const { user, token } = useAuthStore();
  
  // Kiểm tra quyền Admin/Manager
  const isAdminOrManager = user?.roles?.includes("ADMIN") || user?.roles?.includes("MANAGER");

  // Data State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  
  // UI State
  const [loadingList, setLoadingList] = useState(true);
  
  // Page State (Bắt đầu từ 1)
  const [page, setPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter State
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("DATE_DESC");

  // Form State
  const [userRating, setUserRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- 1. Fetch Stats ---
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/v1/reviews/product/${productId}/stats`);
      const data = await res.json();
      if (data.status === "SUCCESS") setStats(data.data);
    } catch (err) { console.error(err); }
  };

  // --- 2. Fetch Reviews ---
  const fetchReviews = async (pageNum = 1) => {
    setLoadingList(true);
    try {
      // API Spring Boot page bắt đầu từ 0 nên phải trừ 1
      let url = `${API_URL}/v1/reviews/product/${productId}?page=${pageNum - 1}&size=5&sortBy=${sortBy}`;
      if (activeFilter) url += `&rating=${activeFilter}`;

      // Gửi token để Admin xem được cả review ẩn
      const headers: HeadersInit = {};
      if (token) {
          headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers }); 
      const data = await res.json();
      
      if (data.status === "SUCCESS") {
        setReviews(data.data.content);
        setTotalPages(data.data.totalPages);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingList(false); }
  };

  useEffect(() => {
    fetchStats();
  }, [productId]);

  useEffect(() => {
    setPage(1); 
    fetchReviews(1);
  }, [productId, activeFilter, sortBy, token]);

  // --- 3. Wrapper chuyển trang ---
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchReviews(newPage);
    document.getElementById("review-list-top")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // --- 4. Submit Review ---
  const handleSubmit = async () => {
    if (!user) { toast.error("Vui lòng đăng nhập"); return; }
    if (!comment.trim()) { toast.error("Nhập nội dung đi bạn ơi"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/v1/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ productId: Number(productId), rating: userRating, comment }),
      });
      const data = await res.json();

      if (res.ok && data.status === "SUCCESS") {
        toast.success("Đánh giá thành công!");
        setComment("");
        fetchReviews(1); // Reload về trang 1
        fetchStats(); 
      } else {
        toast.error(data.message || "Lỗi rồi");
      }
    } catch { toast.error("Lỗi mạng"); }
    finally { setSubmitting(false); }
  };

  // --- 5. Ẩn/Hiện Review (Admin) ---
  const handleToggleVisibility = async (reviewId: number) => {
    try {
        const res = await fetch(`${API_URL}/v1/reviews/${reviewId}`, {
            method: "DELETE", // Backend map DELETE -> Toggle Visibility
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok && data.status === "SUCCESS") {
            toast.success("Đã thay đổi trạng thái");
            fetchReviews(page); // Reload đúng trang đang đứng
            fetchStats();
        } else {
            toast.error(data.message || "Thao tác thất bại");
        }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  const renderStars = (count: number, size = "w-4 h-4") => 
    Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`${size} ${i < count ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-100"}`} />
    ));

  return (
    <div className="mt-16 pt-10 border-t border-border">
      <h2 className="text-2xl font-bold mb-8">Đánh giá & Nhận xét</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* === CỘT TRÁI: THỐNG KÊ === */}
        <div className="lg:col-span-4 space-y-8">
          {stats && (
            <div className="bg-muted/30 p-6 rounded-xl border border-border">
              <div className="flex items-end gap-3 mb-6">
                 <span className="text-5xl font-extrabold text-primary">
                   {stats.averageRating.toFixed(1)}
                 </span>
                 <div className="mb-2">
                    <div className="flex gap-1 mb-1">{renderStars(Math.round(stats.averageRating))}</div>
                    <p className="text-sm text-muted-foreground">{stats.totalReviews} đánh giá</p>
                 </div>
              </div>

              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.starCounts[star] || 0;
                  const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <button 
                      key={star}
                      onClick={() => setActiveFilter(activeFilter === star ? null : star)}
                      className={`w-full flex items-center gap-3 text-sm hover:opacity-80 transition-opacity ${activeFilter === star ? 'font-bold text-primary' : ''}`}
                    >
                      <span className="w-3">{star}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{percent.toFixed(0)}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Form đánh giá */}
          <div className="bg-muted/30 p-6 rounded-xl border border-border">
            <h3 className="font-semibold mb-4">Viết đánh giá của bạn</h3>
            {!user ? (
               <div className="text-sm text-muted-foreground text-center py-4">
                 Vui lòng <Link href="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link> để đánh giá.
               </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                   {[1, 2, 3, 4, 5].map(s => (
                     <button key={s} onClick={() => setUserRating(s)} className="hover:scale-110 transition">
                       <Star className={`w-8 h-8 ${s <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                     </button>
                   ))}
                </div>
                <Textarea 
                  value={comment} onChange={e => setComment(e.target.value)} 
                  placeholder="Sản phẩm thế nào?..." className="bg-background mb-4" 
                />
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="animate-spin mr-2"/>} Gửi đánh giá
                </Button>
              </>
            )}
          </div>
        </div>

        {/* === CỘT PHẢI: DANH SÁCH REVIEW === */}
        <div className="lg:col-span-8">
           
           {/* Thanh Lọc */}
           <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border" id="review-list-top">
              <div className="flex flex-wrap gap-2">
                 <Button 
                   variant={activeFilter === null ? "default" : "outline"} 
                   size="sm" onClick={() => setActiveFilter(null)}
                 >
                   Tất cả 
                 </Button>

                 {[5, 4, 3, 2, 1].map(star => {
                    const count = stats?.starCounts[star] || 0;
                    return (
                        <Button 
                        key={star} 
                        variant={activeFilter === star ? "default" : "outline"} 
                        size="sm" onClick={() => setActiveFilter(star)}
                        >
                        {star} Sao ({count})
                        </Button>
                    );
                 })}
              </div>

              <select 
                value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="text-sm border rounded-md px-3 py-1.5 bg-background"
              >
                 <option value="DATE_DESC">Mới nhất</option>
                 <option value="DATE_ASC">Cũ nhất</option>
                 <option value="RATING_DESC">Sao cao nhất</option>
                 <option value="RATING_ASC">Sao thấp nhất</option>
              </select>
           </div>

           {/* Danh sách */}
           {loadingList ? (
              <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary"/></div>
           ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                 Chưa có đánh giá nào phù hợp bộ lọc.
              </div>
           ) : (
             <div className="space-y-6">
               {reviews.map(r => (
                 <div 
                    key={r.id} 
                    className={`
                        border-b border-border pb-6 last:border-0 animate-in fade-in slide-in-from-bottom-2 group
                        transition-all duration-300
                        ${!r.visible ? "bg-muted/40 opacity-70 grayscale p-4 rounded-lg border border-dashed" : ""} 
                    `}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden">
                             {r.userAvatar ? <img src={r.userAvatar} className="w-full h-full object-cover"/> : <User className="w-5 h-5"/>}
                          </div>
                          <div>
                             <div className="font-semibold text-sm flex items-center gap-2">
                               {r.userName}
                               {r.isVerifiedPurchase && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Đã mua</span>}
                               
                               {/* Nhãn ĐÃ ẨN: Dùng biến r.visible */}
                               {!r.visible && isAdminOrManager && (
                                   <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200">
                                       ĐÃ ẨN
                                   </span>
                               )}
                             </div>
                             <div className="flex mt-1">{renderStars(r.rating, "w-3 h-3")}</div>
                          </div>
                       </div>

                       <div className="flex items-center gap-3">
                           <span className="text-xs text-muted-foreground">{r.createdAt ? format(new Date(r.createdAt), "dd/MM/yyyy", {locale: vi}) : ""}</span>
                           
                           {/* === NÚT ADMIN ẨN/HIỆN (Dùng biến r.visible) === */}
                           {isAdminOrManager && (
                               <button 
                                   onClick={() => handleToggleVisibility(r.id)}
                                   className={`p-2 rounded-full transition-colors ${
                                       r.visible 
                                       ? "text-muted-foreground hover:text-red-600 hover:bg-red-50" // Đang hiện -> Nút Ẩn
                                       : "text-green-600 hover:text-green-700 hover:bg-green-50 bg-green-100" // Đang ẩn -> Nút Hiện
                                   }`}
                                   title={r.visible ? "Ẩn đánh giá này" : "Hiển thị lại đánh giá này"}
                               >
                                   {r.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                               </button>
                           )}
                       </div>
                    </div>
                    <p className="text-sm pl-[52px] text-foreground/90 leading-relaxed whitespace-pre-line">{r.comment}</p>
                 </div>
               ))}
               
               {/* Component Pagination */}
               {totalPages > 1 && (
                 <div className="flex justify-center pt-4">
                    <Pagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={handlePageChange} 
                    />
                 </div>
               )}

             </div>
           )}
        </div>
      </div>
    </div>
  );
}