import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "./centerLang";
import { MIN_GAP, toMinutes, fromMinutes, calcEnd, slotsProblem } from "./slotUtils";

// problems shown live while the center is typing (doctor / missing start are checked on save)
const LIVE_PROBLEMS = ["slotsNeedDuration", "slotsGap", "slotPastMidnight"];

export default function ScheduleEditor({ workDays, setWorkDays, slots, setSlots, duration }) {
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

  // the end time of every slot is always: start + treatment duration
  useEffect(() => {
    const next = slots.map((s) => ({ ...s, end: calcEnd(s.start, duration) }));
    if (next.some((s, i) => s.end !== slots[i].end)) setSlots(next);
  }, [duration, slots]);

  const toggleDay = (d) => {
    setWorkDays(workDays.includes(d) ? workDays.filter((x) => x !== d) : [...workDays, d]);
  };

  const updateSlot = (i, field, value) => {
    setSlots(slots.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  // a new slot starts MIN_GAP minutes after the previous one ends
  const addSlot = () => {
    const last = slots[slots.length - 1];
    const lastEnd = last ? toMinutes(calcEnd(last.start, duration)) : null;
    const start =
      lastEnd !== null && lastEnd + MIN_GAP <= 23 * 60 + 59
        ? fromMinutes(lastEnd + MIN_GAP)
        : "09:00";
    setSlots([...slots, { start, end: "", doctor: last?.doctor || "" }]);
  };

  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));

  const problem = slotsProblem(slots, duration);
  const liveProblem = LIVE_PROBLEMS.includes(problem) ? problem : null;

  return (
    <div className="form-group">
      <label className="card-label">{t("workingDays")}</label>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "15px" }}>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => {
          const on = workDays.includes(d);
          return (
            <label
              key={d}
              style={{
                flex: "1 1 90px",
                minWidth: 90,
                textAlign: "center",
                padding: "8px 6px",
                borderRadius: "12px",
                border: `1px solid ${on ? "#76a37b" : "#ccc"}`,
                background: on ? "#e7f1e8" : "#fafafa",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggleDay(d)}
                style={{ display: "none" }}
              />
              <div style={{ fontWeight: "bold", color: on ? "#2e6b3a" : "#333" }}>{t("d" + d)}</div>
              <div style={{ fontSize: "12px", color: on ? "#2e7d32" : "#999" }}>
                {on ? t("dayHas") : t("dayNone")}
              </div>
            </label>
          );
        })}
      </div>

      <label className="card-label">{t("dailySlots", { n: slots.length })}</label>
      <p style={{ fontSize: "13px", color: "#777", marginBottom: "8px" }}>{t("slotsEndHint")}</p>

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
          {/* the end time is calculated automatically */}
          <input type="time" className="styled-input" style={{ flex: 1, minWidth: 110, background: "#f0f0f0" }}
            value={calcEnd(s.start, duration)} disabled readOnly title={t("slotEnd")} />

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

      {liveProblem && (
        <p style={{
          color: liveProblem === "slotsNeedDuration" ? "#b9650f" : "#c0392b",
          fontSize: "14px",
          margin: "8px 0",
        }}>
          {t(liveProblem)}
        </p>
      )}

      <button type="button" onClick={addSlot} style={{
        width: "100%", padding: "10px", border: "2px dashed #76a37b", background: "transparent",
        color: "#76a37b", borderRadius: "10px", fontWeight: "bold", cursor: "pointer",
      }}>
        {t("addSlot")}
      </button>
    </div>
  );
}