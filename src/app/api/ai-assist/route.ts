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
    const { message, action } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'No message provided' },
        { status: 400 }
      );
    }
    
    if (!action) {
      return NextResponse.json(
        { success: false, message: 'No action specified' },
        { status: 400 }
      );
    }
    
    let prompt = '';
    
    // Different prompts based on the action
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
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that helps write and improve email and text messages. Provide concise, helpful responses." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const aiResponse = completion.choices[0]?.message?.content || 'No response generated';
    
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