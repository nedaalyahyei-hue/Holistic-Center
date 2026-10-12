import React, { useState, useEffect } from "react";
import "./Center.css";
import {
  MdLanguage, MdAccountCircle, MdHome, MdPhone,
  MdDashboard, MdSettings, MdHistory, MdAddCircle,
  MdEdit, MdEventAvailable, MdPerson
} from "react-icons/md";
import { FaMoon, FaSun, FaBars } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";

const SidebarItem = ({ icon, label, onClick, active }) => (
  <div className={`sidebar-item ${active ? "active" : ""}`} onClick={onClick}>
    <span className="sidebar-icon">{icon}</span>
    {label}
  </div>
);

export default function CenterProfile() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const [center, setCenter] = useState({
    username: "",
    email: "",
    phone: "",
    image: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    if (!user) return navigate("/login");

    const loadCenter = async () => {
      try {
        const res = await fetch(`http://localhost:3002/center/${user._id}`);
        const result = await res.json();
        if (result.message === "success") {
          setCenter({
            username: result.center.username || "",
            email: result.center.email || "",
            phone: result.center.phone || "",
            image: result.center.image || "",
            description: result.center.description || "",
            location: result.center.location || "",
          });
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadCenter();
  }, []);

  const handleChange = (e) => {
    setCenter({ ...center, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:3002/center/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: center.phone,
          image: center.image,
          description: center.description,
          location: center.location,
        }),
      });
      const result = await res.json();

      if (result.message === "success") {
        alert("Changes saved successfully!");
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

          <div className="topbar-center"></div>

          <div className="topbar-right">
            <button className="icon-btn" onClick={() => navigate("/center/dashboard")} title="Dashboard Home">
              <MdHome size={28} style={{ color: darkMode ? "#fff" : "#3b3f2e" }} />
            </button>
            <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <FaSun color="#f1c40f" /> : <FaMoon />}
            </button>
            <button className="icon-btn"><MdLanguage /></button>
          </div>
        </div>

        <div className="layout">
          <div className={`sidebar ${open ? "open" : ""}`}>
            <div className="sidebar-content">
              <SidebarItem icon={<MdPerson />} label="Profile" active />
              <SidebarItem icon={<MdDashboard />} label="Dashboard" onClick={() => navigate("/center/dashboard")} />
              <SidebarItem icon={<MdSettings />} label="Management" onClick={() => navigate("/center/management")} />
              <SidebarItem icon={<MdHistory />} label="Refund Requests" onClick={() => navigate("/center/appointment-refundApproval")} />
              <SidebarItem icon={<MdAddCircle />} label="Add Treatment" onClick={() => navigate("/center/add-treatment")} />
              <SidebarItem icon={<MdEdit />} label="Edit Treatment" onClick={() => navigate("/center/edit-treatment")} />
              <SidebarItem icon={<MdEventAvailable />} label="Management Appointments" onClick={() => navigate("/center/management-appointment")} />
            </div>
            <div className="sidebar-logout" onClick={() => navigate("/")}>
              <IoLogOutOutline size={20} /> Logout
            </div>
          </div>

          <div className="content-wrapper">
            <div className="profile-image-container" style={{ marginBottom: '20px' }}>
              <img
                src={center.image || logoImg}
                alt="Center Profile"
                className="profile-logo"
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #76a37b' }}
              />
            </div>

            <h2 className="title">Center Profile</h2>

            <form className="form-box" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label className="card-label">Center Name</label>
                <input type="text" className="styled-input" value={center.username} readOnly
                  style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
              </div>

              <div className="form-group">
                <label className="card-label">Email Address</label>
                <input type="email" className="styled-input" value={center.email} readOnly
                  style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
              </div>

              <div className="form-group">
                <label className="card-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" name="phone" className="styled-input" value={center.phone}
                    onChange={handleChange} placeholder="Enter Phone Number" />
                  <MdPhone style={{ position: 'absolute', right: '15px', top: '12px', color: '#76a37b' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="card-label">Image Link</label>
                <input type="text" name="image" className="styled-input" value={center.image}
                  onChange={handleChange} placeholder="https://..." />
              </div>

              <div className="form-group">
                <label className="card-label">Location</label>
                <input type="text" name="location" className="styled-input" value={center.location}
                  onChange={handleChange} placeholder="Muscat, Al Seeb" />
              </div>

              <div className="form-group">
                <label className="card-label">Description</label>
                <textarea name="description" className="styled-input" rows="3" value={center.description}
                  onChange={handleChange} placeholder="About your center..."></textarea>
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="save-btn" style={{ width: '100%' }} onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}