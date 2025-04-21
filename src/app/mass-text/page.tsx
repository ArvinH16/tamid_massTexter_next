"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Upload, ChevronDown, ChevronUp, RefreshCw, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import AnimatedBackground from "@/components/AnimatedBackground"

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
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [newContact, setNewContact] = useState<Contact>({ name: "", phone: "" })
  const [isAddingContact, setIsAddingContact] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [emailMessage, setEmailMessage] = useState("")
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailResults, setEmailResults] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Add authentication check
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/verify-auth', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          router.push('/');
        }
      } catch {
        router.push('/');
      }
    };

    verifyAuth();
  }, [router]);

  // Fetch message limit data and contacts from Google Sheets on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch message limit data
        const limitResponse = await fetch('/api/messages')
        if (!limitResponse.ok) {
          throw new Error('Failed to fetch message limit data')
        }
        const limitData = await limitResponse.json()
        setMessageLimitData(limitData)
        
        // Fetch contacts from Google Sheets
        await fetchContactsFromGoogleSheets()
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load data. You can still upload a file manually.')
      }
    }

    fetchData()
  }, [])

  // Function to fetch contacts from Google Sheets
  const fetchContactsFromGoogleSheets = async () => {
    setLoadingContacts(true)
    setError(null)
    
    try {
      const response = await fetch('/api/fetch-google-sheet')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to fetch contacts from Google Sheets')
      }
      
      const data = await response.json()
      setContacts(data.contacts)
      setFileName("Google Sheet: Main Roster")
    } catch (error) {
      console.error('Error fetching contacts from Google Sheets:', error)
      setError('Failed to load contacts from Google Sheets. You can still upload a file manually.')
    } finally {
      setLoadingContacts(false)
    }
  }

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

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      alert("Please enter both name and phone number")
      return
    }
    
    // Check if phone number already exists
    if (contacts.some(contact => contact.phone === newContact.phone)) {
      alert("This phone number already exists in the list")
      return
    }
    
    setContacts([...contacts, newContact])
    setNewContact({ name: "", phone: "" })
    setIsAddingContact(false)
  }
  
  const handleDeleteContact = (index: number) => {
    const updatedContacts = [...contacts]
    updatedContacts.splice(index, 1)
    setContacts(updatedContacts)
  }

  const handleSendEmails = async () => {
    if (!emailMessage) {
      alert("Please enter an email message")
      return
    }

    setSendingEmails(true)
    setEmailError(null)
    setEmailResults(null)

    try {
      const response = await fetch('/api/email-sender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: emailMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      setEmailResults(data)
    } catch (error) {
      console.error('Error sending emails:', error)
      setEmailError(error instanceof Error ? error.message : 'An error occurred while sending emails')
    } finally {
      setSendingEmails(false)
    }
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen p-4 bg-transparent">
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Contacts</label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={fetchContactsFromGoogleSheets}
                      disabled={loadingContacts}
                      className="h-8 px-2"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${loadingContacts ? 'animate-spin' : ''}`} />
                      Refresh from Google Sheets
                    </Button>
                  </div>
                  
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
                    {loadingContacts && (
                      <span className="text-sm text-muted-foreground">
                        Loading contacts...
                      </span>
                    )}
                  </div>
                  
                  {/* Expandable contacts list */}
                  {
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
                          <div className="p-2 bg-muted text-sm font-medium grid grid-cols-3">
                            <div>Name</div>
                            <div>Phone Number</div>
                            <div className="text-right">Actions</div>
                          </div>
                          {contacts.map((contact, index) => (
                            <div key={index} className="p-2 grid grid-cols-3 text-sm">
                              <div className="font-medium">{contact.name}</div>
                              <div className="text-muted-foreground">{contact.phone}</div>
                              <div className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteContact(index)}
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          {isAddingContact ? (
                            <div className="p-2 grid grid-cols-3 gap-2 text-sm">
                              <input
                                type="text"
                                placeholder="Name"
                                className="border rounded px-2 py-1"
                                value={newContact.name}
                                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                              />
                              <input
                                type="text"
                                placeholder="Phone Number"
                                className="border rounded px-2 py-1"
                                value={newContact.phone}
                                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                              />
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2"
                                  onClick={() => setIsAddingContact(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="h-6 px-2"
                                  onClick={handleAddContact}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => setIsAddingContact(true)}
                              >
                                + Add Contact
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  }
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

          {/* Email Sender Card */}
          <Card className="w-full max-w-4xl mx-auto mt-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <div>
                  <CardTitle className="text-2xl">TAMID Email System</CardTitle>
                  <CardDescription>Send personalized emails to members</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Message</label>
                  <Textarea
                    placeholder="Enter your email message here... Use {name} as a placeholder for the recipient's first name"
                    className="min-h-[120px]"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">{emailMessage.length} characters</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSendEmails}
                    disabled={sendingEmails || !emailMessage}
                    className="gap-2"
                  >
                    {sendingEmails ? "Sending..." : "Send Emails"}
                  </Button>
                </div>

                {emailError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600">{emailError}</AlertDescription>
                  </Alert>
                )}

                {emailResults && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="font-medium">Email Results</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-600">
                            {emailResults.sent} emails sent successfully
                          </AlertDescription>
                        </Alert>

                        {emailResults.failed > 0 && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-600">
                              {emailResults.failed} emails failed to send
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {emailResults.errors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Error Details:</h4>
                          <ul className="text-sm text-red-600 space-y-1">
                            {emailResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedBackground>
  )
}
