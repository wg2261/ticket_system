import React, { useState } from "react";
import axios from "axios";
import "./Register.css";

export default function Register({ proceedTo }) {
  const [role, setRole] = useState("customer");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleNext = async () => {
    setError("");

    // Required fields
    if (!email || !password || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }

    // Email format
    if (!emailRegex.test(email)) {
      setError("Invalid email format.");
      return;
    }

    // Password matching
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Encode email to avoid URL breaking
      const encodedEmail = encodeURIComponent(email.toLowerCase());
      const accountType = role.toLowerCase();

      // Step 1 email existence check
      const res = await axios.get(
        `http://localhost:8080/auth/exists/${accountType}/${encodedEmail}`
      );

      if (res.data.exists) {
        setError("This email is already registered.");
        return;
      }

      // Continue to Step 2 (RegisterForm)
      proceedTo({
        email: email.toLowerCase(),
        password,
        role: accountType
      });

    } catch (err) {
      console.error(err);
      setError("Error checking email. Please try again.");
    }
  };

  return (
    <div
      className="register-form"
      onKeyDown={(e) => e.key === "Enter" && handleNext()}
    >
      <label className="form-label">Select Role</label>

      <div className="role-column">
        <div className="role-row" onClick={() => setRole("customer")}>
          <div className={`role-circle ${role === "customer" ? "selected" : ""}`} />
          <span className={`role-text ${role === "customer" ? "selected-text" : ""}`}>
            Customer
          </span>
        </div>

        <div className="role-row" onClick={() => setRole("agent")}>
          <div className={`role-circle ${role === "agent" ? "selected" : ""}`} />
          <span className={`role-text ${role === "agent" ? "selected-text" : ""}`}>
            Booking Agent
          </span>
        </div>

        <div className="role-row" onClick={() => setRole("staff")}>
          <div className={`role-circle ${role === "staff" ? "selected" : ""}`} />
          <span className={`role-text ${role === "staff" ? "selected-text" : ""}`}>
            Airline Staff
          </span>
        </div>
      </div>

      {error && <p className="register-error">{error}</p>}

      <label className="form-label">Email</label>
      <input
        className="register-input"
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="form-label">Password</label>
      <input
        className="register-input"
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label className="form-label">Confirm Password</label>
      <input
        className="register-input"
        type="password"
        placeholder="Re-enter password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button className="register-btn" onClick={handleNext}>
        Next →
      </button>
    </div>
  );
}