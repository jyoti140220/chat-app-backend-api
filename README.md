
# Chat App Backend API

A REST API for a one-to-one chat application built using Node.js, Express.js, TypeScript, MySQL, and Firebase Firestore.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MySQL
- Firebase Admin SDK
- Cloud Firestore
- Zod (Request Validation)

## Project Overview

This application supports one-to-one conversations between users.

The backend uses two databases:

### MySQL

MySQL stores relational data:

- User information
- Chat details
- Chat participants

### Firebase Firestore

Firestore stores chat-related data:

- Messages
- Message read receipts
- Last seen information

## Project Structure

```text
chat-app-backend-api/
│
├── src/
│   ├── routes/
│   │   ├── chat.ts
│   │   └── user.ts
│   │
│   ├── db.ts
│   ├── firebase.ts
│   ├── index.ts
│   └── utils.ts
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── schema.sql
└── tsconfig.json
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/jyoti140220/chat-app-backend-api.git
cd chat-app-backend-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure MySQL

Make sure MySQL Server is running.

Create the database and tables by executing:

```sql
SOURCE C:/path/to/chat-app-backend-api/schema.sql;
```

Update the database credentials in the `.env` file.

### 4. Configure Firebase

1. Open Firebase Console.
2. Create or select your Firebase project.
3. Enable Cloud Firestore.
4. Go to Project Settings → Service Accounts.
5. Configure Firebase Admin SDK credentials securely.

Never commit Firebase service account credentials to GitHub.

### 5. Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=chatdb

GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

Keep `.env` and service account credentials private.

### 6. Run the application

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Production:

```bash
npm start
```

Server runs at:

http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /health | Check server status |
| POST | /chat/create | Create a one-to-one chat |
| POST | /chat/:chatId/message/send | Send a message |
| GET | /chat/:chatId/messages | Fetch chat messages |
| POST | /chat/:chatId/message/:messageId/read | Mark message as read |
| POST | /chat/:chatId/lastseen | Update last seen |
| GET | /user/:userId/chats | Get user's chat list |
| PATCH | /chat/:chatId/message/:messageId | Edit a message |
| DELETE | /chat/:chatId/message/:messageId | Delete a message |

## Example API Requests

### Create Chat

POST `/chat/create`

```json
{
  "userAId": 1,
  "userBId": 2
}
```

### Send Message

POST `/chat/1/message/send`

```json
{
  "senderId": 1,
  "text": "Hello!"
}
```

### Mark Message as Read

POST `/chat/1/message/MESSAGE_ID/read`

```json
{
  "userId": 2
}
```

### Edit Message

PATCH `/chat/1/message/MESSAGE_ID`

```json
{
  "userId": 1,
  "text": "Updated message"
}
```

## Database Design

### MySQL Tables

**users**

Stores user information.

**chats**

Stores one-to-one chat relationships between users.

A unique constraint prevents duplicate chat records for the same user pair.

### Firestore Collections

```text
chats/
  {chatId}/
    messages/
      {messageId}
    lastSeen/
      {userId}
```

## Error Handling and Validation

- Zod validates incoming request data.
- Parameterized SQL queries are used.
- Async errors are forwarded to Express error middleware.
- Chat membership checks are implemented in selected chat operations.

## Important Security Notes

This is a learning/demo backend and does not yet implement production authentication.

User IDs are currently accepted from request parameters or request bodies. These should be replaced with authenticated user identity before production use.

Access control must be enforced consistently across all chat and message operations.

## License

ISC
