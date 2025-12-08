import React from "react";
import "./Sidebar.css";

export default function Sidebar({ role, navigate, sidebarOpen, page, userInfo }) {
  
  const staffPermission = userInfo?.permission || null;
  const isAdmin = staffPermission === "admin" || staffPermission === "both";
  const isOperator = staffPermission === "operator" || staffPermission === "both";

  // const staffMenu = ;

  const menu = {
    customer: [
      { label: "My Dashboard", path: "/customer" },
      { label: "Search Flights", path: "/flights" },
      { label: "My Flights", path: "/customer/flights" },
      { label: "My Spending", path: "/customer/spending" }
    ],

    agent: [
      { label: "Dashboard", path: "/agent" },
      { label: "Search Flights", path: "/flights" },
      { label: "Purchased Flights", path: "/agent/flights" },
      { label: "Analytics", path: "/agent/analytics" }
    ],

    staff: [
      { label: "Dashboard", path: "/staff" },
      { label: "Scheduled Flights", path: "/staff/flights" },
      { label: "Analytics", path: "/staff/analytics" },
      { label: "Management", path: "/staff/management" }
    ]
  };

  const items = menu[role] || [];

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-menu">

        {items.map(item => {
          const isActive = page === item.path;

          return (
            <div
              key={item.path}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </div>
          );
        })}

      </div>
    </div>
  );
}
