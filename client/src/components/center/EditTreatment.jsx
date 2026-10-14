import React, { useState, useEffect } from "react";
import "./UpdateTreatment.css";
import { FaBars, FaMoon, FaSun, FaEdit, FaSave } from "react-icons/fa";
import { MdLanguage, MdAccountCircle } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import logoImg from "../../assets/logo.png";

export default function EditTretment() {
  const navigate = useNavigate();
  const location = useLocation();
  const oldTreatment = location.state?.treatment;

  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [treatment, setTreatment] = useState({
    name: oldTreatment?.name || "",
    price: oldTreatment?.price ?? "",
    duration: oldTreatment?.duration ?? "",
    location: oldTreatment?.location || "",
    category: oldTreatment?.category || "Therapy",
    image: oldTreatment?.image || "",
    description: oldTreatment?.description || "",
  });

  // إذا دخل الصفحة بدون ما يختار علاج، نرجعه لـ Management
  useEffect(() => {
    if (!oldTreatment) navigate("/center/management");
  }, []);

  const handleChange = (e) => {
    setTreatment({ ...treatment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `http://localhost:3002/treatments/${oldTreatment._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...treatment,
            price: Number(treatment.price),
            duration: Number(treatment.duration),
          }),
        }
      );
      const result = await res.json();

      if (result.message === "success") {
        alert("Treatment updated successfully!");
        navigate("/center/management");
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Server Error");
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
      navigate("/center/management");
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
              <div className="sidebar-item" onClick={() => navigate("/center/appointment-refundApproval")}>Refund Requests</div>
              <div className="sidebar-item" onClick={() => navigate("/center/add-treatment")}>Add Treatment</div>
              <div className="sidebar-item active">Edit Treatment</div>
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
            <h2 className="title"><FaEdit /> Update Treatment</h2>

            <form className="form-box" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="card-label">Treatment Name</label>
                <input type="text" name="name" className="styled-input"
                  value={treatment.name} onChange={handleChange} required />
              </div>

              <div className="form-row" style={{ display: "flex", gap: "20px" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="card-label">Price (OMR)</label>
                  <input type="number" min="0" name="price" className="styled-input"
                    value={treatment.price} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="card-label">Duration (min)</label>
                  <input type="number" min="1" name="duration" className="styled-input"
                    value={treatment.duration} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="card-label">Category</label>
                <select name="category" className="styled-input"
                  value={treatment.category} onChange={handleChange}>
                  <option value="Therapy">Therapy</option>
                  <option value="Massage">Massage</option>
                  <option value="Hijama">Hijama</option>
                </select>
              </div>

              <div className="form-group">
                <label className="card-label">Image Link</label>
                <input type="text" name="image" className="styled-input"
                  placeholder="https://..." value={treatment.image} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="card-label">Location</label>
                <input type="text" name="location" className="styled-input"
                  value={treatment.location} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="card-label">Description</label>
                <textarea name="description" className="styled-input" rows="3"
                  value={treatment.description} onChange={handleChange}></textarea>
              </div>

              <div className="form-actions" style={{ display: "flex", gap: "15px" }}>
                <button type="submit" className="save-btn" style={{ flex: 1 }}>
                  <FaSave /> Save
                </button>
                <button type="button" className="save-btn cancel-btn" style={{ flex: 1 }} onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}