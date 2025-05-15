import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getOrganizationByAccessCode, getEmailInfoByOrgId, updateEmailsSent } from '@/lib/supabase';

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
    
    // Get email info from database
    const emailInfo = await getEmailInfoByOrgId(organization.id);
    
    if (!emailInfo) {
      return NextResponse.json(
        { success: false, message: 'Email configuration not found' },
        { status: 404 }
      );
    }
    
    // Check if sending would exceed daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    // Parse the last_email_sent date in local timezone
    const lastEmailDate = organization.last_email_sent ? new Date(organization.last_email_sent + 'T00:00:00') : null;    
    // Only reset if we have a last_email_sent date AND it's from a different day
    if (lastEmailDate && lastEmailDate.getTime() < today.getTime()) {
      await updateEmailsSent(organization.id, 0);
      organization.emails_sent = 0;
    }
    
    // Check if sending would exceed daily limit
    const { contacts, message } = await request.json();
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid contacts provided' },
        { status: 400 }
      );
    }

    // Filter out contacts without valid email addresses
    const validContacts = contacts.filter(contact => {
      if (!contact.email) return false;
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(contact.email);
    });

    if (validContacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No contacts with valid email addresses found' },
        { status: 400 }
      );
    }
    
    if (validContacts.length > (organization.email_remaining - organization.emails_sent)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Daily email limit would be exceeded. You have ${organization.email_remaining - organization.emails_sent} emails remaining today, but your file contains ${validContacts.length} contacts.` 
        },
        { status: 429 }
      );
    }
    
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

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send emails to each contact
    for (const contact of validContacts) {
      try {
        const personalizedMessage = message.replace(/{name}/gi, contact.name);
        
        await transporter.sendMail({
          from: emailInfo.email_user_name,
          to: contact.email,
          subject: 'TAMID Message',
          text: personalizedMessage,
        });

        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send email to ${contact.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Update emails sent count
    if (results.sent > 0) {
      const updateSuccess = await updateEmailsSent(organization.id, organization.emails_sent + results.sent);
      if (!updateSuccess) {
        console.error('Failed to update emails_sent count');
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      remainingToday: organization.email_remaining - organization.emails_sent - results.sent
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send emails' },
      { status: 500 }
    );
  }
}

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
    
    // Calculate remaining emails for the day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    // Parse the last_email_sent date in local timezone
    const lastEmailDate = organization.last_email_sent ? new Date(organization.last_email_sent + 'T00:00:00') : null;
        
    // Only reset if we have a last_email_sent date AND it's from a different day
    if (lastEmailDate && lastEmailDate.getTime() < today.getTime()) {
      await updateEmailsSent(organization.id, 0);
      organization.emails_sent = 0;
    }
    
    // Calculate remaining emails
    const remaining = organization.email_remaining - organization.emails_sent;
    
    // Calculate reset date (next day at midnight)
    const resetDate = new Date(today);
    resetDate.setDate(today.getDate() + 1);
    resetDate.setHours(0, 0, 0, 0);
    
    return NextResponse.json({
      dailyLimit: organization.email_remaining,
      emailsSent: organization.emails_sent,
      remaining: remaining,
      resetDate: resetDate.toISOString()
    });
  } catch (error) {
    console.error('Error getting email limit:', error);
    return NextResponse.json(
      { success: false, message: 'Error getting email limit' },
      { status: 500 }
    );
  }
} 