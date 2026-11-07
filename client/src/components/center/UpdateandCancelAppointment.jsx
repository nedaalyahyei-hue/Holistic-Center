import React, { useState, useEffect } from "react";
import { FaEdit, FaTimesCircle, FaClock } from "react-icons/fa";
import {
  MdAttachMoney, MdOutlineMedicalServices, MdEmail, MdAccountCircle, MdEventAvailable,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import "./UpdateandCancelAppointment.css";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";

const API = "http://localhost:3002";

export default function UpdateandCancelAppointment() {
  const navigate = useNavigate();
  const { t, ts, lang } = useLang();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  // booking id -> true once the center confirms the customer's permission by phone (design only)
  const [phoneOk, setPhoneOk] = useState({});

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

  const togglePhone = (id) => setPhoneOk((prev) => ({ ...prev, [id]: !prev[id] }));

  // When the booking was made: "Today, 10:30 AM" or "2026-11-02, 10:30 AM"
  const formatMadeAt = (value) => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    const hour24 = d.getHours();
    const hour12 = hour24 % 12 || 12;
    const timeText = `${hour12}:${pad(d.getMinutes())} ${hour24 >= 12 ? t("pm") : t("am")}`;

    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const dayText = isToday
      ? t("todayWord")
      : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    return `${dayText}${lang === "ar" ? "، " : ", "}${timeText}`;
  };

  const handleEdit = (appt) => {
    navigate("/center/update-appointment", { state: { appointment: appt } });
  };

  const handleCancel = async (appt) => {
    if (!window.confirm(t("confirmCancelAppt"))) return;
    try {
      const res = await fetch(`${API}/bookings/${appt._id}?centerId=${user._id}`, {
        method: "DELETE",
      });
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
          const allowed = !!phoneOk[appt._id];

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
                {appt.doctor && (
                  <div className="detail-item">
                    <label><MdAccountCircle /> {t("doctorLbl")}</label>
                    <p>{appt.doctor}</p>
                  </div>
                )}
                {appt.createdAt && (
                  <div className="detail-item">
                    <label><MdEventAvailable /> {t("bookedOn")}</label>
                    <p>{formatMadeAt(appt.createdAt)}</p>
                  </div>
                )}
              </div>

              {/* The customer's permission is taken by phone, outside the website */}
              <label
                style={{
                  margin: "15px 0",
                  padding: "12px 15px",
                  border: `2px solid ${allowed ? "#2e7d32" : "#bbb"}`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={allowed}
                  onChange={() => togglePhone(appt._id)}
                  style={{ width: 20, height: 20 }}
                />
                <div>
                  <strong>{t("phonePermission")}</strong>
                  <div style={{ color: "#777", fontSize: "14px" }}>{t("phoneHint")}</div>
                </div>
              </label>

              <div className="form-actions card-btns">
                <button
                  className="save-btn edit-btn"
                  disabled={!allowed}
                  style={{ opacity: allowed ? 1 : 0.5 }}
                  onClick={() => handleEdit(appt)}
                >
                  <FaEdit /> {t("edit")}
                </button>
                <button
                  className="save-btn cancel-btn"
                  disabled={!allowed}
                  style={{ opacity: allowed ? 1 : 0.5 }}
                  onClick={() => handleCancel(appt)}
                >
                  <FaTimesCircle /> {t("cancel")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </CenterShell>
  );
}