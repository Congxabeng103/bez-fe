"use client"

import { useState, useEffect } from "react"

export interface FollowedShop {
  userId: string
  shopId: string
  followedAt: string
}

export function useFollowShop() {
  const [followedShops, setFollowedShops] = useState<FollowedShop[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedFollowedShops = localStorage.getItem("followedShops")
    if (savedFollowedShops) {
      setFollowedShops(JSON.parse(savedFollowedShops))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("followedShops", JSON.stringify(followedShops))
    }
  }, [followedShops, isLoaded])

  const followShop = (userId: string, shopId: string) => {
    const isFollowing = followedShops.some((f) => f.userId === userId && f.shopId === shopId)
    if (!isFollowing) {
      setFollowedShops((prev) => [
        ...prev,
        {
          userId,
          shopId,
          followedAt: new Date().toISOString(),
        },
      ])
    }
  }

  const unfollowShop = (userId: string, shopId: string) => {
    setFollowedShops((prev) => prev.filter((f) => !(f.userId === userId && f.shopId === shopId)))
  }

  const isFollowing = (userId: string, shopId: string) => {
    return followedShops.some((f) => f.userId === userId && f.shopId === shopId)
  }

  const getFollowedShops = (userId: string) => {
    return followedShops.filter((f) => f.userId === userId)
  }

  return {
    followedShops,
    followShop,
    unfollowShop,
    isFollowing,
    getFollowedShops,
    isLoaded,
  }
}
