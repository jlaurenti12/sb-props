import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  registerWithEmailAndPassword,
  signInWithGoogle,
} from "../../services/firebase";
import { Form, Input, Button, Image, Divider } from "@heroui/react";
import { IoLogoGoogle } from "react-icons/io5";
import mainLogo from "../../assets/images/sb_logo_lx.png";

function Register() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  }, [user, loading, navigate]);

  return (
    <>
      <Form
        className="max-w-sm grid gap-4 rounded-md login"
        onSubmit={(e) => {
          e.preventDefault();
          let data = Object.fromEntries(new FormData(e.currentTarget));
          registerWithEmailAndPassword(data.name, data.email, data.password);
        }}
      >
        <Image alt="Event image" src={mainLogo} className="logo" />
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
        <Button
          fullWidth
          variant="solid"
          color="primary"
          startContent={<IoLogoGoogle />}
          onPress={signInWithGoogle}
        >
          Sign Up Using Google
        </Button>

        <Divider className="my-4" />

        <div className="text-small form">
          Already have an account? <Link to="/"> Login</Link> now.
        </div>
      </Form>
    </>
  );
}

export default Register;
