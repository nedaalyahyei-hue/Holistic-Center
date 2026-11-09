
import React, { useEffect, useState } from "react";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function UpdateUserProfile() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = savedUser?._id;

  useEffect(() => {
    if (!userId) {
      setMessage("Please login first");
      return;
    }

    fetch(`http://localhost:3002/customer/profile/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "success") {
          setUsername(data.user.username || "");
          setPhone(data.user.phone || "");
        } else {
          setMessage(data.message);
        }
      })
      .catch(() => setMessage("Failed to load profile"));
  }, [userId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!/^[97][0-9]{7}$/.test(phone)) {
      setMessage("Phone number must be 8 digits and start with 9 or 7");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }

    if (currentPassword && !newPassword) {
      setMessage("Please enter a new password");
      return;
    }

    if (!userId) {
      setMessage("Please login first");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3002/customer/profile/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await res.json();

      if (data.message === "success") {
        setPhone(data.user.phone);

        localStorage.setItem(
          "user",
          JSON.stringify({ ...savedUser, ...data.user })
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage("Profile updated successfully");
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="customer-content">
        <div className="customer-box">
          <img src="/logo.png" alt="HCS" className="customer-logo" />
          <h2>Update User Profile</h2>

          <form className="customer-form" onSubmit={handleUpdate}>
            <input
              type="text"
              value={username}
              readOnly
              placeholder="Username"
              style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
            />

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              required
            />

            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current Password (optional)"
            />

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password (optional)"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
            />

            <button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </button>

            {message && <p>{message}</p>}
          </form>
        </div>
      </div>
    </CustomerLayout>
  );
}
