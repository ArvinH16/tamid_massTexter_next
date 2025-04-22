import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_PUBLIC || '';

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

// Public client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for server-side operations that need full access
// This should ONLY be used in server-side code
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseAdmin = serviceRoleKey ? 
    createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }) : null;

// Check if service role key is available in server environment
if (!serviceRoleKey && typeof window === 'undefined') {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail.');
}

// Types based on the database schema
export interface Organization {
    id: number;
    created_at: string;
    access_code: string;
    message_limit: number;
    twilio_number: string;
    email_remaining: number;
    region_id: number;
    chapter_name: string;
    message_sent: number;
    emails_sent: number;
    last_message_sent: string | null;
    last_email_sent: string | null;
}

export interface OrgMember {
    id: number;
    created_at: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    organization_id: number;
    other: string;
}

export interface EmailInfo {
    id: number;
    created_at: string;
    email_user_name: string;
    email_passcode: string;
    organization_id: number;
}

export interface Region {
    id: number;
    created_at: string;
    region: string;
    number: string;
}

interface Contact {
    name: string;
    phone: string;
    email?: string;
}

interface UploadResult {
    uploaded: number;
    skipped: number;
}

// Helper functions for database operations
export async function getOrganizationByAccessCode(accessCode: string): Promise<Organization | null> {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('access_code', accessCode)
        .single();

    if (error) {
        console.error('Error fetching organization:', error);
        return null;
    }

    return data;
}

export async function getOrgMembersByOrgId(orgId: number): Promise<OrgMember[]> {
    const { data, error } = await supabase
        .from('org_members')
        .select('*')
        .eq('organization_id', orgId);

    if (error) {
        console.error('Error fetching org members:', error);
        return [];
    }

    return data || [];
}

export async function getEmailInfoByOrgId(orgId: number): Promise<EmailInfo | null> {
    const { data, error } = await supabase
        .from('email_info')
        .select('*')
        .eq('organization_id', orgId)
        .single();

    if (error) {
        console.error('Error fetching email info:', error);
        return null;
    }

    return data;
}

export async function updateMessageLimit(orgId: number, newLimit: number): Promise<boolean> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }
    
    const { error } = await supabaseAdmin
        .from('organizations')
        .update({ message_limit: newLimit })
        .eq('id', orgId);
        
    if (error) {
        console.error('Error updating message limit:', error);
        return false;
    }

    return true;
}

export async function updateEmailRemaining(orgId: number, newCount: number): Promise<boolean> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }
    
    const { error } = await supabaseAdmin
        .from('organizations')
        .update({ email_remaining: newCount })
        .eq('id', orgId);

    if (error) {
        console.error('Error updating email remaining:', error);
        return false;
    }

    return true;
}

export async function updateMessageSent(orgId: number, newCount: number): Promise<boolean> {
    console.log(`Attempting to update message_sent for org ${orgId} to ${newCount}`);
    
    try {
        // Ensure we have admin client
        if (!supabaseAdmin) {
            throw new Error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        }
        
        // Ensure newCount is not null or undefined
        if (newCount === null || newCount === undefined) {
            throw new Error(`Invalid newCount value: ${newCount}`);
        }
        
        // Ensure newCount is a number
        const numericCount = Number(newCount);
        if (isNaN(numericCount)) {
            throw new Error(`Invalid non-numeric value: ${newCount}`);
        }
        
        // Format the date as YYYY-MM-DD for the database
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        console.log(`Using formatted date: ${formattedDate} and numeric count: ${numericCount}`);
        
        // Direct update approach using admin client
        const { data, error } = await supabaseAdmin
            .from('organizations')
            .update({ 
                message_sent: numericCount,
                last_message_sent: formattedDate
            })
            .eq('id', orgId)
            .select();
        
        if (error) {
            throw new Error(`Database update error: ${error.message}`);
        }
        
        console.log('Update response data:', data);
        
        if (!data || data.length === 0) {
            console.warn('Update successful but no data returned');
        }
        
        // Verify the update was successful by fetching the data again
        const { data: verifyData, error: verifyError } = await supabaseAdmin
            .from('organizations')
            .select('message_sent, last_message_sent')
            .eq('id', orgId)
            .single();
        
        if (verifyError) {
            throw new Error(`Verification error: ${verifyError.message}`);
        }
        
        console.log('Verification data after update:', verifyData);
        
        if (verifyData.message_sent !== numericCount) {
            console.warn(`Verification failed: expected message_sent to be ${numericCount} but got ${verifyData.message_sent}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error in updateMessageSent:', error);
        return false;
    }
}

export async function updateEmailsSent(orgId: number, newCount: number): Promise<boolean> {
    console.log(`Attempting to update emails_sent for org ${orgId} to ${newCount}`);
    
    try {
        // Ensure we have admin client
        if (!supabaseAdmin) {
            throw new Error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        }
        
        // Ensure newCount is not null or undefined
        if (newCount === null || newCount === undefined) {
            throw new Error(`Invalid newCount value: ${newCount}`);
        }
        
        // Ensure newCount is a number
        const numericCount = Number(newCount);
        if (isNaN(numericCount)) {
            throw new Error(`Invalid non-numeric value: ${newCount}`);
        }
        
        // Format the date as YYYY-MM-DD for the database
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        console.log(`Using formatted date: ${formattedDate} and numeric count: ${numericCount}`);
        
        // Direct update approach using admin client
        const { data, error } = await supabaseAdmin
            .from('organizations')
            .update({ 
                emails_sent: numericCount,
                last_email_sent: formattedDate
            })
            .eq('id', orgId)
            .select();
        
        if (error) {
            throw new Error(`Database update error: ${error.message}`);
        }
        
        console.log('Update response data:', data);
        
        if (!data || data.length === 0) {
            console.warn('Update successful but no data returned');
        }
        
        // Verify the update was successful by fetching the data again
        const { data: verifyData, error: verifyError } = await supabaseAdmin
            .from('organizations')
            .select('emails_sent, last_email_sent')
            .eq('id', orgId)
            .single();
        
        if (verifyError) {
            throw new Error(`Verification error: ${verifyError.message}`);
        }
        
        console.log('Verification data after update:', verifyData);
        
        if (verifyData.emails_sent !== numericCount) {
            console.warn(`Verification failed: expected emails_sent to be ${numericCount} but got ${verifyData.emails_sent}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error in updateEmailsSent:', error);
        return false;
    }
}

export async function addOrgMembers(members: Omit<OrgMember, 'id' | 'created_at'>[]): Promise<boolean> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }
    
    const { error } = await supabaseAdmin
        .from('org_members')
        .insert(members);

    if (error) {
        console.error('Error adding org members:', error);
        return false;
    }

    return true;
}

export async function uploadContacts(
    organizationId: string,
    contacts: Contact[]
): Promise<UploadResult> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return { uploaded: 0, skipped: contacts.length };
    }
    
    const { data, error } = await supabaseAdmin
        .from('org_members')
        .insert(
            contacts.map(contact => {
                // Split the name into first_name and last_name
                const nameParts = contact.name.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                return {
                    organization_id: parseInt(organizationId),
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: contact.phone.replace(/\D/g, ''), // Remove non-digits
                    email: contact.email || null,
                    other: '',
                    created_at: new Date().toISOString()
                };
            })
        );

    if (error) {
        console.error('Error uploading contacts:', error);
        console.log('Contacts:', contacts);
        throw new Error('Failed to upload contacts');
    }

    return {
        uploaded: contacts.length,
        skipped: 0 // This could be enhanced to track actual skipped contacts
    };
} 