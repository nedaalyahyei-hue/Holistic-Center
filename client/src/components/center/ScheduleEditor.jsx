import React from "react";
import { useLang } from "./centerLang";

export default function ScheduleEditor({ workDays, setWorkDays, slots, setSlots }) {
  const { t } = useLang();

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
          <input type="text" className="styled-input" style={{ flex: 2, minWidth: 140 }}
            placeholder={t("doctorName")} value={s.doctor}
            onChange={(e) => updateSlot(i, "doctor", e.target.value)} />
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