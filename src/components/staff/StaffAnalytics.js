import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StaffAnalytics.css";

export default function StaffAnalytics({ userInfo }) {
  const email = userInfo?.email;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/staff/analytics/${email}`);

        // SAFETY: Fill missing fields with empty arrays
        setData({
          airline: res.data.airline || "",
          freq_customer: res.data.freq_customer || null,
          status_stats: res.data.status_stats || { total: 0, on_time: 0, delayed: 0 },

          ticket_monthly: res.data.ticket_monthly || [],

          top_agents_month: res.data.top_agents_month || [],
          top_agents_year: res.data.top_agents_year || [],

          top_agents_comm_month: res.data.top_agents_comm_month || [],
          top_agents_comm_year: res.data.top_agents_comm_year || [],

          top_dest_3mo: res.data.top_dest_3mo || [],
          top_dest_year: res.data.top_dest_year || []
        });

      } catch (err) {
        console.error("Failed to load analytics:", err);
        setData(null);
      }
      setLoading(false);
    };
    load();
  }, [email]);

  if (loading) return <div className="staff-analytics-page">Loading...</div>;
  if (!data) return <div className="staff-analytics-page">Unable to load analytics.</div>;

  const stats = data.status_stats;
  const totalFlights = stats.total || 0;

  const onTimeRate =
    totalFlights > 0 ? Math.round((stats.on_time / totalFlights) * 100) : 0;

  return (
    <div className="staff-analytics-page">
      <h2>{data.airline} — Analytics Overview</h2>

      {/* SUMMARY CARDS */}
      <div className="staff-analytics-grid">
        <div className="staff-card">
          <h4>Total Flights</h4>
          <p className="value">{totalFlights}</p>
        </div>

        <div className="staff-card">
          <h4>Most Frequent Customer (Last Year)</h4>
          <p className="value">
            {data.freq_customer?.customer_email || "None"}
          </p>
        </div>

        <div className="staff-card">
          <h4>On-Time Rate</h4>
          <p className="value">{onTimeRate}%</p>
        </div>

        <div className="staff-card">
          <h4>Total Delayed Flights</h4>
          <p className="value">{stats.delayed}</p>
        </div>
      </div>

      {/* TICKETS SOLD PER MONTH */}
      <div className="staff-section">
        <h3>Tickets Sold per Month</h3>

        <div className="staff-table">
          <div className="staff-table-header">
            <span>Month</span>
            <span>Tickets Sold</span>
          </div>

          {(data.ticket_monthly || []).map((row, idx) => {
            const monthName = new Date(row.month + "-01").toLocaleString("en-US", {
              month: "short"
            });

            return (
              <div key={idx} className="staff-table-row">
                <span>{monthName}</span>
                <span>{row.tickets}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP AGENTS — LAST MONTH */}
      <div className="staff-section">
        <h3>Top Booking Agents — Last Month</h3>

        <div className="staff-2col">
          <div className="staff-col">
            <h4>Tickets Sold</h4>

            <div className="staff-table">
              <div className="staff-table-header">
                <span>Agent Email</span>
                <span>Tickets</span>
              </div>

              {(data.top_agents_month?.tickets || []).map((a, idx) => (
                <div key={idx} className="staff-table-row">
                  <span>{a.agent_email}</span>
                  <span>{a.sold}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="staff-col">
            <h4>Commission Earned</h4>

            <div className="staff-table">
              <div className="staff-table-header">
                <span>Agent Email</span>
                <span>Commission</span>
              </div>

              {(data.top_agents_month?.commission || []).map((a, idx) => (
                <div key={idx} className="staff-table-row">
                  <span>{a.agent_email}</span>
                  <span>${a.commission?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TOP AGENTS — LAST YEAR */}
      <div className="staff-section">
        <h3>Top Booking Agents — Last Year</h3>

        <div className="staff-2col">
          <div className="staff-col">
            <h4>Tickets Sold</h4>

            <div className="staff-table">
              <div className="staff-table-header">
                <span>Agent Email</span>
                <span>Tickets</span>
              </div>

              {(data.top_agents_year?.tickets || []).map((a, idx) => (
                <div key={idx} className="staff-table-row">
                  <span>{a.agent_email}</span>
                  <span>{a.sold}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="staff-col">
            <h4>Commission Earned</h4>

            <div className="staff-table">
              <div className="staff-table-header">
                <span>Agent Email</span>
                <span>Commission</span>
              </div>

              {(data.top_agents_year?.commission || []).map((a, idx) => (
                <div key={idx} className="staff-table-row">
                  <span>{a.agent_email}</span>
                  <span>${a.commission?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TOP DESTINATIONS */}
      <div className="staff-section">
        <h3>Top Destinations — Comparison</h3>

        <div className="staff-2col">
          <div className="staff-col">
            <h4>Last 3 Months</h4>

            <div className="staff-table">
              <div className="staff-table-header">
                <span>City</span>
                <span>Count</span>
              </div>

              {(data.top_dest_3mo || []).map((d, idx) => (
                <div key={idx} className="staff-table-row">
                  <span>{d.destination}</span>
                  <span>{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="staff-col">
            <h4>Last Year</h4>

            <div className="staff-table">
              <div className="staff-table-header">
                <span>City</span>
                <span>Count</span>
              </div>

              {(data.top_dest_year || []).map((d, idx) => (
                <div key={idx} className="staff-table-row">
                  <span>{d.destination}</span>
                  <span>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
