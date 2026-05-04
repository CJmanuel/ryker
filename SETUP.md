# Setup Instructions

## Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase project created

## Installation

1. Clone/download this repository
2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file based on `.env.example`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Configuration

### Firebase Firestore Rules
Deploy `firestore.rules` to your Firebase project.

### Firebase Storage Rules
Deploy `storage.rules` to your Firebase project.

### Create Collections
In Firebase Console, manually create these Firestore collections:
- `users` - stores user profiles
- `backups/{department}/files` - stores file metadata per department
- `logs` - stores activity log entries (optional, created automatically on first log)

## Features

### Core Functionality
- Email/password authentication with Firebase Auth
- Department-based access control
- File upload to Cloud Storage
- File list and download
- Dashboard with statistics

### Enhanced Features
- **Toast Notifications** - Visual feedback for all user actions (success/error/warning)
- **Activity Logging** - Complete audit trail tracking uploads, downloads, logins, and registrations
- **Admin Activity Viewer** - Accessible at `/admin/logs` for administrators to review logs
- **Storage Quota Monitoring** - Real-time usage tracking with visual progress bar and 80% capacity warning

## Running the App

Development:
```
npm run dev
```

Build for production:
```
npm run build
```

Preview production build:
```
npm run preview
```

## Features

### Authentication
- Email/password signup and login
- User profiles with department and role assignment
- Protected routes for authenticated users

### Dashboard
- Department information display
- Total file count and storage usage stats

### File Management
- Upload files to department-specific storage
- Download files via links
- View file metadata (name, upload date, size)
- Admin can see all departments' files

### Security
- Firebase Authentication ensures password security
- Firestore and Storage rules enforce department-based access
- Users can only access their department's data
- Admins can access all data

## Project Structure

```
src/
├── auth/              - authentication validators
├── components/        - reusable React components
│   ├── Layout.tsx     - shared sidebar + main layout
│   ├── ProtectedRoute.tsx - auth guard
│   └── Sidebar.tsx    - navigation sidebar
├── context/           - React Context for global state
│   └── AuthContext.tsx
├── hooks/             - custom React hooks
│   ├── useFileUpload.ts
│   ├── useFirebaseError.ts
│   └── useStorageQuota.ts
├── pages/             - page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Files.tsx
│   ├── Upload.tsx
│   └── AdminLogs.tsx
├── services/          - external service integration
│   ├── firebase.ts
│   ├── activityLogger.ts
│   └── toastService.ts
├── App.tsx            - main app with routes
├── App.css
├── main.tsx
├── index.css
├── vite.config.ts
└── tsconfig.json

firestore.rules       - Firestore security rules
storage.rules         - Cloud Storage security rules
.env.example          - environment variables template
```

## Security Considerations

1. **Authentication**: Firebase Auth handles credential security
2. **Database Access**: Firestore rules enforce role and department checks
3. **Storage Access**: Cloud Storage rules limit file access by department
4. **Environment Variables**: Never commit `.env.local`
5. **Input Validation**: Client-side validation in auth validators

## Future Enhancements

- File versioning (keep multiple versions of same filename)
- Password reset functionality
- Email verification
- Fine-grained permission system
- Advanced search and filtering (by date, file type, uploader)
- Batch operations (delete multiple files)
- User management dashboard for admins
- Export audit logs to CSV
- Automatic cleanup of old files (retention policies)
