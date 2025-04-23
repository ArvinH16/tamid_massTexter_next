"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Upload, ChevronDown, ChevronUp, RefreshCw, Mail, Database, MessageSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AnimatedBackground from "@/components/AnimatedBackground"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Contact {
  name: string
  phone: string
  email?: string
}

interface MessageLimitData {
  monthlyLimit: number
  messagesSent: number
  remaining: number
  resetDate: string
}

interface EmailLimitData {
  dailyLimit: number
  emailsSent: number
  remaining: number
  resetDate: string
}

interface ParsedContact {
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
}

export default function MassTextPage() {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [fileName, setFileName] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(0)
  const [failed, setFailed] = useState(0)
  const [failedNumbers, setFailedNumbers] = useState<{ phoneNumber: string; error: string }[]>([])
  const [showResults, setShowResults] = useState(false)
  const [messageLimitData, setMessageLimitData] = useState<MessageLimitData | null>(null)
  const [emailLimitData, setEmailLimitData] = useState<EmailLimitData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showContactsList, setShowContactsList] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [newContact, setNewContact] = useState<Contact>({ name: "", phone: "", email: "" })
  const [isAddingContact, setIsAddingContact] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailResults, setEmailResults] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [uploadToDb, setUploadToDb] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [showSheetSelector, setShowSheetSelector] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [confirmationType, setConfirmationType] = useState<'text' | 'email' | null>(null)

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

  // Fetch message limit data and contacts from Supabase on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch message limit data
        const limitResponse = await fetch('/api/messages')
        if (!limitResponse.ok) {
          console.error('Failed to fetch message limit data')
          // Don't throw an error, just continue without message limit data
        } else {
          const limitData = await limitResponse.json()
          setMessageLimitData(limitData)
        }
        
        // Fetch email limit data
        const emailLimitResponse = await fetch('/api/email-sender')
        if (!emailLimitResponse.ok) {
          console.error('Failed to fetch email limit data')
          // Don't throw an error, just continue without email limit data
        } else {
          const emailLimitData = await emailLimitResponse.json()
          setEmailLimitData(emailLimitData)
        }
        
        // Fetch contacts from Supabase
        await fetchContactsFromSupabase()
      } catch (error) {
        console.error('Error fetching data:', error)
        // Don't set an error message, just continue with empty contacts
        setContacts([])
      }
    }

    fetchData()
  }, [])

  // Function to fetch contacts from Supabase
  const fetchContactsFromSupabase = async () => {
    setLoadingContacts(true)
    setError(null)
    
    try {
      const response = await fetch('/api/fetch-contacts')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to fetch contacts from database')
      }
      
      const data = await response.json()
      
      if (!data.contacts || data.contacts.length === 0) {
        setContacts([])
        setFileName("Database: Organization Members")
        // Don't set an error message, just show a normal state
        return
      }
      
      setContacts(data.contacts)
      setFileName("Database: Organization Members")
    } catch (error) {
      console.error('Error fetching contacts from database:', error)
      setError('Failed to load contacts from database. You can still upload a file manually.')
      setContacts([])
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log(`File selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)
    setFileName(file.name)
    setUploadingFile(true)
    setError(null)
    setUploadSuccess(false)
    setAvailableSheets([])
    setSelectedSheet("")
    setShowSheetSelector(false)
    setUploadedFile(file)

    try {
      console.log('Creating FormData and preparing to upload file')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadToDb', uploadToDb.toString())
      console.log(`Upload to database: ${uploadToDb}`)

      console.log('Sending file to document-parser API')
      const response = await fetch('/api/document-parser', {
        method: 'POST',
        body: formData
      })

      console.log(`API response status: ${response.status}`)
      
      if (!response.ok) {
        const data = await response.json()
        console.error('API error response:', data)
        throw new Error(data.error || 'Failed to parse file. Please check the console for more details.')
      }

      const data = await response.json()
      console.log('API response data:', data)
      
      // Check if the API returned available sheets
      if (data.availableSheets && data.availableSheets.length > 0) {
        console.log(`File contains ${data.availableSheets.length} sheets: ${data.availableSheets.join(', ')}`)
        setAvailableSheets(data.availableSheets)
        setShowSheetSelector(true)
        setUploadingFile(false)
        return
      }
      
      if (!data.contacts || data.contacts.length === 0) {
        console.error('No contacts found in the parsed data')
        setError('No valid contacts found in the file. The application tried to automatically match columns in your file, but couldn&apos;t find contact information. Please check that your file contains columns with names, phone numbers, or emails. You can try renaming your columns to include terms like "name", "phone", or "email" to help the system identify them.')
        setContacts([])
        return
      }
      
      console.log(`Successfully parsed ${data.contacts.length} contacts from the file`)
      
      // Convert the contacts to the format expected by the UI
      const formattedContacts = data.contacts.map((contact: ParsedContact) => ({
        name: `${contact.first_name} ${contact.last_name}`.trim() || 'Unknown',
        phone: contact.phone_number,
        email: contact.email || ''
      }))
      
      console.log('Formatted contacts for UI:', formattedContacts)
      setContacts(formattedContacts)
      setShowContactsList(true) // Automatically show the contacts list after upload
      
      if (data.uploadedToDb) {
        console.log('Contacts were successfully uploaded to the database')
        setUploadSuccess(true)
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      setError('Failed to parse file. Please make sure it contains contact information.')
      setContacts([])
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSheetSelection = async (sheet: string) => {
    if (!uploadedFile) return
    
    setSelectedSheet(sheet)
    setUploadingFile(true)
    setError(null)
    
    try {
      console.log(`Processing sheet: ${sheet}`)
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('uploadToDb', uploadToDb.toString())
      formData.append('selectedSheet', sheet)
      
      const response = await fetch('/api/document-parser', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to parse sheet')
      }
      
      const data = await response.json()
      
      if (!data.contacts || data.contacts.length === 0) {
        setError('No valid contacts found in the selected sheet. Please try another sheet or check the file format.')
        setContacts([])
        return
      }
      
      // Convert the contacts to the format expected by the UI
      const formattedContacts = data.contacts.map((contact: ParsedContact) => ({
        name: `${contact.first_name} ${contact.last_name}`.trim() || 'Unknown',
        phone: contact.phone_number,
        email: contact.email || ''
      }))
      
      setContacts(formattedContacts)
      setShowContactsList(true)
      
      if (data.uploadedToDb) {
        setUploadSuccess(true)
      }
    } catch (error) {
      console.error('Error processing sheet:', error)
      setError('Failed to process the selected sheet. Please try another sheet.')
      setContacts([])
    } finally {
      setUploadingFile(false)
      setShowSheetSelector(false)
    }
  }

  const handleSend = async () => {
    if (!message) {
      alert("Please enter a message")
      return
    }

    if (contacts.length === 0) {
      alert("Please add at least one contact")
      return
    }

    setSending(true)
    setError(null)
    setShowResults(false)

    try {
      const formData = new FormData()
      formData.append('message', message)
      formData.append('contacts', JSON.stringify(contacts))

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to send messages')
      }

      const data = await response.json()
      if (data.success) {
        setSent(data.results.totalSent)
        setFailed(data.results.totalFailed)
        setFailedNumbers(data.results.failedNumbers)
        setShowResults(true)
        
        // Add a small delay before fetching updated message limit data
        setTimeout(async () => {
          const limitResponse = await fetch('/api/messages')
          if (limitResponse.ok) {
            const limitData = await limitResponse.json()
            setMessageLimitData(limitData)
          }
        }, 500) // 500ms delay to ensure database has updated
      } else {
        throw new Error(data.message || 'Failed to send messages')
      }
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
    setUploadSuccess(false)
    setAvailableSheets([])
    setSelectedSheet("")
    setShowSheetSelector(false)
    setUploadedFile(null)
    setEmailResults(null)
    setEmailError(null)
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
    setNewContact({ name: "", phone: "", email: "" })
    setIsAddingContact(false)
  }
  
  const handleDeleteContact = (index: number) => {
    const updatedContacts = [...contacts]
    updatedContacts.splice(index, 1)
    setContacts(updatedContacts)
  }

  const handleSendEmails = async () => {
    if (!message) {
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
        body: JSON.stringify({
          message: message,
          contacts: contacts.filter(contact => contact.email)
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to send emails')
      }

      const data = await response.json()
      setEmailResults({
        sent: data.sent,
        failed: data.failed,
        errors: data.errors || []
      })
      
      // Refresh email limit data
      const emailLimitResponse = await fetch('/api/email-sender')
      if (emailLimitResponse.ok) {
        const emailLimitData = await emailLimitResponse.json()
        setEmailLimitData(emailLimitData)
      }
    } catch (error: unknown) {
      console.error('Error sending emails:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while sending emails'
      setEmailError(errorMessage)
    } finally {
      setSendingEmails(false)
    }
  }

  const openConfirmationDialog = (type: 'text' | 'email') => {
    if (!message) {
      alert("Please enter a message")
      return
    }

    if (contacts.length === 0) {
      alert("Please add at least one contact")
      return
    }

    if (type === 'email' && !contacts.some(contact => contact.email)) {
      alert("None of your contacts have email addresses")
      return
    }

    setConfirmationType(type)
    setShowConfirmationDialog(true)
  }

  const handleConfirmSend = () => {
    setShowConfirmationDialog(false)
    
    if (confirmationType === 'text') {
      handleSend()
    } else if (confirmationType === 'email') {
      handleSendEmails()
    }
    
    setConfirmationType(null)
  }

  return (
    <AnimatedBackground>
      <div className="container mx-auto py-8 px-4">
        <Card className="mb-8 backdrop-blur-md bg-white/95">
          <CardHeader>
            <CardTitle className="text-2xl">Mass Communication System</CardTitle>
            <CardDescription>
              Send text messages or emails to multiple contacts at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {messageLimitData && (
                <div className="flex flex-col space-y-4 p-4 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Text Message Limit (Monthly)</span>
                    <span className="text-sm font-medium">
                      {messageLimitData.messagesSent ?? 0} / {messageLimitData.monthlyLimit}
                    </span>
                  </div>
                  <Progress value={((messageLimitData.messagesSent ?? 0) / (messageLimitData.monthlyLimit || 1)) * 100} />
                  <p className="text-xs text-gray-500 mt-1">
                    Resets on {new Date(messageLimitData.resetDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {emailLimitData && (
                <div className="flex flex-col space-y-4 p-4 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Email Limit (Daily)</span>
                    <span className="text-sm font-medium">
                      {emailLimitData.emailsSent} / {emailLimitData.dailyLimit}
                    </span>
                  </div>
                  <Progress value={(emailLimitData.emailsSent / emailLimitData.dailyLimit) * 100} />
                  <p className="text-xs text-gray-500 mt-1">
                    Resets at {new Date(emailLimitData.resetDate).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here. Use {name} to include the contact's name."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">
                    Contacts ({contacts.length})
                  </label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowContactsList(!showContactsList)}
                    >
                      {showContactsList ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingContact(!isAddingContact)}
                    >
                      Add Contact
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchContactsFromSupabase}
                      disabled={loadingContacts}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${loadingContacts ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

                {isAddingContact && (
                  <div className="mb-4 p-4 border rounded-md bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="newName" className="block text-sm font-medium mb-1">
                          Name
                        </label>
                        <input
                          id="newName"
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label htmlFor="newPhone" className="block text-sm font-medium mb-1">
                          Phone Number
                        </label>
                        <input
                          id="newPhone"
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label htmlFor="newEmail" className="block text-sm font-medium mb-1">
                          Email (Optional)
                        </label>
                        <input
                          id="newEmail"
                          type="email"
                          className="w-full p-2 border rounded-md"
                          value={newContact.email || ""}
                          onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => setIsAddingContact(false)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddContact}>
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                {showContactsList && (
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2 mb-4">
                    {contacts.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-2">No contacts loaded</p>
                        <p className="text-sm text-gray-400">You can upload a file or add contacts manually</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Name</th>
                            <th className="text-left py-2 px-2">Phone</th>
                            <th className="text-left py-2 px-2">Email</th>
                            <th className="text-right py-2 px-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contacts.map((contact, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-2">{contact.name}</td>
                              <td className="py-2 px-2">{contact.phone}</td>
                              <td className="py-2 px-2">{contact.email || '-'}</td>
                              <td className="py-2 px-2 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteContact(index)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv,.xlsx,.xls,.txt"
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingFile ? 'Uploading...' : 'Upload File'}
                    </Button>
                    <span className="text-sm text-gray-500">
                      {fileName || 'No file selected'}
                    </span>
                  </div>
                  
                  {showSheetSelector && (
                    <div className="p-4 border rounded-md bg-gray-50">
                      <h3 className="text-sm font-medium mb-2">Select a sheet to process:</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableSheets.map((sheet) => (
                          <Button
                            key={sheet}
                            variant={selectedSheet === sheet ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSheetSelection(sheet)}
                            disabled={uploadingFile}
                          >
                            {sheet}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="uploadToDb" 
                      checked={uploadToDb} 
                      onCheckedChange={(checked: boolean | 'indeterminate') => setUploadToDb(checked === true)}
                    />
                    <Label htmlFor="uploadToDb">
                      Upload contacts to database
                    </Label>
                  </div>
                  
                  {uploadSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">
                        Contacts successfully uploaded to database
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              {emailError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600">{emailError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button 
                  onClick={async () => {
                    if (contacts.length === 0) {
                      alert("Please upload contacts first");
                      return;
                    }
                    
                    try {
                      setUploadingFile(true);
                      setError(null);
                      
                      const response = await fetch('/api/upload-contacts', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ contacts }),
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(data.message || 'Failed to upload contacts');
                      }
                      
                      setUploadSuccess(true);
                      setTimeout(() => setUploadSuccess(false), 5000);
                    } catch (error) {
                      console.error('Error uploading contacts:', error);
                      const errorMessage = error instanceof Error ? error.message : 'An error occurred while uploading contacts';
                      setError(errorMessage);
                    } finally {
                      setUploadingFile(false);
                    }
                  }} 
                  disabled={uploadingFile || contacts.length === 0}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {uploadingFile ? 'Uploading...' : 'Upload Contacts'}
                </Button>
                <Button 
                  onClick={() => openConfirmationDialog('text')} 
                  disabled={sending || contacts.length === 0}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Text Messages'}
                </Button>
                <Button 
                  onClick={() => openConfirmationDialog('email')} 
                  disabled={sendingEmails || contacts.length === 0}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {sendingEmails ? 'Sending...' : 'Send Emails'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {(showResults || emailResults) && (
          <Card className="mb-8 backdrop-blur-sm bg-white/90">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                Message sending results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showResults && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Text Messages:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md bg-green-50">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium">Successfully Sent</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{sent}</p>
                    </div>
                    <div className="p-4 border rounded-md bg-red-50">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="font-medium">Failed</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{failed}</p>
                    </div>
                  </div>
                  {failedNumbers.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold">Failed numbers:</p>
                      <ul className="list-disc list-inside">
                        {failedNumbers.map((failure, index) => (
                          <li key={index} className="text-red-600">
                            {failure.phoneNumber}: {failure.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {emailResults && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Emails:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md bg-green-50">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium">Successfully Sent</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{emailResults.sent}</p>
                    </div>
                    <div className="p-4 border rounded-md bg-red-50">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="font-medium">Failed</span>
                      </div>
                      <p className="text-2xl font-bold mt-2">{emailResults.failed}</p>
                    </div>
                  </div>
                  {emailResults.errors.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold">Errors:</p>
                      <ul className="list-disc list-inside">
                        {emailResults.errors.map((error, index) => (
                          <li key={index} className="text-red-600">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Confirm {confirmationType === 'text' ? 'Text Message' : 'Email'} Sending
              </DialogTitle>
              <DialogDescription>
                Please review your message before sending:
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 border rounded-md bg-gray-50 my-4">
              <p className="whitespace-pre-wrap">{message}</p>
            </div>
            <div className="mb-4">
              <p className="font-medium">Sending to {contacts.length} contacts</p>
              {confirmationType === 'email' && (
                <p className="text-sm text-gray-500">
                  Only contacts with email addresses will receive the message
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSend}>
                Confirm & Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  )
}
