import React, { useState } from "react";
import "./Center.css";
import { MdLanguage, MdAccountCircle } from "react-icons/md";
import { FaMoon, FaSun, FaBars } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";

export default function AddTreatment() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "",
    category: "Therapy",
    image: "",
    location: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login first");
      return navigate("/login");
    }

    try {
      const res = await fetch("http://localhost:3002/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          duration: Number(form.duration),
          centerId: user._id,
        }),
      });
      const result = await res.json();

      if (result.message === "success") {
        alert("Treatment added successfully!");
        navigate("/center/management");
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
              <div className="sidebar-item" onClick={() => navigate("/center/management")}>Management</div>
              <div className="sidebar-item" onClick={() => navigate("/center/appointment-refundApproval")}>Refund Requests</div>
              <div className="sidebar-item active">Add Treatment</div>
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
              style={{ width: "180px", height: "auto", marginBottom: "10px" }}
            />
            <h2 className="title">Add Treatment</h2>

            <form className="form-box" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="card-label">Treatment Name</label>
                <input type="text" name="name" className="styled-input"
                  placeholder="Hijama (cupping Therapy)"
                  value={form.name} onChange={handleChange} required />
              </div>

              <div className="form-row" style={{ display: "flex", gap: "20px" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="card-label">Price (OMR)</label>
                  <input type="number" min="0" name="price" className="styled-input"
                    placeholder="10" value={form.price} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="card-label">Duration (min)</label>
                  <input type="number" min="1" name="duration" className="styled-input"
                    placeholder="45" value={form.duration} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="card-label">Category</label>
                <select name="category" className="styled-input"
                  value={form.category} onChange={handleChange}>
                  <option value="Therapy">Therapy</option>
                  <option value="Massage">Massage</option>
                  <option value="Hijama">Hijama</option>
                </select>
              </div>

              <div className="form-group">
                <label className="card-label">Upload Image Link</label>
                <input type="text" name="image" className="styled-input"
                  placeholder="https://..." value={form.image} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="card-label">Location</label>
                <input type="text" name="location" className="styled-input"
                  placeholder="Muscat" value={form.location} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="card-label">Description</label>
                <textarea name="description" className="styled-input" rows="3"
                  placeholder="Enter description here..."
                  value={form.description} onChange={handleChange}></textarea>
              </div>

              <div className="form-actions" style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                <button type="submit" className="save-btn" style={{ flex: 1 }}>Add</button>
                <button
                  type="button"
                  className="save-btn cancel-btn"
                  style={{ flex: 1 }}
                  onClick={() => navigate("/center/management")}
                >
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