import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Fake user data
const users = [
  { firstName: 'Eyal', lastName: 'Shechtman', email: 'eyal.shechtman@gmail.com' },
  { firstName: 'Testing', lastName: 'Shechtman', email: 'eshech@uw.edu' },
];

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send emails to each user
    for (const user of users) {
      try {
        const personalizedMessage = message.replace(/{name}/g, user.firstName);
        
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'TAMID Weekly Meeting Reminder',
          text: personalizedMessage,
        });

        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send email to ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
} 