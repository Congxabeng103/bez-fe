"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PromotionResponseDTO } from "@/types/promotionDTO"
import { PartyPopper, CalendarDays } from "lucide-react" // 1. Thêm icon Lịch
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import React, { useState, useEffect } from "react" 

interface CampaignSliderProps {
  promotions: PromotionResponseDTO[];
}

// (MỚI) Hàm định dạng ngày
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateString; // Trả về nguyên bản nếu lỗi
  }
}

export function CampaignSlider({ promotions }: CampaignSliderProps) {
  
  if (!promotions || promotions.length === 0) {
    return null;
  }

  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true }) as any
  )

  useEffect(() => {
    if (!api) { return }
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
    return () => {
      api.off("select", () => {
        setCurrent(api.selectedScrollSnap())
      })
    }
  }, [api])

  const scrollTo = (index: number) => {
    api?.scrollTo(index)
  }

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {promotions.map((promotion) => (
            <CarouselItem key={promotion.id}>
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg min-h-[250px] flex flex-col justify-center">
                <div className="absolute -bottom-10 -right-10 opacity-20">
                  <PartyPopper className="h-48 w-48" />
                </div>
                <div className="relative z-10">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider">
                    {promotion.name}
                  </h3>
                  
                  <p className="mb-4 max-w-2xl text-2xl font-bold leading-tight md:text-3xl">
                    Giảm {promotion.discountValue}% - {promotion.description}
                  </p>
                  
                  {/* 2. (MỚI) Thêm thời gian */}
                  <div className="mb-6 flex items-center gap-2 text-blue-100 opacity-90">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-sm">
                      Áp dụng đến: {formatDate(promotion.endDate)}
                    </span>
                  </div>

                  <Link href="/products"> 
                    <Button variant="outline" className="bg-white text-blue-700 hover:bg-white/90">
                      Xem ngay
                    </Button>
                  </Link>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {promotions.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary" />
          </>
        )}
      </Carousel>

      {/* Dấu chấm tròn */}
      {promotions.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-10">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`h-2 w-2 rounded-full transition-all ${
                current === i ? "w-4 bg-white" : "bg-white/50"
              }`}
              aria-label={`Chuyển đến slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}