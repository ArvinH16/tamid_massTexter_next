# AI Message Assistant Integration

This document provides instructions on how to set up and use the AI Message Assistant feature in the TAMID application.

## Setup Instructions

1. **Obtain an OpenAI API Key**
   - Go to [OpenAI's website](https://platform.openai.com/) and create an account if you don't have one
   - Navigate to the API section and create a new API key
   - Copy your API key

2. **Configure Environment Variables**
   - Create a `.env.local` file in the root directory of the project if it doesn't exist
   - Add the following line to the file:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```
   - Replace `your_openai_api_key_here` with your actual OpenAI API key

3. **Restart the Development Server**
   - Stop the current development server
   - Run `npm run dev` to restart the server with the new environment variables

## Features

The AI Message Assistant provides the following features:

1. **Message Improvement**
   - Enhance the language and structure of your messages
   - Make them more professional and engaging

2. **Message Rephrasing**
   - Get alternative phrasings while keeping the same meaning

3. **Message Expansion**
   - Add more details and context to your messages

4. **Message Shortening**
   - Condense your message while keeping essential information

5. **Tone Adjustment**
   - Make messages more formal or casual

6. **AI Message Generation**
   - Generate complete messages based on your description

7. **Message Suggestions**
   - Get multiple suggestions for your message

## Usage

1. **For Text Messages**
   - Navigate to the Mass Text System section
   - Enter your message in the text area
   - Click the "AI Assist" button to access AI features
   - Select the desired action from the dropdown menu

2. **For Email Messages**
   - Navigate to the Email Sender section
   - Enter your email message in the text area
   - Click the "AI Assist" button to access AI features
   - Select the desired action from the dropdown menu

3. **Using the AI Generator Tab**
   - Switch to the "AI Assistant" tab
   - Describe what you want to write about
   - Click "Generate Message" to create a complete message

## Troubleshooting

If you encounter any issues with the AI Message Assistant:

1. **Check API Key**
   - Ensure your OpenAI API key is correctly set in the `.env.local` file
   - Verify that the key has not expired

2. **Check Network Connection**
   - Ensure you have a stable internet connection
   - Check if OpenAI's API is accessible from your network

3. **Check Console for Errors**
   - Open the browser's developer tools
   - Look for any error messages in the console

## Limitations

- The AI Message Assistant uses the GPT-4o-mini model, which has certain limitations
- Response generation may take a few seconds depending on the complexity of the request
- There may be rate limits associated with your OpenAI API key 