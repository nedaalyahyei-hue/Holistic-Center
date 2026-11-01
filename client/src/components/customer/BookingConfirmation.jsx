import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { treatment, treatmentId, date, slotStart } = location.state || {};

  return (
    <CustomerLayout>
      <div className="booking-content">
        <h1>Confirm Booking</h1>
        <div className="confirm-card">
          <p><strong>Treatment:</strong> {treatment?.name || treatment?.trName}</p>
          <p><strong>Location:</strong> {treatment?.location || "Not available"}</p>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Time:</strong> {slotStart}</p>
          <p><strong>Duration:</strong> {treatment?.duration} minutes</p>
          <p><strong>Price:</strong> {treatment?.price} OMR</p>
        </div>
        <button className="booking-btn" onClick={() =>
          navigate("/customer/payment", {
            state: {
              treatment,
              treatmentId,
              date,
              slotStart
            }
          })
        }>Continue to Payment</button>
        <button className="booking-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </CustomerLayout>
  );
}