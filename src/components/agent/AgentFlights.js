import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AgentFlights.css";

export default function AgentFlights({ userInfo }) {
  const email = userInfo?.email;
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const encoded = encodeURIComponent(email);
        const res = await axios.get(`http://localhost:8080/agent/flights/${encoded}`);
        setFlights(res.data.flights || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  if (loading) return <div className="agent-flights-page">Loading...</div>;

  return (
    <div className="agent-flights-page">
      <h2>Tickets Purchased by You</h2>

      {flights.length === 0 && (
        <p className="no-flights-msg">No tickets purchased yet.</p>
      )}

      <div className="agent-flights-list">
        {flights.map((f, i) => (
          <div key={f.ticket_id} className="agent-flight-row">
            
            {/* LEFT SIDE */}
            <div className="agent-flight-left">
              <div className="flight-title">
                {f.airline_name} — {f.flight_num}
              </div>
              <div className="flight-sub">
                Ticket #{f.ticket_id}
              </div>

              <div className="detail-line">
                <strong>Customer:</strong> {f.customer_name}
              </div>
            </div>

            {/* MIDDLE */}
            <div className="agent-flight-middle">
              <div className="detail-line">
                <strong>From:</strong> {f.from_airport}
              </div>
              <div className="detail-line">
                <strong>To:</strong> {f.to_airport}
              </div>
            </div>

            {/* RIGHT */}
            <div className="agent-flight-right">
              <div className="detail-line">
                <strong>Depart:</strong>{" "}
                {new Date(f.departure_time).toLocaleString()}
              </div>
              <div className="detail-line">
                <strong>Arrive:</strong>{" "}
                {new Date(f.arrival_time).toLocaleString()}
              </div>
              <div className="price-line">
                ${f.price_charged}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}