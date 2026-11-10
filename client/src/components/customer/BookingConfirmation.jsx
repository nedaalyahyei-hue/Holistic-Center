import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  const { treatment, treatmentId, date, slotStart } =
    location.state || {};

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Convert 24-hour time to 12-hour time with AM/PM for display only.
  const formatTime = (time) => {
    if (!time) return "N/A";

    const [hours, minutes] = String(time).split(":");
    const hour = Number(hours);

    if (Number.isNaN(hour)) return time;

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${minutes || "00"} ${period}`;
  };

  const confirmBooking = async () => {
    if (saving) return;

    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user?.email) {
      setError("Please login first to book an appointment.");

      setTimeout(() => {
        navigate("/login");
      }, 7000);

      return;
    }

    if (!treatmentId || !date || !slotStart) {
      setError("Booking details are missing.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3002/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          treatmentId,
          date,
          slotStart,
          customerName: user.username,
          customerEmail: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.message !== "success") {
        setError(data.message || "Booking failed. Please try again.");
        return;
      }

      navigate("/customer/history", { replace: true });
    } catch (err) {
      console.error("Booking error:", err);
      setError("Unable to save booking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="booking-content">
        <h1>Confirm Booking</h1>

        <div className="confirm-card">
          <p>
            <strong>Treatment:</strong>{" "}
            {treatment?.name || treatment?.trName}
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {treatment?.location || "Not available"}
          </p>

          <p>
            <strong>Date:</strong> {date}
          </p>

          <p>
            <strong>Time:</strong> {formatTime(slotStart)}
          </p>

          <p>
            <strong>Duration:</strong> {treatment?.duration} minutes
          </p>

          <p>
            <strong>Price:</strong> {treatment?.price} OMR
          </p>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          className="booking-btn"
          onClick={confirmBooking}
          disabled={saving}
        >
          {saving ? "Confirming..." : "Confirm Booking"}
        </button>

        <button
          className="booking-btn"
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          Back
        </button>
      </div>
    </CustomerLayout>
  );
}
