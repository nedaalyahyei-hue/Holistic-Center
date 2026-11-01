import React, { useState, useEffect } from "react";
import "./UpdateAppointment.css";
import { FaBars, FaMoon, FaSun, FaCalendarAlt, FaSave } from "react-icons/fa";
import { MdLanguage, MdAccountCircle } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import logoImg from "../../assets/logo.png";

const API = "http://localhost:3002";

export default function UpdateAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment;

  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  // status: idle | checking | ok | error
  const [check, setCheck] = useState({ status: "idle", text: "" });

  const today = new Date().toISOString().split("T")[0];

  // Opened without choosing an appointment -> go back
  useEffect(() => {
    if (!appointment) navigate("/center/management-appointment");
  }, []);

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);

    if (!date) {
      setCheck({ status: "idle", text: "" });
      return;
    }

    if (date === appointment.date) {
      setCheck({ status: "error", text: "Choose a different date from the current one." });
      return;
    }

    // Old test bookings have no treatment: the server decides on save
    if (!appointment.treatmentId) {
      setCheck({ status: "ok", text: "" });
      return;
    }

    setCheck({ status: "checking", text: "Checking availability..." });

    try {
      const res = await fetch(`${API}/treatments/${appointment.treatmentId}/availability/${date}`);
      const data = await res.json();

      if (data.message !== "success") {
        setCheck({ status: "error", text: data.message });
        return;
      }
      if (!data.open) {
        setCheck({ status: "error", text: "The center is closed on this day." });
        return;
      }

      const slot = data.slots.find((s) => s.start === appointment.slotStart);
      if (!slot) {
        setCheck({ status: "error", text: "This time slot no longer exists." });
      } else if (slot.booked) {
        setCheck({ status: "error", text: "This slot is already booked by another customer." });
      } else {
        setCheck({ status: "ok", text: `Available: ${slot.start} - ${slot.end} with ${slot.doctor}` });
      }
    } catch (error) {
      setCheck({ status: "error", text: "Server Error" });
    }
  };

  const handleSave = async () => {
    if (!selectedDate) return alert("Please select a date");
    if (check.status !== "ok") return;

    try {
      const res = await fetch(`${API}/bookings/${appointment._id}/date`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      });
      const result = await res.json();

      if (result.message === "success") {
        alert("Appointment date updated successfully!");
        navigate("/center/management-appointment");
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Server Error");
    }
  };

  if (!appointment) return null;

  const checkColor =
    check.status === "ok" ? "#2e7d32" : check.status === "error" ? "#c0392b" : "#777";

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
            <div className="nav-item" onClick={() => navigate("/center/dashboard")}>Dashboard</div>
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
              <div className="sidebar-item" onClick={() => navigate("/center/dashboard")}>Dashboard</div>
              <div className="sidebar-item" onClick={() => navigate("/center/management")}>Management</div>
              <div className="sidebar-item" onClick={() => navigate("/center/appointment-refundApproval")}>Refund Requests</div>
              <div className="sidebar-item" onClick={() => navigate("/center/add-treatment")}>Add Treatment</div>
              <div className="sidebar-item" onClick={() => navigate("/center/edit-treatment")}>Edit Treatment</div>
              <div className="sidebar-item active">Management Appointments</div>
            </div>

            <div className="sidebar-logout" onClick={() => navigate("/")}>
              <IoLogOutOutline size={20} /> Logout
            </div>
          </div>

          <div className="content-wrapper">
            <img src={logoImg} alt="HCS Logo" className="profile-logo"
              style={{ width: "180px", marginBottom: "10px" }} />
            <h2 className="title"><FaCalendarAlt /> Update Appointment Date</h2>

            <div className="form-box" style={{ maxWidth: "450px", marginBottom: "20px" }}>
              <p style={{ marginBottom: "8px" }}><strong>Customer:</strong> {appointment.customerName}</p>
              <p style={{ marginBottom: "8px" }}><strong>Service:</strong> {appointment.treatmentName}</p>
              {appointment.doctor && (
                <p style={{ marginBottom: "8px" }}><strong>Doctor:</strong> {appointment.doctor}</p>
              )}
              <p style={{ marginBottom: "8px" }}><strong>Time:</strong> {appointment.time}</p>
              <p style={{ marginBottom: "8px" }}><strong>Price:</strong> {appointment.price} OMR</p>
              <p style={{ marginBottom: "0" }}><strong>Current date:</strong> {appointment.date}</p>
            </div>

            <div className="form-box" style={{ maxWidth: "450px" }}>
              <div className="form-group">
                <label className="card-label"><FaCalendarAlt /> New Appointment Date</label>
                <input
                  type="date"
                  className="styled-input"
                  min={today}
                  value={selectedDate}
                  onChange={handleDateChange}
                />
                {check.text && (
                  <p style={{ color: checkColor, marginTop: "8px", fontSize: "14px" }}>{check.text}</p>
                )}
                <p className="hint-text">* The new date must be one of the treatment's working days and the same time slot must be free.</p>
              </div>

              <div className="form-actions">
                <button
                  className="save-btn"
                  onClick={handleSave}
                  disabled={check.status !== "ok"}
                  style={{ opacity: check.status === "ok" ? 1 : 0.5 }}
                >
                  <FaSave /> Save New Date
                </button>
                <button className="save-btn cancel-btn" onClick={() => navigate("/center/management-appointment")}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}