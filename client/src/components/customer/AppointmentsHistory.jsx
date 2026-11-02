
import React, { useState, useEffect } from "react";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";

export default function AppointmentsHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editSlot, setEditSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const loadBookings = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3002/bookings/customer/${encodeURIComponent(user.email)}`
      );
      const data = await response.json();

      if (data.message === "success") {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const startEdit = (booking) => {
    setEditingId(booking._id);
    setEditDate(booking.date);
    setEditSlot("");
    setSlots([]);
    setError("");
  };

  useEffect(() => {
    if (!editingId || !editDate) return;

    const booking = bookings.find((b) => b._id === editingId);

    if (!booking?.treatmentId) return;

    setSlots([]);
    setEditSlot("");

    fetch(
      `http://localhost:3002/treatments/${booking.treatmentId}/availability/${editDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "success" && data.open) {
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      })
      .catch((err) => console.error(err));
  }, [editingId, editDate]);

  const saveChanges = async () => {
    if (!editDate || !editSlot || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3002/bookings/${editingId}/customer-edit`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: user.email,
            date: editDate,
            slotStart: editSlot,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.message !== "success") {
        setError(data.message || "Failed to update booking.");
        return;
      }

      setEditingId(null);
      setEditSlot("");
      await loadBookings();
    } catch (err) {
      console.error(err);
      setError("Unable to update booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="history-content">
        <h1>Booking History</h1>

        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          bookings.map((booking) => (
            <div className="history-wrapper" key={booking._id}>
              <h2>Order Summary</h2>

              <div className="history-card">
                <p><strong>{booking.treatmentName}</strong></p>
                <p>Date: {booking.date}</p>
                <p>Time: {booking.slotStart || booking.time || "N/A"}</p>
                <p>Price: <span>{booking.price} OMR</span></p>
                <p>Status: {booking.status}</p>
              </div>

              {editingId === booking._id ? (
                <div className="history-card history-edit-card">
                  <h3>Edit Booking</h3>

                  <p>Select New Date:</p>
                  <input
                    type="date"
                    value={editDate}
                    min={new Date().toLocaleDateString("en-CA")}
                    onChange={(e) => setEditDate(e.target.value)}
                  />

                  <p>Select New Time:</p>
                  <div className="booking-time-slots">
                    {slots.length === 0 ? (
                      <p>No available time slots.</p>
                    ) : (
                      slots.map((slot) => {
                        const isCurrentSlot =
                          editDate === booking.date &&
                          slot.start === booking.slotStart;

                        const unavailable = slot.booked && !isCurrentSlot;

                        return (
                          <button
                            key={slot.start}
                            type="button"
                            disabled={unavailable}
                            className={editSlot === slot.start ? "selected" : ""}
                            onClick={() => setEditSlot(slot.start)}
                            style={unavailable ? {
                              backgroundColor: "#e0e0e0",
                              color: "#888",
                              cursor: "not-allowed"
                            } : {}}
                          >
                            {slot.start}
                            {unavailable ? " (Booked)" : ""}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {error && <p style={{ color: "red" }}>{error}</p>}


                  <div className="history-edit-actions">
                    <button
                      className="history-btn"
                      onClick={saveChanges}
                      disabled={!editSlot || saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      className="history-btn"
                      onClick={() => setEditingId(null)}
                      disabled={saving}
                    >
                      Back
                    </button>
                  </div>

                </div>
              ) : (
                <>
                  <button
                    className="history-btn"
                    onClick={() => startEdit(booking)}
                  >
                    Edit Booking
                  </button>

                  {/* TODO: Connect to Refund API later */}
                  <button
                    className="history-btn"
                    disabled
                    title="Refund feature will be implemented later"
                  >
                    Request Approval for Cancel and Refund
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </CustomerLayout>
  );
}
