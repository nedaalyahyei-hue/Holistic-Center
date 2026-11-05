import React, { useState, useEffect } from "react";
import "./Center.css";
import {
  MdOutlineCalendarMonth, MdOutlineReviews, MdMedicalServices,
  MdAccessTime, MdFilterList, MdTrendingUp, MdAttachMoney,
} from "react-icons/md";
import { FaUserAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";

const MONTH_KEYS = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12"];

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

// ألوان مخصصة للخطوط الخاصة بالخدمات في المخطط البياني
const SERVICE_COLORS = ["#79A99D", "#E07A5F", "#3D405B", "#81B29A", "#F4A261", "#2A9D8F"];

export default function CenterDashboard() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [activeCard, setActiveCard] = useState("");

  const [bookings, setBookings] = useState([]);

  const [filterDate, setFilterDate] = useState("");
  const [showAllBookings, setShowAllBookings] = useState(false);
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

  // Show bookings only after selecting a date or choosing "Show All Bookings"
  const filteredBookings = bookings.filter((b) => {
    if (showAllBookings) return true;
    if (filterDate) return b.date === filterDate;
    return false;
  });

  // Monthly chart data for the selected year
  const monthlyData = MONTH_KEYS.map((key, i) => {
    const prefix = `${filterYear}-${String(i + 1).padStart(2, "0")}`;
    return {
      month: t(key),
      total: bookings.filter((b) => b.date.startsWith(prefix)).length,
    };
  });

  const allServicesCount = new Set(bookings.map((b) => b.treatmentName)).size;

  // Table data: rows = services, columns = months (selected year)
  const yearBookings = bookings.filter((b) => b.date.startsWith(filterYear));
  const serviceNames = [...new Set(yearBookings.map((b) => b.treatmentName))];

  const monthlyTable = serviceNames.map((name) => {
    const perMonth = MONTH_KEYS.map((_, i) => {
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

  // تجهيز البيانات للمخطط الخطي (Line Chart) بحيث يكون كل شهر يحتوي على قيم الخدمات المختلفة
  const lineChartData = MONTH_KEYS.map((key, i) => {
    const item = { month: t(key) };
    monthlyTable.forEach((serv) => {
      item[serv.name] = serv.perMonth[i];
    });
    return item;
  });

  const monthTotals = MONTH_KEYS.map((_, i) =>
    monthlyTable.reduce((sum, r) => sum + r.perMonth[i], 0)
  );
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);
  const grandRevenue = monthlyTable.reduce((sum, r) => sum + r.revenue, 0);

  const YearSelect = () => (
    <div className="filter-item">
      <label><MdFilterList /> {t("year")}</label>
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
    <CenterShell active="dashboard">
      <h2 className="title">{t("centerDashboard")}</h2>

      <div className="cards-container">
        <div
          className={`card clickable-card ${activeCard === "bookings" ? "active-card" : ""}`}
          onClick={() => setActiveCard(activeCard === "bookings" ? "" : "bookings")}
        >
          <MdOutlineCalendarMonth className="card-icon" />
          <p>{t("totalBooking")}</p>
          <h3>{bookings.length}</h3>
        </div>

        <div className="card">
          <MdOutlineReviews className="card-icon" />
          <p>{t("reviews")}</p>
          <h3 style={{ fontSize: "18px" }}>{t("noReviews")}</h3>
        </div>

        <div
          className={`card clickable-card ${activeCard === "analysis" ? "active-card" : ""}`}
          onClick={() => setActiveCard(activeCard === "analysis" ? "" : "analysis")}
        >
          <MdMedicalServices className="card-icon" />
          <p>{t("servicesAnalysis")}</p>
          <h3>{allServicesCount}</h3>
        </div>
      </div> <br></br>

      {activeCard === "bookings" && (
        <div className="output-section">
          <div style={chartBox}>
            <h2 style={chartTitle}>{t("monthlyBookings", { year: filterYear })}</h2>
            <div className="filter-container-row" style={{ marginBottom: "15px" }}>
              <YearSelect />
            </div>

            {/* Monthly chart: all 12 months remain visible */}
            <div style={{ width: "100%", overflowX: "auto" }} dir="ltr">
              <div style={{ minWidth: "650px", height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 15 }}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 5"
                      vertical={false}
                      stroke="#E8EDE9"
                    />
                    <XAxis
                      dataKey="month"
                      interval={0}
                      minTickGap={0}
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                    />
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
                      name={t("bookings")}
                      fill="#79A99D"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Booking date filter and booking cards */}
          <div
            style={{
              background: "#ffffff",
              padding: "22px",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                color: "#34483D",
                textAlign: "center",
                fontSize: "21px",
                marginTop: 0,
                marginBottom: "20px",
              }}
            >
              Booking Details
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "end",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "22px",
              }}
            >
              <div className="filter-item" style={{ minWidth: "220px" }}>
                <label>
                  <MdOutlineCalendarMonth /> Select Booking Date
                </label>
                <input
                  type="date"
                  className="styled-date-input"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setShowAllBookings(false);
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setFilterDate("");
                  setShowAllBookings(true);
                }}
                style={{
                  background: "#79A99D",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 18px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Show All Bookings
              </button>

              {(filterDate || showAllBookings) && (
                <button
                  type="button"
                  className="reset-btn"
                  onClick={() => {
                    setFilterDate("");
                    setShowAllBookings(false);
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {!filterDate && !showAllBookings ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "35px 15px",
                  background: "#F5F8F5",
                  border: "1px dashed #A8BDAE",
                  borderRadius: "12px",
                  color: "#64756B",
                }}
              >
                <MdOutlineCalendarMonth size={42} color="#79A99D" />
                <h3 style={{ color: "#34483D", margin: "10px 0 8px" }}>
                  Select a Date to View Bookings
                </h3>
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  Choose a date to display its appointments, or click
                  {" "}Show All Bookings to view all appointments.
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 15px",
                  background: "#F5F8F5",
                  borderRadius: "12px",
                  color: "#64756B",
                }}
              >
                <MdOutlineCalendarMonth size={38} color="#79A99D" />
                <h3 style={{ color: "#34483D", marginBottom: "8px" }}>
                  No Bookings Found
                </h3>
                <p style={{ margin: 0 }}>
                  There are no appointments for the selected date.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "18px",
                }}
              >
                {filteredBookings.map((b) => (
                  <div
                    key={b._id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #DCE8DF",
                      borderLeft: "5px solid #79A99D",
                      borderRadius: "12px",
                      padding: "18px",
                      boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        paddingBottom: "12px",
                        marginBottom: "14px",
                        borderBottom: "1px solid #E8EDE9",
                      }}
                    >
                      <span
                        style={{
                          color: "#34483D",
                          fontWeight: "700",
                          fontSize: "16px",
                        }}
                      >
                        {b.treatmentName}
                      </span>
                      <span
                        style={{
                          color: "#548B69",
                          fontWeight: "700",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {b.price} {t("omr")}
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: "11px", color: "#46554B" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <FaUserAlt size={14} color="#79A99D" />
                        <strong>{b.customerName}</strong>
                      </div>

                      <div
                        style={{
                          overflowWrap: "anywhere",
                          fontSize: "14px",
                          paddingLeft: "23px",
                          color: "#68766D",
                        }}
                      >
                        {b.customerEmail}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <MdOutlineCalendarMonth size={17} color="#79A99D" />
                        <span>{b.date}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <MdAccessTime size={17} color="#79A99D" />
                        <span>{b.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeCard === "analysis" && (
        <div className="output-section">
          <div style={chartBox}>
            <h2 style={chartTitle}>{t("servicesAnalysis")} ({filterYear})</h2>

            <div className="filter-container-row" style={{ marginBottom: "15px" }}>
              <YearSelect />
            </div>

            <div className="analysis-summary-row">
              <div className="summary-mini-card">
                <MdTrendingUp color="#76a37b" />
                <span>{t("bookingsLbl")} <strong>{grandTotal}</strong></span>
              </div>
              <div className="summary-mini-card">
                <MdAttachMoney color="#2c3123" />
                <span>{t("revenueLbl")} <strong>{grandRevenue} {t("omr")}</strong></span>
              </div>
            </div>

            {monthlyTable.length === 0 ? (
              <p style={{ textAlign: "center", marginTop: "20px" }}>{t("noDataYear")}</p>
            ) : (
              <>
                {/* المخطط الخطي (Line Chart) المضاف حديثاً لعرض أداء الخدمات شهرياً */}
                <div style={{ width: "100%", overflowX: "auto", marginTop: "25px", marginBottom: "35px" }} dir="ltr">
                  <div style={{ minWidth: "650px", height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={lineChartData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 15 }}
                      >
                        <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#E8EDE9" />
                        <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} tickMargin={10} />
                        <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #E8EDE9",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "10px" }} />
                        {monthlyTable.map((serv, index) => (
                          <Line
                            key={serv.name}
                            type="monotone"
                            dataKey={serv.name}
                            stroke={SERVICE_COLORS[index % SERVICE_COLORS.length]}
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* جدول التحليلات الشهري */}
                <div style={{ overflowX: "auto", marginTop: "20px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, textAlign: "start" }}>{t("service")}</th>
                        {MONTH_KEYS.map((key) => (
                          <th key={key} style={thStyle}>{t(key)}</th>
                        ))}
                        <th style={thStyle}>{t("total")}</th>
                        <th style={thStyle}>{t("revenueCol")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyTable.map((row) => (
                        <tr key={row.name}>
                          <td style={{ ...tdStyle, textAlign: "start", fontWeight: "bold" }}>
                            {row.name}
                          </td>
                          {row.perMonth.map((n, i) => (
                            <td key={i} style={{ ...tdStyle, color: n === 0 ? "#bbb" : "#000" }}>
                              {n}
                            </td>
                          ))}
                          <td style={{ ...tdStyle, fontWeight: "bold" }}>{row.total}</td>
                          <td style={tdStyle}>{row.revenue} {t("omr")}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "#F3F7F4", fontWeight: "bold" }}>
                        <td style={{ ...tdStyle, textAlign: "start" }}>{t("total")}</td>
                        {monthTotals.map((n, i) => (
                          <td key={i} style={tdStyle}>{n}</td>
                        ))}
                        <td style={tdStyle}>{grandTotal}</td>
                        <td style={tdStyle}>{grandRevenue} {t("omr")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </CenterShell>
  );
}