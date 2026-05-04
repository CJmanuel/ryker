# Deployment Guide

## Firebase Hosting Deployment

### Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)

### Steps

1. **Initialize Firebase (if not already done):**
   ```bash
   firebase init hosting
   ```
   When prompted:
   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Deploy to Firebase Hosting:**
   ```bash
   firebase deploy --only hosting
   ```

4. **Optionally deploy security rules:**
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

5. **View your live application:**
   Your site is now live at: `https://YOUR-PROJECT-ID.web.app`

### Deploy Rules Only (without hosting)

If you've already deployed the app and only need to update security rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Rollback Deployment

To view deployment history:
```bash
firebase hosting:channel:list
```

To rollback to a previous version:
```bash
firebase hosting:rollback
```

## Environment Variables in Production

Ensure `.env.local` is in your `.gitignore` to prevent accidental commits.

For production, set environment variables in your Firebase Console or CI/CD pipeline:
- Set them in your build process before running `npm run build`
- Vite will automatically load them from `import.meta.env.VITE_*`

## Monitoring

After deployment:
1. Check Firebase Console for:
   - Real-time database/Firestore usage
   - Authentication metrics
   - Storage usage
   - Cloud functions execution (if added)

2. Monitor any errors in:
   - Browser console (F12)
   - Firebase Console > Functions > Logs
   - Cloud Logging

## Performance Optimization

To reduce chunk sizes (if needed in future):

1. Enable code splitting in `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
      }
    }
  }
}
```

2. Install `compression` plugin for gzip:
```bash
npm install compression
```

## Continuous Deployment (Optional)

Set up GitHub Actions or similar CI/CD to auto-deploy on push:

1. Create `.github/workflows/deploy.yml`
2. Add Firebase token as secret
3. Run build and deploy on push to main branch

Example workflow available in [Firebase documentation](https://firebase.google.com/docs/hosting/github-integration).
