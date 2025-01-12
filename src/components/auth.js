import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from "react";

export const Auth = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

   
    const signUp = async () => {
        try {
        await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error(err);
        }
    };

    const logIn = async () => {
        try {
        await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error(err);
        }
    };

    const signInWithGoogle = async () => {
        try {
        await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error(err);
        }
    };

    const logout = async () => {
        try {
        await signOut(auth);
        } catch (err) {
            console.error(err);
        }
    };


    var user = auth.currentUser;

 


    return <div>

       { user? (<>
         <p>Logged in as: {auth?.currentUser?.email} </p> 
         <button onClick={logout}> Logout </button> </>): 
        ( <>
            <input
                placeholder="Email.."
                onChange ={(e) => setEmail(e.target.value)}    
            />
            <input
                placeholder="Password."
                type="password" 
                onChange ={(e) => setPassword(e.target.value)}    
            />

        <button onClick={logIn}>Log In</button>
        <button onClick={signUp}>Sign Up</button>
        <button onClick={signInWithGoogle}> Sign in with Google </button>
        </>)

       }

    </div>
}