import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Staff.css";

export default function Staff({ userInfo }) {
  const email = userInfo?.email;
  const permission = userInfo?.permission;

  const isAdmin = permission === "admin" || permission === "both";
  const isOperator = permission === "operator" || permission === "both";

  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;

    const load = async () => {
      try {
        const encoded = encodeURIComponent(email);
        const res = await axios.get(
          `http://localhost:8080/staff/dashboard/${encoded}`
        );
        setDash(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [email]);

  if (loading) return <div className="staff-dashboard">Loading...</div>;
  if (!dash) return <div className="staff-dashboard">Unable to load dashboard.</div>;

  // derived stats
  const perf = dash.performance || { on_time: 0, delayed: 0, total: 0 };
  const onTimeRate =
    perf.total > 0 ? Math.round((perf.on_time / perf.total) * 100) : 0;

  return (
    <div className="staff-dashboard">

      <h2>Hello {userInfo?.first_name || "Staff"}!</h2>
      <h3>
        {dash.airline} — Staff Dashboard ({permission?.toUpperCase()})
      </h3>

      {/* ==========================
          STATS GRID (Like Agent)
      =========================== */}
      <div className="staff-stats-grid">
        <div className="staff-card">
          <h3>Upcoming Flights (Next 30 Days)</h3>
          <p className="value">{dash.upcoming_count}</p>
        </div>

        <div className="staff-card">
          <h3>On-Time Rate</h3>
          <p className="value">{onTimeRate}%</p>
        </div>

        <div className="staff-card">
          <h3>Delayed Flights</h3>
          <p className="value">{perf.delayed}</p>
        </div>

        <div className="staff-card">
          <h3>Total Flights</h3>
          <p className="value">{perf.total}</p>
        </div>

        <div className="staff-card">
          <h3>Most Frequent Customer</h3>
          <p className="value">
            {dash.frequent_customer?.customer_email || "None"}
          </p>
        </div>

        <div className="staff-card">
          <h3>Top Booking Agent (30 days)</h3>
          <p className="value">{dash.top_agent?.agent_email || "None"}</p>
        </div>
      </div>

      {/* ==========================
          QUICK ACTIONS
      =========================== */}
      <div className="staff-section">
        <h3>Quick Actions</h3>

        <div className="staff-action-grid">
          <a href="/flights" className="staff-action-card">
            <h4>Scheduled Flights</h4>
            <p>Find and view flight details and customer flights</p>
          </a>

          <a href="/staff/analytics" className="staff-action-card">
            <h4>Staff Analytics</h4>
            <p>Performance, customers, top agents & destinations</p>
          </a>

          <a href="/staff/management" className="staff-action-card">
            <h4>Management Panel</h4>
            <p>
              {isAdmin
                ? "Add flights, airports, planes, assign agents"
                : isOperator
                ? "Update flight status"
                : "Limited access"}
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
