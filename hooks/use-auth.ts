"use client"

import { useState, useEffect } from "react"

export interface User {
  id: string
  email: string
  name: string
  phone: string
  address: string
  city: string
  zipCode: string
  country: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  isLoggedIn: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setAuthState({
        user,
        isLoggedIn: true,
      })
    }
    setIsLoaded(true)
  }, [])

  const register = (email: string, password: string, name: string) => {
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
    if (existingUsers.some((u: any) => u.email === email)) {
      return { success: false, error: "Email đã được đăng ký" }
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      country: "",
      createdAt: new Date().toISOString(),
    }

    // Store user credentials
    existingUsers.push({ email, password })
    localStorage.setItem("users", JSON.stringify(existingUsers))

    // Log in the user
    localStorage.setItem("user", JSON.stringify(newUser))
    setAuthState({
      user: newUser,
      isLoggedIn: true,
    })

    return { success: true }
  }

  const login = (email: string, password: string) => {
    const demoAccounts = [
      { email: "demo@example.com", password: "demo123" },
      { email: "user@example.com", password: "user123" },
    ]

    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const allUsers = [...users, ...demoAccounts]
    const user = allUsers.find((u: any) => u.email === email && u.password === password)

    if (!user) {
      return { success: false, error: "Email hoặc mật khẩu không hợp lệ" }
    }

    const userData: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split("@")[0],
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      country: "",
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem("user", JSON.stringify(userData))
    setAuthState({
      user: userData,
      isLoggedIn: true,
    })

    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem("user")
    setAuthState({
      user: null,
      isLoggedIn: false,
    })
  }

  const updateProfile = (updates: Partial<User>) => {
    if (!authState.user) return

    const updatedUser = { ...authState.user, ...updates }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    setAuthState({
      user: updatedUser,
      isLoggedIn: true,
    })
  }

  return {
    ...authState,
    register,
    login,
    logout,
    updateProfile,
    isLoaded,
  }
}
