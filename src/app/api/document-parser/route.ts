// app/api/document-parser/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { parse } from 'csv-parse/sync'
import * as XLSX from 'xlsx'
import { getOrganizationByAccessCode, addOrgMembers, uploadContactsWithDuplicateCheck, formatPhoneNumber } from '@/lib/supabase'

// Define the expected output structure
interface Contact {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  other: string
}

// System prompt for the LLM
const SYSTEM_PROMPT = `You are a helpful assistant that extracts contact information from tabular data.
Your task is to parse the given table data and extract contact information into a structured JSON format.
The output should be a JSON array of objects, where each object has the following structure:
{
  "first_name": "First name of the person",
  "last_name": "Last name of the person",
  "email": "Email address",
  "phone_number": "Phone number",
  "other": "Any additional information"
}

Rules:
1. Extract all contact information you can find
2. If a field is missing, use an empty string
3. Ensure phone numbers are in a consistent format (e.g., (123) 456-7890)
4. Return only valid JSON, no additional text
5. If no contacts are found, return an empty array []
6. Clean up any extra whitespace or formatting in the data
7. Split full names into first_name and last_name when possible
8. If you can't determine first/last name split, put the full name in first_name and leave last_name empty`

export async function POST(request: NextRequest) {
  try {
    console.log('Document parser API called')
    
    // Get access code from cookie
    const accessCode = request.cookies.get('access-code')
    
    if (!accessCode) {
      console.log('No access code found in cookies')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get organization from database
    const organization = await getOrganizationByAccessCode(accessCode.value)
    
    if (!organization) {
      console.log('No organization found for access code')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log(`Processing file for organization: ${organization.chapter_name}`)
    
    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadToDb = formData.get('uploadToDb') === 'true'
    const selectedSheet = formData.get('selectedSheet') as string
    
    if (!file) {
      console.log('No file provided in form data')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)
    
    // Determine file type
    const fileType = file.type
    let textContent = ''
    let availableSheets: string[] = []
    
    // Process the file based on its type
    if (fileType === 'text/csv' || (file.name && file.name.endsWith('.csv'))) {
      console.log('Processing CSV file')
      const fileText = await file.text()
      console.log(`CSV content preview: ${fileText.substring(0, 200)}...`)
      
      const records = parse(fileText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
      
      console.log(`CSV parsed successfully. Found ${records.length} records`)
      console.log('CSV columns:', Object.keys(records[0] || {}))
      
      textContent = JSON.stringify(records, null, 2)
      availableSheets = ['Sheet1'] // CSV files only have one sheet
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
               fileType === 'application/vnd.ms-excel' || 
               (file.name && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')))) {
      // Handle Excel files
      console.log('Processing Excel file')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      
      // Get all sheet names
      availableSheets = workbook.SheetNames
      console.log(`Available sheets: ${availableSheets.join(', ')}`)
      
      // If no sheet is selected, return the available sheets
      if (!selectedSheet) {
        console.log('No sheet selected, returning available sheets')
        return NextResponse.json({ 
          success: true,
          availableSheets,
          contacts: [],
          uploadedToDb: false
        })
      }
      
      // Get the selected sheet
      const worksheet = workbook.Sheets[selectedSheet]
      console.log(`Selected sheet: ${selectedSheet}`)
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet)
      console.log(`Excel parsed successfully. Found ${data.length} records`)
      
      if (data.length > 0) {
        console.log('Excel columns:', Object.keys(data[0] || {}))
      }
      
      textContent = JSON.stringify(data, null, 2)
    } else if (fileType === 'text/plain' || (file.name && file.name.endsWith('.txt'))) {
      console.log('Processing text file')
      textContent = await file.text()
      console.log(`Text content preview: ${textContent.substring(0, 200)}...`)
      availableSheets = ['Sheet1'] // Text files only have one sheet
    } else {
      console.log(`Unsupported file type: ${fileType}`)
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload CSV, Excel, or TXT files.' },
        { status: 400 }
      )
    }
    
    // If no text content or no selected sheet for Excel, return available sheets
    if (!textContent || (fileType.includes('excel') && !selectedSheet)) {
      return NextResponse.json({ 
        success: true,
        availableSheets,
        contacts: [],
        uploadedToDb: false
      })
    }
    
    console.log('Preparing to call OpenAI for parsing')
    
    const client = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    });
      
    // Call OpenAI to parse the text
    console.log('Calling OpenAI API')
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: textContent }
      ],
      response_format: { type: "json_object" }
    })
    
    console.log('OpenAI API response received')
    
    const raw = completion.choices[0].message.content
    console.log(`OpenAI response preview: ${raw}...`)
    
    const parsedResponse = JSON.parse(raw || '{}')
    // Check if the response has a "contacts" property, otherwise treat the response as the contacts array
    const contacts: Contact[] = parsedResponse.contacts || (Array.isArray(parsedResponse) ? parsedResponse : [])
    
    console.log(`Parsed ${contacts.length} contacts from the file`)
    
    if (contacts.length > 0) {
      console.log('Sample contact:', contacts[0])
    }
    
    // Process the parsed contacts for display and ensure phone numbers are properly formatted
    const processedContacts = contacts.map(contact => {
      return {
        ...contact,
        // Format phone number properly if present
        phone_number: contact.phone_number ? formatPhoneNumber(contact.phone_number) : contact.phone_number
      };
    });

    console.log(`Processed ${processedContacts.length} contacts from the file`);

    if (processedContacts.length > 0) {
      console.log('Sample contact after processing:', processedContacts[0]);
    }
    
    // If requested, upload contacts to the database
    if (uploadToDb && processedContacts.length > 0) {
      console.log('Uploading contacts to database')
      try {
        // Convert parsed contacts to expected format
        const formattedContacts = processedContacts.map(contact => ({
          name: `${contact.first_name} ${contact.last_name}`.trim(),
          phone: contact.phone_number,
          email: contact.email || ''
        }))
        
        // Get upload preview first
        const result = await uploadContactsWithDuplicateCheck(
          organization.id.toString(),
          formattedContacts,
          false // Actually upload the contacts
        )
        
        console.log(`Successfully uploaded ${result.uploaded} contacts, skipped ${result.skipped} existing contacts, flagged ${result.flagged} contacts`)
        
        return NextResponse.json({
          success: true,
          availableSheets,
          contacts: processedContacts,
          uploadedToDb: true,
          uploadResult: {
            uploaded: result.uploaded,
            skipped: result.skipped,
            flagged: result.flagged || 0,
            existingContacts: result.existingContacts || [],
            newContacts: result.newContacts || [],
            flaggedContacts: result.flaggedContacts || []
          }
        })
      } catch (error) {
        console.error('Error uploading contacts to database:', error)
        // Continue with returning the contacts without database upload success
      }
    }
    
    // After the uploadToDb block, return the parsed contacts if we didn't upload to DB
    return NextResponse.json({
      success: true,
      availableSheets,
      contacts: processedContacts,
      uploadedToDb: false
    })
  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    )
  }
}
