"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DevEmailNotification() {
  const [visible, setVisible] = useState(false)
  const [messages, setMessages] = useState<string[]>([])

  // This is a mock implementation for development purposes
  // In a real app, you would use a proper notification system
  useEffect(() => {
    // Check if we're in development mode
    if (process.env.NODE_ENV === "development") {
      // Mock receiving console logs about emails
      const originalConsoleLog = console.log
      console.log = (...args) => {
        originalConsoleLog.apply(console, args)

        // Check if this is an email log
        const logString = args.join(" ")
        if (logString.includes("EMAIL WOULD BE SENT")) {
          setVisible(true)
          setMessages((prev) => [...prev, "Email would be sent in production. Check console for details."])

          // Auto-hide after 10 seconds
          setTimeout(() => {
            setVisible(false)
          }, 10000)
        }
      }

      // Cleanup
      return () => {
        console.log = originalConsoleLog
      }
    }
  }, [])

  if (!visible || messages.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800 flex justify-between">
          Development Mode Email
          <button onClick={() => setVisible(false)} className="text-blue-500 hover:text-blue-700">
            <X className="h-4 w-4" />
          </button>
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          {messages.map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </AlertDescription>
      </Alert>
    </div>
  )
}
