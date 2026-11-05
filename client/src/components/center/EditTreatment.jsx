import React, { useState, useEffect } from "react";
import "./UpdateTreatment.css";
import { FaEdit, FaSave } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import ScheduleEditor from "./ScheduleEditor";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";
import { slotsProblem } from "./slotUtils";

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
    category: oldTreatment?.category || "Therapy",
    image: oldTreatment?.image || "",
    description: oldTreatment?.description || "",
  });

  const [workDays, setWorkDays] = useState(oldTreatment?.workDays ?? [0, 1, 2, 3, 4, 6]);
  const [slots, setSlots] = useState(
    oldTreatment?.slots?.length
      ? oldTreatment.slots.map((s) => ({ start: s.start, end: s.end, doctor: s.doctor }))
      : [{ start: "09:00", end: "", doctor: "" }]
  );

  // If the page is opened without choosing a treatment, go back to Management
  useEffect(() => {
    if (!oldTreatment) navigate("/center/management");
  }, []);

  const handleChange = (e) => {
    setTreatment({ ...treatment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (workDays.length === 0) {
      alert(t("selectDay"));
      return;
    }

    const problem = slotsProblem(slots, Number(treatment.duration));
    if (problem) {
      alert(t(problem));
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

      <form className="form-box" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="card-label">{t("treatmentName")}</label>
          <input type="text" name="name" className="styled-input"
            value={treatment.name} onChange={handleChange} required />
        </div>

        <div className="form-row" style={{ display: "flex", gap: "20px" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="card-label">{t("priceOmr")}</label>
            <input type="number" min="0" name="price" className="styled-input"
              value={treatment.price} onChange={handleChange} required />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="card-label">{t("durationMin")}</label>
            <input type="number" min="1" name="duration" className="styled-input"
              value={treatment.duration} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="card-label">{t("category")}</label>
          <select name="category" className="styled-input"
            value={treatment.category} onChange={handleChange}>
            <option value="Therapy">{t("catTherapy")}</option>
            <option value="Massage">{t("catMassage")}</option>
            <option value="Hijama">{t("catHijama")}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="card-label">{t("imageLink")}</label>
          <input type="text" name="image" className="styled-input"
            placeholder="https://..." value={treatment.image} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("location")}</label>
          <input type="text" name="location" className="styled-input"
            value={treatment.location} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("description")}</label>
          <textarea name="description" className="styled-input" rows="3"
            value={treatment.description} onChange={handleChange}></textarea>
        </div>

        <ScheduleEditor
          workDays={workDays}
          setWorkDays={setWorkDays}
          slots={slots}
          setSlots={setSlots}
          duration={Number(treatment.duration)}
        />

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