import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { 
    getOrganizationByChapterName, 
    addOrgMember, 
    getConversationState, 
    upsertConversationState,
    deleteConversationState,
    ConversationState
} from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Function to format phone number
function formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    return phoneNumber.replace(/\D/g, '');
}

export async function POST(request: NextRequest) {
    try {
        console.log('SMS Registration webhook received');
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = (formData.get('Body') as string).trim();
        
        console.log('Message received:', { from, body });

        // Get user state from database
        let userState = await getConversationState(from);
        
        // If no state exists, initialize with "initial" state
        if (!userState) {
            userState = {
                phone_number: from,
                state: 'initial'
            };
            // Save initial state to database
            await upsertConversationState(userState);
        }
        
        // Initial state - expecting organization name
        if (userState.state === 'initial') {
            // Look up organization by chapter name
            const organization = await getOrganizationByChapterName(body);
            
            if (!organization) {
                // Organization not found
                await twilioClient.messages.create({
                    body: 'Sorry, that organization does not exist in our system. Please check the spelling and try again.',
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from
                });
                return NextResponse.json({ success: true });
            }
            
            // Organization found, update state and ask for name
            userState.organization_id = organization.id;
            userState.state = 'waiting_for_name';
            
            // Save updated state to database
            await upsertConversationState(userState);
            
            await twilioClient.messages.create({
                body: `Thanks for contacting ${organization.chapter_name}! Please reply with your full name.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: from
            });
            
            return NextResponse.json({ success: true });
        }
        
        // Waiting for name
        if (userState.state === 'waiting_for_name') {
            // Store name and ask for email
            userState.name = body;
            userState.state = 'waiting_for_email';
            
            // Save updated state to database
            await upsertConversationState(userState);
            
            await twilioClient.messages.create({
                body: `Thanks, ${userState.name}! Please reply with your email address.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: from
            });
            
            return NextResponse.json({ success: true });
        }
        
        // Waiting for email
        if (userState.state === 'waiting_for_email' && userState.name && userState.organization_id) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body)) {
                await twilioClient.messages.create({
                    body: 'That doesn\'t appear to be a valid email address. Please try again.',
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from
                });
                return NextResponse.json({ success: true });
            }
            
            // Store email and complete the state
            userState.email = body;
            userState.state = 'completed';
            
            // Save updated state to database
            await upsertConversationState(userState);
            
            try {
                // Get organization for the completion message using organization_id
                const { data: organization } = await supabase
                    .from('organizations')
                    .select('chapter_name')
                    .eq('id', userState.organization_id)
                    .single();
                    
                const organizationName = organization?.chapter_name || 'the organization';
                
                // Split name into first and last name
                const nameParts = userState.name.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                
                // Add to database
                const success = await addOrgMember({
                    first_name: firstName,
                    last_name: lastName,
                    email: userState.email,
                    phone_number: formatPhoneNumber(from),
                    organization_id: userState.organization_id,
                    other: 'Added via SMS registration'
                });
                
                if (success) {
                    await twilioClient.messages.create({
                        body: `Thank you! Your information has been added to ${organizationName}'s database. Someone will be in touch with you soon.`,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: from
                    });
                    
                    // Delete the conversation state since we're done with it
                    await deleteConversationState(from);
                } else {
                    throw new Error('Database error');
                }
            } catch (error) {
                console.error('Error adding member to database:', error);
                await twilioClient.messages.create({
                    body: 'Sorry, there was an error adding your information to our database. Please try again later or contact the organization directly.',
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from
                });
            }
            
            return NextResponse.json({ success: true });
        }
        
        // Handle any unexpected states or messages
        await twilioClient.messages.create({
            body: 'Sorry, I didn\'t understand that. Please try again or contact the organization directly for assistance.',
            from: process.env.TWILIO_PHONE_NUMBER,
            to: from
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing SMS registration webhook:', error);
        return NextResponse.json(
            { success: false, message: 'Error processing webhook' },
            { status: 500 }
        );
    }
} 