import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Agent.css";

export default function Agent({ userInfo }) {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  const email = userInfo?.email;

  useEffect(() => {
    if (!email) return;

    const loadDashboard = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/agent/dashboard/${email}`);
        setDash(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [email]);

  if (loading) return <div className="agent-dashboard">Loading...</div>;
  if (!dash) return <div className="agent-dashboard">Unable to load dashboard.</div>;

  return (
    <div className="agent-dashboard">
      <h2>Hello {userInfo?.name || "Agent"}!</h2>

      {/* Stats Section */}
      <div className="agent-stats-grid">
        <div className="agent-card">
          <h3>Tickets Sold (Last 30 Days)</h3>
          <p className="value">{dash.tickets_sold}</p>
        </div>

        <div className="agent-card">
          <h3>Total Commission (Last 30 Days)</h3>
          <p className="value">${dash.total_commission.toFixed(2)}</p>
        </div>

        <div className="agent-card">
          <h3>Avg. Commission per Ticket</h3>
          <p className="value">${dash.avg_commission.toFixed(2)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="agent-section">
        <h3>Quick Actions</h3>

        <div className="agent-action-grid">
          <a className="agent-action-card" href="/flights">
            <h4>Search Flights</h4>
            <p>Find flights & purchase tickets</p>
          </a>

          <a className="agent-action-card" href="/agent/flights">
            <h4>View Tickets</h4>
            <p>See all tickets you purchased</p>
          </a>

          <a className="agent-action-card" href="/agent/analytics">
            <h4>Analytics</h4>
            <p>Top customers, commissions, and more</p>
          </a>
        </div>
      </div>
    </div>
  );
}
