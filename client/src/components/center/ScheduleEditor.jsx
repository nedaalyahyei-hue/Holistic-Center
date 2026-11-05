import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "./centerLang";

export default function ScheduleEditor({ workDays, setWorkDays, slots, setSlots }) {
  const navigate = useNavigate();
  const { t } = useLang();

  const [doctors, setDoctors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // the center's registered doctors
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    fetch(`http://localhost:3002/doctors/center/${user._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "success") setDoctors(data.doctors);
      })
      .catch((error) => console.log(error))
      .finally(() => setLoaded(true));
  }, []);

  const toggleDay = (d) => {
    setWorkDays(workDays.includes(d) ? workDays.filter((x) => x !== d) : [...workDays, d]);
  };

  const updateSlot = (i, field, value) => {
    setSlots(slots.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSlot = () => {
    const last = slots[slots.length - 1];
    setSlots([...slots, { start: last?.end || "09:00", end: "", doctor: last?.doctor || "" }]);
  };

  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));

  return (
    <div className="form-group">
      <label className="card-label">{t("workingDays")}</label>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "15px" }}>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <label key={d} style={{
            padding: "6px 12px",
            borderRadius: "20px",
            border: "1px solid #76a37b",
            cursor: "pointer",
            background: workDays.includes(d) ? "#76a37b" : "transparent",
            color: workDays.includes(d) ? "#fff" : "#333",
          }}>
            <input type="checkbox" checked={workDays.includes(d)} onChange={() => toggleDay(d)}
              style={{ display: "none" }} />
            {t("d" + d)}
          </label>
        ))}
      </div>

      <label className="card-label">{t("dailySlots", { n: slots.length })}</label>

      {loaded && doctors.length === 0 && (
        <div style={{
          border: "2px solid #e67e22",
          borderRadius: "10px",
          padding: "12px",
          marginBottom: "10px",
          color: "#b9650f",
        }}>
          <p style={{ marginBottom: "8px" }}>{t("noDoctorsForSlots")}</p>
          <button
            type="button"
            onClick={() => navigate("/center/doctors")}
            style={{
              background: "#76a37b",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("goAddDoctors")}
          </button>
        </div>
      )}

      {slots.map((s, i) => (
        <div key={i} style={{
          display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap",
          border: "1px solid #ddd", borderRadius: "10px", padding: "10px", marginBottom: "8px",
        }}>
          <input type="time" className="styled-input" style={{ flex: 1, minWidth: 110 }}
            value={s.start} onChange={(e) => updateSlot(i, "start", e.target.value)} />
          <span>{t("to")}</span>
          <input type="time" className="styled-input" style={{ flex: 1, minWidth: 110 }}
            value={s.end} onChange={(e) => updateSlot(i, "end", e.target.value)} />

          <select
            className="styled-input"
            style={{ flex: 2, minWidth: 140 }}
            value={s.doctor}
            onChange={(e) => updateSlot(i, "doctor", e.target.value)}
          >
            <option value="">{t("selectDoctor")}</option>
            {doctors.map((d) => (
              <option key={d._id} value={d.name}>{d.name}</option>
            ))}
            {loaded && s.doctor && !doctors.some((d) => d.name === s.doctor) && (
              <option value={s.doctor}>{s.doctor} ({t("notRegistered")})</option>
            )}
          </select>

          <button type="button" onClick={() => removeSlot(i)}
            style={{ background: "none", border: "none", color: "#c0392b", fontWeight: "bold", cursor: "pointer" }}>
            {t("remove")}
          </button>
        </div>
      ))}

      <button type="button" onClick={addSlot} style={{
        width: "100%", padding: "10px", border: "2px dashed #76a37b", background: "transparent",
        color: "#76a37b", borderRadius: "10px", fontWeight: "bold", cursor: "pointer",
      }}>
        {t("addSlot")}
      </button>
    </div>
  );
}