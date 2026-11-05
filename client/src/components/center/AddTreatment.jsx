import React, { useState } from "react";
import "./Center.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import ScheduleEditor from "./ScheduleEditor";
import ImagePicker from "./ImagePicker";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";
import { slotsProblem } from "./slotUtils";

export default function AddTreatment() {
  const navigate = useNavigate();
  const { t, ts } = useLang();

  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "",
    category: "Therapy",
    image: "",
    location: "",
    description: "",
  });

  const [workDays, setWorkDays] = useState([0, 1, 2, 3, 4, 6]);
  const [slots, setSlots] = useState([{ start: "09:00", end: "", doctor: "" }]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert(t("loginFirst"));
      return navigate("/login");
    }

    if (workDays.length === 0) {
      alert(t("selectDay"));
      return;
    }

    const problem = slotsProblem(slots, Number(form.duration));
    if (problem) {
      alert(t(problem));
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

      <form className="form-box" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="card-label">{t("treatmentName")}</label>
          <input type="text" name="name" className="styled-input"
            placeholder={t("nameExample")}
            value={form.name} onChange={handleChange} required />
        </div>

        <div className="form-row" style={{ display: "flex", gap: "20px" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="card-label">{t("priceOmr")}</label>
            <input type="number" min="0" name="price" className="styled-input"
              placeholder="10" value={form.price} onChange={handleChange} required />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="card-label">{t("durationMin")}</label>
            <input type="number" min="1" name="duration" className="styled-input"
              placeholder="45" value={form.duration} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="card-label">{t("category")}</label>
          <select name="category" className="styled-input"
            value={form.category} onChange={handleChange}>
            <option value="Therapy">{t("catTherapy")}</option>
            <option value="Massage">{t("catMassage")}</option>
            <option value="Hijama">{t("catHijama")}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="card-label">{t("treatmentImage")}</label>
          <ImagePicker
            value={form.image}
            onChange={(img) => setForm({ ...form, image: img })}
            maxSide={800}
          />
        </div>

        <div className="form-group">
          <label className="card-label">{t("location")}</label>
          <input type="text" name="location" className="styled-input"
            placeholder={t("locationPh")} value={form.location} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("description")}</label>
          <textarea name="description" className="styled-input" rows="3"
            placeholder={t("descPh")}
            value={form.description} onChange={handleChange}></textarea>
        </div>

        <ScheduleEditor
          workDays={workDays}
          setWorkDays={setWorkDays}
          slots={slots}
          setSlots={setSlots}
          duration={Number(form.duration)}
        />

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