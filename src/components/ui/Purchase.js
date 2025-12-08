import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Purchase.css";

export default function Purchase({ flight, userInfo, navigate, close }) {
  const isAgent = userInfo?.role?.toLowerCase().includes("agent");

  const [seatClasses, setSeatClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [basePrice, setBasePrice] = useState(0);

  // -----------------------------
  // POPUP TOAST STATE
  // -----------------------------
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: ""
  });

  const showPopup = (message, type) => {
    setPopup({ show: true, message, type });
    setTimeout(() => {
      setPopup({ show: false, message: "", type: "" });
    }, type === "success" ? 1500 : 2000);
  };

  const canConfirm =
    selectedClass && (!isAgent || customerEmail.trim().length > 0);

  // Helper dates
  const departDate = flight?.departure_time
    ? new Date(flight.departure_time)
    : null;
  const arriveDate = flight?.arrival_time
    ? new Date(flight.arrival_time)
    : null;

  const departTimeStr = departDate
    ? departDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "-";

  const arriveTimeStr = arriveDate
    ? arriveDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "-";

  const departDateStr = departDate
    ? departDate.toLocaleDateString()
    : "";

  // ============================================================
  // LOAD SEAT CLASSES + SOLD COUNT + PRICE FACTOR
  // ============================================================
  useEffect(() => {
    const loadSeatClasses = async () => {
      try {
        const classRes = await axios.get(
          `http://localhost:8080/staff/get_seat_classes/${flight.airline_name}/${flight.airplane_id}`
        );

        const classes = classRes.data.classes || [];

        const classData = await Promise.all(
          classes.map(async (sc) => {
            const soldRes = await axios.get(
              `http://localhost:8080/tickets/sold/${flight.airline_name}/${flight.flight_num}/${sc.class}`
            );

            return {
              ...sc,
              sold: soldRes.data.sold,
              available: sc.capacity - soldRes.data.sold,
              final_price: (flight.price * sc.price_factor).toFixed(2)
            };
          })
        );

        setSeatClasses(classData);
        setBasePrice(flight.price);
      } catch (err) {
        console.error("Failed loading seat classes:", err);
        showPopup("Failed to load seat classes.", "error");
      }
    };

    loadSeatClasses();
  }, [flight]);

  // ============================================================
  // PURCHASE BUTTON HANDLER
  // ============================================================
  const handleConfirm = async () => {
    if (!selectedClass) {
      showPopup("Please select a seat class.", "error");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/tickets/purchase", {
        customer_email: isAgent ? customerEmail : userInfo.email,
        agent_email: isAgent ? userInfo.email : null,
        airline_name: flight.airline_name,
        flight_num: flight.flight_num,
        seat_class: selectedClass
      });

      showPopup(
        `Purchase successful! Ticket Price: $${res.data.price_charged}`,
        "success"
      );

      // Close modal after success popup fades
      setTimeout(() => {
        close();
        if (!isAgent && typeof navigate === "function") {
          navigate("/customer/tickets");
        }
      }, 1500);
    } catch (err) {
      showPopup(err.response?.data?.detail || "Purchase failed.", "error");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="purchase-overlay" onClick={close}>
      <div className="purchase-box" onClick={(e) => e.stopPropagation()}>

        {/* POPUP MESSAGE */}
        {popup.show && (
          <div className={`popup-banner ${popup.type}`}>
            {popup.message}
          </div>
        )}

        <button className="purchase-close-btn" onClick={close}>
          ×
        </button>

        {/* =============================
            FLIGHT SUMMARY HEADER
        ============================== */}
        <div className="purchase-summary">
          <div className="summary-route">
            <strong>{flight.departure_airport}</strong>
            <span className="arrow">→</span>
            <strong>{flight.arrival_airport}</strong>
          </div>

          <div className="summary-details">
            {departDateStr && <span>{departDateStr}</span>}
            {departDateStr && <span className="dot">•</span>}
            <span>
              {departTimeStr} – {arriveTimeStr}
            </span>
          </div>

          {/* If you don’t have full airport names, just omit this row */}
          {/* <div className="airport-names">
            <span>{flight.departure_airport}</span>
            <span className="arrow-sm">→</span>
            <span>{flight.arrival_airport}</span>
          </div> */}

          <div className="airline-info">
            <strong>{flight.airline_name}</strong>
            <span className="dot">•</span>
            <span>Airplane ID: {flight.airplane_id}</span>
          </div>
        </div>

        <div className="section-divider" />

        {/* =============================
            SEAT CLASS SELECTION
        ============================== */}
        <h3 className="section-header">Choose Class</h3>

        <div className="purchase-class-list">
          {seatClasses.map((sc, index) => (
            <div
              key={index}
              className={`class-row ${
                selectedClass === sc.class ? "active" : ""
              } ${sc.available === 0 ? "disabled" : ""}`}
              onClick={() => sc.available > 0 && setSelectedClass(sc.class)}
            >
              <span className="class-label">{sc.class.toUpperCase()}</span>

              <span className="class-price">${sc.final_price}</span>

              <span className="class-availability">
                {sc.available > 0 ? `${sc.available} seats left` : "Sold Out"}
              </span>
            </div>
          ))}
        </div>

        <div className="section-divider" />

        {/* =============================
            AGENT CUSTOMER EMAIL
        ============================== */}
        {isAgent && (
          <>
            <h3 className="section-header">Customer Email</h3>

            <div className="agent-fields">
              <div className="agent-input">
                <label>Email *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            <div className="section-divider" />
          </>
        )}

        {/* =============================
            CONFIRM BUTTON
        ============================== */}
        <div className="confirm-row">
          <button
            className={`confirm-btn ${canConfirm ? "" : "disabled"}`}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Confirm Purchase →
          </button>
        </div>
      </div>
    </div>
  );
}
