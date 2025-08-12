import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByAccessCode, supabaseAdmin } from '@/lib/supabase';

interface TextMessage {
  id: number;
  created_at: string;
  content: string;
  receiver: string;
}

interface EmailMessage {
  id: number;
  created_at: string;
  content: string;
  subject: string;
  receiver: string;
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

    // Check if admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'texts' or 'emails' or 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let textsData: TextMessage[] = [];
    let emailsData: EmailMessage[] = [];
    let totalTexts = 0;
    let totalEmails = 0;

    // Fetch texts if requested
    if (type === 'texts' || type === 'all' || !type) {
      const { data: texts, error: textsError } = await supabaseAdmin
        .from('texts_sent')
        .select('id, created_at, content, receiver')
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (textsError) {
        console.error('Error fetching texts:', textsError);
      } else {
        textsData = texts || [];
      }

      // Get total count for texts
      const { count: textsCount, error: textsCountError } = await supabaseAdmin
        .from('texts_sent')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization.id);

      if (!textsCountError) {
        totalTexts = textsCount || 0;
      }
    }

    // Fetch emails if requested
    if (type === 'emails' || type === 'all' || !type) {
      const { data: emails, error: emailsError } = await supabaseAdmin
        .from('emails_sent')
        .select('id, created_at, content, subject, receiver')
        .eq('org_id', organization.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (emailsError) {
        console.error('Error fetching emails:', emailsError);
      } else {
        emailsData = emails || [];
      }

      // Get total count for emails
      const { count: emailsCount, error: emailsCountError } = await supabaseAdmin
        .from('emails_sent')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organization.id);

      if (!emailsCountError) {
        totalEmails = emailsCount || 0;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        texts: textsData,
        emails: emailsData,
        pagination: {
          page,
          limit,
          totalTexts,
          totalEmails,
          totalPagesTexts: Math.ceil(totalTexts / limit),
          totalPagesEmails: Math.ceil(totalEmails / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching sent messages:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching sent messages' },
      { status: 500 }
    );
  }
}
