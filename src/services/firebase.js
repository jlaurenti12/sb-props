import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  query,
  setDoc,
  getDoc,
  collection,
  where,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAKi4SyS76B-zFOJvQS2N9vYrhxEkTm_Lw",
  authDomain: "sb-props-f7baa.firebaseapp.com",
  projectId: "sb-props-f7baa",
  storageBucket: "sb-props-f7baa.appspot.com",
  messagingSenderId: "387011073698",
  appId: "1:387011073698:web:06227c23977a853ea029fb",
  measurementId: "G-EHK2RKBGY3"
};


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
    await addDoc(collection(db, "users", user.uid), {
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
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent!");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
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
  logout,
  doc,
};
