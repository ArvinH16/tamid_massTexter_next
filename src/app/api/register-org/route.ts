import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Validate the incoming data
        if (!data.organizationName || !data.email || !data.phoneNumber) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Use the admin client to bypass RLS policies
        const { error } = await supabaseAdmin!.from('pending_orgs').insert([
            {
                organization_name: data.organizationName,
                email: data.email,
                phone_number: data.phoneNumber,
            }
        ]);

        if (error) {
            console.error('Error inserting data:', error);
            return NextResponse.json(
                { error: 'Failed to register organization' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Organization registration submitted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 