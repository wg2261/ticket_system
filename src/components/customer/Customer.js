import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Customer.css";

export default function Customer({ userInfo }) {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const email = userInfo?.email;

  useEffect(() => {
    if (!email) return;

    const loadDashboard = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/customer/dashboard/${email}`);
        setDash(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [email]);

  if (loading) return <div className="customer-dashboard">Loading...</div>;
  if (!dash) return <div className="customer-dashboard">Unable to load dashboard.</div>;

  return (
    <div className="customer-dashboard">
      <h2>Hello {userInfo?.name || "Customer"}!</h2>

      {/* Stats Section */}
      <div className="customer-stats-grid">
        <div className="customer-card">
          <h3>Last 12 Months Spending</h3>
          <p className="value">${dash.total_spending_12mo}</p>
        </div>

        <div className="customer-card">
          <h3>Total Tickets</h3>
          <p className="value">{dash.total_tickets}</p>
        </div>

        <div className="customer-card">
          <h3>Upcoming Trips</h3>
          <p className="value">{dash.upcoming_count}</p>
        </div>

        <div className="customer-card">
          <h3>Last Purchase</h3>
          <p className="value">
            {dash.last_purchase || "No purchases yet"}
          </p>
        </div>
      </div>

      {/* Next Flight */}
      <div className="customer-section">
        <h3>Your Next Upcoming Flight</h3>

        {dash.next_upcoming ? (
          <div className="customer-flight-card">
            <h3>
              {dash.next_upcoming.airline_name} — {dash.next_upcoming.flight_num}
            </h3>

            <p><strong>From:</strong> {dash.next_upcoming.departure_airport}</p>
            <p><strong>To:</strong> {dash.next_upcoming.arrival_airport}</p>
            <p><strong>Departure:</strong> {new Date(dash.next_upcoming.departure_time).toLocaleString()}</p>
            <p><strong>Arrival:</strong> {new Date(dash.next_upcoming.arrival_time).toLocaleString()}</p>
          </div>
        ) : (
          <p>No upcoming flights.</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="customer-section">
        <h3>Quick Actions</h3>

        <div className="customer-action-grid">
          <a className="customer-action-card" href="/flights">
            <h4>Search Flights</h4>
            <p>Find flights & purchase tickets</p>
          </a>

          <a className="customer-action-card" href="/customer/flights">
            <h4>My Flights</h4>
            <p>View upcoming and past trips</p>
          </a>

          <a className="customer-action-card" href="/customer/spending">
            <h4>My Spending</h4>
            <p>Track your travel spending</p>
          </a>
        </div>
      </div>
    </div>
  );
}
