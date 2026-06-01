# Databackup Web

A secure, scalable web application for company data backup and recovery. Built with React, Vite, TypeScript, Supabase, and Backblaze B2 Cloud Storage.

## Features

### Core Functionality
- **User Authentication**: Email/password signup and login via Supabase Auth
- **Role-Based Access**: Admin and department-based access control
- **Member Management**: Admins can view and manage platform members
- **File Upload**: Upload backup files to Backblaze B2 Cloud Storage
- **File Management**: View, download, and manage files
- **Dashboard**: View storage statistics and file counts

### Cloud Storage
- **Backblaze B2**: Secure, cost-effective cloud file storage
- **Automatic Organization**: Files organized by department and user ID
- **Public URLs**: Direct download links for authorized users
- **File Integrity**: SHA1 verification for all uploads

### Security
- Supabase Authentication for secure password handling
- Row Level Security (RLS) policies enforcing access control
- Department-based file organization and access
- Client-side input validation
- File size limits (100MB+ supported)
- Environment variables for all credentials
- B2 private bucket with encryption

### Additional Features
- **Toast Notifications**: Visual feedback for actions (success, error, warning)
- **Activity Logs**: Audit trail for uploads, downloads, logins, registrations
- **Storage Monitoring**: Real-time usage tracking
- **Admin Dashboard**: Activity logs and member management

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend Services**: Supabase (Auth, Database)
- **Cloud Storage**: Backblaze B2
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **Styling**: CSS3

## Quick Start

### Prerequisites
- Node.js 16+
- Supabase project (create at [supabase.com](https://supabase.com))
- Backblaze B2 account (create at [backblaze.com](https://backblaze.com))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CJmanuel/ryker.git
   cd ryker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_B2_APPLICATION_KEY_ID=your_b2_key_id
   VITE_B2_APPLICATION_KEY=your_b2_secret_key
   VITE_B2_BUCKET_ID=your_bucket_id
   VITE_B2_BUCKET_NAME=your_bucket_name
   VITE_B2_ENDPOINT=your_b2_endpoint
   ```

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
│   └── validators.ts     # Input validation
├── components/           # Reusable components
│   ├── Layout.tsx        # Sidebar + main content
│   ├── ProtectedRoute.tsx# Authentication guard
│   └── Sidebar.tsx       # Navigation
├── config/               # Configuration
│   ├── errorReporting.ts # Error handling
│   └── securityHeaders.ts# Security headers
├── context/              # React Context
│   └── AuthContext.tsx   # Global auth state
├── hooks/                # Custom React hooks
│   ├── useFileUpload.ts  # File upload to B2
│   └── useStorageQuota.ts# Storage monitoring
├── pages/                # Page components
│   ├── Login.tsx         # Authentication
│   ├── Register.tsx      # Signup
│   ├── Dashboard.tsx     # Statistics
│   ├── Files.tsx         # File management
│   ├── Upload.tsx        # File upload
│   └── AdminLogs.tsx     # Activity logs
├── services/             # External integrations
│   ├── b2Storage.ts      # B2 upload/download
│   ├── supabase.ts       # Supabase client
│   ├── activityLogger.ts # Activity logging
│   └── toastService.ts   # Notifications
├── App.tsx               # Route definitions
└── main.tsx              # Entry point

Configuration files:
├── .env.example          # Environment variables template
├── vite.config.ts        # Vite build config
├── tsconfig.json         # TypeScript config
├── VERCEL_DEPLOYMENT.md  # Deployment guide
└── package.json          # Dependencies
```

## Environment Variables

Required in `.env.local`:

### Supabase
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Backblaze B2
- `VITE_B2_APPLICATION_KEY_ID` - B2 application key ID
- `VITE_B2_APPLICATION_KEY` - B2 application secret key
- `VITE_B2_BUCKET_ID` - Your B2 bucket ID
- `VITE_B2_BUCKET_NAME` - Your B2 bucket name
- `VITE_B2_ENDPOINT` - B2 endpoint URL

Get these from:
- Supabase: [supabase.com/dashboard](https://supabase.com/dashboard)
- B2: [secure.backblaze.com/app_keys.htm](https://secure.backblaze.com/app_keys.htm)

## Deployment

### Deploy to Vercel

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

Quick steps:
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

Live app will be available at your Vercel URL.

## File Upload Process

1. User selects file and clicks upload
2. `useFileUpload` validates file size
3. File uploaded to B2 storage at `{department}/{userId}/{filename}`
4. B2 returns file ID and public download URL
5. Metadata saved to Supabase database
6. User receives confirmation notification

## Security

### Access Control
- Users can only upload/download their department's files
- Admins have access to all files
- Authentication required for all operations
- File paths include department for isolation

### Data Protection
- B2 bucket is private
- SHA1 integrity verification on uploads
- Supabase RLS enforces database access
- Credentials stored in environment variables only
- HTTPS for all communications

## Troubleshooting

### "B2 authentication failed"
- Verify `VITE_B2_APPLICATION_KEY` is correct
- Check key hasn't been revoked in B2 console
- Ensure key has file upload permissions

### "Supabase connection error"
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is valid
- Check Supabase project is active

### "Permission denied" on upload
- Verify user profile exists in Supabase
- Check user's department matches upload path
- Ensure B2 key has write permissions

### File appears in dashboard but won't download
- Check B2 bucket public access settings
- Verify download URL is correct
- Check user's internet connection

## Performance Tips

- Files are uploaded directly to B2 (fast)
- Metadata cached in browser
- Lazy loading for large file lists
- Vercel edge network for static assets

## Future Enhancements

- [ ] File versioning
- [ ] Batch operations
- [ ] Advanced search and filtering
- [ ] Email notifications
- [ ] File sharing links
- [ ] Encryption at rest
- [ ] Automated backups
- [ ] Storage alerts

## Support & Documentation

- **App Issues**: Check logs in browser DevTools (F12)
- **Supabase Docs**: https://supabase.com/docs
- **B2 Docs**: https://www.backblaze.com/b2/docs
- **React Docs**: https://react.dev
- **Vercel Docs**: https://vercel.com/docs

## License

Private project - All rights reserved

---

**Version**: 1.0.0  
**Last Updated**: 2026-06-01  
**Deployment**: Ready for Vercel
