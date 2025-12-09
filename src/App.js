import React, { useState, useEffect } from "react";
import "./App.css";

import Flight from "./components/ui/Flights";
import Navbar from "./components/ui/Navbar";
import Sidebar from "./components/ui/Sidebar";
import Purchase from "./components/ui/Purchase";

import Customer from "./components/customer/Customer";
import CustomerFlights from "./components/customer/CustomerFlights";
import Spending from "./components/customer/Spending";

import Agent from "./components/agent/Agent";
import AgentFlights from "./components/agent/AgentFlights";
import AgentAnalytics from "./components/agent/AgentAnalytics";

import Staff from "./components/staff/Staff";
import StaffFlights from "./components/staff/StaffFlights";
import StaffAnalytics from "./components/staff/StaffAnalytics";
import Management from "./components/staff/Management";

function App() {
  // SESSION STATE --------------------
  const [userInfo, setUserInfo] = useState(() => {
    const saved = localStorage.getItem("userInfo");
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("userInfo");
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    } else {
      localStorage.removeItem("userInfo");
    }
  }, [userInfo]);

  function protect(requiredRole, Component) {
    if (!userInfo || !userInfo.role) {
      if (userInfo && userInfo.role === "staff") {navigate("/staff/flights");}
      else { navigate("/flights");}
      return null;
    }

    if (userInfo.role !== requiredRole) {
      navigate(`/${userInfo.role}`); // redirect to role dashboard
      return null;
    }

    return <Component userInfo={userInfo} />;
  }


  // PAGE NAVIGATION --------------------
  const [page, setPage] = useState(window.location.pathname);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setPage(path);
  };

  useEffect(() => {
    window.onpopstate = () => setPage(window.location.pathname);
  }, []);

  // SIDEBAR CONTROL --------------------
  const dashboardPages = ["/customer", "/agent", "/staff"];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (dashboardPages.includes(page) && userInfo) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [page, userInfo]);

  const toggleSidebar = () => {
    if (dashboardPages.includes(page)) return;
    setSidebarOpen((prev) => !prev);
  };

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setUserInfo(user);

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userInfo", JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userInfo");

    navigate("/flights");
  };

  const role = userInfo?.role;

  // PAGE RENDERING --------------------
  const renderPage = () => {
    // Public route — always visible
    if (page === "/flights") return <Flight userInfo={userInfo} />;

    // Public: purchase page (user not required)
    if (page === "/purchase") return <Purchase navigate={navigate} userInfo={userInfo} />;

    // Protected routes
    if (!isLoggedIn) {
      navigate("/flights");
      return null;
    }

    switch (page) {
      // CUSTOMER pages
      case "/customer":
        return protect("customer", Customer);
      case "/customer/flights":
        return protect("customer", CustomerFlights);
      case "/customer/spending":
        return protect("customer", Spending);

      // AGENT pages
      case "/agent":
        return protect("agent", Agent);
      case "/agent/flights":
        return protect("agent", AgentFlights);
      case "/agent/analytics":
        return protect("agent", AgentAnalytics);

      // STAFF pages
      case "/staff":
        return protect("staff", Staff);
      case "/staff/flights":
        return protect("staff", StaffFlights);
      case "/staff/analytics":
        return protect("staff", StaffAnalytics);
      case "/staff/management":
        return protect("staff", Management);

      default:
        navigate("/flights");
        return null;
    }

  };

  return (
    <div className="app-container">

      <Navbar
        navigate={navigate}
        role={role}
        userInfo={userInfo}
        setUserInfo={setUserInfo}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        toggleSidebar={toggleSidebar}
      />

      <div className={`main-layout ${sidebarOpen ? "shifted" : ""}`}>

        {isLoggedIn && userInfo && (
          <Sidebar
            role={role}
            navigate={navigate}
            sidebarOpen={sidebarOpen}
            page={page}
            userInfo={userInfo}
          />
        )}

        <div
          className={`content-area
            ${dashboardPages.includes(page) ? "dashboard-size" : ""}
            ${sidebarOpen ? "sidebar-open" : ""}
          `}
        >
          <div className="page">{renderPage()}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
