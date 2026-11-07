import React, { useState } from "react";
import "./Center.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import ScheduleEditor from "./ScheduleEditor";
import ImagePicker from "./ImagePicker";
import CategorySelect from "./CategorySelect";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";
import {
  Req, FieldError, validateTreatment, isFormLevelSlotError, scrollToFirstError,
} from "./formHelpers";

export default function AddTreatment() {
  const navigate = useNavigate();
  const { t, ts } = useLang();

  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "",
    category: "",
    image: "",
    location: "",
    description: "",
  });

  const [workDays, setWorkDays] = useState([0, 1, 2, 3, 4, 6]);
  const [slots, setSlots] = useState([{ start: "09:00", end: "", doctor: "" }]);
  const [errors, setErrors] = useState({}); // field -> translation key

  const err = (field) => (errors[field] ? t(errors[field]) : "");
  const bad = (field) => (errors[field] ? { border: "1px solid #c0392b" } : undefined);

  const clearError = (field) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    clearError(e.target.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert(t("loginFirst"));
      return navigate("/login");
    }

    // every field is required
    const found = validateTreatment(form, workDays, slots);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      scrollToFirstError();
      return;
    }

    try {
      const res = await fetch("http://localhost:3002/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          duration: Number(form.duration),
          centerId: user._id,
          workDays,
          slots,
        }),
      });
      const result = await res.json();

      if (result.message === "success") {
        alert(t("addedOk"));
        navigate("/center/management");
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  return (
    <CenterShell active="addTreatment">
      <img
        src={logoImg}
        alt="HCS Logo"
        className="profile-logo"
        style={{ width: "180px", height: "auto", marginBottom: "10px" }}
      />
      <h2 className="title">{t("addTreatment")}</h2>

      <form className="form-box" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="card-label">{t("treatmentName")}<Req /></label>
          <input type="text" name="name" className="styled-input" style={bad("name")}
            placeholder={t("nameExample")}
            value={form.name} onChange={handleChange} />
          <FieldError text={err("name")} />
        </div>

        <div className="form-row" style={{ display: "flex", gap: "20px" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="card-label">{t("priceOmr")}<Req /></label>
            <input type="number" min="0" step="any" name="price" className="styled-input" style={bad("price")}
              placeholder="10" value={form.price} onChange={handleChange} />
            <FieldError text={err("price")} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="card-label">{t("durationMin")}<Req /></label>
            <input type="number" min="1" step="1" name="duration" className="styled-input" style={bad("duration")}
              placeholder="45" value={form.duration} onChange={handleChange} />
            <FieldError text={err("duration")} />
          </div>
        </div>

        <div className="form-group">
          <label className="card-label">{t("category")}<Req /></label>
          <CategorySelect
            value={form.category}
            onChange={(v) => {
              setForm({ ...form, category: v });
              clearError("category");
            }}
          />
          <FieldError text={err("category")} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("treatmentImage")}<Req /></label>
          <ImagePicker
            value={form.image}
            onChange={(img) => {
              setForm({ ...form, image: img });
              clearError("image");
            }}
            maxSide={800}
          />
          <FieldError text={err("image")} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("location")}<Req /></label>
          <input type="text" name="location" className="styled-input" style={bad("location")}
            placeholder={t("locationPh")} value={form.location} onChange={handleChange} />
          <FieldError text={err("location")} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("description")}<Req /></label>
          <textarea name="description" className="styled-input" rows="3" style={bad("description")}
            placeholder={t("descPh")}
            value={form.description} onChange={handleChange}></textarea>
          <FieldError text={err("description")} />
        </div>

        <ScheduleEditor
          workDays={workDays}
          setWorkDays={(v) => {
            setWorkDays(v);
            clearError("workDays");
          }}
          slots={slots}
          setSlots={(v) => {
            setSlots(v);
            clearError("slots");
          }}
          duration={Number(form.duration)}
        />
        <FieldError text={err("workDays")} />
        <FieldError text={errors.slots && isFormLevelSlotError(errors.slots) ? t(errors.slots) : ""} />

        {Object.keys(errors).length > 0 && (
          <p style={{ color: "#c0392b", fontWeight: "bold", marginTop: "12px" }}>{t("formHasErrors")}</p>
        )}

        <div className="form-actions" style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
          <button type="submit" className="save-btn" style={{ flex: 1 }}>{t("add")}</button>
          <button
            type="button"
            className="save-btn cancel-btn"
            style={{ flex: 1 }}
            onClick={() => navigate("/center/management")}
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </CenterShell>
  );
}