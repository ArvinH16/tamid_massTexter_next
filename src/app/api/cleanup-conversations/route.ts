import { NextRequest, NextResponse } from 'next/server';
import { clearExpiredConversationStates } from '@/lib/supabase';

// This endpoint should be called by a CRON job (e.g., daily)
// You can use services like Vercel Cron Jobs or set up a simple cron job with a service like Upstash
export async function POST(request: NextRequest) {
    try {
        // Verify the request has a valid API key if needed
        const apiKey = request.headers.get('x-api-key');
        if (apiKey !== process.env.CRON_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Clear expired conversation states
        const deletedCount = await clearExpiredConversationStates();
        
        return NextResponse.json({
            success: true,
            message: `Successfully cleaned up ${deletedCount} expired conversation states.`
        });
    } catch (error) {
        console.error('Error cleaning up conversation states:', error);
        return NextResponse.json(
            { success: false, message: 'Error cleaning up conversation states' },
            { status: 500 }
        );
    }
} 