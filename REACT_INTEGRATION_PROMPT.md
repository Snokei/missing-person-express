# React Integration Prompt for RAG Chatbot

Copy and paste the following prompt into an AI assistant (like Cline, ChatGPT, etc.) to generate a complete React chatbot component.

---

## Prompt

```
I have a RAG chatbot backend running at:

POST http://localhost:3000/api/chat

Request format:
{
  "message": "Where was Rahul last seen?"
}

Response format:
{
  "answer": "Rahul was last seen at Tower Chowk, Ujjain on 14 June 2026."
}

Error response format:
{
  "error": "Bad Request",
  "message": "A valid 'message' field is required."
}

I need you to create a complete React chatbot component with the following requirements:

## Tech Stack
- React (functional components with hooks)
- CSS (no external UI library - use plain CSS)
- Fetch API for HTTP calls

## Requirements

### 1. ChatBot Component
Create a `ChatBot.jsx` component that:
- Has a floating chat bubble button in the bottom-right corner
- Clicking the bubble opens a chat window (modal/overlay)
- The chat window has:
  - A header with "Missing Person Chatbot" title and a close button
  - A scrollable message area showing chat history
  - An input field at the bottom with a send button
- Messages are displayed as:
  - User messages: right-aligned, blue background, white text
  - Bot messages: left-aligned, gray background, dark text
- Show a typing indicator ("..." or a small animation) while waiting for the API response
- Handle errors gracefully - show error messages in the chat
- Auto-scroll to the latest message
- Press Enter to send, or click the send button

### 2. State Management
- Use useState for: messages array, input value, loading state, chat window open/closed
- Each message object: { id, text, sender: 'user' | 'bot', timestamp }

### 3. API Integration
- Send POST request to http://localhost:3000/api/chat
- Handle loading states
- Handle network errors
- Handle API errors (400, 500, etc.)

### 4. Styling
- The chat bubble button: 60px circle, blue (#1976d2), white chat icon, shadow
- Chat window: 380px wide, 550px max height, rounded corners, shadow
- Responsive: on mobile (< 480px), the chat window should be full-width with 100vw and 100vh
- Smooth transitions for opening/closing
- Typing indicator animation (3 bouncing dots)
- Scrollbar styling

### 5. File Structure
Create these files:
- src/components/ChatBot/ChatBot.jsx
- src/components/ChatBot/ChatBot.css
- src/components/ChatBot/ChatMessage.jsx (optional, for individual message rendering)
- src/App.js (integrate the ChatBot component)

### 6. Code Quality
- Use async/await
- Add comments
- Clean, readable code
- No TypeScript

Generate the complete code for all files.
```

---

## Expected Output

The AI should generate:

1. **`src/components/ChatBot/ChatBot.jsx`** - Main chatbot component with:
   - Floating action button
   - Chat window overlay
   - Message list
   - Input area
   - API integration
   - Typing indicator

2. **`src/components/ChatBot/ChatBot.css`** - All styles including:
   - FAB button styling
   - Chat window layout
   - Message bubbles
   - Typing animation
   - Responsive design
   - Scrollbar customization

3. **`src/App.js`** - Simple wrapper that renders the ChatBot component

## Integration Steps After Generation

1. Place the generated files in your React project's `src/components/ChatBot/` folder
2. Import and render `<ChatBot />` in your main `App.js` or any page component
3. Make sure your backend server is running on port 3000
4. If your backend is on a different port/domain, update the API URL in `ChatBot.jsx`

## Customization Options

- **Change API URL**: Update the `API_URL` constant in `ChatBot.jsx`
- **Change colors**: Modify CSS variables in `ChatBot.css`
- **Add authentication**: Add `Authorization` header in the fetch call if your API requires it
- **Add suggestions**: Add quick reply buttons for common questions