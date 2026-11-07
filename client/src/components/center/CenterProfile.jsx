import React, { useState, useEffect } from "react";
import "./Center.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import CenterShell from "./CenterShell";
import ImagePicker from "./ImagePicker";
import { useLang } from "./centerLang";
import { Req, FieldError, scrollToFirstError } from "./formHelpers";

// Omani mobile number: exactly 8 digits, numbers only, starts with 9 or 7
const phoneProblem = (value) => {
  if (!value) return "phoneRequired";
  if (!/^\d+$/.test(value)) return "phoneDigitsOnly";
  if (value.length !== 8) return "phoneLength";
  if (!/^[79]/.test(value)) return "phoneStart";
  return "";
};

export default function CenterProfile() {
  const navigate = useNavigate();
  const { t, ts } = useLang();

  const user = JSON.parse(localStorage.getItem("user"));

  // Name and email show immediately from the login data
  const [center, setCenter] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    image: user?.image || "",
    description: user?.description || "",
  });

  const [phoneError, setPhoneError] = useState(""); // translation key

  // each location: { name, mapUrl }
  const [locations, setLocations] = useState([{ name: "", mapUrl: "" }]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadCenter = async () => {
      try {
        const res = await fetch(`http://localhost:3002/center/${user._id}`);
        const result = await res.json();
        if (result.message === "success") {
          const c = result.center;
          setCenter({
            username: c.username || "",
            email: c.email || "",
            phone: c.phone || "",
            image: c.image || "",
            description: c.description || "",
          });
          setLocations(
            c.locations && c.locations.length > 0
              ? c.locations.map((l) => ({ name: l.name, mapUrl: l.mapUrl }))
              : [{ name: "", mapUrl: "" }]
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadCenter();
  }, []);

  const handleChange = (e) => {
    setCenter({ ...center, [e.target.name]: e.target.value });
  };

  // only numbers are accepted, at most 8 digits
  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    setCenter({ ...center, phone: digits });

    if (/\D/.test(raw)) setPhoneError("phoneDigitsOnly");
    else if (digits && !/^[79]/.test(digits)) setPhoneError("phoneStart");
    else setPhoneError("");
  };

  const handlePhoneBlur = () => setPhoneError(phoneProblem(center.phone));

  const handleLocationChange = (index, field, value) => {
    setLocations(locations.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLocation = () => {
    setLocations([...locations, { name: "", mapUrl: "" }]);
  };

  const removeLocation = (index) => {
    if (locations.length === 1) {
      setLocations([{ name: "", mapUrl: "" }]);
      return;
    }
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // the phone number is required and must be a valid Omani number
    const phoneKey = phoneProblem(center.phone);
    if (phoneKey) {
      setPhoneError(phoneKey);
      scrollToFirstError();
      return;
    }

    // a location must have both name and link
    const incomplete = locations.some(
      (l) => (l.name.trim() && !l.mapUrl.trim()) || (!l.name.trim() && l.mapUrl.trim())
    );
    if (incomplete) {
      alert(t("locIncomplete"));
      return;
    }

    const badLink = locations.some(
      (l) => l.mapUrl.trim() && !/^https?:\/\//i.test(l.mapUrl.trim())
    );
    if (badLink) {
      alert(t("locBadLink"));
      return;
    }

    try {
      const res = await fetch(`http://localhost:3002/center/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: center.phone,
          image: center.image,
          description: center.description,
          locations,
        }),
      });
      const result = await res.json();

      if (result.message === "success") {
        alert(t("savedOk"));
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  return (
    <CenterShell active="profile">
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
            style={phoneError ? { border: "1px solid #c0392b" } : undefined}
          />
          <p style={{ fontSize: "12px", color: "#777", margin: "6px 0 0" }}>{t("phoneHint")}</p>
          <FieldError text={phoneError ? t(phoneError) : ""} />
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

          {locations.map((loc, index) => (
            <div
              key={index}
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
                style={{ marginBottom: "8px" }}
              />
              <input
                type="text"
                className="styled-input"
                placeholder={t("mapLinkPh")}
                value={loc.mapUrl}
                onChange={(e) => handleLocationChange(index, "mapUrl", e.target.value)}
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
        </div>

        <div className="form-group">
          <label className="card-label">{t("description")}</label>
          <textarea name="description" className="styled-input" rows="3" value={center.description}
            onChange={handleChange} placeholder={t("aboutPh")}></textarea>
        </div>

        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button type="button" className="save-btn" style={{ width: "100%" }} onClick={handleSave}>
            {t("saveChanges")}
          </button>
        </div>
      </form>
    </CenterShell>
  );
}