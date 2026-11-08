import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "./centerLang";

// The locations the center saved in its Profile, as a list to choose from
export default function LocationSelect({ value, onChange }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [names, setNames] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

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

    fetch(`http://localhost:3002/center/${user._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "success") {
          setNames((data.center.locations || []).map((l) => l.name).filter(Boolean));
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  // an old value that is not in the profile list stays visible, so it is not lost silently
  const oldValue = status === "ready" && value && !names.includes(value);

  return (
    <div>
      <select
        name="location"
        className="styled-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("selectLocation")}</option>
        {names.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
        {oldValue && <option value={value}>{value} ({t("notInList")})</option>}
      </select>

      {status === "loading" && (
        <p style={{ fontSize: "13px", color: "#777", marginTop: "6px" }}>{t("loading")}</p>
      )}

      {status === "error" && (
        <p style={{ fontSize: "14px", color: "#c0392b", marginTop: "6px" }}>{t("locationsError")}</p>
      )}

      {status === "ready" && names.length === 0 && (
        <div
          style={{
            border: "2px solid #e67e22",
            borderRadius: "10px",
            padding: "12px",
            marginTop: "8px",
            color: "#b9650f",
          }}
        >
          <p style={{ margin: "0 0 8px" }}>{t("noLocationsYet")}</p>
          <button
            type="button"
            onClick={() => navigate("/center/center-profile")}
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
            {t("goToProfile")}
          </button>
        </div>
      )}
    </div>
  );
}