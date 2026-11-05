export const MIN_GAP = 5; // minutes between two slots

// "09:30" -> 570 (null if empty or invalid)
export const toMinutes = (hhmm) => {
  const [h, m] = (hhmm || "").split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

// 570 -> "09:30"
export const fromMinutes = (total) => {
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
};

// End time = start + treatment duration.
// Returns "" when it cannot be calculated or when it passes midnight.
export const calcEnd = (start, duration) => {
  const s = toMinutes(start);
  if (s === null || !(duration > 0)) return "";
  const e = s + duration;
  return e > 23 * 60 + 59 ? "" : fromMinutes(e);
};

// Returns a translation key describing the first problem, or null if the slots are fine
export function slotsProblem(slots, duration) {
  if (!(duration > 0)) return "slotsNeedDuration";
  if (!slots || slots.length === 0) return "needSlot";

  for (const s of slots) {
    if (toMinutes(s.start) === null) return "slotNeedStart";
  }
  for (const s of slots) {
    if (!calcEnd(s.start, duration)) return "slotPastMidnight";
  }

  const sorted = [...slots].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = toMinutes(sorted[i - 1].start) + duration;
    if (toMinutes(sorted[i].start) - prevEnd < MIN_GAP) return "slotsGap";
  }

  for (const s of slots) {
    if (!s.doctor) return "slotNeedDoctor";
  }
  return null;
}