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
  const [unreadAdminMessages, setUnreadAdminMessages] = useState(0);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("customerDarkMode") === "true"
  );

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("customerDarkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?._id) return;

      try {
        const res = await fetch("http://localhost:3002/messages");
        const data = await res.json();

        if (data.message === "success") {
          const unread = data.messages.filter(
            (msg) =>
              msg.customerId === user._id &&
              msg.sender === "admin" &&
              !msg.isRead
          );

          setUnreadAdminMessages(unread.length);
        }
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    fetchUnreadMessages();

    const handleMessagesRead = () => {
      setUnreadAdminMessages(0);
    };

    window.addEventListener("adminMessagesRead", handleMessagesRead);
    const interval = setInterval(fetchUnreadMessages, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("adminMessagesRead", handleMessagesRead);
    };
  }, []);

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
            <Link to="/customer/contact">Centers Contact</Link>
            <Link
              to="/customer/contact-admin"
              onClick={() => setUnreadAdminMessages(0)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                fontSize: "18px",
              }}
            >
              Messages With Admin

              {unreadAdminMessages > 0 && (
                <span
                  style={{
                    backgroundColor: "#e74c3c",
                    color: "white",
                    borderRadius: "50%",
                    padding: "4px 8px",
                    flexShrink: 0,
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  {unreadAdminMessages}
                </span>
              )}
            </Link>


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
