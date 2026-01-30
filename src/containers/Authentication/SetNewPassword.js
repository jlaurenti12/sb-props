import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { confirmPasswordResetWithCode } from "../../services/firebase";
import { Form, Input, Button, Divider } from "@heroui/react";

function SetNewPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode") || searchParams.get("oob_code");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!oobCode) {
    return (
      <div className="max-w-sm rounded-md login">
        <p className="text-small form mb-4">
          Invalid or expired reset link. Please request a new password reset
          from the login page.
        </p>
        <Button as={Link} to="/reset" variant="solid" color="secondary">
          Request new reset link
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-sm rounded-md login">
        <p className="text-small form mb-4">
          Your password has been reset. You can now log in with your new
          password.
        </p>
        <Button as={Link} to="/" variant="solid" color="secondary">
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <Form
      className="max-w-sm grid gap-4 rounded-md login"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        if (data.password !== data.confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        if (data.password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        try {
          await confirmPasswordResetWithCode(oobCode, data.password);
          setSuccess(true);
        } catch (err) {
          console.error(err);
          setError(
            err.code === "auth/expired-action-code"
              ? "This reset link has expired. Please request a new one."
              : err.message || "Something went wrong. Please try again."
          );
        }
      }}
    >
      <h2 className="text-lg font-semibold form">Set new password</h2>
      <Input
        isRequired
        errorMessage="Password must be at least 6 characters"
        label="New password"
        labelPlacement="inside"
        name="password"
        type="password"
        minLength={6}
      />
      <Input
        isRequired
        label="Confirm new password"
        labelPlacement="inside"
        name="confirmPassword"
        type="password"
        minLength={6}
      />
      {error && (
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      )}
      <Button fullWidth type="submit" variant="solid" color="secondary">
        Reset password
      </Button>

      <Divider className="my-4" />

      <div className="text-small form">
        Remember your password? <Link to="/">Log in</Link>
      </div>
    </Form>
  );
}

export default SetNewPassword;
