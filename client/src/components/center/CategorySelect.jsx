import React, { useState, useEffect } from "react";
import { useLang } from "./centerLang";

// Category list = the treatment names the admin adds in "Treatment Management"
export default function CategorySelect({ value, onChange }) {
  const { t } = useLang();
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    fetch("http://localhost:3002/admin/treatments")
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "success" && Array.isArray(data.treatments)) {
          const names = data.treatments
            .map((x) => x.name)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
          setCategories(names);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  // an old value that is not in the admin list (for example "Therapy") stays visible
  const oldValue = status === "ready" && value && !categories.includes(value);

  return (
    <div>
      <select
        name="category"
        className="styled-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">{t("selectCategory")}</option>
        {categories.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
        {oldValue && <option value={value}>{value} ({t("notInList")})</option>}
      </select>

      {status === "loading" && (
        <p style={{ fontSize: "13px", color: "#777", marginTop: "6px" }}>{t("loading")}</p>
      )}
      {status === "error" && (
        <p style={{ fontSize: "14px", color: "#c0392b", marginTop: "6px" }}>{t("categoriesError")}</p>
      )}
      {status === "ready" && categories.length === 0 && (
        <p style={{ fontSize: "14px", color: "#b9650f", marginTop: "6px" }}>{t("noCategoriesYet")}</p>
      )}
    </div>
  );
}