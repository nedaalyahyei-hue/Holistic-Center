import React, { useState, useEffect } from "react";
import { FaBars, FaMoon, FaSun, FaEdit, FaTimesCircle, FaClock } from "react-icons/fa";
import {
  MdLanguage, MdAttachMoney, MdOutlineMedicalServices, MdEmail, MdAccountCircle,
} from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import "./UpdateandCancelAppointment.css";

const API = "http://localhost:3002";

export default function UpdateandCancelAppointment() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const loadAppointments = async () => {
    try {
      const res = await fetch(`${API}/bookings/center/${user._id}`);
      const result = await res.json();
      if (result.message === "success") setAppointments(result.bookings);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadAppointments();
  }, []);

  const replaceBooking = (updated) =>
    setAppointments((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));

  const requestChange = async (appt, type) => {
    if (!window.confirm(`Send a ${type} permission request to ${appt.customerName}?`)) return;
    try {
      const res = await fetch(`${API}/bookings/${appt._id}/request-change`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const result = await res.json();
      if (result.message === "success") replaceBooking(result.booking);
      else alert(result.message);
    } catch (error) {
      alert("Server Error");
    }
  };

  const handleEdit = (appt) => {
    const approved = appt.changeStatus === "approved" && appt.changeType === "edit";
    if (approved) {
      navigate("/center/update-appointment", { state: { appointment: appt } });
    } else {
      requestChange(appt, "edit");
    }
  };

  const handleCancel = async (appt) => {
    const approved = appt.changeStatus === "approved" && appt.changeType === "cancel";
    if (!approved) return requestChange(appt, "cancel");

    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const res = await fetch(`${API}/bookings/${appt._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.message === "success") {
        setAppointments(appointments.filter((a) => a._id !== appt._id));
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Server Error");
    }
  };

  const statusText = (a) => {
    if (a.changeStatus === "pending") return `Waiting for the customer to approve the ${a.changeType}...`;
    if (a.changeStatus === "approved") return `Customer approved the ${a.changeType}`;
    if (a.changeStatus === "rejected") return "Customer rejected the request";
    return "No permission requested yet";
  };

  const statusColor = (a) => {
    if (a.changeStatus === "approved") return "#2e7d32";
    if (a.changeStatus === "rejected") return "#c0392b";
    if (a.changeStatus === "pending") return "#e67e22";
    return "#777";
  };

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
            <h2 className="title"><MdOutlineMedicalServices /> Update and Cancel Appointment</h2>

            <button className="save-btn" style={{ marginBottom: "15px" }} onClick={loadAppointments}>
              Refresh
            </button>

            <div className="appointments-list-container">
              {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

              {!loading && appointments.length === 0 && (
                <p style={{ textAlign: "center", marginTop: "20px" }}>No appointments found.</p>
              )}

              {appointments.map((appt) => {
                const pending = appt.changeStatus === "pending";
                const approved = appt.changeStatus === "approved";
                const approvedEdit = approved && appt.changeType === "edit";
                const approvedCancel = approved && appt.changeType === "cancel";

                return (
                  <div key={appt._id} className="form-box appointment-card">
                    <div className="card-header-info">
                      <div className="user-profile-info">
                        <MdAccountCircle size={40} color="#76a37b" />
                        <div>
                          <h3>{appt.customerName}</h3>
                          <span className="email-span"><MdEmail /> {appt.customerEmail}</span>
                        </div>
                      </div>
                    </div>

                    <div className="appointment-details-grid">
                      <div className="detail-item">
                        <label><MdOutlineMedicalServices /> Service</label>
                        <p>{appt.treatmentName}</p>
                      </div>
                      <div className="detail-item">
                        <label><MdAttachMoney /> Price</label>
                        <p>{appt.price} OMR</p>
                      </div>
                      <div className="detail-item">
                        <label><FaClock /> Date</label>
                        <p>{appt.date}</p>
                      </div>
                      <div className="detail-item">
                        <label><FaClock /> Time</label>
                        <p>{appt.time}</p>
                      </div>
                    </div>

                    {/* Customer permission box */}
                    <div style={{
                      margin: "15px 0",
                      padding: "12px 15px",
                      border: `2px solid ${statusColor(appt)}`,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}>
                      <input type="checkbox" checked={approved} disabled
                        style={{ width: 20, height: 20 }} />
                      <div>
                        <strong>Customer Approval</strong>
                        <div style={{ color: statusColor(appt), fontSize: "14px" }}>
                          {statusText(appt)}
                        </div>
                      </div>
                    </div>

                    <div className="form-actions card-btns">
                      <button
                        className="save-btn edit-btn"
                        disabled={pending || (approved && !approvedEdit)}
                        style={{ opacity: pending || (approved && !approvedEdit) ? 0.5 : 1 }}
                        onClick={() => handleEdit(appt)}
                      >
                        <FaEdit /> {approvedEdit ? "Edit" : "Request Edit Permission"}
                      </button>
                      <button
                        className="save-btn cancel-btn"
                        disabled={pending || (approved && !approvedCancel)}
                        style={{ opacity: pending || (approved && !approvedCancel) ? 0.5 : 1 }}
                        onClick={() => handleCancel(appt)}
                      >
                        <FaTimesCircle /> {approvedCancel ? "Cancel" : "Request Cancel Permission"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}