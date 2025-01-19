import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, logInWithEmailAndPassword, signInWithGoogle } from "../../services/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {Form, Input, Button, Image} from "@heroui/react";
import "../../assets/styles/Login.css";
import mainLogo from "../../assets/images/logo.png";

function Login() {
  const [action, setAction] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();


  useEffect(() => {
    if (loading) {
      // maybe trigger a loading screen
      return;
    }
    if (user) navigate("/dashboard");
  }, [user, loading]);

  return (

    <>
    <Form
      className="w-full max-w-xs flex flex-col gap-4 rounded-md login"
      onSubmit={(e) => {
        e.preventDefault();
        let data = Object.fromEntries(new FormData(e.currentTarget));
        console.log(data);
        logInWithEmailAndPassword(data.email, data.password)
      }}
    >
      <Image
        alt="Event image"
        src={mainLogo}
       
      />
      <Input
        isRequired
        errorMessage="Please enter a valid email"
        label="Email"
        labelPlacement="outside"
        name="email"
        placeholder="Enter your email"
        type="email"
      />
      <Input
        isRequired
        errorMessage="Please enter a valid password"
        label="Password"
        labelPlacement="outside"
        name="password"
        placeholder="Enter your password"
        type="password"
      />
      <Button type="submit" variant="bordered">
        Login
      </Button>
        <div>
          Don't have an account? <Link to="/register">Register</Link> now.
        </div>
    </Form>

      </>

    // <div className="login">
    //   <div className="login__container">
    //     <input
    //       type="text"
    //       className="login__textBox"
    //       value={email}
    //       onChange={(e) => setEmail(e.target.value)}
    //       placeholder="E-mail Address"
    //     />
    //     <input
    //       type="password"
    //       className="login__textBox"
    //       value={password}
    //       onChange={(e) => setPassword(e.target.value)}
    //       placeholder="Password"
    //     />
    //     <button
    //       className="login__btn"
    //       onClick={() => logInWithEmailAndPassword(email, password)}
    //     >
    //       Login
    //     </button>
    //     <button className="login__btn login__google" onClick={signInWithGoogle}>
    //       Login with Google
    //     </button>
    //     <div>
    //       <Link to="/reset">Forgot Password</Link>
    //     </div>
    //     <div>
    //       Don't have an account? <Link to="/">Register</Link> now.
    //     </div>
    //   </div>
    // </div>
  );
}

export default Login;