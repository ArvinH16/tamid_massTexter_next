import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getOrganizationByAccessCode, getEmailInfoByOrgId, updateEmailsSent, supabaseAdmin } from '@/lib/supabase';

interface Contact {
  name: string;
  email: string;
}

interface EmailProgress {
  current: number;
  total: number;
  sent: number;
  failed: number;
  currentEmail: string;
  estimatedTimeRemaining: number;
  currentBatch: number;
  totalBatches: number;
  batchPauseRemaining?: number;
  status: 'sending' | 'paused' | 'completed' | 'error';
  message?: string;
}

// Utility function to get random delay between 3-7 seconds
function getRandomDelay(): number {
  return Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000; // 3000-7000ms
}

// Utility function to get random batch pause between 2-5 minutes
function getRandomBatchPause(): number {
  return Math.floor(Math.random() * (300000 - 120000 + 1)) + 120000; // 2-5 minutes
}

// Calculate estimated time remaining
function calculateEstimatedTime(
  currentIndex: number, 
  totalEmails: number, 
  currentBatch: number, 
  totalBatches: number
): number {
  const remainingInBatch = Math.min(50, totalEmails) - (currentIndex % 50);
  const remainingBatches = totalBatches - currentBatch - 1;
  
  // Average delay per email (5 seconds)
  const avgEmailDelay = 5000;
  const avgBatchPause = 210000; // 3.5 minutes average
  
  let timeRemaining = remainingInBatch * avgEmailDelay;
  if (remainingBatches > 0) {
    timeRemaining += remainingBatches * (50 * avgEmailDelay + avgBatchPause);
  }
  
  return Math.ceil(timeRemaining / 1000); // Return in seconds
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Set up SSE headers
  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  };

  let controller: ReadableStreamDefaultController;
  
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  // Function to send progress updates
  const sendProgress = (progress: EmailProgress) => {
    const data = `data: ${JSON.stringify(progress)}\n\n`;
    controller.enqueue(encoder.encode(data));
  };

  // Function to send error and close stream
  const sendError = (message: string) => {
    const errorData = `data: ${JSON.stringify({ status: 'error', message })}\n\n`;
    controller.enqueue(encoder.encode(errorData));
    controller.close();
  };

  // Start background processing
  (async () => {
    try {
      // Get access code from cookie
      const accessCode = request.cookies.get('access-code');
      
      if (!accessCode) {
        sendError('Unauthorized');
        return;
      }
      
      // Get organization from database
      const organization = await getOrganizationByAccessCode(accessCode.value);
      
      if (!organization) {
        sendError('Unauthorized');
        return;
      }
      
      // Get email info from database
      const emailInfo = await getEmailInfoByOrgId(organization.id);
      
      if (!emailInfo) {
        sendError('Email configuration not found');
        return;
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastEmailDate = organization.last_email_sent ? new Date(organization.last_email_sent + 'T00:00:00') : null;
      if (lastEmailDate && lastEmailDate.getTime() < today.getTime()) {
        await updateEmailsSent(organization.id, 0);
        organization.emails_sent = 0;
      }

      // Parse request body
      const { contacts, message, subject, htmlContent, isHtmlEmail = false } = await request.json();
      
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        sendError('No valid contacts provided');
        return;
      }

      // Filter valid contacts
      const validContacts = contacts.filter((contact: Contact) => 
        contact.email && 
        typeof contact.email === 'string' && 
        contact.email.includes('@') && 
        contact.email.includes('.')
      );

      if (validContacts.length === 0) {
        sendError('No valid email addresses found');
        return;
      }

      // Check daily limit
      if ((organization.emails_sent || 0) + validContacts.length > (organization.email_remaining || 500)) {
        sendError(`Daily email limit would be exceeded. Remaining: ${organization.email_remaining - (organization.emails_sent || 0)}`);
        return;
      }

      // Set up nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailInfo.email_user_name,
          pass: emailInfo.email_passcode,
        },
      });

      // Calculate batches
      const totalBatches = Math.ceil(validContacts.length / 50);
      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process emails in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * 50;
        const batchEnd = Math.min(batchStart + 50, validContacts.length);
        const batchContacts = validContacts.slice(batchStart, batchEnd);

        // Send emails in current batch
        for (let i = 0; i < batchContacts.length; i++) {
          const contact = batchContacts[i];
          const globalIndex = batchStart + i;

          try {
            // Send progress update
            sendProgress({
              current: globalIndex + 1,
              total: validContacts.length,
              sent,
              failed,
              currentEmail: contact.email,
              estimatedTimeRemaining: calculateEstimatedTime(globalIndex, validContacts.length, batchIndex, totalBatches),
              currentBatch: batchIndex + 1,
              totalBatches,
              status: 'sending',
              message: `Sending email ${globalIndex + 1} of ${validContacts.length} to ${contact.email}`
            });

            const personalizedMessage = message.replace(/{name}/gi, contact.name || '');
            const personalizedSubject = subject.replace(/{name}/gi, contact.name || '');
            
            // Prepare email options
            const emailOptions: {
              from: string;
              to: string;
              subject: string;
              html?: string;
              text?: string;
            } = {
              from: emailInfo.email_user_name,
              to: contact.email,
              subject: personalizedSubject,
            };

            // Add HTML content if this is a beautified email
            if (isHtmlEmail && htmlContent) {
              const personalizedHtmlContent = htmlContent.replace(/{name}/gi, contact.name || '');
              emailOptions.html = personalizedHtmlContent;
              emailOptions.text = personalizedMessage; // Keep plain text as fallback
            } else {
              emailOptions.text = personalizedMessage;
            }
            
            await transporter.sendMail(emailOptions);

            // Record in database
            if (supabaseAdmin) {
              try {
                await supabaseAdmin
                  .from('emails_sent')
                  .insert({
                    content: isHtmlEmail && htmlContent ? htmlContent.replace(/{name}/gi, contact.name || '') : personalizedMessage,
                    subject: personalizedSubject,
                    org_id: organization.id,
                    receiver: contact.email
                  });
              } catch (dbError) {
                console.error(`Failed to record email in database for ${contact.email}:`, dbError);
              }
            }

            sent++;
            console.log(`Successfully sent email to ${contact.email}`);

          } catch (error) {
            failed++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to send email to ${contact.email}:`, errorMessage);
            errors.push(`Failed to send email to ${contact.email}: ${errorMessage}`);
          }

          // Add random delay between emails (3-7 seconds) - except for the last email in batch
          if (i < batchContacts.length - 1) {
            const delay = getRandomDelay();
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        // Pause between batches (except after the last batch)
        if (batchIndex < totalBatches - 1) {
          const batchPause = getRandomBatchPause();
          const pauseSeconds = Math.ceil(batchPause / 1000);
          
          // Send pause status
          sendProgress({
            current: batchEnd,
            total: validContacts.length,
            sent,
            failed,
            currentEmail: '',
            estimatedTimeRemaining: calculateEstimatedTime(batchEnd, validContacts.length, batchIndex, totalBatches),
            currentBatch: batchIndex + 1,
            totalBatches,
            batchPauseRemaining: pauseSeconds,
            status: 'paused',
            message: `Batch ${batchIndex + 1} complete. Pausing for ${Math.ceil(pauseSeconds / 60)} minutes before next batch...`
          });

          // Countdown during pause
          for (let remaining = pauseSeconds; remaining > 0; remaining -= 10) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Update every 10 seconds
            
            sendProgress({
              current: batchEnd,
              total: validContacts.length,
              sent,
              failed,
              currentEmail: '',
              estimatedTimeRemaining: calculateEstimatedTime(batchEnd, validContacts.length, batchIndex, totalBatches),
              currentBatch: batchIndex + 1,
              totalBatches,
              batchPauseRemaining: Math.max(0, remaining - 10),
              status: 'paused',
              message: `Batch ${batchIndex + 1} complete. Pausing for ${Math.ceil((remaining - 10) / 60)} minutes before next batch...`
            });
          }
        }
      }

      // Update emails sent count
      if (sent > 0) {
        await updateEmailsSent(organization.id, (organization.emails_sent || 0) + sent);
      }

      // Send final completion status
      sendProgress({
        current: validContacts.length,
        total: validContacts.length,
        sent,
        failed,
        currentEmail: '',
        estimatedTimeRemaining: 0,
        currentBatch: totalBatches,
        totalBatches,
        status: 'completed',
        message: `Email sending completed! Sent: ${sent}, Failed: ${failed}`
      });

    } catch (error) {
      console.error('Error in background email processing:', error);
      sendError(error instanceof Error ? error.message : 'Failed to send emails');
    } finally {
      // Close the stream
      setTimeout(() => {
        try {
          controller.close();
        } catch {
          // Stream might already be closed
        }
      }, 1000);
    }
  })();

  return new NextResponse(stream, { headers: responseHeaders });
}
