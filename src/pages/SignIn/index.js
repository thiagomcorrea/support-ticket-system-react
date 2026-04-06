import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import { toast } from "react-toastify";
import "./signin.css";
import logo from "../../assets/logo.png";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { signIn, loadingAuth } = useContext(AuthContext);

  async function handleSubmit(e) {
  e.preventDefault();

  setEmailError("");
  setPasswordError("");

  if (!email) {
    setEmailError("Email is required");
  }

  if (!password) {
    setPasswordError("Password is required");
  }

  if (!email || !password) return;

  if (!email.includes("@") || !email.includes(".")) {
    setEmailError("Invalid email format");
    return;
  }

  try {
    await signIn(email, password);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      setEmailError("User not found");
      return;
    }

    if (error.code === "auth/wrong-password") {
      setPasswordError("Incorrect password");
      return;
    }

    if (error.code === "auth/invalid-email") {
      setEmailError("Invalid email format");
      return;
    }

    if (error.code === "auth/too-many-requests") {
      toast.error("Too many attempts. Try again later.");
      return;
    }

    toast.error("Unable to sign in. Please try again.");
  }
}

  return (
    <div className="container-center">
      <div className="login">
        <div className="login-area">
          <img src={logo} alt="System logo" />
        </div>

        <form onSubmit={handleSubmit}>
          <h1>Sign in</h1>

          <input
            type="text"
            placeholder="email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={emailError ? "input error" : "input"}
          />

          {emailError && <span className="error-text">{emailError}</span>}

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={passwordError ? "input error" : "input"}
          />

          {passwordError && <span className="error-text">{passwordError}</span>}

          <button type="submit" disabled={loadingAuth}>
            {loadingAuth ? "Loading..." : "Sign in"}
          </button>
        </form>

        <Link to="/register">Create an account</Link>
      </div>
    </div>
  );
}