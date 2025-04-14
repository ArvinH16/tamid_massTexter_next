"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Upload, ChevronDown, ChevronUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface Contact {
  name: string
  phone: string
}

interface MessageLimitData {
  dailyLimit: number
  messagesSent: number
  remaining: number
  resetDate: string
}

export default function MassTextPage() {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [fileName, setFileName] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(0)
  const [failed, setFailed] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [messageLimitData, setMessageLimitData] = useState<MessageLimitData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showContactsList, setShowContactsList] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch message limit data on component mount
  useEffect(() => {
    const fetchMessageLimit = async () => {
      try {
        const response = await fetch('/api/messages')
        if (!response.ok) {
          throw new Error('Failed to fetch message limit data')
        }
        const data = await response.json()
        setMessageLimitData(data)
      } catch (error) {
        console.error('Error fetching message limit:', error)
        setError('Failed to load message limit data')
      }
    }

    fetchMessageLimit()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse-excel', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to parse Excel file')
      }

      const data = await response.json()
      setContacts(data.contacts)
    } catch (error) {
      console.error('Error parsing Excel file:', error)
      setError('Failed to parse Excel file. Please make sure it contains name and phone number columns.')
    }
  }

  const handleSend = async () => {
    if (!message || contacts.length === 0) {
      alert("Please enter a message and upload contacts")
      return
    }

    if (messageLimitData && contacts.length > messageLimitData.remaining) {
      alert(
        `You can only send ${messageLimitData.remaining} more messages today. Your Excel file contains ${contacts.length} contacts.`,
      )
      return
    }

    setSending(true)
    setSent(0)
    setFailed(0)
    setError(null)

    try {
      // Create a FormData object to send the contacts and message
      const formData = new FormData()
      formData.append('message', message)
      formData.append('contacts', JSON.stringify(contacts))
      
      // Send the request
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send messages')
      }
      
      // Update the UI with the results
      setSent(data.results.totalSent)
      setFailed(data.results.totalFailed)
      
      // Update message limit data
      if (messageLimitData) {
        setMessageLimitData({
          ...messageLimitData,
          messagesSent: messageLimitData.messagesSent + data.results.totalSent,
          remaining: data.results.remainingToday
        })
      }
      
      setShowResults(true)
    } catch (error: unknown) {
      console.error('Error sending messages:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while sending messages'
      setError(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const handleReset = () => {
    setMessage("")
    setContacts([])
    setFileName("")
    setSent(0)
    setFailed(0)
    setShowResults(false)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">TAMID Mass Text System</CardTitle>
              <CardDescription>Send messages to your members</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder="Enter your message here..."
                className="min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">{message.length} characters</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Upload Contacts (Excel)</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Excel File
                </Button>
                <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                {fileName && (
                  <span className="text-sm text-muted-foreground">
                    {fileName} ({contacts.length} contacts)
                  </span>
                )}
              </div>
              
              {/* Expandable contacts list */}
              {contacts.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 p-0 h-auto text-sm font-medium"
                    onClick={() => setShowContactsList(!showContactsList)}
                  >
                    {showContactsList ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide contacts list
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        View contacts list ({contacts.length})
                      </>
                    )}
                  </Button>
                  
                  {showContactsList && (
                    <div className="mt-2 border rounded-md divide-y max-h-[300px] overflow-y-auto">
                      <div className="p-2 bg-muted text-sm font-medium grid grid-cols-2">
                        <div>Name</div>
                        <div>Phone Number</div>
                      </div>
                      {contacts.map((contact, index) => (
                        <div key={index} className="p-2 grid grid-cols-2 text-sm">
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-muted-foreground">{contact.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted p-4 rounded-lg">
              <div>
                <p className="text-sm font-medium">Daily Limit: {messageLimitData?.dailyLimit || 'Loading...'} messages</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress 
                    value={messageLimitData ? (messageLimitData.messagesSent / messageLimitData.dailyLimit) * 100 : 0} 
                    className="h-2 w-[200px]" 
                  />
                  <span className="text-xs text-muted-foreground">
                    {messageLimitData ? `${messageLimitData.messagesSent} sent, ${messageLimitData.remaining} remaining` : 'Loading...'}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={sending || !message || contacts.length === 0}
                className="w-full sm:w-auto"
              >
                {sending ? "Sending..." : "Send Messages"}
              </Button>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            {showResults && (
              <>
                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Results</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">{sent} messages sent successfully</AlertDescription>
                    </Alert>

                    {failed > 0 && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600">{failed} messages failed to send</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Button variant="outline" onClick={handleReset}>
                    Reset Form
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
