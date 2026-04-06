import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/auth";
import { FiUser, FiMail, FiLock, FiArrowRight } from "react-icons/fi";

import logo from "../../assets/logo.png";
import "./signup.css";

function SignUp() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signUp, loadingAuth } = useContext(AuthContext);

  function handleSubmit(e) {
    e.preventDefault();

    if (nome !== "" && email !== "" && password !== "") {
      signUp(email, password, nome);
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-shell">
        <div className="signup-card">
          <div className="signup-brand">
            <div className="signup-logo-wrap">
              <img src={logo} alt="Sistema Logo" className="signup-logo" />
            </div>

            <div className="signup-brand-text">
              <span className="signup-eyebrow">Create your account</span>
              <h1>Join the support system</h1>
              <p>
                Create your account to manage tickets, customers and workflow in
                one place.
              </p>
            </div>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-field">
              <label htmlFor="signup-name">Name</label>
              <div className="signup-input-wrap">
                <FiUser size={18} />
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Your full name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-email">Email</label>
              <div className="signup-input-wrap">
                <FiMail size={18} />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-password">Password</label>
              <div className="signup-input-wrap">
                <FiLock size={18} />
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button className="signup-submit" type="submit" disabled={loadingAuth}>
              {loadingAuth ? "Creating account..." : "Create account"}
              {!loadingAuth && <FiArrowRight size={18} />}
            </button>
          </form>

          <div className="signup-footer">
            <span>Already have an account?</span>
            <Link to="/">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;