"use client"

import { useState, useEffect } from "react"; 
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated } = useAuthStore(); 
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isAuthorized = isAuthenticated && user && (
    user.roles.includes('ADMIN') || user.roles.includes('STAFF')
  )

  useEffect(() => {
    if (!isHydrated) {
      return; 
    }
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin'); 
      return;
    }
    if (isAuthenticated && !isAuthorized) {
        router.push('/'); 
    }
  }, [isHydrated, isAuthenticated, isAuthorized, router]); 

  if (!isHydrated || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  return <>{children}</>
}