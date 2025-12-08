import React, { useState } from "react";
import axios from "axios";
import "./Navbar.css";
import Login from "./Login";
import Register from "./Register";
import RegisterForm from "./RegisterForm";

function Navbar(props, ref) {
  const {
    navigate,
    role,
    userInfo,
    setUserInfo,
    handleLogin,
    handleLogout,
    toggleSidebar
  } = props;

  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState("login");
  const [registerError, setRegisterError] = useState("");

  const isLoggedIn = Boolean(userInfo);

  const handleRegister = async (extraData) => {
    try {
      if (!extraData) {
        setRegisterError("Registration error: missing data.");
        return;
      }

      const {
        email,
        password,
        role: registerRole,
        first_name,
        last_name,
        date_of_birth,
        airline_name,
        permission,
        name
      } = extraData;

      const role = registerRole.toLowerCase();

      let payload = {};
      let endpoint = "";

      if (role === "customer") {
        payload = {
          email,
          password,
          name: name || email.split("@")[0]
        };
        endpoint = "customer";
      }

      if (role === "agent") {
        payload = { email, password };
        endpoint = "agent";
      }

      if (role === "staff") {
        payload = {
          email,
          password,
          first_name,
          last_name,
          date_of_birth,
          airline_name,
          permission: permission.toLowerCase()
        };
        endpoint = "staff";
      }

      const response = await axios.post(
        `http://localhost:8080/auth/register/${endpoint}`,
        payload
      );

      handleLogin(response.data);

      setShowForm(false);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setRegisterError(err.response?.data?.detail || "Registration failed.");
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState(null);

  React.useEffect(() => {
    const openLogin = () => {
      setFormType("login");
      setShowModal(true);
    };

    window.addEventListener("open-login-modal", openLogin);
    return () => window.removeEventListener("open-login-modal", openLogin);
  }, []);

  return (
    <>
      <nav className="navbar" ref={ref}>

        <div className="navbar-left">
          {isLoggedIn && (
            <button
              className="sidebar-toggle-btn"
              onClick={toggleSidebar}
            >
              ☰
            </button>
          )}

          <div className="navbar-logo">
            WHEEEE~
          </div>
        </div>

        <div className="nav-links">

          {!isLoggedIn && (
            <button
              className="nav-btn"
              onClick={() => {
                setFormType("login");
                setShowModal(true);
              }}
            >
              Login / Register
            </button>
          )}

          {isLoggedIn && role === "customer" && (
            <>
              <button className="nav-btn" onClick={() => navigate("/flights")}>
                Search Flights
              </button>
              <button className="nav-btn" onClick={() => navigate("/customer")}>
                My Dashboard
              </button>
              <button className="nav-btn" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}

          {isLoggedIn && role === "agent" && (
            <>
              <button className="nav-btn" onClick={() => navigate("flights")}>
                Search Flights
              </button>
              <button className="nav-btn" onClick={() => navigate("/agent")}>
                Agent Dashboard
              </button>
              <button className="nav-btn" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}

          {isLoggedIn && role === "staff" && (
            <>
              <button className="nav-btn" onClick={() => navigate("/staff/flights")}>
                Scheduled Flights
              </button>
              <button className="nav-btn" onClick={() => navigate("/staff")}>
                Staff Dashboard
              </button>
              <button className="nav-btn" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}

        </div>
      </nav>

      {/* Login / Register Modal */}
      {showModal && (
        <div className="modal-overlay">

          <div className="modal-box" onClick={(e) => e.stopPropagation()}>

            <button
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>

            <div className="modal-tabs">
              <button
                className={formType === "login" ? "active-tab" : ""}
                onClick={() => setFormType("login")}
              >
                Login
              </button>

              <button
                className={formType === "register" ? "active-tab" : ""}
                onClick={() => setFormType("register")}
              >
                Register
              </button>
            </div>

            <div className="modal-content">
              {formType === "login" ? (
                <Login
                  navigate={navigate}
                  setUserInfo={setUserInfo}
                  handleLogin={handleLogin}
                  closeModal={() => setShowModal(false)}
                />
              ) : (
                <Register
                  navigate={navigate}
                  setUserInfo={setUserInfo}
                  proceedTo={(data) => {
                    setPendingRegistrationData(data);
                    setShowForm(true);
                  }}
                />
              )}
            </div>

          </div>
        </div>
      )}

      {/* Register form */}
      {showForm && (
        <div className="register-modal modal-overlay">
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>

            <RegisterForm
              baseData={pendingRegistrationData}
              onSubmit={handleRegister}
              close={() => {
                setShowForm(false);
                setShowModal(false);
              }}
            />
          </div>
        </div>
      )}

    </>
  );
};

export default Navbar;