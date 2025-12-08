import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Management.css";

export default function Management({ userInfo }) {
  const airline = userInfo?.airline_name;
  const permission = userInfo?.permission;

  const isAdmin = permission === "admin" || permission === "both";
  const isOperator = permission === "operator" || permission === "both";

  // ======================
  // MESSAGE SYSTEM
  // ======================
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "success" | "error"

  const showMessage = (text, type) => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => {
      setMsg("");
      setMsgType("");
    }, 3000);
  };

  // ======================
  // FORM STATES
  // ======================

  // Airport
  const [airportName, setAirportName] = useState("");
  const [airportCity, setAirportCity] = useState("");

  // Airplane
  const [airplaneId, setAirplaneId] = useState("");
  const [seatClasses, setSeatClasses] = useState([]);

  // Flight Creation
  const [flightNum, setFlightNum] = useState("");
  const [fromAirport, setFromAirport] = useState("");
  const [toAirport, setToAirport] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");

  const [airplanes, setAirplanes] = useState([]);

  // Agent Authorization
  const [agentEmail, setAgentEmail] = useState("");

  // Flight Status
  const [statusFlightNum, setStatusFlightNum] = useState("");
  const [newStatus, setNewStatus] = useState("");

  // ======================
  // LOAD AIRPLANES FOR CREATE-FLIGHT DROPDOWN
  // ======================
  useEffect(() => {
    if (!airline) return;

    const loadAirplanes = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/staff/get_airplanes/${airline}`
        );
        setAirplanes(res.data.airplanes || []);
      } catch (err) {
        showMessage("Unable to load airplanes.", "error");
      }
    };

    loadAirplanes();
  }, [airline]);

  // ======================
  // SEAT CLASS FUNCTIONS
  // ======================
  const updateSeatClass = (index, field, value) => {
    const updated = [...seatClasses];
    updated[index][field] = value;
    setSeatClasses(updated);
  };

  const removeSeatClass = (index) => {
    setSeatClasses(seatClasses.filter((_, i) => i !== index));
  };

  // ======================
  // API SUBMIT WRAPPER
  // ======================
  const submit = async (endpoint, body, successMsg = "Success!") => {
    try {
      const res = await axios.post(
        `http://localhost:8080/staff/${endpoint}`,
        body
      );
      showMessage(res.data.message || successMsg, "success");
    } catch (err) {
      console.log("BACKEND ERROR:", err.response?.data);
      showMessage(err.response?.data?.detail || "Error occurred.", "error");
    }
  };

  // ===============================================================
  //                      RENDERED COMPONENT
  // ===============================================================
  return (
    <div>
      {/* Floating Message */}
      {msg && <div className={`mgmt-message ${msgType}`}>{msg}</div>}

      <div className="staff-management-page">
        <h2>Management Panel</h2>
        <h3>{airline} — {permission?.toUpperCase()}</h3>

        {/* ===================================================
            ADMIN SECTION
        =================================================== */}
        {isAdmin && (
          <div className="management-section">
            <h3>Admin Controls</h3>

            <div className="management-grid">

              {/* ====================== ADD AIRPORT ===================== */}
              <div className="management-card">
                <h4>Add Airport</h4>
                <input
                  type="text"
                  placeholder="Airport Name"
                  value={airportName}
                  onChange={(e) => setAirportName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="City"
                  value={airportCity}
                  onChange={(e) => setAirportCity(e.target.value)}
                />

                <button
                  onClick={() =>
                    submit(
                      "add_airport",
                      { name: airportName, city: airportCity },
                      "Airport added."
                    )
                  }
                >
                  Add Airport
                </button>
              </div>

              {/* ====================== ADD AIRPLANE + SEAT CLASSES ===================== */}
              <div className="management-card">
                <h4>Add Airplane + Seat Classes</h4>

                <input
                  type="text"
                  placeholder="Airplane ID"
                  value={airplaneId}
                  onChange={(e) => setAirplaneId(e.target.value)}
                />

                <h4 style={{ marginTop: "10px" }}>Seat Classes</h4>

                {seatClasses.map((sc, index) => (
                  <div
                    key={index}
                    style={{
                      border: "2px solid #E5C5F5",
                      padding: "12px",
                      marginTop: "10px",
                      borderRadius: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Class (ex: Economy)"
                      value={sc.class}
                      onChange={(e) =>
                        updateSeatClass(index, "class", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      placeholder="Capacity"
                      value={sc.capacity}
                      onChange={(e) =>
                        updateSeatClass(index, "capacity", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Price Factor (ex: 1.5)"
                      value={sc.price_factor}
                      onChange={(e) =>
                        updateSeatClass(index, "price_factor", e.target.value)
                      }
                    />

                    <button
                      style={{ background: "#C62828", color: "white", marginTop: "5px" }}
                      onClick={() => removeSeatClass(index)}
                    >
                      Remove Class
                    </button>
                  </div>
                ))}

                <button
                  style={{ background: "#57DEC7", marginTop: "10px" }}
                  onClick={() =>
                    setSeatClasses([
                      ...seatClasses,
                      { class: "", capacity: "", price_factor: "" }
                    ])
                  }
                >
                  + Add Seat Class
                </button>

                <button
                  onClick={() =>
                    submit(
                      "add_airplane",
                      {
                        airplane_id: airplaneId,
                        airline_name: airline,
                        seat_classes: seatClasses
                      },
                      "Airplane added."
                    )
                  }
                >
                  Add Airplane
                </button>
              </div>

              {/* ====================== CREATE FLIGHT ===================== */}
              <div className="management-card">
                <h4>Create Flight</h4>

                <input
                  type="text"
                  placeholder="Flight Number"
                  value={flightNum}
                  onChange={(e) => setFlightNum(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="From Airport"
                  value={fromAirport}
                  onChange={(e) => setFromAirport(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="To Airport"
                  value={toAirport}
                  onChange={(e) => setToAirport(e.target.value)}
                />

                <label>Airplane</label>
                <select
                  value={airplaneId}
                  onChange={(e) => setAirplaneId(e.target.value)}
                >
                  <option value="">Select Airplane</option>
                  {airplanes.map((p, idx) => (
                    <option key={idx} value={p.airplane_id}>
                      {p.airplane_id}
                    </option>
                  ))}
                </select>

                <label>Departure Time</label>
                <input
                  type="datetime-local"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                />

                <label>Arrival Time</label>
                <input
                  type="datetime-local"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                />

                <button
                  onClick={() =>
                    submit(
                      "create_flight",
                      {
                        flight_num: flightNum,
                        from_airport: fromAirport,
                        to_airport: toAirport,
                        departure_time: departure,
                        arrival_time: arrival,
                        airplane_id: airplaneId,
                        airline_name: airline
                      },
                      "Flight created."
                    )
                  }
                >
                  Create Flight
                </button>
              </div>

              {/* ====================== AUTHORIZE AGENT ===================== */}
              <div className="management-card">
                <h4>Authorize Booking Agent</h4>
                <input
                  type="email"
                  placeholder="Agent Email"
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                />

                <button
                  onClick={() =>
                    submit(
                      "authorize_agent",
                      { agent_email: agentEmail, airline_name: airline },
                      "Agent authorized."
                    )
                  }
                >
                  Authorize Agent
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ===================================================
            OPERATOR SECTION
        =================================================== */}
        {isOperator && (
          <div className="management-section">
            <h3>Operator Controls</h3>

            <div className="management-grid">

              <div className="management-card">
                <h4>Update Flight Status</h4>

                <input
                  type="text"
                  placeholder="Flight Number"
                  value={statusFlightNum}
                  onChange={(e) => setStatusFlightNum(e.target.value)}
                />

                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="in-progress">In Progress</option>
                  <option value="delayed">Delayed</option>
                </select>

                <button
                  onClick={() =>
                    submit(
                      "update_flight_status",
                      {
                        flight_num: statusFlightNum,
                        status: newStatus,
                        airline_name: airline
                      },
                      "Status updated."
                    )
                  }
                >
                  Update Status
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
