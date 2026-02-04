# Setting Environment Variables for Production Deployment

When you deploy your app to production, the `.env` file is **not** included in the build. You need to set environment variables in your hosting platform.

## Common Hosting Platforms

### Vercel

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project → **Settings** → **Environment Variables**
3. Add each variable:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`
   - `REACT_APP_FIREBASE_MEASUREMENT_ID`
4. Set them for **Production**, **Preview**, and **Development** environments
5. **Redeploy** your app (Vercel will automatically rebuild)

### Netlify

1. Go to your site in [Netlify Dashboard](https://app.netlify.com/)
2. Click **Site settings** → **Environment variables**
3. Click **Add a variable** and add each one
4. **Trigger a new deploy** (or push a commit)

### Firebase Hosting

If using Firebase Hosting, you can:
1. Set environment variables in your CI/CD pipeline
2. Or use a `.env.production` file (but this gets committed, so less secure)
3. Or use Firebase Functions to proxy requests (more complex)

### Other Platforms

Most platforms have an "Environment Variables" or "Config Vars" section in their dashboard. Look for:
- **Heroku**: Settings → Config Vars
- **Railway**: Variables tab
- **Render**: Environment section
- **GitHub Pages**: Not supported (use Vercel/Netlify instead)

## Quick Fix: Temporary Fallback (Development Only)

If you're testing a production build locally, you can temporarily add fallback values in `firebase.js`. **This is NOT recommended for production** - only use for local testing.

## Important Notes

- Environment variables are embedded at **build time**, not runtime
- After setting env vars in your hosting platform, you **must rebuild/redeploy**
- The `.env` file only works for `npm start` (development)
- Never commit `.env` files with real credentials to git

## Your Current Values

From your `.env` file:
```
REACT_APP_FIREBASE_API_KEY=AIzaSyAKi4SyS76B-zFOJvQS2N9vYrhxEkTm_Lw
REACT_APP_FIREBASE_AUTH_DOMAIN=sb-props-f7baa.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=sb-props-f7baa
REACT_APP_FIREBASE_STORAGE_BUCKET=sb-props-f7baa.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=387011073698
REACT_APP_FIREBASE_APP_ID=1:387011073698:web:06227c23977a853ea029fb
REACT_APP_FIREBASE_MEASUREMENT_ID=G-EHK2RKBGY3
```

Copy these values into your hosting platform's environment variables section.
