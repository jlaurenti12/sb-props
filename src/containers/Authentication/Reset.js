import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { auth, sendPasswordReset } from "../../services/firebase";
import { Form, Input, Button, Divider } from "@heroui/react";

function Reset() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) navigate("/dashboard");
  }, [user, loading, navigate]);

  return (
    <Form
      className="max-w-sm grid gap-4 rounded-md login"
      onSubmit={(e) => {
        e.preventDefault();
        let data = Object.fromEntries(new FormData(e.currentTarget));
        sendPasswordReset(data.email);
      }}
    >
      <Input
        isRequired
        errorMessage="Please enter a valid email"
        label="Email Address"
        labelPlacement="inside"
        name="email"
        type="email"
      />
      <Button fullWidth type="submit" variant="solid" color="secondary">
        Send password reset email
      </Button>

      <Divider className="my-4" />

      <div className="text-small form">
        Don't have an account? <Link to="/register"> Register</Link> now.
      </div>
    </Form>
  );
}

export default Reset;
