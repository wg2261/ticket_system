import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CustomerFlights.css";

export default function CustomerFlights({ userInfo }) {
  const [tab, setTab] = useState("upcoming");
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  const email = userInfo?.email;

  useEffect(() => {
    if (!email) return;

    const loadFlights = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/customer/flights/${email}`
        );

        setUpcoming(res.data.upcoming || []);
        setPast(res.data.past || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFlights();
  }, [email]);

  if (loading) return <div className="customer-flights-container">Loading...</div>;

  const flightsToShow = tab === "upcoming" ? upcoming : past;

  return (
    <div className="customer-flights-container">
      <h2>My Flights</h2>

      {/* Tabs */}
      <div className="customer-flights-tabs">
        <button
          className={tab === "upcoming" ? "active" : ""}
          onClick={() => setTab("upcoming")}
        >
          Upcoming Flights
        </button>

        <button
          className={tab === "past" ? "active" : ""}
          onClick={() => setTab("past")}
        >
          Past Flights
        </button>
      </div>

      {/* Flight List */}
      <div className="customer-flights-list">
        {flightsToShow.length === 0 ? (
          <p className="no-flights-msg">
            No {tab === "upcoming" ? "upcoming" : "past"} flights found.
          </p>
        ) : (
          flightsToShow.map((f, i) => (
            <div className="flight-row" key={i}>
              {/* LEFT SECTION */}
              <div className="flight-info-block">
                <div className="flight-title">
                  {f.airline_name} — {f.flight_num}
                </div>

                <div className="flight-detail-line">
                  <strong>From:</strong> {f.departure_airport}
                </div>
                <div className="flight-detail-line">
                  <strong>To:</strong> {f.arrival_airport}
                </div>
              </div>

              {/* RIGHT SECTION */}
              <div className="flight-meta">
                <div className="time-line">
                  <strong>Depart:</strong>{" "}
                  {new Date(f.departure_time).toLocaleString()}
                </div>
                <div className="time-line">
                  <strong>Arrive:</strong>{" "}
                  {new Date(f.arrival_time).toLocaleString()}
                </div>

                <div className="misc-line">
                  <strong>Class:</strong> {f.seat_class}
                </div>

                <div className="misc-line">
                  <strong>Price:</strong> ${f.price_charged}
                </div>

                {f.purchase_date && (
                  <div className="purchase-line">
                    Purchased on {f.purchase_date}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}