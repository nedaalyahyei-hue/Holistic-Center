import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { FaHospital } from "react-icons/fa";
import AppointmentsHistory from "./AppointmentsHistory";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState("");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user?.email || user.role !== "customer") {
      setLoading(false);
      return;
    }

    fetch(
      `http://localhost:3002/customer/dashboard-stats/${encodeURIComponent(
        user.email
      )}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "success") {
          setBookings(data.bookings || []);
        }
      })
      .catch((error) => {
        console.error("Dashboard Error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Available booking years
  const years = [
    ...new Set(
      bookings
        .filter((booking) => booking.date)
        .map((booking) => String(booking.date).substring(0, 4))
    ),
  ].sort((a, b) => Number(b) - Number(a));

  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [bookings, selectedYear]);

  // Bookings for selected year
  const yearlyBookings = bookings.filter(
    (booking) =>
      String(booking.date || "").substring(0, 4) === selectedYear
  );

  // Group bookings by center
  const centerCounts = {};

  yearlyBookings.forEach((booking) => {
    const centerName =
      booking.centerName ||
      booking.centerId?.centerId?.centerName ||
      booking.centerId?.username ||
      "Unknown Center";

    centerCounts[centerName] =
      (centerCounts[centerName] || 0) + 1;
  });

  const chartData = Object.entries(centerCounts)
    .map(([center, total]) => ({
      center,
      bookings: total,
    }))
    .sort((a, b) => b.bookings - a.bookings);

  return (
    <CustomerLayout>
      <div className="user-dashboard-content">
        <h1>User Dashboard</h1>
        <p>Manage Your Holistic Centers System</p>

        <div className="user-dashboard-cards">
          <div
            className="user-dashboard-card clickable-dashboard-card"
            onClick={() =>
              setActiveCard(activeCard === "booking" ? "" : "booking")
            }
          >
            <MdOutlineCalendarMonth className="user-dashboard-icon" />
            <p>User Booking and Analysis</p>
          </div>
          </div>

          {/* Bookings Chart */}
          {activeCard === "booking" && (
            <div
              className="dashboard-record-box"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "30px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
                maxWidth: "900px",
                height: "auto",
                minHeight: "0",
                margin: "30px auto",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "15px",
                  marginBottom: "25px",
                }}
              >
                <h2 style={{ margin: 0 }}>My Bookings by Center</h2>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={years.length === 0}
                  style={{
                    padding: "10px 15px",
                    borderRadius: "8px",
                    border: "1px solid #76a37b",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  {years.length === 0 ? (
                    <option value={selectedYear}>{selectedYear}</option>
                  ) : (
                    years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {loading ? (
                <p>Loading dashboard...</p>
              ) : chartData.length === 0 ? (
                <p>No bookings found for this year.</p>
              ) : (
                <div style={{ width: "100%", height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 15, right: 20, left: 0, bottom: 35 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="center"
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={65}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="bookings"
                        name="Bookings"
                        fill="#76a37b"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={75}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
                  )}

        {activeCard === "booking" && (
          <AppointmentsHistory embedded={true} />
        )}

      </div>
    </CustomerLayout>
  );
}