import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { 
    getOrganizationByChapterName, 
    addOrgMember, 
    getConversationState, 
    upsertConversationState,
    deleteConversationState,
    formatPhoneNumber,
    supabase,
    markUserOptedOut,
    markUserOptedIn
} from '@/lib/supabase';

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Check if phone number already exists in organization
async function checkExistingMember(phoneNumber: string, organizationId: number) {
    // Format the phone number correctly
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Directly query for the specific formatted phone
    const { data, error } = await supabase
        .from('org_members')
        .select('id, first_name, last_name, phone_number')
        .eq('organization_id', organizationId)
        .eq('phone_number', formattedPhone);
    
    if (error) {
        console.error('Error querying organization members:', error);
        return null;
    }
    
    if (data && data.length > 0) {
        return data[0];
    }
    
    return null;
}

export async function POST(request: NextRequest) {
    try {
        console.log('SMS Registration webhook received');
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = (formData.get('Body') as string).trim();
        
        console.log('Message received:', { from, body });

        // Check for opt-out keywords
        const optOutKeywords = ['quit', 'stop', 'cancel', 'unsubscribe', 'end', 'optout'];
        if (optOutKeywords.includes(body.toLowerCase())) {
            console.log(`Opt-out request received from ${from}`);
            
            // Mark user as opted out in the database
            const success = await markUserOptedOut(from);
            
            // Special handling for STOP which Twilio handles automatically
            // Don't try to send messages to users who texted STOP as Twilio blocks them
            if (body.toLowerCase() === 'stop') {
                console.log('STOP command received - Twilio handles this automatically, not sending response');
                return NextResponse.json({ success: true });
            }
            
            let responseMessage = 'You have been unsubscribed from all future messages. Reply START to opt back in.';
            
            if (!success) {
                console.error(`Failed to opt out ${from} in database`);
                responseMessage = 'We received your opt-out request, but there was an error processing it. Please contact the organization directly.';
            }
            
            try {
                // Send confirmation message for non-STOP opt-out keywords
                await twilioClient.messages.create({
                    body: responseMessage,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from
                });
            } catch (error) {
                console.error('Error sending opt-out confirmation:', error);
                // Continue processing even if message fails
                // The user is still marked as opted out in our database
            }
            
            return NextResponse.json({ success: true });
        }

        // Check for opt-in keywords
        const optInKeywords = ['start', 'yes', 'unstop', 'optin'];
        if (optInKeywords.includes(body.toLowerCase())) {
            console.log(`Opt-in request received from ${from}`);
            
            // Mark user as opted in in the database
            const success = await markUserOptedIn(from);
            
            let responseMessage = 'You have been subscribed to receive messages. Reply QUIT to opt out at any time.';
            
            if (!success) {
                console.error(`Failed to opt in ${from} in database`);
                responseMessage = 'We received your opt-in request, but there was an error processing it. Please contact the organization directly.';
            }
            
            try {
                // Send confirmation message
                await twilioClient.messages.create({
                    body: responseMessage,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from
                });
            } catch (error) {
                console.error('Error sending opt-in confirmation:', error);
                // Continue processing even if message fails
                // The user is still marked as opted in in our database
            }
            
            return NextResponse.json({ success: true });
        }

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
                try {
                    await twilioClient.messages.create({
                        body: 'Sorry, that organization does not exist in our system. Please check the spelling and try again.',
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: from
                    });
                } catch (error) {
                    console.error('Error sending organization not found message:', error);
                }
                return NextResponse.json({ success: true });
            }
            
            // Check if user is already in the organization
            const existingMember = await checkExistingMember(from, organization.id);
            
            if (existingMember) {
                // User already exists in the organization
                const fullName = `${existingMember.first_name} ${existingMember.last_name}`.trim();
                try {
                    await twilioClient.messages.create({
                        body: `You are already a part of ${organization.chapter_name} as ${fullName}. If you need assistance, please contact the organization directly.`,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: from
                    });
                } catch (error) {
                    console.error('Error sending existing member message:', error);
                }
                
                // Delete the conversation state since we don't need to continue
                await deleteConversationState(from);
                return NextResponse.json({ success: true });
            }
            
            // Organization found but user is new, update state and ask for name
            userState.organization_id = organization.id;
            userState.state = 'waiting_for_name';
            
            // Save updated state to database
            await upsertConversationState(userState);
            
            try {
                await twilioClient.messages.create({
                    body: `Thanks for contacting ${organization.chapter_name}! Please reply with your full name.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from
                });
            } catch (error) {
                console.error('Error sending ask for name message:', error);
            }
            
            return NextResponse.json({ success: true });
        }
        
        // Waiting for name
        if (userState.state === 'waiting_for_name') {
            // Store name and ask for email
            userState.name = body;
            userState.state = 'waiting_for_email';
            
            // Save updated state to database
            await upsertConversationState(userState);
            
            try {
                await twilioClient.messages.create({
                    body: `Thanks, ${userState.name}! Please reply with your email address.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: from
                });
            } catch (error) {
                console.error('Error sending ask for email message:', error);
            }
            
            return NextResponse.json({ success: true });
        }
        
        // Waiting for email
        if (userState.state === 'waiting_for_email' && userState.name && userState.organization_id) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body)) {
                try {
                    await twilioClient.messages.create({
                        body: 'That doesn\'t appear to be a valid email address. Please try again.',
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: from
                    });
                } catch (error) {
                    console.error('Error sending invalid email message:', error);
                }
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
                    phone_number: from, // Using original phone format, addOrgMember will format it
                    organization_id: userState.organization_id,
                    other: 'Added via SMS registration'
                });
                
                if (success) {
                    try {
                        await twilioClient.messages.create({
                            body: `Thank you! Your information has been added to ${organizationName}'s database. Someone will be in touch with you soon.`,
                            from: process.env.TWILIO_PHONE_NUMBER,
                            to: from
                        });
                    } catch (error) {
                        console.error('Error sending success message after adding member:', error);
                    }
                    
                    // Delete the conversation state since we're done with it
                    await deleteConversationState(from);
                } else {
                    throw new Error('Database error');
                }
            } catch (error) {
                console.error('Error adding member to database:', error);
                try {
                    await twilioClient.messages.create({
                        body: 'Sorry, there was an error adding your information to our database. Please try again later or contact the organization directly.',
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: from
                    });
                } catch (sendError) {
                    console.error('Error sending database error message:', sendError);
                }
            }
            
            return NextResponse.json({ success: true });
        }
        
        // Handle any unexpected states or messages
        try {
            await twilioClient.messages.create({
                body: 'Sorry, I didn\'t understand that. Please try again or contact the organization directly for assistance.',
                from: process.env.TWILIO_PHONE_NUMBER,
                to: from
            });
        } catch (error) {
            console.error('Error sending fallback message:', error);
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing SMS registration webhook:', error);
        return NextResponse.json(
            { success: false, message: 'Error processing webhook' },
            { status: 500 }
        );
    }
} 