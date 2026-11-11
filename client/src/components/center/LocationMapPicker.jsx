import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MUSCAT_CENTER = [23.588, 58.3829];
const MUSCAT_BOUNDS = [[23.38, 57.28], [23.83, 58.67]];
const MUSCAT_AREA = [
  [23.38, 57.28], [23.44, 57.48], [23.48, 57.72], [23.45, 57.91],
  [23.42, 58.08], [23.46, 58.28], [23.52, 58.49], [23.62, 58.67],
  [23.78, 58.62], [23.83, 58.37], [23.82, 58.12], [23.78, 57.88],
  [23.72, 57.64], [23.62, 57.42], [23.50, 57.30],
];

function parsePoint(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

function insideMuscat(lat, lng) {
  let inside = false;
  for (let i = 0, j = MUSCAT_AREA.length - 1; i < MUSCAT_AREA.length; j = i++) {
    const [yi, xi] = MUSCAT_AREA[i];
    const [yj, xj] = MUSCAT_AREA[j];
    if (((xi > lng) !== (xj > lng)) && lat < ((yj - yi) * (lng - xi)) / ((xj - xi) || 1e-12) + yi) {
      inside = !inside;
    }
  }
  return inside;
}

function makeMarkerIcon(image) {
  const safeImage = String(image || "").replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;");
  return L.divIcon({
    className: "center-map-marker-wrap",
    html: `<div class="center-map-marker"><img src="${safeImage}" alt="" /></div><span class="center-map-marker-tip"></span>`,
    iconSize: [54, 66],
    iconAnchor: [27, 62],
  });
}

function ClickToChoose({ onChoose, onOutside }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      if (insideMuscat(lat, lng)) onChoose([lat, lng]);
      else onOutside();
    },
  });
  return null;
}

export default function LocationMapPicker({ value, image, onChange, t, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const savedPoint = useMemo(() => parsePoint(value), [value]);
  const markerIcon = useMemo(() => makeMarkerIcon(image), [image]);

  const openPicker = () => {
    if (disabled) return;
    setDraft(savedPoint);
    setError("");
    setOpen(true);
  };

  const confirm = () => {
    if (!draft) {
      setError(t("mapChoosePin"));
      return;
    }
    onChange(`${draft[0].toFixed(6)}, ${draft[1].toFixed(6)}`);
    setOpen(false);
  };

  return (
    <>
      <div className="center-map-field">
        <input
          className="styled-input center-map-coordinate"
          value={value || ""}
          readOnly
          placeholder={t("mapCoordinatePlaceholder")}
          aria-label={t("mapCoordinates")}
        />
        <button type="button" className="center-map-open-btn" onClick={openPicker} disabled={disabled} title={t("mapChooseLocation")}>
          <span aria-hidden="true">📍</span>
          <span>{t("mapChooseLocation")}</span>
        </button>
      </div>

      {open && (
        <div className="center-map-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <section className="center-map-modal" role="dialog" aria-modal="true" aria-label={t("mapChooseLocation")}>
            <header className="center-map-modal-header">
              <div>
                <h3>{t("mapChooseLocation")}</h3>
                <p>{t("mapMuscatOnly")}</p>
              </div>
              <button type="button" className="center-map-close" onClick={() => setOpen(false)} aria-label={t("cancel")}>×</button>
            </header>

            <div className="center-map-instructions">{t("mapClickInstruction")}</div>
            <MapContainer
              center={draft || MUSCAT_CENTER}
              zoom={draft ? 15 : 11}
              minZoom={9}
              maxZoom={19}
              maxBounds={MUSCAT_BOUNDS}
              maxBoundsViscosity={1}
              scrollWheelZoom
              className="center-map-canvas"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickToChoose onChoose={(point) => { setDraft(point); setError(""); }} onOutside={() => setError(t("mapOutsideMuscat"))} />
              {draft && <Marker position={draft} icon={markerIcon} />}
            </MapContainer>

            <div className="center-map-modal-footer">
              <div className="center-map-selected">
                {draft ? `${draft[0].toFixed(6)}, ${draft[1].toFixed(6)}` : t("mapNoPin")}
              </div>
              {error && <p className="center-map-error">{error}</p>}
              <div className="center-map-actions">
                <button type="button" className="center-map-cancel" onClick={() => setOpen(false)}>{t("cancel")}</button>
                <button type="button" className="center-map-confirm" onClick={confirm}>{t("mapConfirmLocation")}</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
