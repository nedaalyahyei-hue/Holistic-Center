import React, { useState, useEffect } from "react";
import "./Home.css";
import { Link } from "react-router-dom";

// استيراد الصور من المسارات الصحيحة
import AbnaFreish from "../../assets/AbnaFreish.png";
import Muscat from "../../assets/Muscat.jpg";
import AlYahyeai from "../../assets/AlYahyeai.jpeg";

export default function Home() {
  const [lang, setLang] = useState("en");
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({
    centers: [],
    treatments: []
  });

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({
        centers: [],
        treatments: []
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:3002/search-centers?q=${encodeURIComponent(searchTerm)}`
        );
        const data = await res.json();
        setSearchResults({
          centers: data.centers || [],
          treatments: data.treatments || []
        });
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const centers = [
    { id: 1, name: "Abna Freish Center", nameAr: "مركز أبناء فريش", img: AbnaFreish, rating: 3 },
    { id: 2, name: "Muscat Hijama Center", nameAr: "مركز مسقط للحجامة", img: Muscat, rating: 3 },
    { id: 3, name: "AlYahyeai Hijama Center", nameAr: "مركز اليحيائي للحجامة", img: AlYahyeai, rating: 3 },
    { id: 4, name: "BMC Center", nameAr: "مركز بي إم سي", img: "/BMC.png", rating: 3 },
    { id: 5, name: "Al Manar Hijama Center", nameAr: "مركز المنار للحجامة", img: "/AlManar.png", rating: 3 },
  ];

  const t = {
    en: {
      home: "Home", centers: "Centers", dashboard: "Dashboard", login: "Login",
      heroTitle: "Find and book the best traditional wellness centers in Muscat",
      searchPlaceholder: "Search centers", featured: "Featured Centers",
      all: "All Centers", view: "View Center", contact: "contact"
    },
    ar: {
      home: "الرئيسية", centers: "المراكز", dashboard: "لوحة التحكم", login: "دخول",
      heroTitle: "ابحث واحجز أفضل مراكز الاستشفاء التقليدية في مسقط",
      searchPlaceholder: "ابحث عن المراكز", featured: "المراكز المميزة",
      all: "كل المراكز", view: "عرض المركز", contact: "اتصل بنا"
    }
  };

  const current = t[lang];

  const filteredCenters = !searchTerm.trim()
    ? centers
    : centers.filter((center) => {
      const matchesName =
        center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.nameAr.includes(searchTerm);

      const matchesDatabaseCenter = (searchResults.centers || []).some(
        (c) => c.centerName?.toLowerCase() === center.name.toLowerCase()
      );
      const matchesTreatment = (searchResults.treatments || []).some(
        (t) =>
          t.centerId?.username?.toLowerCase() === center.name.toLowerCase()
      );

      return matchesName || matchesDatabaseCenter || matchesTreatment;
    });
  return (
    <div className={`home-wrapper ${darkMode ? "dark" : ""} ${lang === "ar" ? "rtl" : ""}`}>

      {/* Navbar - الهيدر العلوي */}
      <nav className="navbar-custom">
        <div className="nav-logo-section">
          <span>Holistic Centers</span>
        </div>
        <ul className="nav-menu">

          <li>
            <Link to="/home" className="active">
              {current.home}
            </Link>
          </li>

          <li>
            <Link to="/customer/centers">
              {current.centers}
            </Link>
          </li>

          <li>
            <Link to="/customer/dashboard">
              {current.dashboard}
            </Link>
          </li>

          <li>
            <Link to="/login">
              {current.login}
            </Link>
          </li>

        </ul>
        <div className="nav-tools">
          <span className="tool-icon" onClick={() => setDarkMode(!darkMode)}>{darkMode ? "☀️" : "🌙"}</span>
          <span className="tool-icon" onClick={() => setLang(lang === "en" ? "ar" : "en")}>🌐</span>
        </div>
      </nav>

      {/* Hero Section - الشريط الذي يحتوي على الخلفية والبحث */}
      <header className="hero-container">
        <div className="hero-bg-overlay">
          <img src="/logo.png" alt="Logo" className="hero-logo-img" />
          <h2 className="hero-text">{current.heroTitle}</h2>
          <div className="hero-search-wrapper">
            <input
              type="text"
              placeholder={current.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-glass">🔍</span>
          </div>
        </div>
      </header>

      {/* Main Content - قسم البطاقات */}
      <main className="cards-section">
        <div className="container-inner">
          <h3 className="section-title">{current.featured}</h3>
          <div className="cards-layout">
            {filteredCenters.slice(0, 3).map((center) => (
              <div className="center-card-item" key={center.id}>
                <div className="center-card-img">
                  <img src={center.img} alt={center.name} />
                </div>
                <h4 className="center-card-name">{lang === "en" ? center.name : center.nameAr}</h4>
                <div className="center-card-stars">{"⭐".repeat(center.rating)}</div>

                {/* to click in view center locate in 1 posiation */}
                {center.id === 1 ? (
                  <Link to="/customer/center-details">
                    <button className="center-card-btn">
                      {current.view}
                    </button>
                  </Link>
                ) : (
                  <button className="center-card-btn">
                    {current.view}
                  </button>
                )}
              </div>
            ))}
          </div>

          <h3 className="section-title" style={{ marginTop: '40px' }}>{current.all}</h3>
          <div className="cards-layout">
            {filteredCenters.map((center) => (
              <div className="center-card-item" key={center.id}>
                <div className="center-card-img">
                  <img src={center.img} alt={center.name} />
                </div>
                <h4 className="center-card-name">{lang === "en" ? center.name : center.nameAr}</h4>
                <div className="center-card-stars">{"⭐".repeat(center.rating)}</div>
                <button className="center-card-btn">{current.view}</button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="footer-simple-box" id="contact">
        <p>{current.contact} +96899558654</p>
        <p>customerservice@holisticcenter.com</p>
        <div className="social-icons-list">
          <span>📞</span><span>🔗</span><span>📸</span><span>📘</span><span>▶️</span>
        </div>
      </footer>
    </div>
  );
}