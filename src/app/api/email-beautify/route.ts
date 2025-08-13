import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Email template styles
const emailTemplates = {
  professional: {
    name: 'Professional',
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#3b82f6',
      background: '#ffffff',
      border: '#e5e7eb'
    },
    fonts: {
      heading: 'system-ui, -apple-system, sans-serif',
      body: 'system-ui, -apple-system, sans-serif'
    }
  },
  modern: {
    name: 'Modern',
    colors: {
      primary: '#0f172a',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      border: '#e2e8f0'
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif'
    }
  },
  marketing: {
    name: 'Marketing',
    colors: {
      primary: '#1e40af',
      secondary: '#374151',
      accent: '#f59e0b',
      background: '#ffffff',
      border: '#d1d5db'
    },
    fonts: {
      heading: 'Poppins, system-ui, sans-serif',
      body: 'system-ui, -apple-system, sans-serif'
    }
  },
  newsletter: {
    name: 'Newsletter',
    colors: {
      primary: '#059669',
      secondary: '#6b7280',
      accent: '#dc2626',
      background: '#f9fafb',
      border: '#e5e7eb'
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'system-ui, -apple-system, sans-serif'
    }
  }
};

interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  border: string;
}

interface TemplateFonts {
  heading: string;
  body: string;
}

interface EmailTemplate {
  colors: TemplateColors;
  fonts: TemplateFonts;
}

interface AIEnhancements {
  enhancedSubject?: string;
  subtitle?: string;
  formattedContent: string;
  signature?: string;
}

function generateEmailHTML(content: string, subject: string, template: EmailTemplate, aiEnhancements: AIEnhancements) {
  const { colors, fonts } = template;
  
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <!--[if gte mso 9]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <title>${subject}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fonts.body};
            line-height: 1.6;
            color: ${colors.primary};
            background-color: ${colors.background};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            /* Outlook fixes */
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        /* Outlook specific table resets */
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        /* Reset styles for Outlook */
        #outlook a {
            padding: 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${colors.background};
            border: 1px solid ${colors.border};
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            /* Outlook fixes */
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }
        
        .header {
            background-color: ${colors.primary}; /* Fallback for Outlook */
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
            /* Outlook specific styles */
            mso-line-height-rule: exactly;
        }
        
        .header h1 {
            font-family: ${fonts.heading};
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .content {
            padding: 40px;
        }
        
        .content h2 {
            font-family: ${fonts.heading};
            color: ${colors.primary};
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .content h3 {
            font-family: ${fonts.heading};
            color: ${colors.primary};
            font-size: 20px;
            margin: 25px 0 15px 0;
            font-weight: 600;
        }
        
        .content p {
            margin-bottom: 16px;
            color: ${colors.secondary};
            font-size: 16px;
            line-height: 1.7;
        }
        
        .content ul, .content ol {
            margin: 16px 0 16px 20px;
            color: ${colors.secondary};
        }
        
        .content li {
            margin-bottom: 8px;
            line-height: 1.6;
        }
        
        .highlight {
            background-color: ${colors.accent}20;
            padding: 2px 6px;
            border-radius: 4px;
            color: ${colors.accent};
            font-weight: 500;
        }
        
        .cta-button {
            display: inline-block;
            background-color: ${colors.accent}; /* Fallback for Outlook */
            background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            /* Outlook fixes */
            mso-padding-alt: 0;
            border: none;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, ${colors.border}, transparent);
            margin: 30px 0;
        }
        
        .footer {
            background-color: ${colors.background === '#ffffff' ? '#f9fafb' : colors.background};
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid ${colors.border};
        }
        
        .footer p {
            color: ${colors.secondary};
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .personalization {
            background-color: ${colors.accent}20; /* Fallback for Outlook */
            background: linear-gradient(135deg, ${colors.accent}10, ${colors.primary}10);
            border-left: 4px solid ${colors.accent};
            padding: 16px 20px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        
        .quote {
            border-left: 4px solid ${colors.accent};
            padding-left: 20px;
            font-style: italic;
            color: ${colors.secondary};
            margin: 20px 0;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 6px;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content h2 {
                font-size: 20px;
            }
            
            .content h3 {
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <!--[if gte mso 9]>
            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:120px;">
                <v:fill type="gradient" color="${colors.primary}" color2="${colors.accent}" angle="45" />
                <v:textbox inset="0,30px,0,30px">
            <![endif]-->
            <h1>${aiEnhancements.enhancedSubject || subject}</h1>
            <div class="subtitle">${aiEnhancements.subtitle || ''}</div>
            <!--[if gte mso 9]>
                </v:textbox>
            </v:rect>
            <![endif]-->
        </div>
        
        <div class="content">
            ${aiEnhancements.formattedContent}
        </div>
        
        <div class="footer">
            <p>Best regards,</p>
            <p><strong>${aiEnhancements.signature || 'Your Organization'}</strong></p>
            <div class="divider"></div>
            <p style="font-size: 12px; color: ${colors.secondary};">
                This email was sent from your organization's mass communication platform.
            </p>
        </div>
    </div>
</body>
</html>`;
}

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
    const { message, subject, template = 'professional', orgName } = await request.json();
    
    if (!message || !subject) {
      return NextResponse.json(
        { success: false, message: 'Message and subject are required' },
        { status: 400 }
      );
    }
    
    const selectedTemplate = emailTemplates[template as keyof typeof emailTemplates] || emailTemplates.professional;
    
    // Use AI to enhance the content
    const enhancementPrompt = `
Transform the following plain text email into a beautifully formatted HTML email structure.

Original Subject: "${subject}"
Original Message: "${message}"

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no additional text.

Tasks:
1. Enhance the subject line to be more engaging (keep it concise and professional)
2. Create a compelling subtitle for the email header (can be empty string if not needed)
3. Format the message content using appropriate HTML structure with:
   - Proper headings (h2, h3) for different sections
   - Paragraph breaks for readability
   - Bullet points or numbered lists where appropriate
   - Emphasis using <strong> for important points
   - <span class="highlight"> for key information that should stand out
   - <a href="#" class="cta-button"> for any call-to-action buttons
   - <div class="personalization"> for personalized content
   - <blockquote class="quote"> for any quotes or testimonials

Guidelines:
- Keep the content professional and engaging
- Maintain the original message's intent
- Add structure and visual hierarchy
- Use modern email marketing best practices
- Don't change the core message, just improve formatting and presentation
- If there are any action items or important dates, highlight them
- If {name} is used, preserve it for personalization

RESPOND WITH ONLY THIS JSON FORMAT (no other text):
{
  "enhancedSubject": "improved subject line",
  "subtitle": "optional subtitle for header or empty string",
  "formattedContent": "HTML formatted content here",
  "signature": "suggested organization signature"
}`;

    // Call OpenAI API with increased token limit for larger emails
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert email designer and copywriter. You help create beautiful, professional HTML email layouts. IMPORTANT: Always respond with ONLY valid JSON in the exact format specified. Do not include any explanations, markdown formatting, or additional text outside the JSON object." 
        },
        { role: "user", content: enhancementPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000, // Increased from 1500 to handle larger emails
    });
    
    const aiResponse = completion.choices[0]?.message?.content || '{}';
    
    let aiEnhancements;
    try {
      // Clean up the response to ensure it's valid JSON
      let cleanedResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the response if it contains other text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      // Validate the response contains required fields before parsing
      if (!cleanedResponse.includes('"formattedContent"')) {
        throw new Error('Response missing required formattedContent field');
      }
      
      aiEnhancements = JSON.parse(cleanedResponse);
      
      // Validate the parsed object has required fields
      if (!aiEnhancements.formattedContent) {
        throw new Error('Parsed response missing formattedContent');
      }
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw AI response:', aiResponse);
      
      // Fallback if AI response isn't valid JSON
      aiEnhancements = {
        enhancedSubject: subject,
        subtitle: '',
        formattedContent: `<p>${message.replace(/\n/g, '</p><p>')}</p>`,
        signature: orgName || 'Your Organization'
      };
    }
    
    // Generate the complete HTML email
    const htmlContent = generateEmailHTML(message, subject, selectedTemplate, aiEnhancements);
    
    return NextResponse.json({
      success: true,
      htmlContent,
      aiEnhancements,
      template: selectedTemplate,
      plainTextFallback: message // Keep original for fallback
    });
  } catch (error) {
    console.error('Error with email beautification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to beautify email' },
      { status: 500 }
    );
  }
}

// GET endpoint to return available templates
export async function GET() {
  return NextResponse.json({
    success: true,
    templates: Object.entries(emailTemplates).map(([key, template]) => ({
      id: key,
      name: template.name,
      colors: template.colors
    }))
  });
}
