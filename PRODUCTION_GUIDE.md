# Production Deployment & Readiness Guide

This guide covers deploying the Databackup Web application to production with enterprise-grade security, monitoring, and backup strategies.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Security Hardening](#security-hardening)
3. [Backup & Recovery Strategy](#backup--recovery-strategy)
4. [Error Reporting & Monitoring](#error-reporting--monitoring)
5. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
6. [Performance Optimization](#performance-optimization)
7. [Compliance & Audit](#compliance--audit)

---

## Pre-Deployment Checklist

- [ ] All environment variables configured in Firebase
- [ ] Security rules tested and deployed
- [ ] HTTPS enabled (automatic with Firebase Hosting)
- [ ] Rate limiting configured
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting set up
- [ ] Error reporting integration complete
- [ ] SSL/TLS certificate valid
- [ ] Database indexed for common queries
- [ ] API rate limits configured
- [ ] Logging and audit trails enabled
- [ ] Data retention policies set

---

## Security Hardening

### 1. Enable HTTPS (Automatic with Firebase Hosting)
Firebase Hosting automatically provides HTTPS with Auto-managed SSL certificates.

**Verify HTTPS:**
```bash
curl -I https://your-project.web.app
```

### 2. Content Security Policy (CSP)

Add to `firebase.json` under hosting.headers:
```json
{
  "source": "**",
  "headers": [
    {
      "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self' https://apis.google.com; style-src 'self' 'unsafe-inline'; frame-src 'self' https://*.firebase.com"
    }
  ]
}
```

See `src/config/securityHeaders.ts` for complete CSP configuration.

### 3. Other Security Headers

Update `firebase.json`:
```json
{
  "source": "**",
  "headers": [
    {
      "key": "Strict-Transport-Security",
      "value": "max-age=31536000; includeSubDomains; preload"
    },
    {
      "key": "X-Content-Type-Options",
      "value": "nosniff"
    },
    {
      "key": "X-Frame-Options",
      "value": "SAMEORIGIN"
    },
    {
      "key": "Referrer-Policy",
      "value": "strict-origin-when-cross-origin"
    }
  ]
}
```

### 4. Authentication & Session Security

- ✅ Firebase Auth handles token management
- ✅ Tokens automatically expire after 1 hour
- ✅ Refresh tokens for extended sessions
- ✅ Session stored only in memory (not localStorage for auth tokens)

### 5. Environment Variables

Create `.env.production` with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Never commit `.env.production` to version control.**

---

## Backup & Recovery Strategy

### 1. Automatic Firestore Backups

**Via Google Cloud Console:**
```bash
# Export Firestore database
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d_%H%M%S)

# Restore from backup
gcloud firestore import gs://your-bucket/backup-20240101_120000
```

**Scheduled via Cloud Scheduler:**
Create a Cloud Scheduler job that runs daily:
```bash
gcloud scheduler jobs create app-engine backup-firestore \
  --schedule="0 2 * * *" \
  --time-zone="UTC" \
  --http-method=POST \
  --uri="https://region-PROJECT_ID.cloudfunctions.net/backupFirestore"
```

### 2. Storage Bucket Backups

Enable versioning on Cloud Storage bucket:
```bash
gsutil versioning set on gs://your-bucket
```

### 3. Database Replication

For production, enable:
- **Firestore multi-region replication** (in Firestore settings)
- **Cloud Storage cross-region replication**

### 4. Manual Backup Procedure

```bash
# Backup Firestore
firebase firestore:delete --all --yes

# Restore from backup
gcloud firestore import gs://your-bucket/backup-20240101_120000

# Backup Storage
gsutil -m cp -r gs://prod-bucket/* gs://backup-bucket/
```

### 5. Backup Retention Policy

- Daily backups: keep for 30 days
- Weekly backups: keep for 90 days
- Monthly backups: keep indefinitely
- Test restore procedure monthly

---

## Error Reporting & Monitoring

### 1. Firebase Crashlytics

Enable in Firebase Console, then add to your app:

```typescript
// In src/context/AuthContext.tsx or main.tsx
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAnalytics } from 'firebase/analytics';

const app = initializeApp(firebaseConfig);

// Initialize App Check
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_KEY),
  isTokenAutoRefreshEnabled: true,
});

// Initialize Analytics
getAnalytics(app);
```

### 2. Sentry Integration (Alternative/Additional)

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 3. Custom Error Tracking

Use `src/config/errorReporting.ts`:

```typescript
import { reportError } from '../config/errorReporting';

try {
  // your code
} catch (error) {
  reportError(error, {
    userId: user.uid,
    page: 'Campaigns',
    action: 'create_campaign',
  });
}
```

### 4. Performance Monitoring

Track key metrics:
- Page load time
- API response times
- Upload/download speeds
- User interaction latency

---

## CI/CD Pipeline Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main, production]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test -- --run

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          # ... other env vars

      - name: Deploy to Firebase
        if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/production'
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
          channelId: live
```

### GitLab CI/CD Example

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:18
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 day

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run lint
    - npm run test -- --run
  coverage: '/Lines\s*:\s*(\d+.\d+)%/'

deploy:
  stage: deploy
  image: node:18
  script:
    - npm install -g firebase-tools
    - firebase deploy --token $FIREBASE_TOKEN --project $FIREBASE_PROJECT_ID
  only:
    - main
    - production
  environment:
    name: production
```

### Setup Service Account for CI/CD

```bash
# Generate service account key
firebase_project_id=your-project-id
gcloud iam service-accounts create firebase-deploy \
  --project=$firebase_project_id

gcloud projects add-iam-policy-binding $firebase_project_id \
  --member="serviceAccount:firebase-deploy@$firebase_project_id.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

gcloud iam service-accounts keys create firebase-key.json \
  --iam-account=firebase-deploy@$firebase_project_id.iam.gserviceaccount.com

# Add to CI/CD secrets with name: FIREBASE_SERVICE_ACCOUNT
cat firebase-key.json | base64
```

---

## Performance Optimization

### 1. Code Splitting

Update `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
});
```

### 2. Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

// In your route:
<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>
```

### 3. Database Indexing

Create indexes for common queries in Firestore Console:
- `campaigns`: index on `department` + `status`
- `clients`: index on `department` + `createdAt`
- `budgets`: index on `department` + `amount`

### 4. Caching Strategy

- Static assets: 1 year cache (handled by Firebase)
- HTML: no-cache
- API responses: cache with stale-while-revalidate

---

## Compliance & Audit

### 1. GDPR Compliance

- [ ] Data deletion on request
- [ ] Data export functionality
- [ ] Privacy policy published
- [ ] Terms of service updated
- [ ] Consent for analytics enabled

Implement data deletion:
```typescript
export const deleteUserData = async (userId: string) => {
  // Delete user profile
  await deleteDoc(doc(firestore, 'users', userId));
  
  // Delete user's files
  const filesRef = ref(storage, `backups/${userId}`);
  // Delete all files recursively
  
  // Delete user's activity logs
  const logsQuery = query(collection(firestore, 'logs'), 
    where('userId', '==', userId));
  const logsSnapshot = await getDocs(logsQuery);
  logsSnapshot.forEach(doc => deleteDoc(doc.ref));
};
```

### 2. SOC 2 Compliance

- ✅ Audit trails enabled (activity logs)
- ✅ Authentication & MFA support (via Firebase Auth)
- ✅ Encryption in transit (HTTPS)
- ✅ Encryption at rest (Firebase default)
- ✅ Access controls (department-based rules)
- ✅ Regular backups
- ✅ Incident response plan

### 3. Data Retention Policy

Set in Firestore console:
- Activity logs: 90 days
- User profiles: Until account deletion
- Files: Based on subscription/plan
- Backups: See backup retention policy above

### 4. Audit Trail Queries

Admins can view complete audit via Activity Logs page, which shows:
- User actions
- Resource changes
- Failed operations
- Data exports
- Settings changes

---

## Deployment Checklist

```bash
# 1. Update version
npm version minor  # or patch, major

# 2. Build for production
npm run build

# 3. Test build
npm run preview

# 4. Test security rules
npm run test:rules

# 5. Deploy to Firebase
firebase deploy --only hosting,firestore:rules,storage:rules

# 6. Verify deployment
open https://your-project.web.app

# 7. Monitor for errors
# Check Firebase Console > Crashlytics & Analytics
```

---

## Post-Deployment Monitoring

### Daily Checks
- [ ] Check error logs for new issues
- [ ] Review user activity for anomalies
- [ ] Verify all services are responding
- [ ] Check disk/storage usage

### Weekly Review
- [ ] Backup integrity check
- [ ] Performance metrics review
- [ ] Security alerts review
- [ ] User feedback/support tickets

### Monthly Audit
- [ ] Full security audit
- [ ] Compliance checklist review
- [ ] Cost optimization review
- [ ] Capacity planning

---

## Emergency Procedures

### Data Recovery
```bash
# Restore from backup
gcloud firestore import gs://backup-bucket/backup-20240101_120000
```

### Service Degradation
- Switch to read-only mode (update rules temporarily)
- Activate fallback UI
- Communicate with users
- Prepare rollback plan

### Security Incident
1. Isolate affected components
2. Revoke compromised tokens
3. Review audit logs
4. Notify stakeholders
5. Implement fixes
6. Deploy to production
7. Post-incident review

---

For more information, see:
- [Firebase Documentation](https://firebase.google.com/docs)
- [OWASP Security Guidelines](https://owasp.org)
- [CWE Top 25](https://cwe.mitre.org/top25/)
