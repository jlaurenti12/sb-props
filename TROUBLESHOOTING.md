# Troubleshooting Vercel Environment Variables

## Check These Things:

### 1. Verify Variables Are Set Correctly
- Go to Vercel → Your Project → Settings → Environment Variables
- Make sure all 7 variables are there
- Check that variable names match EXACTLY (case-sensitive):
  - `REACT_APP_FIREBASE_API_KEY` (not `REACT_APP_FIREBASE_APIKEY`)
  - `REACT_APP_FIREBASE_AUTH_DOMAIN`
  - `REACT_APP_FIREBASE_PROJECT_ID`
  - `REACT_APP_FIREBASE_STORAGE_BUCKET`
  - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
  - `REACT_APP_FIREBASE_APP_ID`
  - `REACT_APP_FIREBASE_MEASUREMENT_ID`

### 2. Check Environment Scope
- Each variable should be set for **Production** (or "All Environments")
- If you only set them for "Development", they won't work in production

### 3. Check Build Logs
- Go to Deployments → Click on your latest deployment
- Check the build logs for any errors
- Look for messages about environment variables

### 4. Clear Build Cache
- In Vercel, go to Settings → General
- Scroll down and click "Clear Build Cache"
- Then redeploy

### 5. Verify the Deployment Used the Variables
- In the build logs, you should see the variables being used
- If you see `undefined` values, the variables aren't being read

### 6. Double-Check Values
Make sure there are no extra spaces or quotes in the values:
- ✅ Correct: `AIzaSyAKi4SyS76B-zFOJvQS2N9vYrhxEkTm_Lw`
- ❌ Wrong: `"AIzaSyAKi4SyS76B-zFOJvQS2N9vYrhxEkTm_Lw"` (with quotes)
- ❌ Wrong: ` AIzaSyAKi4SyS76B-zFOJvQS2N9vYrhxEkTm_Lw ` (with spaces)

## Quick Test

Add this temporarily to your `firebase.js` to see what's being loaded:

```javascript
console.log('Environment check:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'SET' : 'MISSING',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
});
```

Then check the browser console on your deployed site to see if variables are loaded.
