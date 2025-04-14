# TAMID Mass Text System

A Next.js application for sending mass text messages to contacts from a CSV file.

## Features

- Upload CSV files with contact information
- Send personalized text messages to multiple contacts
- Track daily message limits
- Access code protection
- Real-time feedback on message sending status

## Prerequisites

- Node.js 18+ or Bun
- Twilio account with API credentials

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   # Twilio credentials
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Access code for the application
   ACCESS_CODE=TAMID2024

   # Daily message limit
   DAILY_MESSAGE_LIMIT=100
   ```
4. Replace the placeholder values with your actual Twilio credentials and desired access code.

## Running the Application

### Development

```bash
bun run dev
```

### Production

```bash
bun run build
bun run start
```

## CSV Format

The application expects a CSV file with the following columns:
- `name` (or `firstName`, `first_name`): The contact's name
- `phone` (or `phoneNumber`, `phone_number`, `mobile`): The contact's phone number

Example:
```
name,phone
John Doe,+1234567890
Jane Smith,+0987654321
```

## Message Personalization

You can personalize messages by including `{name}` in your message text. This will be replaced with the contact's name when the message is sent.

Example: "Hi {name}! Welcome to TAMID!"

## Daily Message Limit

The application tracks the number of messages sent per day and enforces a daily limit. The limit resets at midnight UTC.

## License

This project is proprietary and confidential.
