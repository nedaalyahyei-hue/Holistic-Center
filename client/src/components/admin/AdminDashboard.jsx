import React, { useState, useEffect } from "react";
import "./Admin.css";
import { MdLanguage } from "react-icons/md";
import { FaUsers, FaPlus, FaMoon, FaSun, FaBars, FaHome,FaRegUserCircle } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, } from "recharts";
import MessageNotification from "./MessageNotification";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeCard, setActiveCard] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [centers, setCenters] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [usersData, setUsersData] = useState([]);
  const [monthlyUsers, setMonthlyUsers] = useState([]);

  const [userMonth, setUserMonth] = useState(
    new Date().getMonth() + 1
  );

  const [userYear, setUserYear] = useState(
    new Date().getFullYear()
  );

  const [monthlyCenters, setMonthlyCenters] = useState([]);

  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [bookingMonth, setBookingMonth] = useState(
    new Date().getMonth() + 1
  );
  const [bookingYear, setBookingYear] = useState(
    new Date().getFullYear()
  );

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
            date: center.createdAt || "",
            email: center.email || "",
            phone: center.phone || "",
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

  useEffect(() => {
    fetch("http://localhost:3002/admin/centers/monthly")
      .then((res) => res.json())
      .then((data) => setMonthlyCenters(data))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    const fetchMonthlyUsers = async () => {
      try {
        const res = await fetch("http://localhost:3002/admin/customers/monthly");

        if (!res.ok) {
          throw new Error("Failed to fetch monthly users");
        }

        const data = await res.json();

        setMonthlyUsers(
          data.map((item) => ({
            month: item._id,
            total: item.total,
          }))
        );
      } catch (error) {
        console.error("Error fetching monthly users:", error);
      }
    };

    fetchMonthlyUsers();
  }, []);

  useEffect(() => {
    const fetchMonthlyBookings = async () => {
      try {
        const response = await fetch(
          `http://localhost:3002/admin/bookings/monthly?month=${bookingMonth}&year=${bookingYear}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch monthly bookings");
        }

        const data = await response.json();
        setMonthlyBookings(data);
      } catch (error) {
        console.error("Error fetching monthly bookings:", error);
      }
    };

    fetchMonthlyBookings();
  }, [bookingMonth, bookingYear]);

  const bookingsData = [
    { id: 1, userEmail: "ahmed.balushi@example.com", date: "15 May 2026", time: "10:00 AM", center: "Abna Freish Center" },
    { id: 2, userEmail: "sara.riyami@example.com", date: "16 May 2026", time: "11:30 AM", center: "Muscat Hijama Center" },
    { id: 3, userEmail: "mazin.harthy@example.com", date: "18 May 2026", time: "09:00 AM", center: "BMC Center" },
  ];

  const sortedCenters = [...centers].sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;

    return sortOrder === "newest"
      ? dateB - dateA
      : dateA - dateB;
  });

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
              className="nav-item active"
              onClick={() => {
                setActiveCard("");
                document.querySelector(".content-wrapper")?.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              Dashboard
            </span>
            <span className="nav-item" onClick={() => navigate("/admin/management")}>Admin Management</span>
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
              <div
                className="sidebar-item active"
                onClick={() => {
                  setActiveCard("");
                  document.querySelector(".content-wrapper")?.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                Dashboard
              </div>

              <div className="sidebar-item" onClick={() => navigate("/admin/management")}>
                Admin Management
              </div>

              <div className="sidebar-item" onClick={() => navigate("/admin/register-center")}>
                Register Center
              </div>

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
            <h2 className="title">Admin Dashboard</h2>

            <div className="cards-container">
              <div
                className={`card clickable-card ${activeCard === "centers" ? "active-card" : ""}`}
                onClick={() => setActiveCard(activeCard === "centers" ? "" : "centers")}
              >
                <FaHome className="card-icon" />
                <p>Total Registered Centers</p>
                <h3>{centers.length}</h3>
              </div>

              <div
                className={`card clickable-card ${activeCard === "users" ? "active-card" : ""}`}
                onClick={() => setActiveCard(activeCard === "users" ? "" : "users")}
              >
                <FaUsers className="card-icon" />
                <p>Total Registered Users</p>
                <h3>{totalCustomers}</h3>
              </div>

              <div
                className={`card clickable-card ${activeCard === "bookings" ? "active-card" : ""}`}
                onClick={() => setActiveCard(activeCard === "bookings" ? "" : "bookings")}
              >
                <FaPlus className="card-icon" />
                <p>Total Booking Per Center</p>
                <h3>{monthlyBookings.reduce((sum, center) => sum + center.total, 0)}</h3>
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
                    <option value="newest">Sort by Newest</option>
                    <option value="oldest">Sort by Oldest</option>
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
              <div
                className="dashboard-record-box"
                style={{
                  background: "#ffffff",
                  padding: "30px",
                  borderRadius: "18px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h2
                  style={{
                    color: "#34483D",
                    fontSize: "22px",
                    marginBottom: "25px",
                    textAlign: "center",
                  }}
                >
                  Monthly Registered Users
                </h2>
                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    justifyContent: "center",
                    margin: "20px 0",
                  }}
                >
                  <select
                    value={userMonth}
                    onChange={(e) => setUserMonth(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2026, i, 1).toLocaleString("en-US", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>

                  <select
                    value={userYear}
                    onChange={(e) => setUserYear(Number(e.target.value))}
                  >
                    {[2025, 2026, 2027, 2028].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ width: "100%", height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyUsers.filter((item) => {
                        const [year, month] = item.month.split("-").map(Number);

                        return year === userYear && month === userMonth;
                      })}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="total"
                        name="Registered Users"
                        fill="#76a37b"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeCard === "bookings" && (
              <div
                className="dashboard-record-box"
                style={{
                  background: "#ffffff",
                  padding: "30px",
                  borderRadius: "18px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ textAlign: "center", color: "#34483D" }}>
                  Total Booking Per Center
                </h2>

                <div style={{ display: "flex", gap: "15px", justifyContent: "center", margin: "20px 0" }}>
                  <select
                    value={bookingMonth}
                    onChange={(e) => setBookingMonth(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2026, i, 1).toLocaleString("en-US", { month: "long" })}
                      </option>
                    ))}
                  </select>

                  <select
                    value={bookingYear}
                    onChange={(e) => setBookingYear(Number(e.target.value))}
                  >
                    {[2025, 2026, 2027, 2028].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div style={{ width: "100%", height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyBookings}
                      margin={{ top: 20, right: 20, left: 25, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="centerName"
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={110}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" name="Total Bookings" fill="#79A99D" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}