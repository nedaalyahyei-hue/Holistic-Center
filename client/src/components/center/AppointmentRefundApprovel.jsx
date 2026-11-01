import React, { useState, useEffect } from "react";
import "./AppointmentRefundApproval.css";
import { FaBars, FaMoon, FaSun, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { MdLanguage, MdAccountCircle } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";

const API = "http://localhost:3002";

export default function AppointmentRefundApproval() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadRefunds = async () => {
      try {
        const res = await fetch(`${API}/refunds/center/${user._id}`);
        const result = await res.json();
        if (result.message === "success") {
          // only requests that still need an answer
          setRefundRequests(result.refunds.filter((r) => r.status === "pending"));
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadRefunds();
  }, []);

  const handleAction = async (id, actionType) => {
    const label = actionType === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this refund request?`)) return;

    try {
      const res = await fetch(`${API}/refunds/${id}/decision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: actionType === "approved" }),
      });
      const result = await res.json();

      if (result.message !== "success") {
        alert(result.message);
        return;
      }

      // show the result message, then remove the card
      setRefundRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status: actionType } : req))
      );
      setTimeout(() => {
        setRefundRequests((prev) => prev.filter((req) => req._id !== id));
      }, 3000);
    } catch (error) {
      alert("Server Error");
    }
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
              <div className="sidebar-item active">Refund Requests</div>
              <div className="sidebar-item" onClick={() => navigate("/center/add-treatment")}>Add Treatment</div>
              <div className="sidebar-item" onClick={() => navigate("/center/edit-treatment")}>Edit Treatment</div>
              <div className="sidebar-item" onClick={() => navigate("/center/management-appointment")}>Management Appointments</div>
            </div>

            <div className="sidebar-logout" onClick={() => navigate("/")}>
              <IoLogOutOutline size={20} /> Logout
            </div>
          </div>

          <div className="content-wrapper">
            <img src={logoImg} alt="Logo" className="profile-logo"
              style={{ width: "180px", marginBottom: "10px" }} />
            <h2 className="title">Refund Requests Approval</h2>

            <div className="requests-container">
              {loading && <p>Loading...</p>}

              {refundRequests.map((request) => (
                <div key={request._id} className="refund-card-wrapper">
                  {request.status === "pending" ? (
                    <div className="refund-card">
                      <div className="request-info">
                        <div className="patient-name">{request.customerName}</div>
                        <div className="service-name">
                          {request.treatmentName} - <span className="price-text-highlight">{request.amount} OMR</span>
                        </div>
                        <div className="refund-reason">
                          Appointment: {request.bookingDate} {request.bookingTime}
                        </div>
                        <div className="refund-reason">Reason: {request.reason}</div>
                      </div>
                      <div className="approval-actions">
                        <button className="approve-btn" onClick={() => handleAction(request._id, "approved")}>
                          <FaCheckCircle /> Approve
                        </button>
                        <button className="reject-btn" onClick={() => handleAction(request._id, "rejected")}>
                          <FaTimesCircle /> Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`status-message-box ${request.status}`}>
                      {request.status === "approved"
                        ? "Request Approved. A notification has been sent to the user."
                        : "Request Rejected. A notification has been sent to the user."}
                    </div>
                  )}
                </div>
              ))}

              {!loading && refundRequests.length === 0 && (
                <p className="no-requests">No pending refund requests.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}