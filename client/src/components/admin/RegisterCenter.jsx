import React, { useState } from "react";
import "./Admin.css";
import { FaMoon, FaSun, FaBars, FaPlus, FaHome, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdLanguage, MdDashboard } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function RegisterCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setMessage("");
    setError("");

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.endsWith(".om")) {
      setError("Email must end with .om");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const newCenter = {
      username: name,
      email,
      phone,
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
      if (!response.ok) {
        setError(result.message || "Registration failed");
        return;
      }
    } catch (error) {
      setError("Cannot connect to server");
      return;
    }

    setMessage("Center registered successfully!");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className={`admin-page ${darkMode ? "dark" : ""}`}>
      <div className="overlay">
        <div className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setOpen(!open)}><FaBars /></button>
            <span className="menu-text">Menu</span>
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
              <div className="sidebar-item" onClick={() => navigate("/admin/messages")}>Messages</div>
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
                placeholder="Center Nick Name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Center Email (... .om)"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
