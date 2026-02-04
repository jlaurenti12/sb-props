# How to Deploy Firestore Security Rules

## Prerequisites

1. Install Firebase CLI locally (recommended):
```bash
npm install --save-dev firebase-tools
```

   **OR** install globally (requires sudo on Mac/Linux):
```bash
sudo npm install -g firebase-tools
```

2. Login to Firebase:
```bash
npx firebase login
```
   (or `firebase login` if installed globally)

3. Initialize Firebase in your project (if not already done):
```bash
npx firebase init firestore
```
   - Select your Firebase project
   - Choose to use existing `firestore.rules` file
   - Choose to use existing `firestore.indexes.json` (or create one)

## Deploy Security Rules

Deploy the security rules to Firebase:

```bash
npx firebase deploy --only firestore:rules
```
   (or `firebase deploy --only firestore:rules` if installed globally)

## Verify Rules Are Active

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Verify the rules match `firestore.rules` in your project

## Test Rules

Use the **Rules Playground** in Firebase Console:

1. Go to Firestore → Rules → Rules Playground
2. Test scenarios:
   - **Unauthenticated read**: Should fail
   - **Authenticated user reading questions**: Should succeed
   - **Non-admin creating question**: Should fail
   - **User reading own data**: Should succeed
   - **User reading other user's data**: Should fail (if rules prevent it)
   - **Admin operations**: Should succeed for admin users only

## Important Notes

- Rules are deployed immediately and affect all users
- Test thoroughly before deploying to production
- Keep a backup of your rules file
- Rules are version controlled in your repo

## Troubleshooting

If rules don't work:
1. Check Firebase Console for rule syntax errors
2. Verify you're logged in as the correct Firebase project
3. Check that `firestore.rules` file is in the project root
4. Ensure Firebase CLI is up to date: `firebase-tools --version`
