// app/api/parse-table/route.ts
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { parse } from 'csv-parse/sync'

// Define the expected output structure
interface Contact {
  name: string
  email: string
  phone: string
}

// System prompt for the LLM
const SYSTEM_PROMPT = `You are a helpful assistant that extracts contact information from tabular data.
Your task is to parse the given table data and extract contact information into a structured JSON format.
The output should be a JSON array of objects, where each object has the following structure:
{
  "First name": "First name of the person",
  "Last name": "Last name of the person",
  "email": "Email address",
  "phone": "Phone number"
}

Rules:
1. Extract all contact information you can find
2. If a field is missing, use an empty string
3. Ensure phone numbers are in a consistent format (e.g., (123) 456-7890)
4. Return only valid JSON, no additional text
5. If no contacts are found, return an empty array []
7. Clean up any extra whitespace or formatting in the data`

export async function POST(request: Request) {
  try {
    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Extract text content based on file type
    let textContent = ''
    const fileType = file.type

    if (fileType === 'text/csv' || (file.name && file.name.endsWith('.csv'))) {
      const fileText = await file.text()
      const records = parse(fileText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
      textContent = JSON.stringify(records, null, 2)
    } else if (fileType === 'text/plain' || (file.name && file.name.endsWith('.txt'))) {
      textContent = await file.text()
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload CSV or TXT files.' },
        { status: 400 }
      )
    }

    const client = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'],
      });
      
    // Call OpenAI to parse the text
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: textContent }
      ],
      response_format: { type: "json_object" }
    })

      
    const raw = completion.choices[0].message.content
    
    const parsedResponse = JSON.parse(raw || '{}')
    const contacts: Contact[] = Array.isArray(parsedResponse) ? parsedResponse : []

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    )
  }
}
