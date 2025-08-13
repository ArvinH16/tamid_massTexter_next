import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getOrganizationByAccessCode, getEmailInfoByOrgId } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get access code from cookie
    const accessCode = request.cookies.get('access-code');
    
    if (!accessCode) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get organization from database
    const organization = await getOrganizationByAccessCode(accessCode.value);
    
    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get email info from database
    const emailInfo = await getEmailInfoByOrgId(organization.id);
    
    if (!emailInfo) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email configuration not found',
          health: {
            smtp_configured: false,
            smtp_connection: false,
            daily_limit_status: 'unknown'
          }
        },
        { status: 404 }
      );
    }
    
    // Test SMTP connection
    let smtpHealthy = false;
    let smtpError = null;
    
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: emailInfo.email_user_name,
          pass: emailInfo.email_passcode,
        },
        connectionTimeout: 10000, // 10 seconds for health check
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
      
      await transporter.verify();
      smtpHealthy = true;
      transporter.close(); // Clean up connection
    } catch (error) {
      smtpError = error instanceof Error ? error.message : 'SMTP connection failed';
      console.error('SMTP health check failed:', error);
    }
    
    // Check daily limit status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastEmailDate = organization.last_email_sent ? new Date(organization.last_email_sent + 'T00:00:00') : null;
    let currentEmailsSent = organization.emails_sent || 0;
    
    // Reset if it's a new day
    if (lastEmailDate && lastEmailDate.getTime() < today.getTime()) {
      currentEmailsSent = 0;
    }
    
    const remaining = (organization.email_remaining || 0) - currentEmailsSent;
    const dailyLimitStatus = remaining > 0 ? 'healthy' : 'limit_reached';
    
    return NextResponse.json({
      success: true,
      health: {
        smtp_configured: true,
        smtp_connection: smtpHealthy,
        smtp_error: smtpError,
        daily_limit_status: dailyLimitStatus,
        emails_remaining: remaining,
        emails_sent_today: currentEmailsSent,
        daily_limit: organization.email_remaining || 0,
        last_reset: lastEmailDate?.toISOString(),
        next_reset: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      recommendations: [
        ...(smtpHealthy ? [] : ['Check your email configuration and credentials']),
        ...(remaining <= 10 && remaining > 0 ? ['You are close to your daily email limit'] : []),
        ...(remaining <= 0 ? ['Daily email limit reached. Wait until tomorrow to send more emails.'] : []),
        ...(currentEmailsSent > (organization.email_remaining || 0) * 0.8 ? ['Consider upgrading your plan for higher email limits'] : [])
      ]
    });
    
  } catch (error) {
    console.error('Error checking email health:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check email health',
        health: {
          smtp_configured: false,
          smtp_connection: false,
          daily_limit_status: 'error'
        }
      },
      { status: 500 }
    );
  }
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
    
    // Get organization from database
    const organization = await getOrganizationByAccessCode(accessCode.value);
    
    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { htmlContent, testEmail } = await request.json();
    
    if (!htmlContent || !testEmail) {
      return NextResponse.json(
        { success: false, message: 'HTML content and test email are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Get email info from database
    const emailInfo = await getEmailInfoByOrgId(organization.id);
    
    if (!emailInfo) {
      return NextResponse.json(
        { success: false, message: 'Email configuration not found' },
        { status: 404 }
      );
    }
    
    // Analyze HTML for compatibility issues
    const compatibilityIssues = analyzeEmailCompatibility(htmlContent);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailInfo.email_user_name,
        pass: emailInfo.email_passcode,
      },
    });
    
    try {
      // Send test email
      await transporter.sendMail({
        from: emailInfo.email_user_name,
        to: testEmail,
        subject: `Email Compatibility Test - ${new Date().toLocaleDateString()}`,
        html: htmlContent,
        text: 'This is a test email to check HTML compatibility across email clients. If you can see this, your email client may not support HTML emails properly.'
      });
      
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        compatibility: {
          issues: compatibilityIssues,
          recommendations: generateCompatibilityRecommendations(compatibilityIssues)
        }
      });
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          compatibility: {
            issues: compatibilityIssues,
            recommendations: generateCompatibilityRecommendations(compatibilityIssues)
          }
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error testing email compatibility:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to test email compatibility' },
      { status: 500 }
    );
  }
}

function analyzeEmailCompatibility(htmlContent: string): string[] {
  const issues: string[] = [];
  
  // Check for CSS gradients without fallbacks
  if (htmlContent.includes('linear-gradient') && !htmlContent.includes('background-color')) {
    issues.push('CSS gradients detected without fallback background colors');
  }
  
  // Check for unsupported CSS properties
  const unsupportedProperties = [
    'box-shadow',
    'border-radius',
    'transform',
    'transition'
  ];
  
  unsupportedProperties.forEach(prop => {
    if (htmlContent.includes(prop)) {
      issues.push(`CSS property '${prop}' may not be supported in all email clients`);
    }
  });
  
  // Check for missing VML fallbacks for gradients
  if (htmlContent.includes('linear-gradient') && !htmlContent.includes('v:rect')) {
    issues.push('Gradients detected without VML fallback for Outlook');
  }
  
  // Check for web fonts without fallbacks
  if (htmlContent.includes('@import') || htmlContent.includes('link.*font')) {
    issues.push('Web fonts detected - ensure fallback fonts are specified');
  }
  
  // Check for missing viewport meta tag
  if (!htmlContent.includes('viewport')) {
    issues.push('Missing viewport meta tag for mobile compatibility');
  }
  
  // Check for missing Outlook namespace declarations
  if (!htmlContent.includes('xmlns:v') || !htmlContent.includes('xmlns:o')) {
    issues.push('Missing Outlook VML namespace declarations');
  }
  
  return issues;
}

function generateCompatibilityRecommendations(issues: string[]): string[] {
  const recommendations: string[] = [];
  
  if (issues.some(issue => issue.includes('gradient'))) {
    recommendations.push('Add solid background-color fallbacks for all gradients');
    recommendations.push('Consider using VML for Outlook gradient support');
  }
  
  if (issues.some(issue => issue.includes('box-shadow'))) {
    recommendations.push('Use border or background-color alternatives for visual emphasis');
  }
  
  if (issues.some(issue => issue.includes('border-radius'))) {
    recommendations.push('Consider using table-based rounded corners for better compatibility');
  }
  
  if (issues.some(issue => issue.includes('viewport'))) {
    recommendations.push('Add viewport meta tag for proper mobile rendering');
  }
  
  if (issues.some(issue => issue.includes('namespace'))) {
    recommendations.push('Add Outlook VML namespace declarations to the HTML tag');
  }
  
  recommendations.push('Test your emails across multiple clients including Outlook, Gmail, Apple Mail, and mobile clients');
  recommendations.push('Use table-based layouts for maximum compatibility');
  recommendations.push('Inline critical CSS styles for better client support');
  
  return recommendations;
}
