# Databackup Web

A secure, scalable web application for company data backup and recovery. Built with React, Vite, TypeScript, and Supabase.

## Features

### Core Functionality
- **User Authentication**: Email/password signup and login via Supabase Auth
- **Role-Based Access**: Admin-only access control - only administrators can use the platform
- **Member Management**: Admins can view and delete platform members
- **File Upload**: Upload backup files to Supabase Storage
- **File Management**: View, download, and manage files
- **Dashboard**: View storage statistics and file counts

### Security
- Supabase Authentication for secure password handling
- Row Level Security (RLS) policies enforcing access control
- Supabase Storage with proper bucket policies
- Client-side input validation in auth flows
- File size limits (100MB per file)
- Environment variables for Supabase credentials

### Additional Features
- **Toast Notifications**: Visual feedback for actions (success, error, warning)
- **Activity Logs**: Admin-only audit trail for uploads, downloads, logins, registrations
- **Storage Quota Monitoring**: Real-time usage tracking with 80% warning threshold
- **Admin Dashboard**: Activity logs and member management for administrators only

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend Services**: Supabase (Authentication, Database, Storage)
- **Routing**: React Router 6
- **Styling**: CSS3

## Quick Start

### Prerequisites
- Node.js 16+
- Supabase project (create at [supabase.com](https://supabase.com))

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in your Firebase credentials.

4. Deploy security rules:
   - Copy contents of `firestore.rules` to Firestore Rules in Firebase Console
   - Copy contents of `storage.rules` to Storage Rules in Firebase Console

5. Create Firestore collections (manually in console):
   - `users` - stores user profiles
   - `backups/{department}/files` - stores file metadata per department

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── auth/                 # Authentication utilities
│   └── validators.ts     # Input validation (email, password, username)
├── components/           # Reusable components
│   ├── Layout.tsx        # Sidebar + main content layout
│   ├── ProtectedRoute.tsx# Authentication guard
│   └── Sidebar.tsx       # Navigation and logout
├── context/              # React Context
│   └── AuthContext.tsx   # Global auth state & user profile
├── hooks/                # Custom React hooks
│   ├── useFileUpload.ts  # File upload logic with validation
│   ├── useFirebaseError.ts# Firebase error formatting
│   └── useStorageQuota.ts# Storage usage monitoring
├── pages/                # Page components
│   ├── Login.tsx         # Email/password login
│   ├── Register.tsx      # Signup with department & role
│   ├── Dashboard.tsx     # Statistics and file count with quota warning
│   ├── Files.tsx         # File list and download
│   ├── Upload.tsx        # File upload interface
│   └── AdminLogs.tsx     # Activity logs viewer (admin only)
├── services/             # External integrations
│   ├── firebase.ts       # Firebase initialization
│   ├── activityLogger.ts # Activity logging service
│   └── toastService.ts   # Toast notification service
├── App.tsx               # Route definitions
├── App.css               # Layout and page styles
├── index.css             # Global and form styles
└── main.tsx              # React entry point

firestore.rules          # Firestore access control
storage.rules            # Cloud Storage access control
.env.example             # Environment variables template
```

## Key Concepts

### Authentication Flow
1. User registers with email, password, department, and role
2. Firebase Auth creates secure credentials (hashed passwords)
3. User profile stored in Firestore `users/{uid}`
4. AuthContext watches auth state and fetches user profile
5. ProtectedRoute checks if user is authenticated

### Department-Based Access
- Files stored at `storage: /backups/{department}/{userId}/{filename}`
- Metadata stored at `firestore: backups/{department}/files/{fileId}`
- Firestore rules check `request.auth.token.department` matches
- Admin users bypass department checks

### File Upload Process
1. User selects file and clicks upload
2. `useFileUpload` validates file size
3. File uploaded to Cloud Storage at department path
4. Download URL obtained and metadata saved to Firestore
5. User receives success/error notification

## Security Rules

### Firestore Rules
- Users can only read profiles (their own or admin access)
- Only authenticated users can create backups in their department
- Only admins can delete files
- Collection group queries allow admins to see all files

### Storage Rules
- Files stored under `backups/{department}/{userId}/`
- Read allowed if user's department matches or user is admin
- Write allowed only for user's department
- Delete allowed only for admins

## Environment Variables

Required in `.env.local`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Get these from Firebase Console → Project Settings.

## Future Enhancements

- File versioning (keep multiple versions of same filename)
- Activity logs (uploads, downloads, deletions)
- Storage usage alerts (80%+ warnings)
- Password reset functionality
- Email verification
- Advanced search and filtering
- Batch operations (delete multiple files)
- User management dashboard for admins
- Export audit logs to CSV

## Troubleshooting

### "Firebase config not found"
- Ensure `.env.local` exists with all Firebase credentials
- Verify Vite environment variables start with `VITE_`

### "Permission denied" on file upload
- Check `storage.rules` is deployed to Firebase
- Verify user's department matches storage path
- Check user profile exists in Firestore

### "Cannot read property 'role' of null"
- User profile not found in Firestore
- Create user profile in `users/{uid}` collection
- Check AuthContext correctly fetches profile

## Support

For Firebase issues, see [Firebase Documentation](https://firebase.google.com/docs).

For React/TypeScript questions, see [React Docs](https://react.dev) and [TypeScript Docs](https://www.typescriptlang.org/docs).
