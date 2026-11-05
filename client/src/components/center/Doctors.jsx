import React, { useState, useEffect } from "react";
import "./Center.css";
import "./Management.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";

const API = "http://localhost:3002";

export default function Doctors() {
  const navigate = useNavigate();
  const { t, ts } = useLang();

  const user = JSON.parse(localStorage.getItem("user"));

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", specialty: "" });

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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();

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

      <form className="form-box" onSubmit={handleAdd} style={{ marginBottom: "20px" }}>
        <div className="form-group">
          <label className="card-label">{t("doctorNameLbl")}</label>
          <input
            type="text"
            name="name"
            className="styled-input"
            placeholder={t("doctorNamePh")}
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="card-label">{t("specialty")}</label>
          <input
            type="text"
            name="specialty"
            className="styled-input"
            placeholder={t("specialtyPh")}
            value={form.specialty}
            onChange={handleChange}
          />
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