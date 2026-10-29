import React, { useState, useEffect } from "react";
import "./Center.css";
import { MdLanguage, MdAccountCircle } from "react-icons/md";
import { FaMoon, FaSun, FaBars } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";

export default function CenterProfile() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  // Name and email show immediately from the login data
  const [center, setCenter] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    image: user?.image || "",
    description: user?.description || "",
  });

  // each location: { name, mapUrl }
  const [locations, setLocations] = useState([{ name: "", mapUrl: "" }]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadCenter = async () => {
      try {
        const res = await fetch(`http://localhost:3002/center/${user._id}`);
        const result = await res.json();
        if (result.message === "success") {
          const c = result.center;
          setCenter({
            username: c.username || "",
            email: c.email || "",
            phone: c.phone || "",
            image: c.image || "",
            description: c.description || "",
          });
          setLocations(
            c.locations && c.locations.length > 0
              ? c.locations.map((l) => ({ name: l.name, mapUrl: l.mapUrl }))
              : [{ name: "", mapUrl: "" }]
          );
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

  const handleLocationChange = (index, field, value) => {
    setLocations(locations.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLocation = () => {
    setLocations([...locations, { name: "", mapUrl: "" }]);
  };

  const removeLocation = (index) => {
    if (locations.length === 1) {
      setLocations([{ name: "", mapUrl: "" }]);
      return;
    }
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // a location must have both name and link
    const incomplete = locations.some(
      (l) => (l.name.trim() && !l.mapUrl.trim()) || (!l.name.trim() && l.mapUrl.trim())
    );
    if (incomplete) {
      alert("Each location needs both a name and a map link.");
      return;
    }

    const badLink = locations.some(
      (l) => l.mapUrl.trim() && !/^https?:\/\//i.test(l.mapUrl.trim())
    );
    if (badLink) {
      alert("Map link must start with http:// or https://");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3002/center/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: center.phone,
          image: center.image,
          description: center.description,
          locations,
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
              <div className="sidebar-item active">Profile</div>
              <div className="sidebar-item" onClick={() => navigate("/center/dashboard")}>Dashboard</div>
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
            <img
              src={center.image || logoImg}
              alt="Center Profile"
              className="profile-logo"
              style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", border: "3px solid #76a37b", marginBottom: "10px" }}
            />
            <h2 className="title">Center Profile</h2>

            <form className="form-box" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label className="card-label">Center Name</label>
                <input type="text" className="styled-input" value={center.username} readOnly disabled
                  style={{ background: "#f5f5f5", cursor: "not-allowed", color: "#555" }} />
              </div>

              <div className="form-group">
                <label className="card-label">Email Address</label>
                <input type="email" className="styled-input" value={center.email} readOnly disabled
                  style={{ background: "#f5f5f5", cursor: "not-allowed", color: "#555" }} />
              </div>

              <div className="form-group">
                <label className="card-label">Phone Number</label>
                <input type="text" name="phone" className="styled-input" value={center.phone}
                  onChange={handleChange} placeholder="Enter Phone Number" />
              </div>

              <div className="form-group">
                <label className="card-label">Upload Image Link</label>
                <input type="text" name="image" className="styled-input" value={center.image}
                  onChange={handleChange} placeholder="https://..." />
              </div>

              <div className="form-group">
                <label className="card-label">Locations</label>

                {locations.map((loc, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    <input
                      type="text"
                      className="styled-input"
                      placeholder="Location name (e.g. Al Seeb Branch)"
                      value={loc.name}
                      onChange={(e) => handleLocationChange(index, "name", e.target.value)}
                      style={{ marginBottom: "8px" }}
                    />
                    <input
                      type="text"
                      className="styled-input"
                      placeholder="Map link (https://maps.google.com/...)"
                      value={loc.mapUrl}
                      onChange={(e) => handleLocationChange(index, "mapUrl", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      style={{
                        marginTop: "8px",
                        background: "none",
                        border: "none",
                        color: "#c0392b",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLocation}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px dashed #76a37b",
                    background: "transparent",
                    color: "#76a37b",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  + Add Another Location
                </button>
              </div>

              <div className="form-group">
                <label className="card-label">Description</label>
                <textarea name="description" className="styled-input" rows="3" value={center.description}
                  onChange={handleChange} placeholder="About your center..."></textarea>
              </div>

              <div className="form-actions" style={{ marginTop: "20px" }}>
                <button type="button" className="save-btn" style={{ width: "100%" }} onClick={handleSave}>
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