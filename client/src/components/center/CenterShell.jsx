import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaBars, FaMoon, FaSun, FaUserMd } from "react-icons/fa";
import {
  MdLanguage, MdAccountCircle, MdPerson, MdDashboard, MdMedicalServices,
  MdEventAvailable, MdHistory, MdAddCircle, MdEdit, MdExpandMore,
} from "react-icons/md";
import { IoLogOutOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useLang } from "./centerLang";
import usePendingRefunds from "./usePendingRefunds";
import logoImg from "../../assets/logo.png";
import "./CenterShell.css";

const SIDEBAR_W = 270;
const NARROW = 900;
const STORE_KEY = "centerSidebarOpen";

// pages that belong to the "Center Treatment" group
const GROUP_PAGES = ["management", "editTreatment", "addTreatment"];

const isNarrowNow = () => typeof window !== "undefined" && window.innerWidth <= NARROW;

const readOpen = () => {
  if (isNarrowNow()) return false;
  try {
    return localStorage.getItem(STORE_KEY) !== "0";
  } catch (error) {
    return true;
  }
};

const readCenterId = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?._id;
  } catch (error) {
    return undefined;
  }
};

// Shared layout for all center pages: topbar, fixed side menu, dark mode and language button
export default function CenterShell({ active, children }) {
  const navigate = useNavigate();
  const { lang, t, toggleLang } = useLang();
  const isAr = lang === "ar";

  const [darkMode, setDarkMode] = useState(false);
  const [narrow, setNarrow] = useState(isNarrowNow);
  const [open, setOpen] = useState(readOpen);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [centerId] = useState(readCenterId);
  const pending = usePendingRefunds(centerId);
  const pendingText = pending > 99 ? "99+" : String(pending);

  const groupActive = GROUP_PAGES.includes(active);
  const [treatOpen, setTreatOpen] = useState(groupActive);

  // switching between a small and a big screen
  useEffect(() => {
    let wasNarrow = isNarrowNow();
    const onResize = () => {
      const now = isNarrowNow();
      if (now !== wasNarrow) {
        wasNarrow = now;
        setNarrow(now);
        setOpen(now ? false : readOpen());
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Esc closes the logout question
  useEffect(() => {
    if (!confirmLogout) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setConfirmLogout(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmLogout]);

  const toggleSidebar = () => {
    const next = !open;
    setOpen(next);
    if (!narrow) {
      try {
        localStorage.setItem(STORE_KEY, next ? "1" : "0");
      } catch (error) {
        /* ignore */
      }
    }
  };

  const go = (path) => {
    if (narrow) setOpen(false);
    navigate(path);
  };

  const askLogout = () => {
    if (narrow) setOpen(false);
    setConfirmLogout(true);
  };

  const doLogout = () => {
    try {
      localStorage.removeItem("user");
    } catch (error) {
      /* ignore */
    }
    setConfirmLogout(false);
    navigate("/");
  };

  // the page content and the topbar make room for the menu while it is open
  const shift = open && !narrow ? SIDEBAR_W : 0;
  const shiftStyle = {
    marginLeft: isAr ? 0 : shift,
    marginRight: isAr ? shift : 0,
    width: shift ? `calc(100% - ${shift}px)` : "100%",
    boxSizing: "border-box",
    transition: "margin 0.3s ease, width 0.3s ease",
  };

  const renderItem = (key, icon, label, isActive, onClick, isChild, badge) => (
    <div
      key={key}
      className={`cs-item ${isChild ? "cs-child" : ""} ${isActive ? "cs-active" : ""}`}
      onClick={onClick}
    >
      <span className="cs-icon">{icon}</span>
      <span className="cs-label">{label}</span>
      {badge}
    </div>
  );

  // opens a page, unless we are already on it
  const open_ = (pageKey, path) => (active === pageKey ? undefined : () => go(path));

  const refundBadge =
    pending > 0 ? (
      <span className="cs-badge" title={t("pendingRefundsTitle", { n: pending })}>
        {pendingText}
      </span>
    ) : null;

  const sidebar = (
    <>
      {narrow && open && <div className="cs-backdrop" onClick={() => setOpen(false)} />}

      <aside
        className={`cs-sidebar ${isAr ? "cs-rtl" : "cs-ltr"} ${open ? "" : "cs-closed"} ${darkMode ? "cs-dark" : ""}`}
        dir={isAr ? "rtl" : "ltr"}
        aria-hidden={!open}
      >
        <div className="cs-brand" onClick={() => go("/center/dashboard")}>
          <img src={logoImg} alt="HCS" />
        </div>

        <nav className="cs-menu">
          {renderItem("profile", <MdPerson />, t("profile"),
            active === "profile", open_("profile", "/center/center-profile"))}

          {renderItem("dashboard", <MdDashboard />, t("dashboard"),
            active === "dashboard", open_("dashboard", "/center/dashboard"))}

          {/* Center Treatment group: Edit / Delete and Add */}
          <div
            className={`cs-item ${groupActive ? "cs-active-parent" : ""}`}
            onClick={() => setTreatOpen(!treatOpen)}
          >
            <span className="cs-icon"><MdMedicalServices /></span>
            <span className="cs-label">{t("centerTreatment")}</span>
            <MdExpandMore className={`cs-chev ${treatOpen ? "cs-chev-open" : ""}`} />
          </div>

          <div className={`cs-sub ${treatOpen ? "cs-sub-open" : ""}`}>
            {renderItem("treatList", <MdEdit />, t("treatmentsList"),
              active === "management" || active === "editTreatment",
              open_("management", "/center/management"), true)}

            {renderItem("treatAdd", <MdAddCircle />, t("addTreatment"),
              active === "addTreatment",
              open_("addTreatment", "/center/add-treatment"), true)}
          </div>

          {renderItem("appointments", <MdEventAvailable />, t("managementAppointments"),
            active === "managementAppointments",
            open_("managementAppointments", "/center/management-appointment"))}

          {renderItem("refunds", <MdHistory />, t("refundRequests"),
            active === "refundRequests",
            open_("refundRequests", "/center/appointment-refundApproval"),
            false, refundBadge)}

          {renderItem("doctors", <FaUserMd />, t("doctors"),
            active === "doctors", open_("doctors", "/center/doctors"))}
        </nav>

        <div className="cs-logout" onClick={askLogout}>
          <IoLogOutOutline size={22} />
          <span>{t("logout")}</span>
        </div>
      </aside>
    </>
  );

  const logoutDialog = confirmLogout ? (
    <div className="cs-modal-backdrop" onClick={() => setConfirmLogout(false)}>
      <div
        className={`cs-modal ${darkMode ? "cs-modal-dark" : ""}`}
        dir={isAr ? "rtl" : "ltr"}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cs-modal-icon"><IoLogOutOutline size={34} /></div>
        <h3>{t("logoutTitle")}</h3>
        <p>{t("logoutText")}</p>
        <div className="cs-modal-actions">
          <button type="button" className="cs-btn-stay" onClick={() => setConfirmLogout(false)}>
            {t("stay")}
          </button>
          <button type="button" className="cs-btn-leave" onClick={doLogout}>
            {t("logoutYes")}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div
      className={`center-page ${darkMode ? "dark" : ""}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="center-overlay">
        <div className="topbar" style={shiftStyle}>
          <div className="topbar-left">
            <button className="icon-btn" onClick={toggleSidebar} style={{ position: "relative" }}>
              <FaBars />
              {/* the menu is closed but a refund request is waiting */}
              {pending > 0 && !open && <span className="cs-dot" />}
            </button>
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
          <div className="content-wrapper" style={shiftStyle}>{children}</div>
        </div>
      </div>

      {/* drawn outside the page so they always stay fixed to the screen */}
      {createPortal(
        <>
          {sidebar}
          {logoutDialog}
        </>,
        document.body
      )}
    </div>
  );
}