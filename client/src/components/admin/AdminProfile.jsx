
import React, { useState } from "react";
import "./Admin.css";
import { FaMoon, FaSun, FaBars, FaHome, FaEnvelope } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import MessageNotification from "./MessageNotification";
import { FaRegUserCircle } from "react-icons/fa";

export default function AdminProfile() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const adminId = savedUser?._id;

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!adminId || savedUser?.role !== "admin") {
            alert("Please login as Admin");
            return;
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("All password fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            alert("New password must be at least 8 characters");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `http://localhost:3002/admin/profile/${adminId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        confirmPassword,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || data.message !== "success") {
                alert(data.message || "Failed to update password");
                return;
            }

            alert("Password updated successfully!");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            alert("Failed to update password");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className={`admin-page ${darkMode ? "dark" : ""}`}>
            <div className="overlay">

                {/* Topbar */}
                <div className="topbar">
                    <div className="topbar-left">
                        <button className="icon-btn" onClick={() => setOpen(!open)}>
                            <FaBars />
                        </button>

                        <button
                            className="icon-btn"
                            onClick={() => navigate("/admin/profile")}
                            title="Admin Profile"
                            style={{ fontSize: "38px" }}
                        >
                            <FaRegUserCircle />
                        </button>
                    </div>

                    <div className="topbar-center">
                        <span
                            className="nav-item"
                            onClick={() => navigate("/admin/dashboard")}
                        >
                            Dashboard
                        </span>

                        <span
                            className="nav-item"
                            onClick={() => navigate("/admin/management")}
                        >
                            Admin Management
                        </span>
                    </div>

                    <div className="topbar-right">
                        <button
                            className="icon-btn"
                            onClick={() => navigate("/admin/messages")}
                        >
                            <FaEnvelope />
                        </button>

                        <button
                            className="icon-btn"
                            onClick={() => navigate("/admin/dashboard")}
                        >
                            <FaHome />
                        </button>

                        <button
                            className="icon-btn"
                            onClick={() => setDarkMode(!darkMode)}
                        >
                            {darkMode ? <FaSun color="#f1c40f" /> : <FaMoon />}
                        </button>

                        <button className="icon-btn">
                            <MdLanguage />
                        </button>
                    </div>
                </div>

                <div className="layout">

                    {/* Sidebar */}
                    <div className={`sidebar ${open ? "open" : ""}`}>
                        <div className="sidebar-content">
                            <div
                                className="sidebar-item"
                                onClick={() => navigate("/admin/dashboard")}
                            >
                                Dashboard
                            </div>

                            <div
                                className="sidebar-item"
                                onClick={() => navigate("/admin/management")}
                            >
                                Admin Management
                            </div>

                            <div
                                className="sidebar-item"
                                onClick={() => navigate("/admin/register-center")}
                            >
                                Register Center
                            </div>

                            <div
                                className="sidebar-item"
                                onClick={() => navigate("/admin/treatments")}
                            >
                                Treatment Management
                            </div>

                            <div
                                className="sidebar-item"
                                onClick={() => navigate("/admin/messages")}
                            >
                                Messages
                                <MessageNotification />
                            </div>
                        </div>

                        <div
                            className="sidebar-logout"
                            onClick={() => navigate("/")}
                        >
                            <IoLogOutOutline style={{ marginRight: "8px" }} />
                            Logout
                        </div>
                    </div>

                    {/* Admin Profile Content */}
                    <div className="content-wrapper">
                        <img src="/logo.png" alt="HCS" className="logo" />

                        <h2 className="title">Admin Profile</h2>

                        <div className="management-card">
                            <form onSubmit={handleUpdate}>

                                <input
                                    type="text"
                                    className="input"
                                    value={savedUser?.username || ""}
                                    readOnly
                                    style={{
                                        backgroundColor: "#e9ecef",
                                        cursor: "not-allowed",
                                    }}
                                />

                                <input
                                    type="password"
                                    className="input"
                                    placeholder="Current Password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />

                                <input
                                    type="password"
                                    className="input"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />

                                <input
                                    type="password"
                                    className="input"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />

                                <button
                                    type="submit"
                                    className="remove-btn"
                                    style={{ backgroundColor: "#76a37b" }}
                                    disabled={loading}
                                >
                                    {loading ? "Updating..." : "Update Password"}
                                </button>

                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
