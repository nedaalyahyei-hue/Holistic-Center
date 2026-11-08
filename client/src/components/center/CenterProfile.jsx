
import React, { useState, useEffect, useRef } from "react";
import "./Center.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import CenterShell from "./CenterShell";
import ImagePicker from "./ImagePicker";
import Toast from "./Toast";
import { useLang } from "./centerLang";
import { Req, FieldError, scrollToFirstError } from "./formHelpers";

const API = "http://localhost:3002";

const emptyLocation = () => ({ _id: "", name: "", mapUrl: "" });

// rows without any text are ignored
const cleanLocations = (list) =>
  (list || [])
    .map((l) => ({
      _id: l._id || "",
      name: (l.name || "").replace(/\s+/g, " ").trim(),
      mapUrl: (l.mapUrl || "").trim(),
    }))
    .filter((l) => l.name || l.mapUrl);

// phone number: 8 digits, numbers only, starts with 9 or 7
const phoneFormatProblem = (value) => {
  if (!/^\d{8}$/.test(value) || !/^[79]/.test(value)) {
    return "The number is incorrect";
  }
  return "";
};

const locationsProblem = (rows) => {
  if (rows.some((l) => !l.name || !l.mapUrl)) return "locIncomplete";
  if (rows.some((l) => !/^https?:\/\//i.test(l.mapUrl))) return "locBadLink";
  const names = rows.map((l) => l.name.toLowerCase());
  if (new Set(names).size !== names.length) return "locDuplicate";
  return "";
};

export default function CenterProfile() {
  const navigate = useNavigate();
  const { t, ts } = useLang();

  const user = JSON.parse(localStorage.getItem("user"));

  // Only the name and the email come from the login data (they never change).
  // Everything else is loaded from the server, so an old copy can never overwrite the saved data.
  const [center, setCenter] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: "",
    image: "",
    description: "",
  });
  const [locations, setLocations] = useState([emptyLocation()]);

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState(""); // translation key
  const [locError, setLocError] = useState(""); // translation key
  const [toast, setToast] = useState({ text: "", type: "success" });

  // what is saved in the database right now
  const savedData = useRef({ phone: "", image: "", description: "", locations: [] });

  const applyServerData = (c) => {
    const data = {
      phone: c.phone || "",
      image: c.image || "",
      description: c.description || "",
      locations: (c.locations || []).map((l) => ({
        _id: String(l._id),
        name: l.name,
        mapUrl: l.mapUrl,
      })),
    };
    savedData.current = data;

    setCenter((prev) => ({
      ...prev,
      username: c.username || prev.username,
      email: c.email || prev.email,
      phone: data.phone,
      image: data.image,
      description: data.description,
    }));
    setLocations(data.locations.length > 0 ? data.locations : [emptyLocation()]);
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadCenter = async () => {
      try {
        const res = await fetch(`${API}/center/${user._id}`);
        const result = await res.json();
        if (result.message === "success") {
          applyServerData(result.center);
          setLoaded(true);
        } else {
          setLoadError(true);
        }
      } catch (error) {
        setLoadError(true);
      }
    };

    loadCenter();
  }, []);

  const handleChange = (e) => {
    setCenter({ ...center, [e.target.name]: e.target.value });
  };

  // an empty phone is always a problem; the format is only checked when the number was changed
  const phoneKey = (value) => {
    if (!value) return "The number is incorrect.";
    if (value !== savedData.current.phone) return phoneFormatProblem(value);
    return "";
  };

  // only numbers are accepted, at most 8 digits
  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    setCenter({ ...center, phone: digits });

    if (/\D/.test(raw)) setPhoneError("The number is incorrect.");
    else if (digits && digits !== savedData.current.phone && !/^[79]/.test(digits)) {
      setPhoneError("The number is incorrect.");
    } else setPhoneError("");
  };

  const handlePhoneBlur = () => setPhoneError(phoneKey(center.phone));

  const handleLocationChange = (index, field, value) => {
    setLocations(locations.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
    setLocError("");
  };

  const addLocation = () => {
    setLocations([...locations, emptyLocation()]);
  };

  const removeLocation = (index) => {
    setLocError("");
    if (locations.length === 1) {
      setLocations([emptyLocation()]);
      return;
    }
    setLocations(locations.filter((_, i) => i !== index));
  };

  const keepInBrowser = (c) => {
    // the login data is kept in the browser; big pictures are not stored there
    try {
      const image = c.image && !c.image.startsWith("data:") ? c.image : "";
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          phone: c.phone,
          image,
          description: c.description,
          locations: c.locations,
        })
      );
    } catch (error) {
      /* the browser storage is full: the data is still saved on the server */
    }
  };

  const handleSave = async () => {
    if (!loaded || saving) return;

    const pKey = phoneKey(center.phone);
    const rows = cleanLocations(locations);
    const lKey = locationsProblem(rows);
    setPhoneError(pKey);
    setLocError(lKey);
    if (pKey || lKey) {
      if (pKey) setToast({ text: "The number is incorrect.", type: "error" });
      scrollToFirstError();
      return;
    }

    // send only what really changed: everything else stays exactly as it is saved
    const saved = savedData.current;
    const body = {};
    if (center.phone !== saved.phone) body.phone = center.phone;
    if (center.image !== saved.image) body.image = center.image;
    if (center.description !== saved.description) body.description = center.description;
    if (JSON.stringify(rows) !== JSON.stringify(cleanLocations(saved.locations))) body.locations = rows;

    if (Object.keys(body).length === 0) {
      setToast({ text: t("nothingToSave"), type: "info" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/center/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (result.message === "success") {
        applyServerData(result.center);
        keepInBrowser(result.center);
        setToast({ text: "Saved successfully", type: "success" });
      } else {
        setToast({
          text: result.message === "Invalid phone number"
            ? "The number is incorrect."
            : ts(result.message),
          type: "error",
        });
      }
    } catch (error) {
      setToast({ text: t("serverError"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const canSave = loaded && !saving;

  return (
    <CenterShell active="profile">
      <Toast
        text={toast.text}
        type={toast.type}
        onClose={() => setToast({ text: "", type: toast.type })}
      />

      <img
        src={center.image || logoImg}
        alt="Center Profile"
        className="profile-logo"
        style={{
          width: "150px",
          height: "150px",
          borderRadius: "50%",
          objectFit: "cover",
          border: "3px solid #76a37b",
          marginBottom: "10px",
        }}
      />
      <h2 className="title">{t("centerProfile")}</h2>

      <form className="form-box" onSubmit={(e) => e.preventDefault()} noValidate>
        {!loaded && !loadError && (
          <p style={{ color: "#777", margin: "0 0 12px" }}>{t("loading")}</p>
        )}
        {loadError && (
          <p style={{ color: "#c0392b", fontWeight: "bold", margin: "0 0 12px" }}>
            {t("profileLoadError")}
          </p>
        )}

        <div className="form-group">
          <label className="card-label">{t("centerName")}</label>
          <input type="text" className="styled-input" value={center.username} readOnly disabled
            style={{ background: "#f5f5f5", cursor: "not-allowed", color: "#555" }} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("email")}</label>
          <input type="email" className="styled-input" value={center.email} readOnly disabled
            style={{ background: "#f5f5f5", cursor: "not-allowed", color: "#555" }} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("phone")}<Req /></label>
          <input
            type="text"
            name="phone"
            className="styled-input"
            inputMode="numeric"
            maxLength={8}
            value={center.phone}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            placeholder="91234567"
            disabled={!loaded}
            style={phoneError ? { border: "1px solid #c0392b" } : undefined}
          />
          <FieldError text={phoneError} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("centerImage")}</label>
          <ImagePicker
            value={center.image}
            onChange={(img) => setCenter({ ...center, image: img })}
            maxSide={500}
            round
          />
        </div>

        <div className="form-group">
          <label className="card-label">{t("locations")}</label>
          <p style={{ fontSize: "12px", color: "#777", margin: "0 0 8px" }}>{t("locationsHint")}</p>

          {locations.map((loc, index) => (
            <div
              key={loc._id || `new-${index}`}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <input
                type="text"
                className="styled-input"
                placeholder={t("locationNamePh")}
                value={loc.name}
                onChange={(e) => handleLocationChange(index, "name", e.target.value)}
                disabled={!loaded}
                style={{ marginBottom: "8px" }}
              />
              <input
                type="text"
                className="styled-input"
                placeholder={t("mapLinkPh")}
                value={loc.mapUrl}
                onChange={(e) => handleLocationChange(index, "mapUrl", e.target.value)}
                disabled={!loaded}
              />
              <button
                type="button"
                onClick={() => removeLocation(index)}
                style={{
                  marginTop: "8px",
                  background: "none",
                  border: "none",
                  color: "#c0392b",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {t("remove")}
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLocation}
            disabled={!loaded}
            style={{
              width: "100%",
              padding: "10px",
              border: "2px dashed #76a37b",
              background: "transparent",
              color: "#76a37b",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("addLocation")}
          </button>
          <FieldError text={locError ? t(locError) : ""} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("description")}</label>
          <textarea name="description" className="styled-input" rows="3" value={center.description}
            onChange={handleChange} placeholder={t("aboutPh")} disabled={!loaded}></textarea>
        </div>

        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="save-btn"
            style={{ width: "100%", opacity: canSave ? 1 : 0.5 }}
            disabled={!canSave}
            onClick={handleSave}
          >
            {t("saveChanges")}
          </button>
        </div>
      </form>
    </CenterShell>
  );
}
