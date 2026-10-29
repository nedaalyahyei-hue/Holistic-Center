import React, { useState, useEffect } from "react";
import "./Center.css";
import {
  MdOutlineCalendarMonth, MdLanguage, MdOutlineReviews,
  MdMedicalServices, MdAccountCircle, MdAccessTime, MdFilterList,
  MdTrendingUp, MdAttachMoney,
} from "react-icons/md";
import { FaMoon, FaSun, FaBars, FaStar, FaRegStar, FaUserAlt } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const chartBox = {
  background: "#ffffff",
  padding: "30px",
  borderRadius: "18px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  marginBottom: "20px",
};

const chartTitle = {
  color: "#34483D",
  fontSize: "22px",
  marginBottom: "25px",
  textAlign: "center",
};

const axisTick = { fill: "#64756B", fontSize: 12 };

const thStyle = {
  padding: "12px 10px",
  textAlign: "center",
  borderBottom: "2px solid #79A99D",
  color: "#34483D",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 10px",
  textAlign: "center",
  borderBottom: "1px solid #eee",
};

export default function CenterDashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeCard, setActiveCard] = useState("");

  const [bookings, setBookings] = useState([]);

  const [filterDate, setFilterDate] = useState("");
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadBookings = async () => {
      try {
        const res = await fetch(`http://localhost:3002/bookings/center/${user._id}`);
        const result = await res.json();
        if (result.message === "success") setBookings(result.bookings);
      } catch (error) {
        console.log(error);
      }
    };

    loadBookings();
  }, []);

  // Years available (always include current year)
  const years = Array.from(
    new Set([String(new Date().getFullYear()), ...bookings.map((b) => b.date.slice(0, 4))])
  ).sort();

  // Bookings list (filtered by year + optional date)
  const filteredBookings = bookings.filter((b) => {
    const matchesDate = filterDate === "" || b.date === filterDate;
    const matchesYear = b.date.startsWith(filterYear);
    return matchesDate && matchesYear;
  });

  // Monthly chart data for the selected year
  const monthlyData = MONTHS.map((m, i) => {
    const prefix = `${filterYear}-${String(i + 1).padStart(2, "0")}`;
    return {
      month: m,
      total: bookings.filter((b) => b.date.startsWith(prefix)).length,
    };
  });

  const allServicesCount = new Set(bookings.map((b) => b.treatmentName)).size;

  // Table data: rows = services, columns = months (selected year)
  const yearBookings = bookings.filter((b) => b.date.startsWith(filterYear));
  const serviceNames = [...new Set(yearBookings.map((b) => b.treatmentName))];

  const monthlyTable = serviceNames.map((name) => {
    const perMonth = MONTHS.map((_, i) => {
      const prefix = `${filterYear}-${String(i + 1).padStart(2, "0")}`;
      return yearBookings.filter(
        (b) => b.treatmentName === name && b.date.startsWith(prefix)
      ).length;
    });
    return {
      name,
      perMonth,
      total: perMonth.reduce((a, b) => a + b, 0),
      revenue: yearBookings
        .filter((b) => b.treatmentName === name)
        .reduce((sum, b) => sum + b.price, 0),
    };
  });

  const monthTotals = MONTHS.map((_, i) =>
    monthlyTable.reduce((sum, r) => sum + r.perMonth[i], 0)
  );
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);
  const grandRevenue = monthlyTable.reduce((sum, r) => sum + r.revenue, 0);

  const YearSelect = () => (
    <div className="filter-item">
      <label><MdFilterList /> Year:</label>
      <select
        className="styled-select"
        value={filterYear}
        onChange={(e) => setFilterYear(e.target.value)}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={`center-page ${darkMode ? "dark" : ""}`}>
      <div className="center-overlay">
        <div className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setOpen(!open)}><FaBars /></button>
            <button className="icon-btn profile-nav-btn" onClick={() => navigate("/center/center-profile")}>
              <MdAccountCircle size={32} />
            </button>
            <span className="menu-text">Center Panel</span>
          </div>

          <div className="topbar-center">
            <div className="nav-item active">Dashboard</div>
          </div>

          <div className="topbar-right">
            <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <FaSun color="#f1c40f" /> : <FaMoon />}
            </button>
            <button className="icon-btn"><MdLanguage /></button>
          </div>
        </div>

        <div className="layout">
          <div className={`sidebar ${open ? "open" : ""}`}>
            <div className="sidebar-content">
              <div className="sidebar-item" onClick={() => navigate("/center/center-profile")}>Profile</div>
              <div className="sidebar-item active">Dashboard</div>
              <div className="sidebar-item" onClick={() => navigate("/center/management")}>Management</div>
              <div className="sidebar-item" onClick={() => navigate("/center/appointment-refundApproval")}>Refund Requests</div>
              <div className="sidebar-item" onClick={() => navigate("/center/add-treatment")}>Add Treatment</div>
              <div className="sidebar-item" onClick={() => navigate("/center/edit-treatment")}>Edit Treatment</div>
              <div className="sidebar-item" onClick={() => navigate("/center/management-appointment")}>Management Appointments</div>
            </div>

            <div className="sidebar-logout" onClick={() => navigate("/")}>
              <IoLogOutOutline size={20} /> Logout
            </div>
          </div>

          <div className="content-wrapper">
            <h2 className="title">Center Dashboard</h2>

            <div className="cards-container">
              <div
                className={`card clickable-card ${activeCard === "bookings" ? "active-card" : ""}`}
                onClick={() => setActiveCard(activeCard === "bookings" ? "" : "bookings")}
              >
                <MdOutlineCalendarMonth className="card-icon" />
                <p>Total Booking</p>
                <h3>{bookings.length}</h3>
              </div>

              <div className="card">
                <MdOutlineReviews className="card-icon" />
                <p>Reviews</p>
                <div className="stars-row">
                  <FaStar color="#f1c40f" /><FaStar color="#f1c40f" /><FaStar color="#f1c40f" /><FaStar color="#f1c40f" /><FaRegStar color="#f1c40f" />
                </div>
                <h3>4.0</h3>
              </div>

              <div
                className={`card clickable-card ${activeCard === "analysis" ? "active-card" : ""}`}
                onClick={() => setActiveCard(activeCard === "analysis" ? "" : "analysis")}
              >
                <MdMedicalServices className="card-icon" />
                <p>Services Analysis Per Month</p>
                <h3>{allServicesCount}</h3>
              </div>
            </div>

            {activeCard === "bookings" && (
              <div className="output-section">
                <div style={chartBox}>
                  <h2 style={chartTitle}>Monthly Bookings ({filterYear})</h2>
                  <div className="filter-container-row" style={{ marginBottom: "15px" }}>
                    <YearSelect />
                  </div>

                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                        barCategoryGap="45%"
                      >
                        <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E8EDE9" />
                        <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: "#F3F7F4" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #E8EDE9",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          }}
                        />
                        <Bar
                          dataKey="total"
                          name="Bookings"
                          fill="#79A99D"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={65}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="filter-container-row">
                  <div className="filter-item">
                    <label><MdOutlineCalendarMonth /> Date:</label>
                    <input
                      type="date"
                      className="styled-date-input"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                  <button className="reset-btn" onClick={() => setFilterDate("")}>Reset</button>
                </div>

                <div className="result-cards-grid">
                  {filteredBookings.length === 0 && <p>No bookings found.</p>}
                  {filteredBookings.map((b) => (
                    <div key={b._id} className="info-result-card">
                      <div className="res-header">
                        <span className="type-badge">{b.treatmentName}</span>
                        <span className="price-text">{b.price} OMR</span>
                      </div>
                      <div className="res-body">
                        <h4><FaUserAlt size={12} /> {b.customerName}</h4>
                        <p>{b.customerEmail}</p>
                        <div className="res-footer">
                          <span><MdOutlineCalendarMonth size={14} /> {b.date}</span>
                          <span><MdAccessTime size={14} /> {b.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCard === "analysis" && (
              <div className="output-section">
                <div style={chartBox}>
                  <h2 style={chartTitle}>Services Analysis Per Month ({filterYear})</h2>

                  <div className="filter-container-row" style={{ marginBottom: "15px" }}>
                    <YearSelect />
                  </div>

                  <div className="analysis-summary-row">
                    <div className="summary-mini-card">
                      <MdTrendingUp color="#76a37b" />
                      <span>Bookings: <strong>{grandTotal}</strong></span>
                    </div>
                    <div className="summary-mini-card">
                      <MdAttachMoney color="#2c3123" />
                      <span>Revenue: <strong>{grandRevenue} OMR</strong></span>
                    </div>
                  </div>

                  {monthlyTable.length === 0 ? (
                    <p style={{ textAlign: "center", marginTop: "20px" }}>
                      No data for this year.
                    </p>
                  ) : (
                    <div style={{ overflowX: "auto", marginTop: "20px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={{ ...thStyle, textAlign: "left" }}>Service</th>
                            {MONTHS.map((m) => (
                              <th key={m} style={thStyle}>{m}</th>
                            ))}
                            <th style={thStyle}>Total</th>
                            <th style={thStyle}>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyTable.map((row) => (
                            <tr key={row.name}>
                              <td style={{ ...tdStyle, textAlign: "left", fontWeight: "bold" }}>
                                {row.name}
                              </td>
                              {row.perMonth.map((n, i) => (
                                <td key={i} style={{ ...tdStyle, color: n === 0 ? "#bbb" : "#000" }}>
                                  {n}
                                </td>
                              ))}
                              <td style={{ ...tdStyle, fontWeight: "bold" }}>{row.total}</td>
                              <td style={tdStyle}>{row.revenue} OMR</td>
                            </tr>
                          ))}
                          <tr style={{ background: "#F3F7F4", fontWeight: "bold" }}>
                            <td style={{ ...tdStyle, textAlign: "left" }}>Total</td>
                            {monthTotals.map((n, i) => (
                              <td key={i} style={tdStyle}>{n}</td>
                            ))}
                            <td style={tdStyle}>{grandTotal}</td>
                            <td style={tdStyle}>{grandRevenue} OMR</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}