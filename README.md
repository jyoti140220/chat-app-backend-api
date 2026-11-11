# Chat Backend (Node.js + TypeScript + MySQL + Firebase Firestore)

- **MySQL**: users and chats (relational data)
- **Firestore**: messages, read receipts, last-seen tracking

## Setup
1. `npm install`
2. Create the DB and tables: `mysql -u root -p < schema.sql`
3. Firebase console -> Firestore Database -> create. Project settings -> Service accounts -> generate key, save as `serviceAccountKey.json` in the project root (never commit it).
4. `cp .env.example .env` and fill in the MySQL password.
5. `npm run dev` (server on http://localhost:3000)

## Firestore layout
```
chats/{chatId}/messages/{messageId}  { senderId, text, createdAt, readBy: { userId: timestamp } }
chats/{chatId}/lastSeen/{userId}     { messageId, updatedAt }
```

## APIs
| # | Method & path | Body | Result |
|---|---|---|---|
| 1 | POST /chat/create | `{userAId, userBId}` | `{chatId}` (existing chat returned if present) |
| 2 | POST /chat/:chatId/message/send | `{senderId, text}` | `{messageId}` |
| 3 | GET /chat/:chatId/messages?limit=50 | - | `{messages}` ordered by timestamp |
| 4 | POST /chat/:chatId/message/:messageId/read | `{userId}` | `{success}` |
| 5 | POST /chat/:chatId/lastseen | `{userId, messageId}` | `{success}` |
| 6 | GET /user/:userId/chats | - | `{chats:[{chatId, memberIds, createdAt}]}` |
| Bonus | PATCH /chat/:chatId/message/:messageId | `{userId, text}` | edit (sender only) |
| Bonus | DELETE /chat/:chatId/message/:messageId | `{userId}` | delete (sender only) |

Only chat members can send, read, or update last-seen. Chat pairs are stored with `user_a_id < user_b_id` plus a unique key, so a pair never gets duplicate chats.

## Testing without a real Firebase project (Firestore emulator)
Needs Java 21+. In one terminal: `npx firebase emulators:start --only firestore --project demo-chat`.
In another: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-chat npm run dev`.

Note: TypeScript is pinned to 5.x (ts-node-dev does not work with TypeScript 7).
