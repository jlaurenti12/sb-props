# Setting Environment Variables in Vercel

## Step-by-Step Instructions

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com) and log in
   - Find your `sb-props` project

2. **Navigate to Environment Variables**
   - Click on your project
   - Go to **Settings** (top navigation)
   - Click **Environment Variables** in the left sidebar

3. **Add Each Variable**
   Click **Add New** for each of these:

   | Variable Name | Value |
   |--------------|-------|
   | `REACT_APP_FIREBASE_API_KEY` | `AIzaSyAKi4SyS76B-zFOJvQS2N9vYrhxEkTm_Lw` |
   | `REACT_APP_FIREBASE_AUTH_DOMAIN` | `sb-props-f7baa.firebaseapp.com` |
   | `REACT_APP_FIREBASE_PROJECT_ID` | `sb-props-f7baa` |
   | `REACT_APP_FIREBASE_STORAGE_BUCKET` | `sb-props-f7baa.appspot.com` |
   | `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `387011073698` |
   | `REACT_APP_FIREBASE_APP_ID` | `1:387011073698:web:06227c23977a853ea029fb` |
   | `REACT_APP_FIREBASE_MEASUREMENT_ID` | `G-EHK2RKBGY3` |

4. **Set Environment Scope**
   For each variable, select:
   - ✅ **Production**
   - ✅ **Preview** 
   - ✅ **Development**
   
   (Or just select "All Environments" if available)

5. **Save and Redeploy**
   - Click **Save** after adding all variables
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on your latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger a new deployment

## Important Notes

- Environment variables are embedded at **build time**
- You must **redeploy** after adding variables for them to take effect
- The `.env` file only works for local development (`npm start`)
- Variables are case-sensitive - make sure they match exactly

## Verify It's Working

After redeploying, check your deployed site. The Firebase error should be gone and the app should work normally.

## Troubleshooting

- **Still seeing errors?** Make sure you redeployed after adding the variables
- **Variables not showing?** Check that you saved them and they're set for the correct environment
- **Build failing?** Check the Vercel build logs for any errors
