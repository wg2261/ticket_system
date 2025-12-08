import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Spending.css";

export default function Spending({ userInfo }) {
  const email = userInfo?.email;

  const [monthly, setMonthly] = useState([]);
  const [total12mo, setTotal12mo] = useState(0);
  const [range, setRange] = useState({ start: "", end: "" });
  const [customTotal, setCustomTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load 12-month spending
  useEffect(() => {
    if (!email) return;

    const loadData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/customer/spending/${email}`
        );

        setMonthly(res.data.monthly || []);
        setTotal12mo(res.data.last12Months || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [email]);

  // Custom range calculation FROM backend
  async function calculateCustom() {
    if (!range.start || !range.end) return;

    try {
      const res = await axios.get(
        `http://localhost:8080/customer/spending/${email}`,
        {
          params: {
            start: range.start + "-01",
            end: range.end + "-31",
          },
        }
      );

      setCustomTotal(res.data.last12Months || 0);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="spending-container">Loading...</div>;

  return (
    <div className="spending-container">
      <h2>My Spending</h2>

      {/* Summary Card */}
      <div className="spending-summary">
        <h3>Total Spending (Last 12 Months):</h3>
        <p className="total-amount">${total12mo.toFixed(2)}</p>
      </div>

      {/* Chart */}
      <div className="spending-chart">
        <h3>Monthly Spending</h3>

        <div className="bar-chart">
          {monthly.length === 0 ? (
            <p>No spending data found.</p>
          ) : (
            monthly.map((m, idx) => (
              <div key={idx} className="bar-box">
                <div
                  className="bar"
                  style={{
                    height: `${Math.min(m.total / 6, 140)}px`,
                  }}
                ></div>
                <label>{m.month}</label>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Custom Range */}
      <div className="custom-range">
        <h3>Custom Range</h3>

        <input
          type="month"
          value={range.start}
          onChange={(e) => setRange({ ...range, start: e.target.value })}
        />

        <input
          type="month"
          value={range.end}
          onChange={(e) => setRange({ ...range, end: e.target.value })}
        />

        <button
          onClick={calculateCustom}
          disabled={!range.start || !range.end}
        >
          Calculate
        </button>

        {customTotal !== null && (
          <p className="custom-total">
            Total Spending: ${customTotal.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}