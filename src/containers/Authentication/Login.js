import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  auth,
  logInWithEmailAndPassword,
  signInWithGoogle,
} from "../../services/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Form, Input, Button, Image, Divider } from "@heroui/react";
import { IoLogoGoogle } from "react-icons/io5";
import mainLogo from "../../assets/images/sb_logo_lx.png";

function Login() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (user) navigate("/dashboard");
  }, [user, loading, navigate]);

  return (
    <>
      <Form
        className="max-w-sm grid gap-4 rounded-md login"
        onSubmit={(e) => {
          e.preventDefault();
          let data = Object.fromEntries(new FormData(e.currentTarget));
          logInWithEmailAndPassword(data.email, data.password);
        }}
      >
        <Image alt="Event image" src={mainLogo} className="logo" />
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
        <div className="text-small form">
          <Link to="/reset"> Forgot Password?</Link>
        </div>
        <Button fullWidth type="submit" variant="solid" color="secondary">
          Login
        </Button>
        <div className="text-small buttonBreak">Or</div>
        <Button
          fullWidth
          variant="solid"
          color="primary"
          startContent={<IoLogoGoogle />}
          onPress={signInWithGoogle}
        >
          Sign-in Using Google
        </Button>

        <Divider className="my-4" />

        <div className="text-small form">
          Don't have an account? <Link to="/register"> Register</Link> now.
        </div>
      </Form>
    </>
  );
}

export default Login;
