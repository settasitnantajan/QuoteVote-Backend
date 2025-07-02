🔥 Backend
This project uses Firebase as the backend to handle real-time data and (optional) authentication.

Key responsibilities:

Database: Stores all quotes and their vote counts in Firestore (NoSQL).

Authentication (optional): Can be extended to allow users to sign in to prevent duplicate voting or manage submissions.

Real-time updates: Uses Firestore’s real-time listeners so vote counts update instantly for all users.

Hosting: Firebase Hosting can be used for static assets if needed (currently deployed on Vercel).

Firebase services used:

Firestore: Stores quotes as documents in a collection.

Firebase SDK: Handles CRUD operations (add, update, delete votes).

Authentication: (Optional) Google sign-in or anonymous auth for user-specific features.

quotes (collection)
 ├── {quoteId} (document)
      ├── text: "Example quote here"
      ├── votes: 5
      ├── createdAt: timestamp
      ├── author: "User123" (optional)

✅ Why Firebase?
Firebase is great for small to medium apps that need:

Real-time updates

Fast setup

Scalable NoSQL storage

Simple auth integration
