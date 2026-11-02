import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { TiThMenu } from "react-icons/ti";
import { RiArrowGoBackFill } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import { MdDarkMode, MdOutlineLanguage } from "react-icons/md";
import { FaSun } from "react-icons/fa";
import "./Customer.css";

export default function CustomerLayout({ children }) {
  const [open, setOpen] = useState(true);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("customerDarkMode") === "true"
  );

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("customerDarkMode", darkMode);
  }, [darkMode]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const goToContact = () => {
    window.location.href = "/home#contact";
  };

  return (
    <div className={`customer-page ${darkMode ? "dark" : ""}`}>
      <div className="customer-navbar">
        <div className="nav-left">
          <button
            className="menu-btn"
            type="button"
            onClick={() => setOpen(!open)}
          >
            <TiThMenu className="menu-icon" />
          </button>

          <Link to="/customer/update-profile">
            <CgProfile className="profile-icon" />
          </Link>
        </div>

        <div className="nav-center">
          <NavLink
            to="/home"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            Home
          </NavLink>

          <NavLink
            to="/customer/centers"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            Centers
          </NavLink>


          <NavLink
            to="/login"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            Login
          </NavLink>
        </div>

        <div className="nav-right">
          {darkMode ? (
            <FaSun className="nav-icon" onClick={() => setDarkMode(false)} />
          ) : (
            <MdDarkMode className="nav-icon" onClick={() => setDarkMode(true)} />
          )}

          <MdOutlineLanguage className="nav-icon" />
        </div>
      </div>

      <div className="customer-main">
        {open && (
          <div className="customer-sidebar">
            <Link to="/customer/centers">Centers</Link>
            <Link to="/customer/dashboard">Dashboard</Link>
            <Link to="/customer/history">Booking History</Link>
            <Link to="/customer/chatbot">Chatbot</Link>
            <Link to="/customer/contact">Contact With Centers</Link>
            <Link to="/customer/contact-admin">Contact With Admin</Link>
            

            <div className="logout-link" onClick={logout}>
              Logout
            </div>
          </div>
        )}

        {children}

        <div className="floating-back-btn" onClick={() => navigate(-1)}>
          <RiArrowGoBackFill />
        </div>
      </div>
    </div>
  );
}
