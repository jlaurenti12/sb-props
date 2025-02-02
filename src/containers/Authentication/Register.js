import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  registerWithEmailAndPassword,
  signInWithGoogle,
} from "../../services/firebase";
import "../../assets/styles/Register.css";
import {Form, Input, Button, Image, Divider} from "@heroui/react";
import { IoLogoGoogle } from "react-icons/io5";
import "../../assets/styles/Login.css";
import mainLogo from "../../assets/images/sb_logo.png";


function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();

  const register = () => {
    if (!name) alert("Please enter name");
    registerWithEmailAndPassword(name, email, password);
  };

  useEffect(() => {
    if (loading) return;
    if (user) {
        navigate("/dashboard");
    } else {
      navigate("/register")
    }
  }, [user, loading]);

  return (

    <>
      <Form
        className="max-w-sm grid gap-4 rounded-md login"
        onSubmit={(e) => {
          e.preventDefault();
          let data = Object.fromEntries(new FormData(e.currentTarget));
          console.log(data);
          registerWithEmailAndPassword(data.name, data.email, data.password)
        }}
      >
        <Image
          alt="Event image"
          src={mainLogo}
          className="logo"
        />
        <Input
          isRequired
          errorMessage="Please enter a name"
          label="Full Name"
          labelPlacement="inside"
          name="name"
          type="text"
        />
        <Input
          isRequired
          errorMessage="Please enter a valid email"
          label="Email"
          labelPlacement="inside"
          name="email"
          type="email"
        />
        <Input
          isRequired
          errorMessage="Please enter a valid password"
          label="Password"
          labelPlacement="inside"
          name="password"
          type="password"
        />
        <Button fullWidth type="submit" variant="solid" color="secondary">
          Register
        </Button>
        <div className="text-small buttonBreak">Or</div>
        <Button fullWidth variant="solid" color="primary" startContent={<IoLogoGoogle />}  onPress={signInWithGoogle}>
          Sign Up Using Google
        </Button>

          <Divider className="my-4" />

          <div className="text-small form">
                Already have an account? <Link  to="/"> Login</Link> now.
          </div>
      </Form>
    </>




    // <div className="register">
    //   <div className="register__container">
    //     <input
    //       type="text"
    //       className="register__textBox"
    //       value={name}
    //       onChange={(e) => setName(e.target.value)}
    //       placeholder="Full Name"
    //     />
    //     <input
    //       type="text"
    //       className="register__textBox"
    //       value={email}
    //       onChange={(e) => setEmail(e.target.value)}
    //       placeholder="E-mail Address"
    //     />
    //     <input
    //       type="password"
    //       className="register__textBox"
    //       value={password}
    //       onChange={(e) => setPassword(e.target.value)}
    //       placeholder="Password"
    //     />
    //     <button className="register__btn" onClick={register}>
    //       Register
    //     </button>
    //     <button
    //       className="register__btn register__google"
    //       onClick={signInWithGoogle}
    //     >
    //       Register with Google
    //     </button>

    //     <div>
    //       Already have an account? <Link to="/">Login</Link> now.
    //     </div>
    //   </div>
    // </div>
  );
}

export default Register;