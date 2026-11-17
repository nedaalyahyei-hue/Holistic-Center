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
  const [locations, setLocations] = useState([]); // the branches saved in the center profile
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", specialty: "", locationId: "" });
  const [errors, setErrors] = useState({}); // field -> translation key

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [docRes, centerRes] = await Promise.all([
          fetch(`${API}/doctors/center/${user._id}`),
          fetch(`${API}/center/${user._id}`),
        ]);
        const docs = await docRes.json();
        const center = await centerRes.json();

        if (docs.message === "success") setDoctors(docs.doctors);
        if (center.message === "success") {
          setLocations(
            (center.center.locations || []).map((l) => ({ _id: String(l._id), name: l.name }))
          );
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    // the name, the specialty and the branch are all required
    const found = {};
    if (!form.name.trim()) found.name = "errDoctorName";
    if (form.specialty.trim().length < 2) found.specialty = "errSpecialty";
    if (!form.locationId) found.locationId = "errBranch";
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
          locationId: form.locationId,
        }),
      });
      const result = await res.json();

      if (result.message === "success") {
        setDoctors((prev) =>
          [...prev.filter((d) => d._id !== result.doctor._id), result.doctor].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setForm({ name: "", specialty: "", locationId: form.locationId });
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
        if (result.treatmentsUpdated > 0) {
          alert(t("doctorRemoved", { n: result.treatmentsUpdated }));
        }
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  // move a doctor to another branch (or give a branch to an old doctor who has none)
  const handleBranchChange = async (doctor, locationId) => {
    if (!locationId || locationId === String(doctor.locationId || "")) return;

    try {
      const res = await fetch(`${API}/doctors/${doctor._id}/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: user._id, locationId }),
      });
      const result = await res.json();

      if (result.message === "success") {
        setDoctors((prev) => prev.map((d) => (d._id === doctor._id ? result.doctor : d)));
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  // doctors grouped by branch; the doctors without a branch come first
  const knownIds = new Set(locations.map((l) => l._id));
  const withoutBranch = doctors.filter((d) => !d.locationId || !knownIds.has(String(d.locationId)));
  const groups = [
    ...(withoutBranch.length > 0
      ? [{ id: "none", title: t("noBranch"), list: withoutBranch, warn: true }]
      : []),
    ...locations
      .map((l) => ({
        id: l._id,
        title: l.name,
        list: doctors.filter((d) => String(d.locationId || "") === l._id),
        warn: false,
      }))
      .filter((g) => g.list.length > 0),
  ];

  const renderDoctor = (d, warn) => (
    <div key={d._id} className="category-row" style={{ flexWrap: "wrap", gap: "8px" }}>
      <span className="category-name">
        {d.name}
        {d.specialty ? ` — ${d.specialty}` : ""}
      </span>
      <div className="action-buttons" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <select
          className="styled-input"
          style={{
            minWidth: 150,
            ...(warn ? { border: "1px solid #e67e22" } : {}),
          }}
          value={warn ? "" : String(d.locationId || "")}
          onChange={(e) => handleBranchChange(d, e.target.value)}
          title={t("doctorLocation")}
        >
          {warn && (
            <option value="" disabled>
              {t("selectBranch")}
            </option>
          )}
          {locations.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>
        <button className="btn-dark delete-btn" onClick={() => handleDelete(d)}>
          {t("delete")}
        </button>
      </div>
    </div>
  );

  return (
    <CenterShell active="doctors">
      <img
        src={logoImg}
        alt="HCS Logo"
        className="profile-logo"
        style={{ width: "180px", marginBottom: "10px" }}
      />
      <h2 className="title">{t("doctorsTitle")}</h2>

      {!loading && locations.length === 0 && (
        <div
          style={{
            border: "2px solid #e67e22",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "15px",
            color: "#b9650f",
          }}
        >
          <p style={{ margin: "0 0 8px" }}>{t("noBranchesForDoctors")}</p>
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

        <div className="form-group">
          <label className="card-label">{t("doctorLocation")}<Req /></label>
          <select
            name="locationId"
            className="styled-input"
            style={errors.locationId ? { border: "1px solid #c0392b" } : undefined}
            value={form.locationId}
            onChange={handleChange}
          >
            <option value="">{t("selectBranch")}</option>
            {locations.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </select>
          <FieldError text={errors.locationId ? t(errors.locationId) : ""} />
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

        {groups.map((g) => (
          <div key={g.id}>
            <div
              style={{
                padding: "10px 15px",
                fontWeight: "bold",
                color: g.warn ? "#b9650f" : "#2e6b3a",
                background: g.warn ? "#fdf1e3" : "#eef5ef",
              }}
            >
              {g.title} ({g.list.length})
              {g.warn && (
                <div style={{ fontWeight: "normal", fontSize: "13px", marginTop: "4px" }}>
                  {t("assignBranchHint")}
                </div>
              )}
            </div>
            {g.list.map((d) => renderDoctor(d, g.warn))}
          </div>
        ))}
      </div>
    </CenterShell>
  );
}