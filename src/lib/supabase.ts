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
    opted_out?: boolean;
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
    flagged?: number;
    toUpload?: number;
    newContacts?: Contact[];
    existingContacts?: Contact[];
    flaggedContacts?: Contact[];
}

// Conversation state interface
export interface ConversationState {
    id?: number;
    created_at?: string;
    updated_at?: string;
    phone_number: string;
    state: 'initial' | 'waiting_for_name' | 'waiting_for_email' | 'completed';
    organization_id?: number | null;
    name?: string | null;
    email?: string | null;
    expires_at?: string;
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
    
    if (!supabaseAdmin) {
        return null;
    }
    
    const { data, error } = await supabaseAdmin
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

/**
 * Format phone number to standardized format with country code
 * Ensures phone numbers are stored as 12065734928 (with country code)
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  // Handle null or undefined phone numbers
  if (phoneNumber === null || phoneNumber === undefined) {
    return '';
  }
  
  // Remove all non-digit characters including the '+' sign
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // US numbers: if it's 10 digits, add '1' as country code
  if (digitsOnly.length === 10) {
    return `1${digitsOnly}`;
  }
  
  // If it already has 11 digits and starts with 1, assume it's already formatted correctly
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return digitsOnly;
  }
  
  // Return as-is for other cases (could be international or incorrect)
  return digitsOnly;
}

/**
 * Checks which contacts already exist in the database based on phone number and organization ID
 */
export async function checkExistingContacts(
    organizationId: string,
    contacts: Contact[]
): Promise<{ newContacts: Contact[], existingContacts: Contact[], flaggedContacts: Contact[] }> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return { newContacts: [], existingContacts: contacts, flaggedContacts: [] };
    }
    
    // Identify flagged contacts (missing phone numbers) and format phone numbers for valid contacts
    const flaggedContacts: Contact[] = [];
    const validContacts = contacts.map(contact => {
        // If no phone number or empty after formatting, flag the contact but still allow it
        if (!contact.phone || contact.phone.replace(/\D/g, '') === '') {
            flaggedContacts.push(contact);
            return {
                ...contact,
                formattedPhone: null
            };
        }
        
        return {
            ...contact,
            formattedPhone: formatPhoneNumber(contact.phone)
        };
    }) as Array<Contact & { formattedPhone: string | null }>;
    
    // Get all existing contacts for this organization
    const { data: existingOrgMembers, error } = await supabaseAdmin
        .from('org_members')
        .select('phone_number')
        .eq('organization_id', parseInt(organizationId));
    
    if (error) {
        console.error('Error fetching existing contacts:', error);
        return { newContacts: contacts, existingContacts: [], flaggedContacts };
    }
    
    // Format existing phone numbers for comparison
    const existingPhoneNumbers = new Set(
        existingOrgMembers.map(member => formatPhoneNumber(member.phone_number))
    );
    
    // Separate contacts into new and existing
    const newContacts: Contact[] = [];
    const existingContacts: Contact[] = [];
    
    for (const contact of validContacts) {
        // Only check for duplicates if the contact has a phone number
        if (contact.formattedPhone && existingPhoneNumbers.has(contact.formattedPhone)) {
            existingContacts.push({
                name: contact.name,
                phone: contact.phone, // Keep original format for display
                email: contact.email
            });
        } else {
            newContacts.push({
                name: contact.name,
                phone: contact.phone, // Keep original format for display
                email: contact.email
            });
        }
    }
    
    return { newContacts, existingContacts, flaggedContacts };
}

/**
 * Uploads contacts with duplicate checking based on phone number and organization ID
 */
export async function uploadContactsWithDuplicateCheck(
    organizationId: string,
    contacts: Contact[],
    previewOnly: boolean = false
): Promise<UploadResult> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return { uploaded: 0, skipped: 0, flagged: contacts.length };
    }
    
    // Check for existing contacts
    const { newContacts, existingContacts, flaggedContacts } = await checkExistingContacts(organizationId, contacts);
    
    // If it's just a preview, return the counts without uploading
    if (previewOnly) {
        return {
            uploaded: 0, // Would be uploaded in non-preview mode
            toUpload: newContacts.length,
            skipped: existingContacts.length,
            flagged: flaggedContacts.length,
            newContacts,
            existingContacts,
            flaggedContacts
        };
    }
    
    // If there are no new contacts, return early
    if (newContacts.length === 0) {
        return {
            uploaded: 0,
            skipped: existingContacts.length,
            flagged: flaggedContacts.length,
            newContacts: [],
            existingContacts,
            flaggedContacts
        };
    }
    
    // Upload new contacts
    const { error } = await supabaseAdmin
        .from('org_members')
        .insert(
            newContacts.map(contact => {
                // Split the name into first_name and last_name
                const nameParts = contact.name.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                return {
                    organization_id: parseInt(organizationId),
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: contact.phone ? formatPhoneNumber(contact.phone) : null, // Allow null phone numbers
                    email: contact.email || null,
                    other: '',
                    created_at: new Date().toISOString()
                };
            })
        );

    if (error) {
        console.error('Error uploading contacts:', error);
        console.log('Contacts:', newContacts);
        throw new Error('Failed to upload contacts');
    }

    return {
        uploaded: newContacts.length,
        skipped: existingContacts.length,
        flagged: flaggedContacts.length,
        newContacts,
        existingContacts,
        flaggedContacts
    };
}

export async function getOrganizationByChapterName(chapterName: string): Promise<Organization | null> {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .ilike('chapter_name', chapterName.trim())
        .single();

    if (error) {
        console.error('Error fetching organization by chapter name:', error);
        return null;
    }

    return data;
}

export async function addOrgMember(member: Omit<OrgMember, 'id' | 'created_at'>): Promise<boolean> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }
    
    // Format the phone number for consistent comparison
    const formattedPhone = formatPhoneNumber(member.phone_number);
    console.log(`Checking if member exists with formatted phone: ${formattedPhone} in org: ${member.organization_id}`);
    
    // First check if this phone number already exists in the organization
    const { data: existingMembers, error: checkError } = await supabaseAdmin
        .from('org_members')
        .select('id, phone_number, first_name, last_name')
        .eq('organization_id', member.organization_id);
    
    if (checkError) {
        console.error('Error checking for existing org members:', checkError);
        return false;
    }
    
    // Check for existing members with the same phone number
    const matchingMember = existingMembers?.find(existing => {
        const existingFormatted = formatPhoneNumber(existing.phone_number);
        const isMatch = existingFormatted === formattedPhone;
        if (isMatch) {
            console.log(`Found match: DB has ${existing.phone_number} (${existingFormatted}) matches input ${member.phone_number} (${formattedPhone})`);
        }
        return isMatch;
    });
    
    // If member already exists, consider it a success but don't add a duplicate
    if (matchingMember) {
        console.log(`Member with phone ${member.phone_number} already exists as ID ${matchingMember.id} (${matchingMember.first_name} ${matchingMember.last_name}) in organization ${member.organization_id}`);
        return true;
    }
    
    console.log(`No existing member found with phone ${formattedPhone}. Adding new member: ${member.first_name} ${member.last_name}`);
    
    // Member doesn't exist, proceed with insertion
    const { error } = await supabaseAdmin
        .from('org_members')
        .insert({
            ...member,
            phone_number: formattedPhone // Ensure we store the properly formatted number
        });

    if (error) {
        console.error('Error adding org member:', error);
        return false;
    }

    console.log(`Successfully added new member: ${member.first_name} ${member.last_name} with phone ${formattedPhone}`);
    return true;
}

// Get conversation state by phone number
export async function getConversationState(phoneNumber: string): Promise<ConversationState | null> {
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return null;
    }
    
    const { data, error } = await supabaseAdmin
        .from('conversation_states')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

    if (error) {
        console.error('Error fetching conversation state:', error);
        return null;
    }

    return data;
}

// Create or update conversation state
export async function upsertConversationState(state: ConversationState): Promise<boolean> {
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }

    // Set updated_at time to now
    const now = new Date().toISOString();
    const stateWithTimestamp = {
        ...state,
        updated_at: now,
        // Set expiration to 24 hours from now
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const { error } = await supabaseAdmin
        .from('conversation_states')
        .upsert(stateWithTimestamp, { 
            onConflict: 'phone_number',
            ignoreDuplicates: false
        });

    if (error) {
        console.error('Error upserting conversation state:', error);
        return false;
    }

    return true;
}

// Delete conversation state (used when conversation is complete or abandoned)
export async function deleteConversationState(phoneNumber: string): Promise<boolean> {
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }

    const { error } = await supabaseAdmin
        .from('conversation_states')
        .delete()
        .eq('phone_number', phoneNumber);

    if (error) {
        console.error('Error deleting conversation state:', error);
        return false;
    }

    return true;
}

// Clear expired conversation states (can be called via cron job)
export async function clearExpiredConversationStates(): Promise<number> {
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return 0;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
        .from('conversation_states')
        .delete()
        .lt('expires_at', now)
        .select('id');

    if (error) {
        console.error('Error clearing expired conversation states:', error);
        return 0;
    }

    return data?.length || 0;
}

export async function uploadContacts(
    organizationId: string,
    contacts: Contact[]
): Promise<UploadResult> {
    return uploadContactsWithDuplicateCheck(organizationId, contacts, false);
}

/**
 * Updates an existing organization member
 */
export async function updateOrgMember(
    memberId: number,
    updates: Partial<Omit<OrgMember, 'id' | 'created_at'>>
): Promise<boolean> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }
    
    const { error } = await supabaseAdmin
        .from('org_members')
        .update(updates)
        .eq('id', memberId);

    if (error) {
        console.error('Error updating org member:', error);
        return false;
    }

    return true;
}

/**
 * Deletes an organization member
 */
export async function deleteOrgMember(memberId: number): Promise<boolean> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }
    
    const { error } = await supabaseAdmin
        .from('org_members')
        .delete()
        .eq('id', memberId);

    if (error) {
        console.error('Error deleting org member:', error);
        return false;
    }

    return true;
}

/**
 * Marks a user as opted out of receiving messages
 */
export async function markUserOptedOut(phoneNumber: string): Promise<boolean> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }
    
    // Format the phone number for consistent comparison
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Update all matching records across all organizations
    const { error } = await supabaseAdmin
        .from('org_members')
        .update({ opted_out: true })
        .eq('phone_number', formattedPhone);

    if (error) {
        console.error('Error marking user as opted out:', error);
        return false;
    }

    return true;
}

/**
 * Checks if a user has opted out of receiving messages
 */
export async function hasUserOptedOut(phoneNumber: string): Promise<boolean> {
    // Format the phone number for consistent comparison
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const { data, error } = await supabase
        .from('org_members')
        .select('opted_out')
        .eq('phone_number', formattedPhone)
        .eq('opted_out', true)
        .limit(1);

    if (error) {
        console.error('Error checking if user opted out:', error);
        return false;
    }

    return data && data.length > 0;
}

/**
 * Marks a user as opted back in to receiving messages
 */
export async function markUserOptedIn(phoneNumber: string): Promise<boolean> {
    // Ensure we have admin client
    if (!supabaseAdmin) {
        console.error('Admin client not available, SUPABASE_SERVICE_ROLE_KEY may be missing');
        return false;
    }
    
    // Format the phone number for consistent comparison
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Update all matching records across all organizations
    const { error } = await supabaseAdmin
        .from('org_members')
        .update({ opted_out: false })
        .eq('phone_number', formattedPhone);

    if (error) {
        console.error('Error marking user as opted in:', error);
        return false;
    }

    return true;
} 