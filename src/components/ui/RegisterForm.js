import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RegisterForm.css";

export default function RegisterForm({ baseData, onSubmit, close }) {
  const { email, password, role } = baseData;
  
  useEffect(() => {
    if (role === "agent") { submit() }
  }, [role]);

  const [form, setForm] = useState({});
  const [error, setError] = useState("");

  const [airlines, setAirlines] = useState([]);
  const [loadingAirlines, setLoadingAirlines] = useState(true);

  useEffect(() => {
    const loadAirlines = async () => {
      try {
        const res = await axios.get("http://localhost:8080/auth/airlines");
        setAirlines(res.data.airlines);
      } catch (err) {
        console.error("Failed to load airlines:", err);
      } finally {
        setLoadingAirlines(false);
      }
    };

    if (baseData.role === "staff") {
      loadAirlines();
    }
  }, [baseData.role]);

  const update = (key, val) => setForm({ ...form, [key]: val });

  const submit = () => {
    setError("");

    if (role === "customer") {
      if (!form.name) {
        setError("Full Name (*) is required.");
        return;
      }
    }

    if (role === "staff") {
      const required = ["first_name", "last_name", "date_of_birth", "airline_name", "permission"];
      const missing = required.filter((f) => !form[f]);
      if (missing.length > 0) {
        setError("Please fill all required (*) staff fields.");
        return;
      }
    }

    onSubmit({
      email,
      password,
      role,
      ...form
    });
  };

  return (
    <div
      className="registerform-container"
      onKeyDown={(e) => e.key === "Enter" && submit()}
    >
      <h3 className="registerform-title">
        {role === "customer" && "Customer Registration"}
        {role === "staff" && "Staff Registration"}
      </h3>

      {error && <p className="registerform-error">{error}</p>}

      {role === "customer" && (
        <>
          <label className="registerform-label">Full Name *</label>
          <input
            className="registerform-input"
            placeholder="Full Name"
            onChange={(e) => update("name", e.target.value)}
          />

          <label className="registerform-label">Phone Number</label>
          <input
            className="registerform-input"
            placeholder="Phone Number"
            onChange={(e) => update("phone_number", e.target.value)}
          />

          <label className="registerform-label">Street</label>
          <input
            className="registerform-input"
            placeholder="Street"
            onChange={(e) => update("street", e.target.value)}
          />

          <label className="registerform-label">City</label>
          <input
            className="registerform-input"
            placeholder="City"
            onChange={(e) => update("city", e.target.value)}
          />

          <label className="registerform-label">State</label>
          <input
            className="registerform-input"
            placeholder="State"
            onChange={(e) => update("state", e.target.value)}
          />

          <label className="registerform-label">Passport Number</label>
          <input
            className="registerform-input"
            placeholder="Passport Number"
            onChange={(e) => update("passport_number", e.target.value)}
          />

          <label className="registerform-label">Passport Expiration</label>
          <input
            className="registerform-input"
            type="date"
            onChange={(e) => update("passport_expiration_date", e.target.value)}
          />

          <label className="registerform-label">Passport Country</label>
          <input
            className="registerform-input"
            placeholder="Passport Country"
            onChange={(e) => update("passport_country", e.target.value)}
          />

          <label className="registerform-label">Date of Birth</label>
          <input
            className="registerform-input"
            type="date"
            onChange={(e) => update("date_of_birth", e.target.value)}
          />
        </>
      )}

      {role === "staff" && (
        <>
          <label className="registerform-label">First Name *</label>
          <input
            className="registerform-input"
            placeholder="First Name"
            onChange={(e) => update("first_name", e.target.value)}
          />

          <label className="registerform-label">Last Name *</label>
          <input
            className="registerform-input"
            placeholder="Last Name"
            onChange={(e) => update("last_name", e.target.value)}
          />

          <label className="registerform-label">Date of Birth *</label>
          <input
            className="registerform-input"
            type="date"
            onChange={(e) => update("date_of_birth", e.target.value)}
          />

          <label className="registerform-label">Airline Name *</label>
            {loadingAirlines ? (
              <p>Loading airlines...</p>
            ) : (
              <select
                className="registerform-input"
                onChange={(e) => update("airline_name", e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select Airline</option>
                {airlines.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}

          <label className="registerform-label">Staff Permission *</label>
          <select
            className="registerform-select"
            onChange={(e) => update("permission", e.target.value)}
          >
            <option value="" disabled>Select Staff Permission</option>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="both">Both</option>
          </select>
        </>
      )}

      <button className="registerform-btn" onClick={submit}>
        Finish Registration
      </button>

    </div>
  );
}
