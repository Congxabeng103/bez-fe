"use client"

import { useState, useEffect } from "react"

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  recipientId: string
  message: string
  timestamp: string
  read: boolean
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("chatMessages", JSON.stringify(messages))
    }
  }, [messages, isLoaded])

  const sendMessage = (senderId: string, senderName: string, recipientId: string, message: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      senderName,
      recipientId,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => [newMessage, ...prev])
    return newMessage
  }

  const getConversation = (userId1: string, userId2: string) => {
    return messages
      .filter(
        (m) =>
          (m.senderId === userId1 && m.recipientId === userId2) ||
          (m.senderId === userId2 && m.recipientId === userId1),
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  const markAsRead = (messageId: string) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, read: true } : m)))
  }

  const getUnreadCount = (userId: string) => {
    return messages.filter((m) => m.recipientId === userId && !m.read).length
  }

  return {
    messages,
    sendMessage,
    getConversation,
    markAsRead,
    getUnreadCount,
    isLoaded,
  }
}
