import React, { useState } from "react";
import { FaBars, FaMoon, FaSun } from "react-icons/fa";
import { MdLanguage, MdAccountCircle } from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useLang } from "./centerLang";

const ITEMS = [
  ["profile", "/center/center-profile"],
  ["dashboard", "/center/dashboard"],
  ["management", "/center/management"],
  ["refundRequests", "/center/appointment-refundApproval"],
  ["addTreatment", "/center/add-treatment"],
  ["editTreatment", "/center/edit-treatment"],
  ["managementAppointments", "/center/management-appointment"],
];

// Shared layout for all center pages: topbar, sidebar, dark mode and language button
export default function CenterShell({ active, children }) {
  const navigate = useNavigate();
  const { lang, t, toggleLang } = useLang();
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div
      className={`center-page ${darkMode ? "dark" : ""}`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="center-overlay">
        <div className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setOpen(!open)}><FaBars /></button>
            <button
              className="icon-btn profile-nav-btn"
              onClick={() => navigate("/center/center-profile")}
            >
              <MdAccountCircle size={32} />
            </button>
            <span className="menu-text">{t("centerPanel")}</span>
          </div>

          <div className="topbar-center">
            <div
              className={`nav-item ${active === "dashboard" ? "active" : ""}`}
              onClick={() => navigate("/center/dashboard")}
            >
              {t("dashboard")}
            </div>
          </div>

          <div className="topbar-right">
            <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <FaSun color="#f1c40f" /> : <FaMoon />}
            </button>
            <button className="icon-btn" onClick={toggleLang} title={t("language")}>
              <MdLanguage />
            </button>
          </div>
        </div>

        <div className="layout">
          <div className={`sidebar ${open ? "open" : ""}`}>
            <div className="sidebar-content">
              {ITEMS.map(([key, path]) => (
                <div
                  key={key}
                  className={`sidebar-item ${active === key ? "active" : ""}`}
                  onClick={active === key ? undefined : () => navigate(path)}
                >
                  {t(key)}
                </div>
              ))}
            </div>

            <div className="sidebar-logout" onClick={() => navigate("/")}>
              <IoLogOutOutline size={20} /> {t("logout")}
            </div>
          </div>

          <div className="content-wrapper">{children}</div>
        </div>
      </div>
    </div>
  );
}