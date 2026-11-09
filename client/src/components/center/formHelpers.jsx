import React from "react";
import { slotsProblem, toMinutes, calcEnd } from "./slotUtils";
// Red star next to a required label
export function Req() {
  return <span style={{ color: "#c0392b", marginInlineStart: "4px" }}>*</span>;
}

// Red message under a field (empty text shows nothing)
export function FieldError({ text }) {
  if (!text) return null;
  return (
    <p
      data-field-error="true"
      style={{ color: "#c0392b", fontSize: "13px", margin: "6px 0 0" }}
    >
      {text}
    </p>
  );
}

// Slot problems shown under the schedule (the schedule editor already shows the others live)
const FORM_LEVEL_SLOT_ERRORS = ["needSlot", "slotNeedStart", "slotNeedDoctor"];
export const isFormLevelSlotError = (key) => FORM_LEVEL_SLOT_ERRORS.includes(key);

// Scroll to the first red message
export function scrollToFirstError() {
  setTimeout(() => {
    document
      .querySelector("[data-field-error]")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 60);
}

// Returns { field: translationKey } for every problem. An empty object means everything is fine.
export function validateTreatment(values, workDays, slots) {
  const errors = {};
  const filled = (v) => typeof v === "string" && v.trim().length > 0;

  if (!filled(values.name)) errors.name = "errName";

  const price = Number(values.price);
  if (values.price === "" || !Number.isFinite(price) || price <= 0) errors.price = "errPrice";

  const duration = Number(values.duration);
  if (values.duration === "" || !Number.isInteger(duration) || duration <= 0) {
    errors.duration = "errDuration";
  }

  if (!filled(values.category)) errors.category = "errCategory";
  if (!filled(values.image)) errors.image = "errImage";
  if (!filled(values.location)) errors.location = "errLocation";
  if (!filled(values.description)) errors.description = "errDescription";

  if (!workDays || workDays.length === 0) errors.workDays = "selectDay";

  // time slots: start time, end time, gaps and doctor
  if (!errors.duration) {
    const problem = slotsProblem(slots, duration);
    if (problem) errors.slots = problem;
  }
  if (!errors.duration) {
  const outsideWorkingHours = slots.some((s) => {
    if (!/^\d{2}:\d{2}$/.test(s.start || "")) return false;

    const start = toMinutes(s.start);
    const end = toMinutes(calcEnd(s.start, duration));

    return start < 480 || end > 1320;
  });

  if (outsideWorkingHours) {
    errors.slots = "slotOutsideWorkingHours";
  } else {
    const problem = slotsProblem(slots, duration);
    if (problem) errors.slots = problem;
  }
}

  return errors;
}