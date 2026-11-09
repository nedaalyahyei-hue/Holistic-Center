import React, { useState } from "react";
import "./Admin.css";
import { FaMoon, FaSun, FaBars, FaPlus, FaHome, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdLanguage, MdDashboard } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import MessageNotification from "./MessageNotification";
import CenterValidation from "../../validations/CenterValidation";
import { FaRegUserCircle } from "react-icons/fa";

export default function RegisterCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  const handleRegister = async () => {
    setMessage("");
    setError("");

    // Validate center registration fields
    try {
      await CenterValidation.validate(
        {
          username: name,
          email,
          phone,
          crNumber,
          password,
          confirmPassword,
        },
        { abortEarly: true }
      );
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    const newCenter = {
      username: name,
      email,
      phone,
      crNumber,
      password,
    };

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3002/register-center", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCenter),
      });

      const result = await response.json();

      if (!response.ok || result.message !== "success") {
        setError(result.message || "Registration failed");
        return;
      }
    } catch (error) {
      setError("Cannot connect to server");
      return;
    }

    setMessage("A confirmation email has been sent. Please check your email and confirm your account.");
    setName("");
    setEmail("");
    setPhone("");
    setCrNumber("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className={`admin-page ${darkMode ? "dark" : ""}`}>
      <div className="overlay">
        <div className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setOpen(!open)}>
              <FaBars />
            </button>

            <button
              className="icon-btn"
              onClick={() => navigate("/admin/profile")}
              title="Admin Profile"
              style={{ fontSize: "38px" }}
            >
              <FaRegUserCircle />
            </button>
          </div>
          <div className="topbar-center">
            <span
              className="nav-item"
              onClick={() => navigate("/admin/dashboard")}
            >
              Dashboard
            </span>

            <span
              className="nav-item"
              onClick={() => navigate("/admin/management")}
            >
              Admin Management
            </span>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={() => navigate("/admin/messages")}><FaEnvelope /></button>
            <button className="icon-btn" onClick={() => navigate("/admin/dashboard")}><FaHome /></button>
            <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <FaSun color="#f1c40f" /> : <FaMoon />}
            </button>
            <button className="icon-btn"><MdLanguage /></button>
          </div>
        </div>

        <div className="layout">
          <div className={`sidebar ${open ? "open" : ""}`}>
            <div className="sidebar-content">
              <div className="sidebar-item" onClick={() => navigate("/admin/dashboard")}>Dashboard</div>
              <div className="sidebar-item" onClick={() => navigate("/admin/management")}>Admin Management</div>
              <div className="sidebar-item active">Register Center</div>
              <div
                className="sidebar-item"
                onClick={() => navigate("/admin/treatments")}
              >
                Treatment Management
              </div>
              <div
                className="sidebar-item"
                onClick={() => navigate("/admin/messages")}
              >
                Messages
                <MessageNotification />
              </div>

            </div>
            <div className="sidebar-logout" onClick={() => navigate("/")}>
              <IoLogOutOutline style={{ marginRight: '8px' }} /> Logout
            </div>
          </div>

          <div className="content-wrapper">
            <img src="/logo.png" alt="logo" className="logo" />
            <h2 className="title">Register New Center</h2>
            <div className="management-card">
              {message && <p style={{ color: '#76a37b', fontWeight: 'bold' }}>{message}</p>}
              {error && <p style={{ color: '#c0392b', fontWeight: 'bold' }}>{error}</p>}

              <input
                type="text"
                placeholder="Enter Center Name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="centername@gmail.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="text"
                placeholder="CR Number"
                className="input"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#76a37b' }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#76a37b' }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button
                className="remove-btn"
                style={{ backgroundColor: '#76a37b' }}
                onClick={handleRegister}
              >
                <FaPlus style={{ marginRight: '8px' }} /> Register Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
