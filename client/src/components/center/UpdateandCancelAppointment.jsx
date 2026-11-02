import React, { useState, useEffect } from "react";
import { FaEdit, FaTimesCircle, FaClock } from "react-icons/fa";
import { MdAttachMoney, MdOutlineMedicalServices, MdEmail, MdAccountCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import "./UpdateandCancelAppointment.css";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";

const API = "http://localhost:3002";

export default function UpdateandCancelAppointment() {
  const navigate = useNavigate();
  const { t, ts } = useLang();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const loadAppointments = async () => {
    try {
      const res = await fetch(`${API}/bookings/center/${user._id}`);
      const result = await res.json();
      if (result.message === "success") setAppointments(result.bookings);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadAppointments();
  }, []);

  const replaceBooking = (updated) =>
    setAppointments((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));

  const requestChange = async (appt, type) => {
    const typeText = type === "edit" ? t("typeEdit") : t("typeCancel");
    if (!window.confirm(t("confirmRequest", { type: typeText, name: appt.customerName }))) return;
    try {
      const res = await fetch(`${API}/bookings/${appt._id}/request-change`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const result = await res.json();
      if (result.message === "success") replaceBooking(result.booking);
      else alert(ts(result.message));
    } catch (error) {
      alert(t("serverError"));
    }
  };

  const handleEdit = (appt) => {
    const approved = appt.changeStatus === "approved" && appt.changeType === "edit";
    if (approved) {
      navigate("/center/update-appointment", { state: { appointment: appt } });
    } else {
      requestChange(appt, "edit");
    }
  };

  const handleCancel = async (appt) => {
    const approved = appt.changeStatus === "approved" && appt.changeType === "cancel";
    if (!approved) return requestChange(appt, "cancel");

    if (!window.confirm(t("confirmCancelAppt"))) return;
    try {
      const res = await fetch(`${API}/bookings/${appt._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.message === "success") {
        setAppointments(appointments.filter((a) => a._id !== appt._id));
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  const statusText = (a) => {
    const typeText = a.changeType === "cancel" ? t("typeCancel") : t("typeEdit");
    if (a.changeStatus === "pending") return t("statusWaiting", { type: typeText });
    if (a.changeStatus === "approved") return t("statusApproved", { type: typeText });
    if (a.changeStatus === "rejected") return t("statusRejected");
    return t("statusNone");
  };

  const statusColor = (a) => {
    if (a.changeStatus === "approved") return "#2e7d32";
    if (a.changeStatus === "rejected") return "#c0392b";
    if (a.changeStatus === "pending") return "#e67e22";
    return "#777";
  };

  return (
    <CenterShell active="managementAppointments">
      <img src={logoImg} alt="HCS Logo" className="profile-logo"
        style={{ width: "180px", marginBottom: "10px" }} />
      <h2 className="title"><MdOutlineMedicalServices /> {t("updateCancelTitle")}</h2>

      <button
        className="save-btn"
        style={{ width: "140px", height: "42px", marginBottom: "15px" }}
        onClick={loadAppointments}
      >
        {t("refresh")}
      </button>

      <div className="appointments-list-container">
        {loading && <p style={{ textAlign: "center" }}>{t("loading")}</p>}

        {!loading && appointments.length === 0 && (
          <p style={{ textAlign: "center", marginTop: "20px" }}>{t("noAppointments")}</p>
        )}

        {appointments.map((appt) => {
          const pending = appt.changeStatus === "pending";
          const approved = appt.changeStatus === "approved";
          const approvedEdit = approved && appt.changeType === "edit";
          const approvedCancel = approved && appt.changeType === "cancel";

          return (
            <div key={appt._id} className="form-box appointment-card">
              <div className="card-header-info">
                <div className="user-profile-info">
                  <MdAccountCircle size={40} color="#76a37b" />
                  <div>
                    <h3>{appt.customerName}</h3>
                    <span className="email-span"><MdEmail /> {appt.customerEmail}</span>
                  </div>
                </div>
              </div>

              <div className="appointment-details-grid">
                <div className="detail-item">
                  <label><MdOutlineMedicalServices /> {t("service")}</label>
                  <p>{appt.treatmentName}</p>
                </div>
                <div className="detail-item">
                  <label><MdAttachMoney /> {t("priceLbl")}</label>
                  <p>{appt.price} {t("omr")}</p>
                </div>
                <div className="detail-item">
                  <label><FaClock /> {t("dateLbl")}</label>
                  <p>{appt.date}</p>
                </div>
                <div className="detail-item">
                  <label><FaClock /> {t("timeLbl")}</label>
                  <p>{appt.time}</p>
                </div>
              </div>

              {/* Customer permission box */}
              <div style={{
                margin: "15px 0",
                padding: "12px 15px",
                border: `2px solid ${statusColor(appt)}`,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <input type="checkbox" checked={approved} disabled
                  style={{ width: 20, height: 20 }} />
                <div>
                  <strong>{t("customerApproval")}</strong>
                  <div style={{ color: statusColor(appt), fontSize: "14px" }}>
                    {statusText(appt)}
                  </div>
                </div>
              </div>

              <div className="form-actions card-btns">
                <button
                  className="save-btn edit-btn"
                  disabled={pending || (approved && !approvedEdit)}
                  style={{ opacity: pending || (approved && !approvedEdit) ? 0.5 : 1 }}
                  onClick={() => handleEdit(appt)}
                >
                  <FaEdit /> {approvedEdit ? t("edit") : t("reqEdit")}
                </button>
                <button
                  className="save-btn cancel-btn"
                  disabled={pending || (approved && !approvedCancel)}
                  style={{ opacity: pending || (approved && !approvedCancel) ? 0.5 : 1 }}
                  onClick={() => handleCancel(appt)}
                >
                  <FaTimesCircle /> {approvedCancel ? t("cancel") : t("reqCancel")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </CenterShell>
  );
}