import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get access code from cookie
    const accessCode = request.cookies.get('access-code');
    
    if (!accessCode) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const { message, action, type, context } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'No message provided' },
        { status: 400 }
      );
    }
    
    // For email customization, we don't need action
    if (!type && !action) {
      return NextResponse.json(
        { success: false, message: 'No action or type specified' },
        { status: 400 }
      );
    }
    
    let prompt = '';
    let systemMessage = "You are a helpful assistant that helps write and improve email and text messages. Provide concise, helpful responses.";
    
    // Handle email customization separately
    if (type === 'email_customization') {
      systemMessage = "You are an expert email designer and HTML specialist. You help users customize and improve their HTML email designs. You can modify colors, layout, content, and styling while maintaining professional quality.";
      
      prompt = `
User Request: "${message}"

Current Email Context:
- Subject: ${context?.subject || 'N/A'}
- Template: ${context?.template || 'professional'}
- Organization: ${context?.orgName || 'Organization'}

Current HTML Email:
${context?.currentHtml || 'No HTML provided'}

Instructions:
1. Understand what the user wants to change about their email
2. If they want visual/styling changes, provide updated HTML
3. If they want content changes, modify the appropriate sections
4. Always maintain responsive design and email client compatibility
5. Explain what changes you made in simple terms

Your response should be in JSON format:
{
  "response": "explanation of what you changed",
  "updatedHtml": "complete updated HTML if changes were made",
  "updatedEnhancements": {
    "enhancedSubject": "updated subject if changed",
    "subtitle": "updated subtitle if changed", 
    "formattedContent": "updated content if changed",
    "signature": "updated signature if changed"
  }
}

Only include updatedHtml and updatedEnhancements if you actually made changes. If no changes are needed, just provide a helpful response.`;
    } else {
      // Original message assistance functionality
      switch (action) {
        case 'improve':
          prompt = `Improve the following message to make it more professional and engaging. Keep the same general meaning but enhance the language and structure: "${message}"`;
          break;
        case 'rephrase':
          prompt = `Rephrase the following message in a different way while keeping the same meaning: "${message}"`;
          break;
        case 'expand':
          prompt = `Expand the following message with more details and context while keeping the core message: "${message}"`;
          break;
        case 'shorten':
          prompt = `Shorten the following message while keeping the essential information: "${message}"`;
          break;
        case 'formal':
          prompt = `Make the following message more formal and professional: "${message}"`;
          break;
        case 'casual':
          prompt = `Make the following message more casual and friendly: "${message}"`;
          break;
        case 'generate':
          prompt = `Generate a professional email message about: "${message}"`;
          break;
        default:
          return NextResponse.json(
            { success: false, message: 'Invalid action' },
            { status: 400 }
          );
      }
    }
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: systemMessage
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: type === 'email_customization' ? 2000 : 500,
    });
    
    const aiResponse = completion.choices[0]?.message?.content || 'No response generated';
    
    // Handle email customization response
    if (type === 'email_customization') {
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return NextResponse.json({
          success: true,
          response: parsedResponse.response,
          updatedHtml: parsedResponse.updatedHtml,
          updatedEnhancements: parsedResponse.updatedEnhancements
        });
      } catch {
        // Fallback if JSON parsing fails
        return NextResponse.json({
          success: true,
          response: aiResponse
        });
      }
    }
    
    // Original message assistance response
    return NextResponse.json({
      success: true,
      message: aiResponse
    });
  } catch (error) {
    console.error('Error with AI assistance:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process AI request' },
      { status: 500 }
    );
  }
} 