import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AgentAnalytics.css";

export default function AgentAnalytics({ userInfo }) {
  const email = userInfo?.email;
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      try {
        const encoded = encodeURIComponent(email);
        const res = await axios.get(
          `http://localhost:8080/agent/analytics/${encoded}`
        );
        setAnalytics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [email]);

  if (loading) return <div className="agent-analytics-page">Loading...</div>;
  if (!analytics) return <div className="agent-analytics-page">No data found.</div>;

  const { summary, top_tickets, top_commission } = analytics;

  return (
    <div className="agent-analytics-page">
      <h2>Analytics Overview</h2>

      {/* SUMMARY GRID */}
      <div className="agent-analytics-grid">
        <div className="agent-analytics-card">
          <h4>Total Commission (Last 30 Days)</h4>
          <p className="value">${summary.total_commission.toFixed(2)}</p>
        </div>

        <div className="agent-analytics-card">
          <h4>Average Commission per Ticket</h4>
          <p className="value">${summary.avg_commission.toFixed(2)}</p>
        </div>

        <div className="agent-analytics-card">
          <h4>Tickets Sold (Last 30 Days)</h4>
          <p className="value">{summary.tickets_sold}</p>
        </div>
      </div>

      {/* TOP CUSTOMERS BY TICKETS */}
      <div className="agent-section">
        <h3>Top 5 Customers by Tickets Sold</h3>

        <div className="agent-table">
          <div className="agent-table-header">
            <span>Customer</span>
            <span>Tickets</span>
          </div>

          {top_tickets.map((row, index) => (
            <div key={index} className="agent-table-row">
              <span>{row.customer_name}</span>
              <span>{row.ticket_count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TOP CUSTOMERS BY COMMISSION */}
      <div className="agent-section">
        <h3>Top 5 Customers by Commission</h3>

        <div className="agent-table">
          <div className="agent-table-header">
            <span>Customer</span>
            <span>Commission</span>
          </div>

          {top_commission.map((row, index) => (
            <div key={index} className="agent-table-row">
              <span>{row.customer_name}</span>
              <span>${row.commission_earned.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}