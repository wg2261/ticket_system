import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Flights.css";
import Purchase from "./Purchase"; 

export default function Flight({ userInfo }) {
  const [tab, setTab] = useState("search");

  const [leaving, setLeaving] = useState("");
  const [going, setGoing] = useState("");
  const [date, setDate] = useState("");

  const [airline, setAirline] = useState("");
  const [flightNum, setFlightNum] = useState("");

  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  useEffect(() => {
    if(!userInfo){
      setLeaving("");
      setGoing("");
      setDate("");
      setFlightNum("");   
      setAirline("");
      setResults([]);
      setHasSearched(false);
    }
  }, [userInfo]);

  const isAgent = userInfo?.role === "agent";
  const isCustomer = userInfo?.role === "customer";

  const handleSearch = async () => {
    setHasSearched(true);
    setResults([]);

    const role = userInfo?.role || "customer";
    const email = userInfo?.email || null;

    try {
      const res = await axios.get("http://localhost:8080/flights/search", {
        params: { from_loc: leaving, to_loc: going, date, role, email }
      });

      setResults(res.data.results || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  const handleLookup = async () => {
    setHasSearched(true);
    setResults([]);

    try {
      const res = await axios.get("http://localhost:8080/flights/status", {
        params: {
          flight_num: flightNum,
          airline: airline
        }
      });

      // Backend returns error
      if (res.data.error) {
        setResults([]);
        return;
      }

      // Wrap in array for unified structure
      setResults([res.data]);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  const openModal = (flight) => {
    if (!userInfo) {
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }

    setSelectedFlight(flight);
    setShowModal(true);
  };

  React.useEffect(() => {
    if (!userInfo) {
      setResults([]);
    }
  }, [userInfo]);

  return (
    <div className="flights-page">
      <div className="flight-container">
        <div className="flight-tabs">
          <button className={tab === "search" ? "active-tab" : ""} onClick={() => setTab("search")}>
            Flight Search
          </button>
          <button className={tab === "lookup" ? "active-tab" : ""} onClick={() => setTab("lookup")}>
            Flight Status
          </button>
        </div>

        {/* SEARCH TAB */}
        {tab === "search" && (
          <div className="flight-tab-content">
            <div className="flex-item">
              <label className="input-label">Leaving from</label>
              <div className="input-box">
                <input type="text" placeholder="City or Airport Code" value={leaving} onChange={(e)=>setLeaving(e.target.value)} />
              </div>
            </div>

            <button className="swap-btn" onClick={() => { const t = leaving; setLeaving(going); setGoing(t); }}>⇄</button>

            <div className="flex-item">
              <label className="input-label">Going to</label>
              <div className="input-box">
                <input type="text" placeholder="City or Airport Code" value={going} onChange={(e)=>setGoing(e.target.value)} />
              </div>
            </div>

            <div className="flex-item">
              <label className="input-label">Date</label>
              <div className="input-box">
                <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
              </div>
            </div>

            <button 
              className="search-btn"
              onClick={handleSearch}
              disabled={!leaving || !going}
            >
              Search
            </button>

          </div>
        )}

        {/* LOOKUP TAB */}
        {tab === "lookup" && (
          <div className="flight-tab-content">
            <div className="flex-item">
              <label className="input-label">Airline</label>
              <div className="input-box">
                <input type="text" placeholder="Airline" value={airline} onChange={(e)=>setAirline(e.target.value)} />
              </div>
            </div>

            <div className="flex-item">
              <label className="input-label">Flight Number</label>
              <div className="input-box">
                <input type="text" placeholder="Flight number" value={flightNum} onChange={(e)=>setFlightNum(e.target.value)} />
              </div>
            </div>

            <button
              className="search-btn"
              onClick={handleLookup}
              disabled={!flightNum || !airline}
            >
              Lookup
            </button>

          </div>
        )}
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="results-box">
          {results.length === 0 ? (
            <div className="no-results">No flights found.</div>
          ) : (
            results.map((f, i) => {
              const isInProgress = 
                f.live_status === "in-progress" || 
                f.status === "in-progress";

              return (
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
                              minute: "2-digit"
                            })}
                          </div>
                          <div className="airport-code">{f.departure_airport}</div>
                        </div>

                        <div className="flight-col">
                          <div className="time-main">
                            {new Date(f.arrival_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                          <div className="airport-code">{f.arrival_airport}</div>
                        </div>
                      </div>

                      {/* STATUS BADGE */}
                      {isInProgress && (
                        <div className="in-progress-badge">In Progress</div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE: HIDE PRICE + BUTTON IF IN-PROGRESS */}
                  <div className="flight-right">
                    {!isInProgress && (
                      <>
                        <div className="price-tag">US${f.price}</div>
                        <button className="select-btn" onClick={() => openModal(f)}>
                          Select
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Purchase modal */}
      {showModal && (
        <Purchase
          flight={selectedFlight}
          userInfo={userInfo}
          close={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
