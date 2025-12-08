import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

export default function Login({ navigate, handleLogin, closeModal }) {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async () => {
    setError("");

    // Required fields
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    // Email format
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/auth/login", {
        email,
        password,
        role
      });

      // Backend error (via FastAPI HTTPException)
      if (response.data.detail) {
        setError(response.data.detail);
        return;
      }

      const user = response.data;

      // Store into React App.js (session)
      handleLogin(user);

      // Close modal if used
      if (closeModal) closeModal();

      // Redirect to correct dashboard
      if (user.role === "staff") {
        navigate("/staff/flights");
      } 

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    }
  };

  return (
    <div
      className="login-form"
      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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

      {error && <p className="login-error">{error}</p>}

      <label className="form-label">Email</label>
      <input
        className="form-input"
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="form-label">Password</label>
      <input
        className="form-input"
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="login-btn" onClick={handleSubmit}>
        Login
      </button>
    </div>
  );
}
