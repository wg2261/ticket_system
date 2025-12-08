import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StaffFlights.css";

export default function StaffFlights({ userInfo, navigate }) {
  const email = userInfo?.email;

  const [tab, setTab] = useState("browse"); // "browse" | "customer"

  // ===== BROWSE FLIGHTS =====
  const [fromAirport, setFromAirport] = useState("");
  const [toAirport, setToAirport] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [airline, setAirline] = useState("");
  const [flights, setFlights] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // ===== CUSTOMER LOOKUP =====
  const [custEmail, setCustEmail] = useState("");
  const [custFlights, setCustFlights] = useState([]);

  // -------------------------
  // LOAD STAFF FLIGHTS
  // -------------------------
  const loadFlights = async () => {
    setHasSearched(true);
    setFlights([]);

    try {
      const res = await axios.get(
        `http://localhost:8080/staff/flights/${encodeURIComponent(email)}`,
        {
          params: {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            from_airport: fromAirport || undefined,
            to_airport: toAirport || undefined,
          },
        }
      );

      setAirline(res.data.airline);
      setFlights(res.data.flights || []);
    } catch (err) {
      console.error(err);
      setFlights([]);
    }
  };

  // -------------------------
  // CUSTOMER FLIGHT HISTORY
  // -------------------------
  const lookupHistory = async () => {
    if (!custEmail.trim()) return;

    setCustFlights([]);

    try {
      const res = await axios.get(
        `http://localhost:8080/staff/customer-history/${encodeURIComponent(email)}/${encodeURIComponent(custEmail)}`
      );

      setCustFlights(res.data.history || []);
    } catch (err) {
      console.error(err);
      setCustFlights([]);
    }
  };

  // Reset views on switching tab
  useEffect(() => {
    const init = async () => {
      setHasSearched(false);
      await loadFlights(); 
    };
    init();
  }, []);

  return (
    <div className="flights-page">
      <div className="flight-container">
        <h2>{userInfo.airline_name} — Scheduled Flights</h2>

        {/* ===========================
            TABS
        =========================== */}
        <div className="flight-tabs">
          <button
            className={tab === "browse" ? "active-tab" : ""}
            onClick={() => setTab("browse")}
          >
            Browse Flights
          </button>

          <button
            className={tab === "customer" ? "active-tab" : ""}
            onClick={() => setTab("customer")}
          >
            Customer Lookup
          </button>
        </div>

        {/* ===========================
            TAB 1 — BROWSE FLIGHTS
        =========================== */}
        {tab === "browse" && (
          <div className="flight-tab-content">

            <div className="flex-item">
              <label className="input-label">From</label>
              <div className="input-box">
                <input
                  type="text"
                  placeholder="City or Airport Code"
                  value={fromAirport}
                  onChange={(e) => setFromAirport(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-item">
              <label className="input-label">To</label>
              <div className="input-box">
                <input
                  type="text"
                  placeholder="City or Airport Code"
                  value={toAirport}
                  onChange={(e) => setToAirport(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-item">
              <label className="input-label">From Date</label>
              <div className="input-box">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-item">
              <label className="input-label">To Date</label>
              <div className="input-box">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <button className="search-btn" onClick={loadFlights}>
              Apply Filters
            </button>
          </div>
        )}

        {/* ===========================
            TAB 2 — CUSTOMER LOOKUP
        =========================== */}
        {tab === "customer" && (
          <div className="flight-tab-content">
            <div className="flex-item">
              <label className="input-label">Customer Email</label>
              <div className="input-box">
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              className="search-btn"
              onClick={lookupHistory}
              disabled={!custEmail}
            >
              Search
            </button>
          </div>
        )}
      </div>

      {/* ===========================
          RESULTS — FLIGHTS (TAB 1)
      =========================== */}
      {tab === "browse" && (
        <div className="results-box">
          {flights.length === 0 ? (
            <div className="no-results">No flights found.</div>
          ) : (
            flights.map((f, i) => (
              <div key={i} className="flight-row">
                <div className="flight-left">
                  <div className="flight-info">
                    <h3 className="airline-name">
                      {f.airline_name} — {f.flight_num}
                    </h3>

                    <div className="flight-columns">
                      <div className="flight-col">
                        <div className="time-main">
                          {new Date(f.departure_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="airport-code">{f.departure_airport}</div>
                      </div>

                      <div className="flight-col">
                        <div className="time-main">
                          {new Date(f.arrival_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="airport-code">{f.arrival_airport}</div>
                      </div>
                    </div>

                    <div className="in-progress-badge">
                      {f.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===========================
          RESULTS — CUSTOMER LOOKUP (TAB 2)
      =========================== */}
      {tab === "customer" && custFlights.length > 0 && (
        <div className="results-box">
          {custFlights.map((f, i) => (
            <div key={i} className="flight-row">
              <div className="flight-left">
                <div className="flight-info">
                  <h3 className="airline-name">{airline} — {f.flight_num}</h3>

                  <div className="flight-columns">
                    <div className="flight-col">
                      <div className="time-main">
                        {new Date(f.departure_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="airport-code">{f.departure_airport}</div>
                    </div>

                    <div className="flight-col">
                      <div className="time-main">
                        {new Date(f.arrival_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      <div className="airport-code">{f.arrival_airport}</div>

                      <div className="flight-date">
                        {new Date(f.arrival_time).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>

                      <div className="airplane-id">Plane: {f.airplane_id}</div>
                    </div>

                    </div>

                    <div className="in-progress-badge">{f.status}</div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
