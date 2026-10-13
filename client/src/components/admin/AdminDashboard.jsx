import React, { useState, useEffect } from "react";
import "./Admin.css";
import { MdLanguage } from "react-icons/md";
import { FaUsers, FaPlus, FaMoon, FaSun, FaBars, FaHome } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeCard, setActiveCard] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [centers, setCenters] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [usersData, setUsersData] = useState([]);

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await fetch("http://localhost:3002/admin/centers");

        if (!res.ok) {
          throw new Error("Failed to fetch centers");
        }

        const data = await res.json();

        setCenters(
          data.map((center) => ({
            id: center._id,
            name: center.centerName,
            img: center.image,
            location: center.location,
            date: "",
            email: "",
            phone: "",
          }))
        );
      } catch (error) {
        console.error("Error fetching centers:", error);
      }
    };

    fetchCenters();
  }, []);

  useEffect(() => {
    const fetchCustomersCount = async () => {
      try {
        const res = await fetch("http://localhost:3002/admin/customers/count");

        if (!res.ok) {
          throw new Error("Failed to fetch customers count");
        }

        const data = await res.json();
        console.log("Centers from MongoDB:", data);
        setTotalCustomers(data.totalCustomers);
      } catch (error) {
        console.error("Error fetching customers count:", error);
      }
    };

    fetchCustomersCount();
  }, []);


  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("http://localhost:3002/admin/customers");

        if (!res.ok) {
          throw new Error("Failed to fetch customers");
        }

        const data = await res.json();

        setUsersData(
          data.map((user) => ({
            id: user._id,
            name: user.username,
            email: user.email,
          }))
        );
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  const bookingsData = [
    { id: 1, userEmail: "ahmed.balushi@example.com", date: "15 May 2026", time: "10:00 AM", center: "Abna Freish Center" },
    { id: 2, userEmail: "sara.riyami@example.com", date: "16 May 2026", time: "11:30 AM", center: "Muscat Hijama Center" },
    { id: 3, userEmail: "mazin.harthy@example.com", date: "18 May 2026", time: "09:00 AM", center: "BMC Center" },
  ];

  const sortedCenters = [...centers].sort((a, b) => {
    return sortOrder === "newest"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date);
  });

  return (
    <div className={`admin-page ${darkMode ? "dark" : ""}`}>
      <div className="overlay">
        <div className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setOpen(!open)}><FaBars /></button>
            <span className="menu-text">Menu</span>
          </div>
          <div className="topbar-center">
            <span className="nav-item active" onClick={() => navigate("/admin/dashboard")}>Dashboard</span>
            <span className="nav-item" onClick={() => navigate("/admin/management")}>Admin Management</span>
            <span className="nav-item" onClick={() => navigate("/admin/register-center")}>Register Center</span>
          </div>
          <div className="topbar-right">
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
              <div className="sidebar-item active" onClick={() => navigate("/admin/dashboard")}>Dashboard</div>
              <div className="sidebar-item" onClick={() => navigate("/admin/management")}>Admin Management</div>
              <div className="sidebar-item" onClick={() => navigate("/admin/register-center")}>Register Center</div>
            </div>
            <div className="sidebar-logout" onClick={() => navigate("/")}>
              <IoLogOutOutline style={{ marginRight: '8px' }} /> Logout
            </div>
          </div>

          <div className="content-wrapper">
            <h2 className="title">Admin Dashboard</h2>

            <div className="cards-container">
              <div
                className={`card clickable-card ${activeCard === "centers" ? "active-card" : ""}`}
                onClick={() => setActiveCard(activeCard === "centers" ? "" : "centers")}
              >
                <FaHome className="card-icon" />
                <p>Total Centers</p>
                <h3>{centers.length}</h3>
              </div>

              <div
                className={`card clickable-card ${activeCard === "users" ? "active-card" : ""}`}
                onClick={() => setActiveCard(activeCard === "users" ? "" : "users")}
              >
                <FaUsers className="card-icon" />
                <p>Total Users</p>
                <h3>{totalCustomers}</h3>
              </div>

              <div
                className={`card clickable-card ${activeCard === "bookings" ? "active-card" : ""}`}
                onClick={() => setActiveCard(activeCard === "bookings" ? "" : "bookings")}
              >
                <FaPlus className="card-icon" />
                <p>Total Booking</p>
                <h3>{bookingsData.length}</h3>
              </div>
            </div>

            {activeCard === "centers" && (
              <div className="dashboard-record-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>Centers Summary</h2>
                  <select
                    className="input"
                    style={{ width: 'auto', padding: '5px 10px' }}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                <div className="records-grid">
                  {sortedCenters.map((center) => (
                    <div
                      key={center.id}
                      className="dashboard-record-card"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate("/customer/center-details", {
                          state: { center },
                        })
                      }
                    >
                      <p><strong>Center Name:</strong> {center.name}</p>
                      <p><strong>Email:</strong> {center.email}</p>
                      <p><strong>Phone:</strong> {center.phone}</p>
                      <p><strong>Registration Date:</strong> {center.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCard === "users" && (
              <div className="dashboard-record-box">
                <h2>Users Summary</h2>
                <div className="records-grid">
                  {usersData.map((user) => (
                    <div key={user.id} className="dashboard-record-card">
                      <p><strong>Name:</strong> {user.name}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCard === "bookings" && (
              <div className="dashboard-record-box">
                <h2>Bookings Summary</h2>
                <div className="records-grid">
                  {bookingsData.map((booking, index) => (
                    <div key={index} className="dashboard-record-card">
                      <p><strong>User:</strong> {booking.userEmail}</p>
                      <p><strong>Center:</strong> {booking.center}</p>
                      <p><strong>Date:</strong> {booking.date} | {booking.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}