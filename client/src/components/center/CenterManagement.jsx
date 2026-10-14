import React, { useState, useEffect } from "react";
import "./Management.css";
import { FaBars, FaMoon, FaSun } from "react-icons/fa";
import { MdLanguage, MdAccountCircle } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";

export default function CenterManagement() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadTreatments = async () => {
      try {
        const res = await fetch(
          `http://localhost:3002/treatments/center/${user._id}`
        );
        const result = await res.json();
        if (result.message === "success") setTreatments(result.treatments);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadTreatments();
  }, []);

  const handleDelete = async (treatment) => {
    if (!window.confirm(`Are you sure you want to delete "${treatment.name}"?`)) return;

    try {
      const res = await fetch(`http://localhost:3002/treatments/${treatment._id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.message === "success") {
        setTreatments(treatments.filter((t) => t._id !== treatment._id));
      } else {
        alert(result.message);
      }
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
              <div className="sidebar-item active">Management</div>
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
            <img
              src={logoImg}
              alt="HCS Logo"
              className="profile-logo"
              style={{ width: "180px", marginBottom: "10px" }}
            />

            <h2 className="title">Center Management</h2>

            <div className="categories-box">
              <div className="box-header">My Treatments</div>

              {loading && <p style={{ padding: 15 }}>Loading...</p>}
              {!loading && treatments.length === 0 && (
                <p style={{ padding: 15 }}>No treatments yet.</p>
              )}

              {treatments.map((t) => (
                <div key={t._id} className="category-row">
                  <span className="category-name">{t.name} — {t.price} OMR</span>
                  <div className="action-buttons">
                    <button
                      className="btn-dark"
                      onClick={() =>
                        navigate("/center/edit-treatment", { state: { treatment: t } })
                      }
                    >
                      Edit
                    </button>
                    <button className="btn-dark delete-btn" onClick={() => handleDelete(t)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="add-category-btn" onClick={() => navigate("/center/add-treatment")}>
              Add New Treatment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}