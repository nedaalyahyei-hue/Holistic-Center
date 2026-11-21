import React, { useState, useEffect } from "react";
import "./Home.css";
import { Link } from "react-router-dom";

export default function Home() {
  const [lang, setLang] = useState("en");
  const [darkMode, setDarkMode] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({
    centers: [],
    treatments: [],
  });

  // Real centers from the database
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [centersError, setCentersError] = useState("");

  // Load the centers once when the page opens
  useEffect(() => {
    fetch("http://localhost:3002/customer/centers")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load centers");
        return res.json();
      })
      .then((data) => {
        if (data.message === "success") {
          setCenters(data.centers || []);
        } else {
          setCentersError(data.message || "Failed to load centers");
        }
      })
      .catch(() => setCentersError("Failed to load centers"))
      .finally(() => setLoadingCenters(false));
  }, []);

  // Search (center name or treatment name) with a small delay
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ centers: [], treatments: [] });
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
          treatments: data.treatments || [],
        });
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const t = {
    en: {
      home: "Home",
      centers: "Centers",
      dashboard: "Dashboard",
      login: "Login",
      heroTitle: "Find and book the best traditional wellness centers in Muscat",
      searchPlaceholder: "Search centers",
      featured: "Featured Centers",
      all: "All Centers",
      view: "View Center",
      contact: "contact",
      loading: "Loading centers...",
      noCenters: "No centers available yet.",
      noLocation: "Location not available",
      noReviews: "No reviews yet",
    },
    ar: {
      home: "الرئيسية",
      centers: "المراكز",
      dashboard: "لوحة التحكم",
      login: "دخول",
      heroTitle: "ابحث واحجز أفضل مراكز الاستشفاء التقليدية في مسقط",
      searchPlaceholder: "ابحث عن المراكز",
      featured: "المراكز المميزة",
      all: "كل المراكز",
      view: "عرض المركز",
      contact: "اتصل بنا",
      loading: "جاري تحميل المراكز...",
      noCenters: "لا توجد مراكز حالياً.",
      noLocation: "الموقع غير متوفر",
      noReviews: "لا توجد تقييمات بعد",
    },
  };

  const current = t[lang];

  const handleJoinRequest = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const requestData = {
      centerName: formData.get("centerName"),
      centerEmail: formData.get("centerEmail"),
      phoneNumber: formData.get("phoneNumber"),
      crNumber: formData.get("crNumber"),
    };

    setSendingRequest(true);

    try {
      const response = await fetch("http://localhost:3002/request-to-join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Failed to send request");
        return;
      }

      alert("Your request has been sent successfully!");
      form.reset();
      setShowJoinForm(false);
    } catch (error) {
      alert("Cannot connect to server");
    } finally {
      setSendingRequest(false);
    }
  };

  // Filter the real centers by the search text
  const filteredCenters = !searchTerm.trim()
    ? centers
    : centers.filter((center) => {
        const term = searchTerm.trim().toLowerCase();
        const centerName = (center.centerName || "").toLowerCase();

        const matchesName = centerName.includes(term);

        const matchesDatabaseCenter = (searchResults.centers || []).some(
          (c) => String(c._id) === String(center._id)
        );

        const matchesTreatment = (searchResults.treatments || []).some(
          (tr) => (tr.centerId?.username || "").toLowerCase() === centerName
        );

        return matchesName || matchesDatabaseCenter || matchesTreatment;
      });

  // Featured = the 3 centers with the most bookings (centers with no bookings are not featured)
  const featuredCenters = [...filteredCenters]
    .filter((c) => (c.bookingsCount || 0) > 0)
    .sort(
      (a, b) =>
        (b.bookingsCount || 0) - (a.bookingsCount || 0) ||
        (b.avgRating || 0) - (a.avgRating || 0)
    )
    .slice(0, 3);

  // Stars from the average of the real reviews (0 to 5)
  const renderStars = (avg) => {
    const filled = Math.max(0, Math.min(5, Math.round(avg || 0)));
    return "★".repeat(filled) + "☆".repeat(5 - filled);
  };

  // One card: the whole card opens the login page
  const renderCenterCard = (center) => (
    <Link to="/login" className="center-card-link" key={center._id}>
      <div className="center-card-item">
        <div className="center-card-img">
          <img src={center.image || "/logo.png"} alt={center.centerName} />
        </div>
        <h4 className="center-card-name">{center.centerName}</h4>
        <p className="center-card-location">
          {center.location || current.noLocation}
        </p>
        <div className="center-card-stars">{renderStars(center.avgRating)}</div>
        <p className="center-card-rating">
          {center.reviewsCount > 0
            ? `${center.avgRating} (${center.reviewsCount})`
            : current.noReviews}
        </p>
        <span className="center-card-btn">{current.view}</span>
      </div>
    </Link>
  );

  return (
    <div
      className={`home-wrapper ${darkMode ? "dark" : ""} ${
        lang === "ar" ? "rtl" : ""
      }`}
    >
      {/* Navbar */}
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
            <Link to="/customer/centers">{current.centers}</Link>
          </li>

          <li>
            <Link to="/customer/dashboard">{current.dashboard}</Link>
          </li>

          <li>
            <Link to="/login">{current.login}</Link>
          </li>
        </ul>

        <div className="nav-tools">
          <button
            type="button"
            className="request-join-btn"
            onClick={() => setShowJoinForm(true)}
          >
            {lang === "en" ? "Request to Join" : "طلب الانضمام"}
          </button>

          <span className="tool-icon" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </span>

          <span
            className="tool-icon"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
          >
            🌐
          </span>
        </div>
      </nav>

      {/* Hero */}
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

      {/* Centers */}
      <main className="cards-section">
        <div className="container-inner">
          {loadingCenters && <p>{current.loading}</p>}
          {centersError && <p>{centersError}</p>}
          {!loadingCenters && !centersError && filteredCenters.length === 0 && (
            <p>{current.noCenters}</p>
          )}

          {filteredCenters.length > 0 && (
            <>
              {featuredCenters.length > 0 && (
                <>
                  <h3 className="section-title">{current.featured}</h3>
                  <div className="cards-layout">
                    {featuredCenters.map(renderCenterCard)}
                  </div>
                </>
              )}

              <h3
                className="section-title"
                style={{ marginTop: featuredCenters.length > 0 ? "40px" : 0 }}
              >
                {current.all}
              </h3>
              <div className="cards-layout">
                {filteredCenters.map(renderCenterCard)}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer-simple-box" id="contact">
        <p>{current.contact} +96899558654</p>
        <p>customerservice@holisticcenter.com</p>
        <div className="social-icons-list">
          <span>📞</span>
          <span>🔗</span>
          <span>📸</span>
          <span>📘</span>
          <span>▶️</span>
        </div>
      </footer>

      {/* Request to Join modal */}
      {showJoinForm && (
        <div className="join-modal-overlay">
          <div className="join-modal">
            <button
              type="button"
              className="join-close-btn"
              onClick={() => setShowJoinForm(false)}
            >
              ×
            </button>

            <h2>Request to Join</h2>
            <p>Enter your center details to request registration.</p>

            <form onSubmit={handleJoinRequest}>
              <label>Center Name</label>
              <input
                type="text"
                name="centerName"
                placeholder="Center Name"
                required
              />

              <label>Center Email</label>
              <input
                type="email"
                name="centerEmail"
                placeholder="Center Email"
                required
              />

              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                required
              />

              <label>CR Number</label>
              <input
                type="text"
                name="crNumber"
                placeholder="Commercial Registration Number"
                required
              />

              <button
                type="submit"
                className="join-send-btn"
                disabled={sendingRequest}
              >
                {sendingRequest ? "Sending..." : "Send Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}