import { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login({ onLogin, onCreateAccount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "/api/login",
        {
          email: email.trim(),
          password: password,
        }
      );

      console.log("LOGIN SUCCESS:", response.data);

      localStorage.setItem("token", response.data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      onLogin(response.data.user);

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      if (error.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (error.response?.status === 403) {
        setError("You are not authorized to login.");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Unable to connect to server.");
      }

    } finally {
      setLoading(false);
    }
  }

  function handleCreateAccount() {
    onCreateAccount();
  }

  return (
    <div className="login-page">
      <div className="login-box">

        <div className="login-logo">
          🛒
        </div>

        <h1>Retail Inventory</h1>

        <p className="login-subtitle">
          Login to your account
        </p>

        <form onSubmit={handleLogin}>

          <div className="input-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <div className="register-section">
          <span>Don't have an account?</span>

          <button
            type="button"
            onClick={handleCreateAccount}
          >
            Create New Account
          </button>
        </div>

      </div>
    </div>
  );
}

export default Login;
