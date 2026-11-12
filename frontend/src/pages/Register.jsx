import { useState } from "react";
import axios from "axios";
import "./Register.css";

function Register({ onBackToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= SEND OTP =================

  async function handleSendOtp() {
    setError("");

    if (!name.trim() || !email.trim() || !mobile.trim()) {
      setError("Please fill all required details.");
      return;
    }

    if (mobile.trim().length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "/api/send-otp",
        {
          email: email.trim(),
        }
      );

      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");

      alert(response.data.message);
    } catch (error) {
      console.error("SEND OTP ERROR:", error);

      console.error(
        "SERVER RESPONSE:",
        JSON.stringify(error.response?.data, null, 2)
      );

      setError(
        error.response?.data?.message ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ================= VERIFY OTP =================

  async function handleVerifyOtp() {
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "/api/verify-otp",
        {
          email: email.trim(),
          otp: otp.trim(),
        }
      );

      setOtpVerified(true);

      alert(response.data.message);
    } catch (error) {
      console.error("VERIFY OTP ERROR:", error);

      console.error(
        "SERVER RESPONSE:",
        JSON.stringify(error.response?.data, null, 2)
      );

      setOtpVerified(false);

      setError(
        error.response?.data?.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ================= CREATE ACCOUNT =================

  async function handleCreateAccount(e) {
    e.preventDefault();

    setError("");

    if (!otpSent) {
      setError("Please verify your email first.");
      return;
    }

    if (!otpVerified) {
      setError("Please verify the OTP before creating your account.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "/api/register",
        {
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password: password,
        }
      );

      console.log("REGISTER SUCCESS:", response.data);

      alert(response.data.message);

      // Account successfully created
      onBackToLogin();

    } catch (error) {
      console.error("REGISTER ERROR:", error);

      const serverData = error.response?.data;

      console.error(
        "SERVER RESPONSE:",
        JSON.stringify(serverData, null, 2)
      );

      // Show exact backend error in popup
      alert(
        "REGISTER ERROR:\n\n" +
        JSON.stringify(
          serverData || {
            message: "No response received from server",
          },
          null,
          2
        )
      );

      setError(
        serverData?.message ||
          serverData?.error ||
          "Account could not be created."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">

      <div className="register-box">

        {/* HEADER */}

        <div className="register-header">

          <div className="register-logo">
            🛒
          </div>

          <h1>Create Account</h1>

          <p>
            Register as a user to access Retail Inventory
          </p>

        </div>


        <form onSubmit={handleCreateAccount}>

          {/* NAME */}

          <div className="input-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />

          </div>


          {/* EMAIL */}

          <div className="input-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {

                setEmail(e.target.value);
                setOtpSent(false);
                setOtpVerified(false);

              }}
              disabled={loading}
              required
            />

          </div>


          {/* MOBILE */}

          <div className="input-group">

            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={mobile}
              onChange={(e) =>
                setMobile(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10)
                )
              }
              disabled={loading}
              required
            />

          </div>


          {/* EMAIL VERIFICATION */}

          <div className="verification-section">

            <div className="verification-title">

              <span>
                📧
              </span>

              <div>

                <strong>
                  Email Verification
                </strong>

                <p>
                  Verify your email using a 6-digit OTP
                </p>

              </div>

            </div>


            <button
              type="button"
              className="otp-button"
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : otpSent
                ? "Resend OTP"
                : "Send OTP"}
            </button>

          </div>


          {/* OTP */}

          {otpSent && (

            <div className="otp-section">

              <div className="input-group">

                <label>
                  Enter OTP
                </label>

                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  maxLength="6"
                  disabled={loading || otpVerified}
                />

              </div>


              <button
                type="button"
                className={
                  otpVerified
                    ? "otp-verified-button"
                    : "verify-otp-button"
                }
                onClick={handleVerifyOtp}
                disabled={loading || otpVerified}
              >
                {otpVerified
                  ? "✓ Email Verified"
                  : loading
                  ? "Verifying..."
                  : "Verify OTP"}
              </button>

            </div>

          )}


          {/* PASSWORD */}

          <div className="input-group">

            <label>
              Create Password
            </label>

            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
              required
            />

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="input-group">

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              disabled={loading}
              required
            />

          </div>


          {/* USER ROLE INFO */}

          <div className="user-role-info">

            <span>
              👤
            </span>

            <div>

              <strong>
                User Account
              </strong>

              <p>
                New registrations are created as User accounts.
              </p>

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <p className="register-error">
              {error}
            </p>

          )}


          {/* CREATE ACCOUNT */}

          <button
            type="submit"
            className="create-account-button"
            disabled={loading || !otpVerified}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>


        {/* BACK TO LOGIN */}

        <div className="login-section">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={onBackToLogin}
          >
            Login here
          </button>

        </div>

      </div>

    </div>
  );
}

export default Register;
