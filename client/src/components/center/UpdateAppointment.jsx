import React, { useState, useEffect } from "react";
import "./UpdateAppointment.css";
import { FaCalendarAlt, FaSave } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";

const API = "http://localhost:3002";

export default function UpdateAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, ts } = useLang();
  const appointment = location.state?.appointment;

  const user = JSON.parse(localStorage.getItem("user"));

  const [selectedDate, setSelectedDate] = useState("");
  // status: idle | checking | ok | error. The text is stored as a key so it follows the language
  const [check, setCheck] = useState({ status: "idle", key: "", vars: null, raw: "" });

  const today = new Date().toISOString().split("T")[0];

  // Opened without choosing an appointment -> go back
  useEffect(() => {
    if (!appointment) navigate("/center/management-appointment");
  }, []);

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);

    if (!date) {
      setCheck({ status: "idle", key: "", vars: null, raw: "" });
      return;
    }

    if (date === appointment.date) {
      setCheck({ status: "error", key: "differentDate", vars: null, raw: "" });
      return;
    }

    // Old test bookings have no treatment: the server decides on save
    if (!appointment.treatmentId) {
      setCheck({ status: "ok", key: "", vars: null, raw: "" });
      return;
    }

    setCheck({ status: "checking", key: "checking", vars: null, raw: "" });

    try {
      const res = await fetch(`${API}/treatments/${appointment.treatmentId}/availability/${date}`);
      const data = await res.json();

      if (data.message !== "success") {
        setCheck({ status: "error", key: "", vars: null, raw: data.message });
        return;
      }
      if (!data.open) {
        setCheck({ status: "error", key: "closedDay", vars: null, raw: "" });
        return;
      }

      const slot = data.slots.find((s) => s.start === appointment.slotStart);
      if (!slot) {
        setCheck({ status: "error", key: "slotGone", vars: null, raw: "" });
      } else if (slot.booked) {
        setCheck({ status: "error", key: "slotBooked", vars: null, raw: "" });
      } else {
        setCheck({
          status: "ok",
          key: "available",
          vars: { start: slot.start, end: slot.end, doctor: slot.doctor },
          raw: "",
        });
      }
    } catch (error) {
      setCheck({ status: "error", key: "serverError", vars: null, raw: "" });
    }
  };

  const handleSave = async () => {
    if (!selectedDate) return alert(t("selectDate"));
    if (check.status !== "ok") return;

    try {
      const res = await fetch(`${API}/bookings/${appointment._id}/date`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, centerId: user?._id }),
      });
      const result = await res.json();

      if (result.message === "success") {
        alert(t("dateUpdated"));
        navigate("/center/management-appointment");
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  if (!appointment) return null;

  const checkColor =
    check.status === "ok" ? "#2e7d32" : check.status === "error" ? "#c0392b" : "#777";
  const checkText = check.key ? t(check.key, check.vars) : ts(check.raw);

  return (
    <CenterShell active="managementAppointments">
      <img src={logoImg} alt="HCS Logo" className="profile-logo"
        style={{ width: "180px", marginBottom: "10px" }} />
      <h2 className="title"><FaCalendarAlt /> {t("updateApptTitle")}</h2>

      <div className="form-box" style={{ maxWidth: "450px", marginBottom: "20px" }}>
        <p style={{ marginBottom: "8px" }}><strong>{t("customerC")}</strong> {appointment.customerName}</p>
        <p style={{ marginBottom: "8px" }}><strong>{t("serviceC")}</strong> {appointment.treatmentName}</p>
        {appointment.doctor && (
          <p style={{ marginBottom: "8px" }}><strong>{t("doctorC")}</strong> {appointment.doctor}</p>
        )}
        <p style={{ marginBottom: "8px" }}><strong>{t("timeC")}</strong> {appointment.time}</p>
        <p style={{ marginBottom: "8px" }}><strong>{t("priceC")}</strong> {appointment.price} {t("omr")}</p>
        <p style={{ marginBottom: "0" }}><strong>{t("currentDate")}</strong> {appointment.date}</p>
      </div>

      <div className="form-box" style={{ maxWidth: "450px" }}>
        <div className="form-group">
          <label className="card-label"><FaCalendarAlt /> {t("newDate")}</label>
          <input
            type="date"
            className="styled-input"
            min={today}
            value={selectedDate}
            onChange={handleDateChange}
          />
          {checkText && (
            <p style={{ color: checkColor, marginTop: "8px", fontSize: "14px" }}>{checkText}</p>
          )}
          <p className="hint-text">{t("hintDate")}</p>
        </div>

        <div className="form-actions">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={check.status !== "ok"}
            style={{ opacity: check.status === "ok" ? 1 : 0.5 }}
          >
            <FaSave /> {t("saveNewDate")}
          </button>
          <button className="save-btn cancel-btn" onClick={() => navigate("/center/management-appointment")}>
            {t("cancel")}
          </button>
        </div>
      </div>
    </CenterShell>
  );
}