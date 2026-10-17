import React, { useState, useEffect } from "react";
import "./Admin.css";
import { FaMoon, FaSun, FaBars, FaTrashAlt } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function AdminManagement() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [centerName, setCenterName] = useState("");
  const [centers, setCenters] = useState([]);
  const [editingCenterId, setEditingCenterId] = useState(null);
  const [newCenterName, setNewCenterName] = useState("");

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const response = await fetch("http://localhost:3002/admin/centers");

        if (!response.ok) {
          throw new Error("Failed to fetch centers");
        }

        const data = await response.json();
        setCenters(data);
      } catch (error) {
        console.error("Error fetching centers:", error);
      }
    };

    fetchCenters();
  }, []);

  const handleSaveCenter = async () => {
    if (!newCenterName.trim()) {
      alert("Please enter center name");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3002/admin/centers/${editingCenterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            centerName: newCenterName.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Update failed");
        return;
      }

      setCenters((prev) =>
        prev.map((center) =>
          center._id === editingCenterId
            ? result.center
            : center
        )
      );

      setEditingCenterId(null);
      setNewCenterName("");

      alert("Center name updated successfully!");
    } catch (error) {
      alert("Cannot connect to server");
    }
  };

  const handleRemoveCenter = async (center) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${center.centerName}?`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:3002/admin/centers/${center._id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Failed to delete center");
        return;
      }

      setCenters((prev) =>
        prev.filter((item) => item._id !== center._id)
      );

      alert("Center deleted successfully!");
    } catch (error) {
      alert("Cannot connect to server");
    }
  };


  return (
    <div className={`admin-page ${darkMode ? "dark" : ""}`}>
      <div className="overlay">

        <div className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setOpen(!open)}><FaBars /></button>
            <span className="menu-text">Menu</span>
          </div>
          <div className="topbar-center">
            <span className="nav-item active">
              Admin Management
            </span>

            <span
              className="nav-item"
              onClick={() => navigate("/admin/dashboard")}
            >
              Dashboard
            </span>
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
              <div
                className="sidebar-item"
                onClick={() => navigate("/admin/dashboard")}
              >
                Dashboard
              </div>
              <div
                className="sidebar-item active"
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                style={{ cursor: "pointer" }}
              >
                Admin Management
              </div>

              {showAdminMenu && (
                <div style={{ paddingLeft: "25px" }}>

                  <div
                    className="sidebar-item"
                    onClick={() => navigate("/admin/register-center")}
                  >
                    Register Center
                  </div>

                  <div
                    className="sidebar-item"
                    onClick={() => navigate("/admin/messages")}
                  >
                    Messages
                  </div>
                </div>
              )}
            </div>
            <div className="sidebar-logout" onClick={() => navigate("/")}>
              <IoLogOutOutline style={{ marginRight: '8px' }} /> Logout
            </div>
          </div>

          <div className="content-wrapper">
            <img src="/logo.png" alt="logo" className="logo" />
            <h2 className="title">Admin Management</h2>
            <div
              className="management-card"
              style={{
                width: "90%",
                maxWidth: "900px",
                padding: "30px",
                background: "#ffffff",
                borderRadius: "18px",
              }}
            >
              <h2 style={{ color: "#34483D", marginBottom: "25px" }}>
                Centers Management
              </h2>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "15px", textAlign: "left" }}>
                      Center Name
                    </th>
                    <th style={{ padding: "15px", textAlign: "center" }}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {centers.map((center) => (
                    <tr key={center._id}>
                      <td style={{ padding: "15px", borderTop: "1px solid #eee" }}>
                        {editingCenterId === center._id ? (
                          <input
                            type="text"
                            value={newCenterName}
                            onChange={(e) => setNewCenterName(e.target.value)}
                            style={{
                              padding: "10px",
                              border: "1px solid #79A99D",
                              borderRadius: "8px",
                              width: "80%",
                            }}
                          />
                        ) : (
                          center.centerName
                        )}
                      </td>

                      <td
                        style={{
                          padding: "15px",
                          borderTop: "1px solid #eee",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (editingCenterId === center._id) {
                              handleSaveCenter();
                            } else {
                              setEditingCenterId(center._id);
                              setNewCenterName(center.centerName || "");
                            }
                          }}
                          style={{
                            background: "#79A99D",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 18px",
                            marginRight: "10px",
                          }}
                        >
                          {editingCenterId === center._id ? "Save" : "Update"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveCenter(center)}
                          style={{
                            background: "#C75B52",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 18px",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
