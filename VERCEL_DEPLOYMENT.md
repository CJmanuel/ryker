# Vercel Deployment Guide

This guide explains how to deploy the Databackup Web application to Vercel.

## Prerequisites

1. **Vercel Account**: Create one at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be on GitHub (already done: `CJmanuel/ryker`)
3. **Environment Variables**: Have your `.env.local` values ready

## Deployment Steps

### Step 1: Connect GitHub Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select **"Import Git Repository"**
4. Search for and select `CJmanuel/ryker`
5. Click **"Import"**

### Step 2: Configure Environment Variables

In the Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add all required variables:

```env
VITE_SUPABASE_URL=https://jqnmpexkwiittimxtoov.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_B2_APPLICATION_KEY_ID=0051588bf27ac9d0000000001
VITE_B2_APPLICATION_KEY=your_b2_secret_key
VITE_B2_BUCKET_ID=21d5f8987bbf2479adc091d
VITE_B2_BUCKET_NAME=philmediabackup
VITE_B2_ENDPOINT=s3.us-east-005.backblazeb2.com
VITE_ENV=production
```

**Important**: Set environment for **Production**, **Preview**, and **Development** as needed.

### Step 3: Configure Build Settings

The default settings should work, but verify:

- **Framework Preset**: Vite (should auto-detect)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your app
3. Once complete, you'll get a deployment URL

## Post-Deployment Checklist

### ✅ Verify Environment Variables

After deployment, check that all env vars are correctly set:
- Go to **Settings** → **Environment Variables**
- Ensure all B2 and Supabase credentials are present

### ✅ Test File Uploads

1. Visit your Vercel deployment URL
2. Login with a test account
3. Try uploading a file
4. Verify file appears in B2 bucket: https://secure.backblaze.com/b2/buckets/

### ✅ Check CORS Settings (if needed)

If uploads fail with CORS errors:
1. The B2 bucket may need CORS configuration
2. Contact B2 support or check their documentation
3. Generally, Vercel domain should be whitelisted

### ✅ Monitor Logs

View deployment logs in Vercel:
- **Deployments** tab → Select latest deployment
- Click **"Logs"** to see build and runtime output
- Look for any errors related to B2 or Supabase

## Custom Domain Setup

To use a custom domain:

1. Go to **Settings** → **Domains**
2. Enter your custom domain
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (5-48 hours)

## Environment Variables by Environment

Set different values for different environments:

### Production
```env
VITE_ENV=production
VITE_B2_APPLICATION_KEY_ID=0051588bf27ac9d0000000001
```

### Preview/Staging
```env
VITE_ENV=staging
VITE_B2_APPLICATION_KEY_ID=0051588bf27ac9d0000000001
```

### Development (local)
```env
VITE_ENV=development
# Use local .env.local
```

## Troubleshooting

### Build Fails: "Module not found"

**Solution**: Clear cache and rebuild
```bash
# Local rebuild
npm install
npm run build
```

### 404 on Refresh

This is expected with React SPA. Vercel auto-configures routing for React apps.
If issues persist:
1. Go to **Settings** → **Git**
2. Ensure "Build & Development Settings" are correct
3. Redeploy

### B2 Upload Fails in Production

**Possible causes**:
1. Missing environment variable
2. CORS issues with B2
3. Incorrect key credentials

**Solution**:
1. Check logs: **Deployments** → **Logs**
2. Verify all env vars in Vercel settings
3. Test locally first: `npm run dev`

### Supabase Connection Issues

**Solution**:
1. Verify `VITE_SUPABASE_URL` is correct
2. Verify `VITE_SUPABASE_ANON_KEY` is valid
3. Check Supabase project is active
4. Check network requests in browser DevTools

## Monitoring & Analytics

Vercel provides:
- **Real-time logs**: See requests and errors
- **Analytics**: View page performance
- **Deployments**: Track all versions
- **Function logs**: Monitor API/middleware

Access these from your project dashboard.

## Rollback Previous Deployment

If something breaks:
1. Go to **Deployments**
2. Find the previous working deployment
3. Click **"..." → "Promote to Production"**

## Update & Redeploy

To redeploy after code changes:
1. Push changes to GitHub
2. Vercel auto-detects and rebuilds
3. Or manually click **"Redeploy"** in Vercel dashboard

## Performance Tips

- Vercel caches builds between deployments
- Use `npm run preview` locally to test production build
- Monitor bundle size: Check build logs for warnings
- Enable Vercel Analytics for performance insights

## Security Best Practices

1. **Never commit `.env.local`** - use Vercel's environment variables
2. **Rotate B2 keys regularly** - change `VITE_B2_APPLICATION_KEY` periodically
3. **Use strong Supabase passwords** - check Supabase security settings
4. **Enable 2FA on Vercel** - go to Settings → Account
5. **Review logs regularly** - monitor for suspicious activity

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Supabase Docs**: https://supabase.com/docs
- **B2 Docs**: https://www.backblaze.com/b2/docs/

---

**Deployment URL**: Will be provided by Vercel after deployment
**Custom Domain**: Configure in Vercel settings after deployment
