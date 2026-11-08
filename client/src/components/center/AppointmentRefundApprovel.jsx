import React, { useState, useEffect } from "react";
import "./AppointmentRefundApproval.css";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";

const API = "http://localhost:3002";
const EVERY_MS = 4000; // new requests show up by themselves

export default function AppointmentRefundApproval() {
  const navigate = useNavigate();
  const { t, ts } = useLang();

  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const loadRefunds = async () => {
    try {
      const res = await fetch(`${API}/refunds/center/${user._id}`);
      const result = await res.json();
      if (result.message === "success") {
        // keep the cards that were just answered (they disappear after 3 seconds),
        // and show every request that still needs an answer
        setRefundRequests((prev) => {
          const answered = prev.filter((r) => r.status !== "pending");
          const answeredIds = new Set(answered.map((r) => r._id));
          const pending = result.refunds.filter(
            (r) => r.status === "pending" && !answeredIds.has(r._id)
          );
          return [...pending, ...answered];
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return undefined;
    }

    loadRefunds();
    const timer = setInterval(loadRefunds, EVERY_MS);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async (id, actionType) => {
    const question = actionType === "approved" ? t("confirmApprove") : t("confirmReject");
    if (!window.confirm(question)) return;

    try {
      const res = await fetch(`${API}/refunds/${id}/decision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: actionType === "approved" }),
      });
      const result = await res.json();

      if (result.message !== "success") {
        alert(ts(result.message));
        return;
      }

      // the red circle in the menu updates right away
      window.dispatchEvent(new Event("refunds-changed"));

      // show the result message, then remove the card
      setRefundRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status: actionType } : req))
      );
      setTimeout(() => {
        setRefundRequests((prev) => prev.filter((req) => req._id !== id));
      }, 3000);
    } catch (error) {
      alert(t("serverError"));
    }
  };

  return (
    <CenterShell active="refundRequests">
      <img src={logoImg} alt="Logo" className="profile-logo"
        style={{ width: "180px", marginBottom: "10px" }} />
      <h2 className="title">{t("refundTitle")}</h2>

      <div className="requests-container">
        {loading && <p>{t("loading")}</p>}

        {refundRequests.map((request) => (
          <div key={request._id} className="refund-card-wrapper">
            {request.status === "pending" ? (
              <div className="refund-card">
                <div className="request-info">
                  <div className="patient-name">{request.customerName}</div>
                  <div className="service-name">
                    {request.treatmentName} - <span className="price-text-highlight">{request.amount} {t("omr")}</span>
                  </div>
                  <div className="refund-reason">
                    {t("apptC")} {request.bookingDate} {request.bookingTime}
                  </div>
                  <div className="refund-reason">{t("reasonC")} {request.reason}</div>
                </div>
                <div className="approval-actions">
                  <button className="approve-btn" onClick={() => handleAction(request._id, "approved")}>
                    <FaCheckCircle /> {t("approve")}
                  </button>
                  <button className="reject-btn" onClick={() => handleAction(request._id, "rejected")}>
                    <FaTimesCircle /> {t("reject")}
                  </button>
                </div>
              </div>
            ) : (
              <div className={`status-message-box ${request.status}`}>
                {request.status === "approved" ? t("approvedMsg") : t("rejectedMsg")}
              </div>
            )}
          </div>
        ))}

        {!loading && refundRequests.length === 0 && (
          <p className="no-requests">{t("noPending")}</p>
        )}
      </div>
    </CenterShell>
  );
}