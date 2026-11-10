import React, { useState, useEffect } from "react";
import CustomerLayout from "./CustomerLayout";
import "./Customer.css";
import { FaRegStar, FaStar } from "react-icons/fa";

export default function AppointmentsHistory({ embedded = false }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editSlot, setEditSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Cancel & Refund Request
  const [refundingId, setRefundingId] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundSaving, setRefundSaving] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [refundSuccess, setRefundSuccess] = useState("");
  const [refunds, setRefunds] = useState([]);

  // Review
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

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

  const loadRefunds = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(
        `http://localhost:3002/refunds/customer/${encodeURIComponent(user.email)}`
      );

      const data = await response.json();

      if (data.message === "success") {
        setRefunds(data.refunds || []);
      }
    } catch (err) {
      console.error("Error loading refunds:", err);
    }
  };

  useEffect(() => {
    loadBookings();
    loadRefunds();
  }, []);

  useEffect(() => {
    const markRefundNotificationsRead = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch(
          `http://localhost:3002/notifications/customer/${encodeURIComponent(user.email)}`
        );

        const data = await response.json();

        if (data.message === "success") {
          const unread = (data.notifications || []).filter(
            (notification) =>
              notification.type === "refund" &&
              !notification.isRead
          );

          await Promise.all(
            unread.map((notification) =>
              fetch(
                `http://localhost:3002/notifications/${notification._id}/read`,
                { method: "PUT" }
              ).then((res) => {
                if (!res.ok) throw new Error("Failed to mark notification as read");
                return res.json();
              }).then((result) => {
                if (result.message !== "success") {
                  throw new Error("Failed to mark notification as read");
                }
              })
            )
          );

          window.dispatchEvent(new Event("refundNotificationsRead"));
        }
      } catch (error) {
        console.error("Error marking refund notifications as read:", error);
      }
    };

    markRefundNotificationsRead();
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

  const submitRefundRequest = async () => {
    if (!refundingId || !refundReason.trim() || refundSaving) return;

    setRefundSaving(true);
    setRefundError("");
    setRefundSuccess("");

    try {
      const response = await fetch("http://localhost:3002/refunds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: refundingId,
          customerEmail: user.email,
          reason: refundReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.message !== "success") {
        setRefundError(data.message || "Failed to submit refund request.");
        return;
      }

      setRefundSuccess("Cancel & Refund request submitted successfully.");
      await loadRefunds();
      setRefundingId(null);
      setRefundReason("");
    } catch (err) {
      console.error("Refund request error:", err);
      setRefundError("Unable to submit refund request.");
    } finally {
      setRefundSaving(false);
    }
  };

  const submitReview = async () => {
    if (reviewSaving || !reviewingId) return;

    if (!reviewRating) {
      setReviewError("Please select a star rating.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please write a review.");
      return;
    }

    setReviewSaving(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      const response = await fetch("http://localhost:3002/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: reviewingId,
          customerEmail: user.email,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.message !== "success") {
        setReviewError(data.message || "Failed to submit review.");
        return;
      }

      alert("Thank you for your review!");
      setReviewingId(null);
      setReviewRating(0);
      setReviewComment("");
    } catch (error) {
      console.error("Review Error:", error);
      setReviewError("Unable to submit review.");
    } finally {
      setReviewSaving(false);
    }
  };

  const getBookingRefunds = (booking) =>
    refunds.filter((refund) => {
      const bookingId =
        typeof refund.bookingId === "object"
          ? refund.bookingId?._id
          : refund.bookingId;

      return String(bookingId) === String(booking._id);
    });

  const content = (
    <div className="history-content">
      <h1>Manage Booking</h1>

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map((booking) => {
          const bookingRefunds = getBookingRefunds(booking);
          const hasPendingRefund = bookingRefunds.some(
            (refund) => refund.status?.toLowerCase() === "pending"
          );
          const isCancelled = booking.status === "cancelled";

          return (
            <div className="history-wrapper" key={booking._id}>
              <h2>Order Summary</h2>

              <div className="history-card">
                <p>
                  <strong>Center:</strong> {booking.centerName || "Unknown Center"}
                </p>

                <p>
                  <strong>{booking.treatmentName}</strong>
                </p>

                <p>Date: {booking.date}</p>

                <p>
                  Time: {formatTime(booking.slotStart || booking.time)}
                </p>

                <p>
                  Price: <span>{booking.price} OMR</span>
                </p>

                {isCancelled && (
                  <p>
                    Booking Status: <strong>Cancelled</strong>
                  </p>
                )}

                {bookingRefunds.map((refund) => (
                  <p key={refund._id}>
                    Refund Status: <strong>{refund.status}</strong>
                  </p>
                ))}

                {!isCancelled && editingId !== booking._id && (
                  <div className="history-card-actions">
                    <button
                      className="history-btn"
                      onClick={() => startEdit(booking)}
                    >
                      Edit Booking
                    </button>

                    <button
                      className="history-btn"
                      disabled={hasPendingRefund}
                      onClick={() => {
                        setRefundingId(booking._id);
                        setRefundReason("");
                        setRefundError("");
                        setRefundSuccess("");
                      }}
                    >
                      {hasPendingRefund
                        ? "Cancel & Refund Request Pending"
                        : "Request Cancel & Refund"}
                    </button>

                    <button
                      className="history-btn"
                      onClick={() => setReviewingId(booking._id)}
                    >
                      Write a Review
                    </button>
                  </div>
                )}
              </div>

              {editingId === booking._id && !isCancelled ? (
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
                            style={
                              unavailable
                                ? {
                                    backgroundColor: "#e0e0e0",
                                    color: "#888",
                                    cursor: "not-allowed",
                                  }
                                : {}
                            }
                          >
                            {formatTime(slot.start)}
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
                  {!isCancelled && refundingId === booking._id && (
                    <div className="history-card history-edit-card">
                      <h3>Request Cancel & Refund</h3>
                      <p>Reason for Cancellation:</p>

                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Enter your reason..."
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #76a37b",
                          boxSizing: "border-box",
                          resize: "vertical",
                        }}
                      />

                      {refundError && (
                        <p style={{ color: "red" }}>{refundError}</p>
                      )}

                      <div className="history-edit-actions">
                        <button
                          className="history-btn"
                          onClick={submitRefundRequest}
                          disabled={!refundReason.trim() || refundSaving}
                        >
                          {refundSaving ? "Submitting..." : "Submit Request"}
                        </button>

                        <button
                          className="history-btn"
                          onClick={() => {
                            setRefundingId(null);
                            setRefundReason("");
                            setRefundError("");
                          }}
                          disabled={refundSaving}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {reviewingId === booking._id && (
                <div className="history-card history-edit-card">
                  <h3>Write a Review</h3>

                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) =>
                      star <= reviewRating ? (
                        <FaStar
                          key={star}
                          className="star-icon active-star"
                          onClick={() => setReviewRating(star)}
                        />
                      ) : (
                        <FaRegStar
                          key={star}
                          className="star-icon"
                          onClick={() => setReviewRating(star)}
                        />
                      )
                    )}
                  </div>

                  <textarea
                    className="review-textarea"
                    placeholder="Share your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />

                  {reviewError && (
                    <p style={{ color: "red" }}>{reviewError}</p>
                  )}

                  <div className="history-card-actions">
                    <button
                      className="history-btn"
                      disabled={reviewSaving}
                      onClick={submitReview}
                    >
                      {reviewSaving ? "Sending..." : "Send Review"}
                    </button>

                    <button
                      className="history-btn"
                      onClick={() => {
                        setReviewingId(null);
                        setReviewRating(0);
                        setReviewComment("");
                        setReviewError("");
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return embedded ? content : <CustomerLayout>{content}</CustomerLayout>;
}