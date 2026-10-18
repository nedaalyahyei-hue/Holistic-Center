import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const date = location.state?.date;

  return (
    <CustomerLayout>
      <div className="booking-content">
        <h1>Confirm Booking</h1>
        <div className="confirm-card">
          <p><strong>Treatment:</strong> Hijama (Cupping Therapy)</p>
          <p><strong>Center:</strong> Abna Freish Center</p>
          <p><strong>Location:</strong> Muscat, Al Seeb</p>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Duration:</strong> 45 minutes</p>
          <p><strong>Price:</strong> 10 OMR</p>
        </div>
        <button className="booking-btn" onClick={() => navigate("/customer/payment")}>Continue to Payment</button>
        <button className="booking-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </CustomerLayout>
  );
}