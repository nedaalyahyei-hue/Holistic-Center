import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "./centerLang";
import { MIN_GAP, toMinutes, fromMinutes, calcEnd, slotsProblem } from "./slotUtils";

// problems shown live while the center is typing (doctor / missing start are checked on save)
const LIVE_PROBLEMS = ["slotsNeedDuration", "slotsGap", "slotPastMidnight"];

const sameName = (a, b) =>
  String(a || "").replace(/\s+/g, " ").trim().toLowerCase() ===
  String(b || "").replace(/\s+/g, " ").trim().toLowerCase();

// `location` = the name of the treatment's location (branch). Only the doctors of that branch can be chosen.
export default function ScheduleEditor({ workDays, setWorkDays, slots, setSlots, duration, location }) {
  const navigate = useNavigate();
  const { t } = useLang();

  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [resetNote, setResetNote] = useState(false);

  // the doctors who work in the center now (each one has his branch: locationName)
  useEffect(() => {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      user = null;
    }
    if (!user) {
      setStatus("error");
      return;
    }

    fetch(`http://localhost:3002/doctors/center/${user._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "success") {
          setDoctors(data.doctors);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  const branchDoctors = location ? doctors.filter((d) => d.locationName === location) : [];
  const withoutBranch = doctors.filter((d) => !d.locationName).length;

  // the end time of every slot is always: start + treatment duration
  useEffect(() => {
    const next = slots.map((s) => ({ ...s, end: calcEnd(s.start, duration) }));
    if (next.some((s, i) => s.end !== slots[i].end)) setSlots(next);
  }, [duration, slots]);

  // keep every slot in step with the branch:
  // - an old slot with a doctor name only is linked to the doctor (when the name is unique in the branch)
  // - a doctor who does not work in the selected branch is removed from the slot
  useEffect(() => {
    if (status !== "ready") return;

    let changed = false;
    let cleared = false;

    const next = slots.map((s) => {
      let doc = null;

      if (s.doctorId) {
        doc = branchDoctors.find((d) => d._id === s.doctorId) || null;
      } else if (s.doctor) {
        const matches = branchDoctors.filter((d) => sameName(d.name, s.doctor));
        if (matches.length === 1) doc = matches[0];
      }

      if (doc) {
        if (s.doctorId === doc._id && s.doctor === doc.name) return s;
        changed = true;
        return { ...s, doctor: doc.name, doctorId: doc._id };
      }

      if (s.doctor || s.doctorId) {
        changed = true;
        cleared = true;
        return { ...s, doctor: "", doctorId: "" };
      }
      return s;
    });

    if (changed) {
      setSlots(next);
      if (cleared) setResetNote(true);
    }
  }, [status, doctors, location, slots]);

  const toggleDay = (d) => {
    setWorkDays(workDays.includes(d) ? workDays.filter((x) => x !== d) : [...workDays, d]);
  };

  const updateSlot = (i, field, value) => {
    setSlots(slots.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  // the doctor is chosen by id, so two doctors with the same name are never mixed up
  const pickDoctor = (i, id) => {
    const d = branchDoctors.find((x) => x._id === id);
    setSlots(
      slots.map((s, idx) =>
        idx === i ? { ...s, doctor: d ? d.name : "", doctorId: d ? d._id : "" } : s
      )
    );
  };

  // a new slot starts MIN_GAP minutes after the previous one ends
  const addSlot = () => {
    const last = slots[slots.length - 1];
    const lastEnd = last ? toMinutes(calcEnd(last.start, duration)) : null;
    const start =
      lastEnd !== null && lastEnd + MIN_GAP <= 23 * 60 + 59
        ? fromMinutes(lastEnd + MIN_GAP)
        : "09:00";
    setSlots([
      ...slots,
      { start, end: "", doctor: last?.doctor || "", doctorId: last?.doctorId || "" },
    ]);
  };

  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));

  const problem = slotsProblem(slots, duration);
  const closingProblem = Number.isFinite(duration) && duration > 0 &&
    slots.some((s) => {
      if (!/^\d{2}:\d{2}$/.test(s.start || "")) return false;

      const start = toMinutes(s.start);
      const calculatedEnd = calcEnd(s.start, duration);
      if (!/^\d{2}:\d{2}$/.test(calculatedEnd || "")) return false;

      const end = toMinutes(calculatedEnd);

      return start < 480 || end > 1320;
    });
  const liveProblem = LIVE_PROBLEMS.includes(problem) ? problem : null;

  const boxStyle = {
    border: "2px solid #e67e22",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "10px",
    color: "#b9650f",
  };
  const greenBtn = {
    background: "#76a37b",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    fontWeight: "bold",
    cursor: "pointer",
  };

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

      {status === "error" && (
        <p style={{ color: "#c0392b", fontSize: "14px", margin: "8px 0" }}>{t("doctorsLoadError")}</p>
      )}

      {/* the treatment's location decides which doctors can be chosen */}
      {status === "ready" && !location && doctors.length > 0 && (
        <div style={boxStyle}>
          <p style={{ margin: 0 }}>{t("chooseLocationFirst")}</p>
        </div>
      )}

      {status === "ready" && doctors.length === 0 && (
        <div style={boxStyle}>
          <p style={{ marginBottom: "8px" }}>{t("noDoctorsForSlots")}</p>
          <button type="button" onClick={() => navigate("/center/doctors")} style={greenBtn}>
            {t("goAddDoctors")}
          </button>
        </div>
      )}

      {status === "ready" && location && doctors.length > 0 && branchDoctors.length === 0 && (
        <div style={boxStyle}>
          <p style={{ marginBottom: "8px" }}>{t("noDoctorsInBranch")}</p>
          <button type="button" onClick={() => navigate("/center/doctors")} style={greenBtn}>
            {t("goAddDoctors")}
          </button>
        </div>
      )}

      {status === "ready" && withoutBranch > 0 && (
        <p style={{ color: "#b9650f", fontSize: "13px", margin: "6px 0" }}>
          {t("unassignedDoctorsNote", { n: withoutBranch })}
        </p>
      )}

      {resetNote && slots.some((s) => !s.doctorId) && (
        <p style={{ color: "#b9650f", fontSize: "14px", margin: "6px 0", fontWeight: "bold" }}>
          {t("doctorsResetNote")}
        </p>
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
            style={{ flex: 2, minWidth: 180 }}
            value={s.doctorId || ""}
            disabled={!location}
            onChange={(e) => pickDoctor(i, e.target.value)}
          >
            <option value="">{t("selectDoctor")}</option>
            {branchDoctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}{d.specialty ? ` — ${d.specialty}` : ""}
              </option>
            ))}
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

      {closingProblem && (
        <p style={{
          color: "#c0392b",
          fontSize: "14px",
          margin: "8px 0",
          fontWeight: "bold",
        }}>
          {t("slotOutsideWorkingHours")}
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