"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Upload as UploadIcon, ChevronDown, ChevronUp, RefreshCw, Mail, Database, MessageSquare, PlusCircle as PlusCircleIcon, Info as InfoIcon, XCircle as XCircleIcon, Pencil as PencilIcon, Trash as TrashIcon, AlertTriangle as AlertTriangleIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AnimatedBackground from "@/components/AnimatedBackground"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AIMessageAssistant } from "@/components/ui/ai-message-assistant"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Contact {
  name: string
  phone: string
  email?: string
  id?: number
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
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewLoadingProgress, setPreviewLoadingProgress] = useState(0)
  const [previewData, setPreviewData] = useState<{
    newContacts: Contact[],
    existingContacts: Contact[],
    flaggedContacts: Contact[],
    invalidContacts?: { contact: Contact; reason: string }[]
  } | null>(null)
  const [editingFlaggedContact, setEditingFlaggedContact] = useState<Contact | null>(null)
  const [contactsToAddAnyway, setContactsToAddAnyway] = useState<Contact[]>([])
  const [showFlaggedContactsDialog, setShowFlaggedContactsDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'mass-text' | 'contacts-management'>('mass-text')
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingContactId, setDeletingContactId] = useState<number | null>(null)
  const [originalContacts, setOriginalContacts] = useState<Contact[]>([])
  const [tempUploadToDb, setTempUploadToDb] = useState(false)
  const [showTempContactWarning, setShowTempContactWarning] = useState(false)

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
        setOriginalContacts([])
        setFileName("Database: Organization Members")
        // Don't set an error message, just show a normal state
        return
      }
      
      setContacts(data.contacts)
      setOriginalContacts(data.contacts)
      setFileName("Database: Organization Members")
    } catch (error) {
      console.error('Error fetching contacts from database:', error)
      setError('Failed to load contacts from database. You can still upload a file manually.')
      setContacts([])
      setOriginalContacts([])
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
    setTempUploadToDb(uploadToDb) // Remember user's choice for upload to database
    
    // Start progress animation for file upload
    setPreviewLoadingProgress(0)
    const duration = 40000 // 40 seconds
    const interval = 200 // Update every 200ms
    const steps = duration / interval
    const incrementPerStep = 95 / steps // Go to 95% to leave room at the end
    
    const progressInterval = setInterval(() => {
      setPreviewLoadingProgress(current => {
        // Cap at 95% to indicate we're still waiting
        return current < 95 ? current + incrementPerStep : current;
      });
    }, interval);

    try {
      console.log('Creating FormData and preparing to upload file')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadToDb', 'false') // Always load without uploading first
      console.log(`Upload to database preference: ${uploadToDb} (will be applied after preview)`)

      console.log('Sending file to document-parser API')
      const response = await fetch('/api/document-parser', {
        method: 'POST',
        body: formData
      })

      console.log(`API response status: ${response.status}`)
      
      // Complete the progress bar after receiving response
      clearInterval(progressInterval)
      setPreviewLoadingProgress(100)
      // Short delay to show 100% before hiding
      setTimeout(() => {
        setPreviewLoadingProgress(0)
      }, 500)
      
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
      
      // If user had selected to upload to database, automatically show preview
      if (tempUploadToDb) {
        setTimeout(() => handlePreviewContacts(), 500)
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
    
    // Start progress animation for sheet processing
    setPreviewLoadingProgress(0)
    const duration = 40000 // 40 seconds
    const interval = 200 // Update every 200ms
    const steps = duration / interval
    const incrementPerStep = 95 / steps // Go to 95% to leave room at the end
    
    const progressInterval = setInterval(() => {
      setPreviewLoadingProgress(current => {
        // Cap at 95% to indicate we're still waiting
        return current < 95 ? current + incrementPerStep : current;
      });
    }, interval);
    
    try {
      console.log(`Processing sheet: ${sheet}`)
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('uploadToDb', 'false') // Always load without uploading first
      formData.append('selectedSheet', sheet)
      
      const response = await fetch('/api/document-parser', {
        method: 'POST',
        body: formData
      })
      
      // Complete the progress bar after receiving response
      clearInterval(progressInterval)
      setPreviewLoadingProgress(100)
      
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
      
      // If user had selected to upload to database, automatically show preview
      if (tempUploadToDb) {
        setTimeout(() => handlePreviewContacts(), 500)
      }
    } catch (error) {
      console.error('Error processing sheet:', error)
      setError('Failed to process the selected sheet. Please try another sheet.')
      setContacts([])
    } finally {
      // Add a small delay before hiding the progress
      setTimeout(() => {
        setUploadingFile(false)
        setShowSheetSelector(false)
        setPreviewLoadingProgress(0)
      }, 500)
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
    setShowPreviewModal(false)
    setPreviewData(null)
    setEditingFlaggedContact(null)
    setContactsToAddAnyway([])
    setShowFlaggedContactsDialog(false)
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
    
    // If in contacts management mode, add to database
    if (viewMode === 'contacts-management') {
      handleAddContactToDatabase();
    } else {
      setContacts([...contacts, newContact])
      setNewContact({ name: "", phone: "", email: "" })
      setIsAddingContact(false)
    }
  }
  
  // Function to add a contact to the database
  const handleAddContactToDatabase = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/upload-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contacts: [newContact]
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add contact');
      }
      
      // Refresh the contacts list
      await fetchContactsFromSupabase();
      setNewContact({ name: "", phone: "", email: "" });
      setIsAddingContact(false);
      
    } catch (error) {
      console.error('Error adding contact:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add contact';
      setError(errorMessage);
    }
  };
  
  const handleDeleteContact = (index: number) => {
    // If in contacts management mode, delete from database
    if (viewMode === 'contacts-management' && originalContacts[index]?.id) {
      setDeletingContactId(originalContacts[index].id!);
      setIsDeleting(true);
    } else {
      const updatedContacts = [...contacts];
      updatedContacts.splice(index, 1);
      setContacts(updatedContacts);
    }
  }
  
  // Function to confirm deleting a contact from the database
  const handleConfirmDelete = async () => {
    if (!deletingContactId) return;
    
    try {
      setError(null);
      
      const response = await fetch(`/api/delete-contact?id=${deletingContactId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete contact');
      }
      
      // Refresh the contacts list
      await fetchContactsFromSupabase();
      setIsDeleting(false);
      setDeletingContactId(null);
      
    } catch (error) {
      console.error('Error deleting contact:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact';
      setError(errorMessage);
      setIsDeleting(false);
      setDeletingContactId(null);
    }
  };
  
  // Function to handle editing a contact
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
  };
  
  // Function to save edited contact
  const handleSaveContact = async () => {
    if (!editingContact || !editingContact.id) return;
    
    try {
      setError(null);
      
      const nameParts = editingContact.name.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      
      const response = await fetch('/api/update-contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingContact.id,
          first_name,
          last_name,
          email: editingContact.email,
          phone_number: editingContact.phone
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update contact');
      }
      
      // Refresh the contacts list
      await fetchContactsFromSupabase();
      setEditingContact(null);
      
    } catch (error) {
      console.error('Error updating contact:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update contact';
      setError(errorMessage);
    }
  };

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
    if (contacts.length === 0) {
      alert("Please upload contacts first");
      return;
    }
    
    // If contacts are not being saved to DB, show warning
    if (!uploadSuccess && !uploadToDb) {
      setShowTempContactWarning(true)
      setConfirmationType(type);
      return;
    }
    
    setConfirmationType(type);
    setShowConfirmationDialog(true);
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

  // Add a function to handle preview
  const handlePreviewContacts = async () => {
    if (contacts.length === 0) {
      alert("Please upload contacts first");
      return;
    }
    
    try {
      setPreviewLoading(true);
      setPreviewLoadingProgress(0);
      setError(null);
      
      // Fixed duration progress animation (40 seconds)
      const duration = 40000; // 40 seconds
      const interval = 200; // Update every 200ms
      const steps = duration / interval;
      const incrementPerStep = 95 / steps; // Go to 95% to leave room at the end
      
      const progressInterval = setInterval(() => {
        setPreviewLoadingProgress(current => {
          // Cap at 95% to indicate we're still waiting
          return current < 95 ? current + incrementPerStep : current;
        });
      }, interval);
      
      const response = await fetch('/api/preview-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contacts }),
      });
      
      // Clear the progress interval and complete the progress bar
      clearInterval(progressInterval);
      setPreviewLoadingProgress(100);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to preview contacts');
      }
      
      setPreviewData({
        newContacts: data.newContacts || [],
        existingContacts: data.existingContacts || [],
        flaggedContacts: data.flaggedContacts || [],
        invalidContacts: data.invalidContacts || []
      });
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error previewing contacts:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while previewing contacts';
      setError(errorMessage);
    } finally {
      setPreviewLoading(false);
      // Reset progress after a small delay to allow the animation to complete
      setTimeout(() => setPreviewLoadingProgress(0), 500);
    }
  };

  // Add a function to handle adding flagged contacts
  const handleAddFlaggedContact = (contact: Contact) => {
    setContactsToAddAnyway(prev => [...prev, contact]);
  };

  // Add a function to handle removing flagged contacts from the "add anyway" list
  const handleRemoveFlaggedContact = (contact: Contact) => {
    setContactsToAddAnyway(prev => prev.filter(c => c !== contact));
  };

  // Modify the handleUploadAfterPreview function to include flagged contacts
  const handleUploadAfterPreview = async () => {
    if (!previewData) {
      setShowPreviewModal(false);
      return;
    }
    
    // If there are flagged contacts that aren't being added anyway, show the confirmation dialog
    const remainingFlaggedContacts = previewData.flaggedContacts?.filter(
      contact => !contactsToAddAnyway.includes(contact)
    ) || [];

    if (remainingFlaggedContacts.length > 0) {
      setShowFlaggedContactsDialog(true);
      return;
    }

    try {
      setUploadingFile(true);
      setError(null);
      
      // Combine new contacts with contacts to add anyway
      const contactsToUpload = [
        ...previewData.newContacts,
        ...contactsToAddAnyway
      ];

      // Ensure we have at least one contact to upload
      if (contactsToUpload.length === 0) {
        throw new Error('No valid contacts to upload');
      }
      
      const response = await fetch('/api/upload-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contacts: contactsToUpload }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload contacts');
      }
      
      setUploadSuccess(true);
      setContactsToAddAnyway([]);
      
      setTimeout(() => setUploadSuccess(false), 5000);
      setShowPreviewModal(false);
    } catch (error) {
      console.error('Error uploading contacts:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while uploading contacts';
      setError(errorMessage);
    } finally {
      setUploadingFile(false);
    }
  };

  // Add a function to handle the flagged contacts confirmation
  const handleFlaggedContactsConfirmation = async (proceed: boolean) => {
    setShowFlaggedContactsDialog(false);
    
    if (proceed) {
      await handleUploadAfterPreview();
    }
  };

  // Function to handle editing flagged contacts
  const handleEditFlaggedContact = (contact: Contact) => {
    setEditingFlaggedContact({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      id: contact.id
    });
  };

  // Function to save edited flagged contact
  const handleSaveFlaggedContact = () => {
    if (!editingFlaggedContact || !previewData) return;
    
    // Find the index of the contact in the flagged contacts array
    const index = previewData.flaggedContacts.findIndex(
      c => c.phone === editingFlaggedContact.phone && c.name === editingFlaggedContact.name
    );
    
    if (index === -1) return;
    
    const updatedFlaggedContacts = [...previewData.flaggedContacts];
    
    // If phone number is now valid, move to new contacts
    const phoneNumber = editingFlaggedContact.phone?.trim() || '';
    if (phoneNumber && phoneNumber.replace(/\D/g, '').length >= 10) {
      // Remove from flagged contacts
      updatedFlaggedContacts.splice(index, 1);
      
      // Add to new contacts
      const updatedNewContacts = [...previewData.newContacts, editingFlaggedContact];
      
      // Update preview data
      setPreviewData({
        ...previewData,
        newContacts: updatedNewContacts,
        flaggedContacts: updatedFlaggedContacts
      });
    } else {
      // Just update the contact in place if still invalid
      updatedFlaggedContacts[index] = editingFlaggedContact;
      
      setPreviewData({
        ...previewData,
        flaggedContacts: updatedFlaggedContacts
      });
    }
    
    setEditingFlaggedContact(null);
  };

  return (
    <AnimatedBackground>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Mass Communication</h1>
        
        {/* View mode toggle */}
        <div className="flex mb-6 border rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 ${viewMode === 'mass-text' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            onClick={() => setViewMode('mass-text')}
          >
            Mass Text & Email
          </button>
          <button
            className={`flex-1 py-2 ${viewMode === 'contacts-management' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            onClick={() => {
              setViewMode('contacts-management')
              setShowContactsList(true)
              fetchContactsFromSupabase()
            }}
          >
            All Members
          </button>
        </div>
        
        {viewMode === 'mass-text' ? (
          // Mass text view
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Message</CardTitle>
                <CardDescription>
                  Compose a message to send to your contacts
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
                    <AIMessageAssistant
                      message={message}
                      onMessageChange={setMessage}
                      placeholder="Enter your message here. Use {name} to include the contact's name."
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
                          <UploadIcon className="h-4 w-4 mr-2" />
                          {uploadingFile ? 'Uploading...' : 'Upload File'}
                        </Button>
                        <span className="text-sm text-gray-500">
                          {fileName || 'No file selected'}
                        </span>
                      </div>
                      
                      {/* File processing/preview loading indicator */}
                      {(uploadingFile || previewLoading) && (
                        <div className="mt-2 p-3 border rounded-md bg-gray-50">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{uploadingFile ? "Processing file..." : "Analyzing contacts..."}</span>
                              <span>{Math.round(previewLoadingProgress)}%</span>
                            </div>
                            <Progress value={previewLoadingProgress} className="w-full h-2" />
                            <p className="text-xs text-gray-500">
                              {uploadingFile 
                                ? "Parsing contacts from your file. This may take 30 seconds to 1 minute depending on file size."
                                : "Checking for duplicates and validation. This may take 30 seconds to 1 minute."}
                            </p>
                          </div>
                        </div>
                      )}
                      
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
                          onCheckedChange={(checked: boolean | 'indeterminate') => {
                            setUploadToDb(checked === true)
                            setTempUploadToDb(checked === true)
                            // If contacts are loaded and user wants to save them, show preview
                            if (checked === true && contacts.length > 0) {
                              handlePreviewContacts()
                            }
                          }}
                        />
                        <Label htmlFor="uploadToDb" className="flex items-center cursor-pointer">
                          <span>Save contacts to database</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 ml-1 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                If unchecked, contacts will only be used temporarily for this session.
                                Check this box to permanently save contacts to your database.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                      </div>
                      
                      {uploadSuccess && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-600">
                            Contacts successfully saved to database
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
                    {uploadToDb && contacts.length > 0 && !uploadSuccess && (
                      <Button 
                        onClick={handlePreviewContacts} 
                        disabled={previewLoading || contacts.length === 0}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        {previewLoading ? 'Loading Preview...' : 'Save Contacts'}
                      </Button>
                    )}
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
          </div>
        ) : (
          // Contacts management view
          <Card>
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
              <CardDescription>
                Add, edit or delete organization members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">
                    Members ({originalContacts.length})
                  </label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingContact(!isAddingContact)}
                    >
                      Add Member
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
                  <div className="border rounded-md p-4 mb-4">
                    <h3 className="text-sm font-medium mb-2">Add New Member</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <div>
                        <Label htmlFor="new-contact-name">Name</Label>
                        <Input
                          id="new-contact-name"
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-contact-phone">Phone</Label>
                        <Input
                          id="new-contact-phone"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-contact-email">Email</Label>
                        <Input
                          id="new-contact-email"
                          value={newContact.email || ""}
                          onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                          placeholder="john.doe@example.com"
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
                
                {/* Contact listing with edit/delete controls */}
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {originalContacts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No members found. Add some members to get started.
                          </td>
                        </tr>
                      ) : (
                        originalContacts.map((contact, index) => (
                          <tr key={`contact-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {editingContact?.id === contact.id ? (
                                <Input
                                  value={editingContact?.name || ""}
                                  onChange={(e) => {
                                    if (editingContact) {
                                      setEditingContact({
                                        ...editingContact,
                                        name: e.target.value
                                      });
                                    }
                                  }}
                                />
                              ) : (
                                contact.name
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {editingContact?.id === contact.id ? (
                                <Input
                                  value={editingContact?.phone || ""}
                                  onChange={(e) => {
                                    if (editingContact) {
                                      setEditingContact({
                                        ...editingContact,
                                        phone: e.target.value
                                      });
                                    }
                                  }}
                                />
                              ) : (
                                contact.phone
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {editingContact?.id === contact.id ? (
                                <Input
                                  value={editingContact?.email || ""}
                                  onChange={(e) => {
                                    if (editingContact) {
                                      setEditingContact({
                                        ...editingContact,
                                        email: e.target.value
                                      });
                                    }
                                  }}
                                />
                              ) : (
                                contact.email || "-"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {editingContact?.id === contact.id ? (
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingContact(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveContact}
                                  >
                                    Save
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditContact(contact)}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteContact(index)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </CardFooter>
          </Card>
        )}

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

        {/* Add the preview loading indicator before the Confirmation Dialog */}
        {/* {(previewLoading || uploadingFile) && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium mb-4">
                {uploadingFile ? "Processing File" : "Analyzing Contacts"}
              </h3>
              <div className="space-y-4">
                <Progress value={previewLoadingProgress} className="w-full" />
                <p className="text-sm text-gray-600">
                  {uploadingFile 
                    ? "Parsing and extracting contacts from your file. This may take 30 seconds to 1 minute depending on file size."
                    : "Checking contacts for duplicates and validation. This may take 30 seconds to 1 minute."}
                </p>
                <p className="text-xs text-gray-500 italic">
                  Please be patient. For larger files, this process could take even longer.
                </p>
                <div className="flex items-center justify-center mt-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            </div>
          </div>
        )} */}

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

        {/* Add a preview modal */}
        {showPreviewModal && previewData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold">Contact Upload Preview</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Review the contacts before uploading to the database
                </p>
              </div>
              
              <div className="p-6 overflow-y-auto flex-grow">
                {previewData.newContacts.length > 0 ? (
                  <div className="mb-6">
                    <h4 className="font-medium text-green-600 mb-2 flex items-center">
                      <PlusCircleIcon className="h-5 w-5 mr-1" />
                      New Contacts ({previewData.newContacts.length})
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.newContacts.map((contact, index) => (
                            <tr key={`new-${index}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic mb-6">No new contacts to add</p>
                )}
                
                {previewData.existingContacts.length > 0 ? (
                  <div>
                    <h4 className="font-medium text-amber-600 mb-2 flex items-center">
                      <InfoIcon className="h-5 w-5 mr-1" />
                      Existing Contacts ({previewData.existingContacts.length})
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.existingContacts.map((contact, index) => (
                            <tr key={`existing-${index}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No existing contacts found</p>
                )}
                
                {previewData.flaggedContacts && previewData.flaggedContacts.length > 0 && (
                  <div className="my-6">
                    <h4 className="font-medium text-orange-600 mb-2 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-1" />
                      Flagged Contacts - Missing Phone Numbers ({previewData.flaggedContacts.length})
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.flaggedContacts.map((contact, index) => (
                            <tr key={`flagged-${index}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name || "-"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{contact.phone || "Missing"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || "-"}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEditFlaggedContact(contact)}
                                  >
                                    Edit
                                  </Button>
                                  {contactsToAddAnyway.includes(contact) ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleRemoveFlaggedContact(contact)}
                                    >
                                      Remove
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleAddFlaggedContact(contact)}
                                    >
                                      Add Anyway
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-orange-600 mt-2">
                      These contacts are missing valid phone numbers. You can choose to add them anyway or edit their information.
                    </p>
                  </div>
                )}
                
                {previewData.invalidContacts && previewData.invalidContacts.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-red-600 mb-2 flex items-center">
                      <XCircleIcon className="h-5 w-5 mr-1" />
                      Invalid Contacts ({previewData.invalidContacts.length})
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.invalidContacts.map((item, index) => (
                            <tr key={`invalid-${index}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.contact.name || "N/A"} / {item.contact.phone || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUploadAfterPreview} 
                  disabled={uploadingFile || previewData.newContacts.length === 0}
                >
                  {uploadingFile ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload {previewData.newContacts.length} Contact{previewData.newContacts.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add edit form for flagged contacts */}
        {editingFlaggedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-medium mb-4">Edit Contact</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input 
                    type="text"
                    className="w-full border rounded-md p-2"
                    value={editingFlaggedContact.name || ''}
                    onChange={(e) => setEditingFlaggedContact({
                      ...editingFlaggedContact,
                      name: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    className="w-full border rounded-md p-2"
                    value={editingFlaggedContact.phone || ''}
                    onChange={(e) => setEditingFlaggedContact({
                      ...editingFlaggedContact,
                      phone: e.target.value
                    })}
                    placeholder="Enter valid phone number (10+ digits)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: US numbers should be 10 digits (e.g., 2065551234) or include country code (e.g., 12065551234)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input 
                    type="email"
                    className="w-full border rounded-md p-2"
                    value={editingFlaggedContact.email || ''}
                    onChange={(e) => setEditingFlaggedContact({
                      ...editingFlaggedContact,
                      email: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingFlaggedContact(null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveFlaggedContact}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation dialog */}
        {isDeleting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-semibold mb-2">Confirm Delete</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this member? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleting(false);
                    setDeletingContactId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add the flagged contacts confirmation dialog */}
        {showFlaggedContactsDialog && previewData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-medium mb-4">Missing Contact Information</h3>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  The following contacts are missing phone numbers or email addresses:
                </p>
                
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.flaggedContacts?.filter(
                        contact => !contactsToAddAnyway.includes(contact)
                      ).map((contact, index) => (
                        <tr key={`flagged-confirm-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{contact.phone || "Missing"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <p className="text-sm text-gray-600">
                  These contacts will not be added to your database. Would you like to proceed with uploading the other contacts?
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => handleFlaggedContactsConfirmation(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleFlaggedContactsConfirmation(true)}>
                  Proceed Anyway
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add a temporary contact warning dialog */}
        {showTempContactWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4 text-amber-500">
                <AlertTriangleIcon className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-medium">Temporary Contacts</h3>
              </div>
              
              <p className="mb-4">
                The contacts you&apos;ve uploaded won&apos;t be saved to your database. They will only be used for this session and will be lost when you leave this page.
              </p>
              
              <p className="mb-6">
                Do you want to continue sending without saving, or would you like to save these contacts first?
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTempContactWarning(false)
                    // Open the regular confirmation dialog
                    setShowConfirmationDialog(true)
                  }}
                >
                  Continue Without Saving
                </Button>
                <Button
                  onClick={() => {
                    setShowTempContactWarning(false)
                    setUploadToDb(true)
                    handlePreviewContacts()
                  }}
                >
                  Save Contacts First
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedBackground>
  )
}
