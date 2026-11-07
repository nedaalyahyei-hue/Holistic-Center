import React, { useState, useEffect } from "react";
import "./UpdateTreatment.css";
import { FaEdit, FaSave } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import ScheduleEditor from "./ScheduleEditor";
import ImagePicker from "./ImagePicker";
import CategorySelect from "./CategorySelect";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";
import {
  Req, FieldError, validateTreatment, isFormLevelSlotError, scrollToFirstError,
} from "./formHelpers";

export default function EditTretment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, ts } = useLang();
  const oldTreatment = location.state?.treatment;

  const [treatment, setTreatment] = useState({
    name: oldTreatment?.name || "",
    price: oldTreatment?.price ?? "",
    duration: oldTreatment?.duration ?? "",
    location: oldTreatment?.location || "",
    category: oldTreatment?.category || "",
    image: oldTreatment?.image || "",
    description: oldTreatment?.description || "",
  });

  const [workDays, setWorkDays] = useState(oldTreatment?.workDays ?? [0, 1, 2, 3, 4, 6]);
  const [slots, setSlots] = useState(
    oldTreatment?.slots?.length
      ? oldTreatment.slots.map((s) => ({ start: s.start, end: s.end, doctor: s.doctor }))
      : [{ start: "09:00", end: "", doctor: "" }]
  );
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

  // If the page is opened without choosing a treatment, go back to Management
  useEffect(() => {
    if (!oldTreatment) navigate("/center/management");
  }, []);

  const handleChange = (e) => {
    setTreatment({ ...treatment, [e.target.name]: e.target.value });
    clearError(e.target.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // every field is required
    const found = validateTreatment(treatment, workDays, slots);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      scrollToFirstError();
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3002/treatments/${oldTreatment._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...treatment,
            price: Number(treatment.price),
            duration: Number(treatment.duration),
            workDays,
            slots,
          }),
        }
      );
      const result = await res.json();

      if (result.message === "success") {
        alert(t("updatedOk"));
        navigate("/center/management");
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  const handleCancel = () => {
    if (window.confirm(t("confirmCancelEdit"))) {
      navigate("/center/management");
    }
  };

  return (
    <CenterShell active="editTreatment">
      <img
        src={logoImg}
        alt="HCS Logo"
        className="profile-logo"
        style={{ width: "180px", marginBottom: "10px" }}
      />
      <h2 className="title"><FaEdit /> {t("updateTreatment")}</h2>

      <form className="form-box" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="card-label">{t("treatmentName")}<Req /></label>
          <input type="text" name="name" className="styled-input" style={bad("name")}
            value={treatment.name} onChange={handleChange} />
          <FieldError text={err("name")} />
        </div>

        <div className="form-row" style={{ display: "flex", gap: "20px" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="card-label">{t("priceOmr")}<Req /></label>
            <input type="number" min="0" step="any" name="price" className="styled-input" style={bad("price")}
              value={treatment.price} onChange={handleChange} />
            <FieldError text={err("price")} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="card-label">{t("durationMin")}<Req /></label>
            <input type="number" min="1" step="1" name="duration" className="styled-input" style={bad("duration")}
              value={treatment.duration} onChange={handleChange} />
            <FieldError text={err("duration")} />
          </div>
        </div>

        <div className="form-group">
          <label className="card-label">{t("category")}<Req /></label>
          <CategorySelect
            value={treatment.category}
            onChange={(v) => {
              setTreatment({ ...treatment, category: v });
              clearError("category");
            }}
          />
          <FieldError text={err("category")} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("treatmentImage")}<Req /></label>
          <ImagePicker
            value={treatment.image}
            onChange={(img) => {
              setTreatment({ ...treatment, image: img });
              clearError("image");
            }}
            maxSide={800}
          />
          <FieldError text={err("image")} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("location")}<Req /></label>
          <input type="text" name="location" className="styled-input" style={bad("location")}
            value={treatment.location} onChange={handleChange} />
          <FieldError text={err("location")} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("description")}<Req /></label>
          <textarea name="description" className="styled-input" rows="3" style={bad("description")}
            value={treatment.description} onChange={handleChange}></textarea>
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
          duration={Number(treatment.duration)}
        />
        <FieldError text={err("workDays")} />
        <FieldError text={errors.slots && isFormLevelSlotError(errors.slots) ? t(errors.slots) : ""} />

        {Object.keys(errors).length > 0 && (
          <p style={{ color: "#c0392b", fontWeight: "bold", marginTop: "12px" }}>{t("formHasErrors")}</p>
        )}

        <div className="form-actions" style={{ display: "flex", gap: "15px" }}>
          <button type="submit" className="save-btn" style={{ flex: 1 }}>
            <FaSave /> {t("save")}
          </button>
          <button type="button" className="save-btn cancel-btn" style={{ flex: 1 }} onClick={handleCancel}>
            {t("cancel")}
          </button>
        </div>
      </form>
    </CenterShell>
  );
}