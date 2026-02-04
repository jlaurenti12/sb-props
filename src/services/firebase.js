import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  setDoc,
  getDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Debug: Log environment variable status (remove after fixing)
if (process.env.NODE_ENV === 'production') {
  console.log('Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
    hasAllVars: Object.values(firebaseConfig).every(v => v !== undefined)
  });
}

// Validate that environment variables are loaded
if (!firebaseConfig.apiKey) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMsg = isDevelopment
    ? 'Firebase API key is missing. Make sure .env file exists in the project root and restart the dev server (npm start).'
    : 'Firebase API key is missing in production build. Set environment variables in your hosting platform (Vercel/Netlify/etc). See DEPLOYMENT_ENV_VARS.md for instructions.';
  
  console.error('Firebase Config:', firebaseConfig);
  console.error(errorMsg);
  throw new Error(`Firebase configuration error: ${errorMsg}`);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    const q = doc(db, "users", user.uid);
    const docs = await getDoc(q);
    if (!docs.exists()) {
      const userData = {
        uid: user.uid,
        name: user.displayName,
        authProvider: "google",
        email: user.email,
        takenQuiz: false,
        isAdmin: false,
      };
      await setDoc(q, userData);
    }
    return true;
  } catch (err) {
    console.error(err);
    //alert(err.message);
    alert('Something happened with google login');
    return false;
  }
};

const logInWithEmailAndPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const registerWithEmailAndPassword = async (name, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
     await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      authProvider: "local",
      email,
      takenQuiz: false,
      isAdmin: false,
    });
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

// const updateStatus = async (user) => {
//   try {   
//     const q = query(collection(db, "users"), where("uid", "==", user?.uid));
//     const data = await getDocs(q);
//     const id = data.docs[0].id;

//     await updateDoc(doc(db, "users", id), {
//       takenQuiz: true
//     });

//   } catch(err) {
//     console.error(err);
// }
// }

const sendPasswordReset = async (email) => {
  try {
    // continueUrl: where user goes after completing reset (e.g. back to app).
    // The link IN THE EMAIL is set in Firebase Console → Auth → Email templates → Customize action URL.
    const actionCodeSettings = {
      url: `${window.location.origin}/set-new-password`,
      handleCodeInApp: true,
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    alert("Password reset link sent! Check your email.");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const confirmPasswordResetWithCode = async (oobCode, newPassword) => {
  await confirmPasswordReset(auth, oobCode, newPassword);
};

const logout = () => {
  signOut(auth);
};

export {
  auth,
  db,
  signInWithGoogle,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  sendPasswordReset,
  confirmPasswordResetWithCode,
  logout,
  doc,
};
