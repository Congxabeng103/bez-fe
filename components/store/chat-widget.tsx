"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@/hooks/use-chat"
import { Button } from "@/components/ui/button"
import { X, Send, MessageCircle } from "lucide-react"

interface ChatWidgetProps {
  userId: string
  userName: string
  recipientId: string
  recipientName: string
}

export function ChatWidget({ userId, userName, recipientId, recipientName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const { sendMessage, getConversation } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const conversation = getConversation(userId, recipientId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessage(userId, userName, recipientId, message)
      setMessage("")
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-card border border-border rounded-lg shadow-lg z-40 flex flex-col max-h-96">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">Chat với {recipientName}</h3>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">Chưa có tin nhắn nào</p>
        ) : (
          conversation.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === userId ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <Button type="submit" size="sm" className="px-3">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
