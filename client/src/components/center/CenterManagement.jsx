import React, { useState, useEffect } from "react";
import "./Management.css";
import { useNavigate } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import CenterShell from "./CenterShell";
import { useLang } from "./centerLang";

export default function CenterManagement() {
  const navigate = useNavigate();
  const { t, ts } = useLang();

  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadTreatments = async () => {
      try {
        const res = await fetch(
          `http://localhost:3002/treatments/center/${user._id}`
        );
        const result = await res.json();
        if (result.message === "success") setTreatments(result.treatments);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadTreatments();
  }, []);

  const handleDelete = async (treatment) => {
    if (!window.confirm(t("confirmDelete", { name: treatment.name }))) return;

    try {
      const res = await fetch(`http://localhost:3002/treatments/${treatment._id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.message === "success") {
        setTreatments(treatments.filter((x) => x._id !== treatment._id));
      } else {
        alert(ts(result.message));
      }
    } catch (error) {
      alert(t("serverError"));
    }
  };

  return (
    <CenterShell active="management">
      <img
        src={logoImg}
        alt="HCS Logo"
        className="profile-logo"
        style={{ width: "180px", marginBottom: "10px" }}
      />

      <h2 className="title">{t("centerManagement")}</h2>

      <div className="categories-box">
        <div className="box-header">{t("myTreatments")}</div>

        {loading && <p style={{ padding: 15 }}>{t("loading")}</p>}
        {!loading && treatments.length === 0 && (
          <p style={{ padding: 15 }}>{t("noTreatments")}</p>
        )}

        {treatments.map((tr) => (
          <div key={tr._id} className="category-row">
            <span className="category-name">{tr.name}</span>
            <div className="action-buttons">
              <button
                className="btn-dark"
                onClick={() =>
                  navigate("/center/edit-treatment", { state: { treatment: tr } })
                }
              >
                {t("edit")}
              </button>
              <button className="btn-dark delete-btn" onClick={() => handleDelete(tr)}>
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="add-category-btn" onClick={() => navigate("/center/add-treatment")}>
        {t("addTreatment")}
      </button>
    </CenterShell>
  );
}