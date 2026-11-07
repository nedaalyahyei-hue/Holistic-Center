import React, { useState, useEffect } from "react";
import "./Center.css";
import "./Management.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";
import { Req, FieldError, scrollToFirstError } from "./formHelpers";

const API = "http://localhost:3002";

export default function Doctors() {
  const navigate = useNavigate();
  const { t, ts } = useLang();

  const user = JSON.parse(localStorage.getItem("user"));

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", specialty: "" });
  const [errors, setErrors] = useState({}); // field -> translation key

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadDoctors = async () => {
      try {
        const res = await fetch(`${API}/doctors/center/${user._id}`);
        const result = await res.json();
        if (result.message === "success") setDoctors(result.doctors);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    // the name and the specialty are both required
    const found = {};
    if (!form.name.trim()) found.name = "errDoctorName";
    if (form.specialty.trim().length < 2) found.specialty = "errSpecialty";
    setErrors(found);
    if (Object.keys(found).length > 0) {
      scrollToFirstError();
      return;
    }

    try {
      const res = await fetch(`${API}/doctors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId: user._id,
          name: form.name,
          specialty: form.specialty,
        }),
      });
      const result = await res.json();

      if (result.message === "success") {
        setDoctors((prev) =>
          [...prev, result.doctor].sort((a, b) => a.name.localeCompare(b.name))
        );
        setForm({ name: "", specialty: "" });
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(t("confirmDeleteDoctor", { name: doctor.name }))) return;

    try {
      const res = await fetch(`${API}/doctors/${doctor._id}?centerId=${user._id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.message === "success") {
        setDoctors((prev) => prev.filter((d) => d._id !== doctor._id));
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  return (
    <CenterShell active="doctors">
      <img
        src={logoImg}
        alt="HCS Logo"
        className="profile-logo"
        style={{ width: "180px", marginBottom: "10px" }}
      />
      <h2 className="title">{t("doctorsTitle")}</h2>

      <form className="form-box" onSubmit={handleAdd} noValidate style={{ marginBottom: "20px" }}>
        <div className="form-group">
          <label className="card-label">{t("doctorNameLbl")}<Req /></label>
          <input
            type="text"
            name="name"
            className="styled-input"
            style={errors.name ? { border: "1px solid #c0392b" } : undefined}
            placeholder={t("doctorNamePh")}
            value={form.name}
            onChange={handleChange}
          />
          <FieldError text={errors.name ? t(errors.name) : ""} />
        </div>

        <div className="form-group">
          <label className="card-label">{t("specialty")}<Req /></label>
          <input
            type="text"
            name="specialty"
            className="styled-input"
            style={errors.specialty ? { border: "1px solid #c0392b" } : undefined}
            placeholder={t("specialtyPh")}
            value={form.specialty}
            onChange={handleChange}
          />
          <FieldError text={errors.specialty ? t(errors.specialty) : ""} />
        </div>

        <div className="form-actions" style={{ marginTop: "10px" }}>
          <button type="submit" className="save-btn" style={{ width: "100%" }}>
            {t("addDoctor")}
          </button>
        </div>
      </form>

      <div className="categories-box">
        <div className="box-header">{t("myDoctors")}</div>

        {loading && <p style={{ padding: 15 }}>{t("loading")}</p>}
        {!loading && doctors.length === 0 && (
          <p style={{ padding: 15 }}>{t("noDoctors")}</p>
        )}

        {doctors.map((d) => (
          <div key={d._id} className="category-row">
            <span className="category-name">
              {d.name}
              {d.specialty ? ` — ${d.specialty}` : ""}
            </span>
            <div className="action-buttons">
              <button className="btn-dark delete-btn" onClick={() => handleDelete(d)}>
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </CenterShell>
  );
}