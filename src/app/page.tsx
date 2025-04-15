"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AnimatedBackground from "@/components/AnimatedBackground"
import TransitionAnimation from "@/components/TransitionAnimation"
import { AnimatePresence } from "framer-motion"

export default function Home() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showTransition, setShowTransition] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accessCode) {
      setError("Please enter an access code")
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Invalid access code")
      }
      
      // Show transition animation
      setShowTransition(true)
      
      // Wait for animation to complete before redirecting
      setTimeout(() => {
        router.push("/mass-text")
      }, 1500)
      
    } catch (error: unknown) {
      console.error("Error verifying access code:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred while verifying access code"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedBackground>
      <div className="flex min-h-screen items-center justify-center p-4 bg-transparent">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/90">
          <CardHeader>
            <CardTitle className="text-2xl text-center">TAMID Mass Text System</CardTitle>
            <CardDescription className="text-center">Enter your access code to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="accessCode" className="text-sm font-medium">
                  Access Code
                </label>
                <Input
                  id="accessCode"
                  type="password"
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <AnimatePresence>
        {showTransition && <TransitionAnimation />}
      </AnimatePresence>
    </AnimatedBackground>
  )
}
