# SMS Opt-Out Setup Guide

This guide explains how to set up SMS opt-out functionality for your TAMID mass text system to comply with 10DLC regulations.

## Database Setup

You need to add an `opted_out` column to the `org_members` table in your Supabase database. 

### Option 1: Using Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query and paste the following SQL:

```sql
-- Add opted_out column to org_members table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'org_members' 
    AND column_name = 'opted_out'
  ) THEN 
    ALTER TABLE org_members 
    ADD COLUMN opted_out BOOLEAN DEFAULT FALSE;
    
    -- Add an index to improve performance when filtering by opted_out
    CREATE INDEX idx_org_members_opted_out ON org_members (opted_out);
  END IF;
END $$;
```

4. Run the query

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db execute -f src/scripts/add-opted-out-column.sql
```

## Functionality Added

The following functionality has been implemented:

1. **Opt-out Message**: Every mass text now automatically includes "Reply QUIT to stop receiving messages" at the end.

2. **Handling Opt-out Keywords**: Users can opt out by replying with any of these keywords:
   - QUIT
   - STOP
   - CANCEL
   - UNSUBSCRIBE
   - END
   - OPTOUT

3. **Opting Back In**: Users can opt back in by texting:
   - START
   - YES
   - UNSTOP
   - OPTIN

4. **Automatic Filtering**: The system automatically skips sending messages to users who have opted out.

## Twilio's Automatic Opt-Out Handling

Twilio has its own automatic opt-out handling for SMS. When a user texts **STOP** to a Twilio number:

1. Twilio automatically marks the user as opted out in their system
2. Twilio blocks any further outgoing messages to that user
3. Twilio sends an automatic response like "You have been unsubscribed"

Our system is designed to work with Twilio's built-in opt-out handling:

1. We detect when a user texts "STOP" and mark them as opted out in our database
2. We don't attempt to send a confirmation message for "STOP" commands (since Twilio already does this)
3. For other opt-out keywords like "QUIT" or "UNSUBSCRIBE", we handle the opt-out in our system and send a confirmation

**Important:** If a user has texted "STOP" directly to Twilio, you'll need to use Twilio's REST API to opt them back in before you can send them messages again. This is a Twilio requirement and cannot be bypassed by our system.

### Troubleshooting

If you see error messages like "Attempt to send to unsubscribed recipient" in your logs, this indicates that Twilio has blocked the message because the recipient previously sent a "STOP" command. These users will also be marked as opted out in your database.

## Testing

To test the functionality:

1. Send a mass text to a test number
2. Reply with "QUIT" from that number
3. Verify you receive a confirmation message
4. Send another mass text and verify the opted-out number doesn't receive the message
5. Reply with "START" from the opted-out number
6. Verify you receive a confirmation message
7. Send another mass text and verify the number now receives messages again

## Compliance Information

This implementation helps comply with 10DLC regulations by:

1. Providing a clear opt-out mechanism for recipients
2. Honoring opt-out requests promptly
3. Allowing users to easily opt back in
4. Including required opt-out instructions in every message

For more information on 10DLC compliance, visit the [Twilio 10DLC Guidelines](https://support.twilio.com/hc/en-us/articles/1260803225570-Content-Guidelines-and-Best-Practices-for-10DLC-A2P-SMS-Messaging). 