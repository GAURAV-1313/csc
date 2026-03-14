import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import heroHi from "../assets/hero-hi.jpg";
import heroEn from "../assets/hero-en.jpg";
import digitalSevaLogo from "../assets/digital-seva-logo.png";
import aadhaarIcon from "../assets/services/Aadhaar.webp";
import ayushmanIcon from "../assets/services/AYUSHMAN-BHARAT.webp";
import jeevanIcon from "../assets/services/JEEVAN-PRAMAAN.webp";
import passportIcon from "../assets/services/Passport.webp";
import panIcon from "../assets/services/pan-card.svg";
import incomeIcon from "../assets/services/income.svg";
import domicileIcon from "../assets/services/domicile.svg";
import scstIcon from "../assets/services/scst.svg";
import obcIcon from "../assets/services/obc.svg";
import landIcon from "../assets/services/land.svg";
import birthIcon from "../assets/services/birth.svg";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    operator_id: "",
    name: "",
    district: ""
  });
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"hi" | "en">(
    (localStorage.getItem("ui_lang") as "hi" | "en") || "hi"
  );
  const [heroIndex, setHeroIndex] = useState(0);

  const copy = {
    hi: {
      topLeft: "हिंदी | भाषा चुनें • हेल्पलाइन: 0771-2992035",
      topRight: "डिजिटल भारत के साथ जारी रखें",
      navTitle: "कॉमन सर्विस सेंटर",
      navSubtitle: "Digital Seva Portal",
      navLinks: ["होम", "CSC Locator", "जानकारी सुविधा", "संपर्क"],
      heroTitle: "लोक सेवा केंद्र • AI प्री-स्क्रीनिंग डेस्क",
      heroBody:
        "CSC ऑपरेटरों के लिए तेज़ आवेदन सत्यापन, दस्तावेज़ जांच और जोखिम विश्लेषण — सब एक जगह.",
      notice: "AI Copilot केवल प्री-वैलिडेशन करता है, अंतिम सबमिशन eDistrict पर होगा.",
      loginTitle: "CSC Operator Access",
      loginSub: "कृपया ऑपरेटर विवरण भरें.",
      operatorId: "Operator ID *",
      name: "नाम",
      district: "जिला",
      loginBtn: "लॉगिन और आगे बढ़ें",
      citizenLogin: "नागरिक लॉगिन"
    },
    en: {
      topLeft: "English | Select Language • Helpline: 0771-2992035",
      topRight: "Continue with Digital India",
      navTitle: "Common Service Center",
      navSubtitle: "Digital Seva Portal",
      navLinks: ["Home", "CSC Locator", "Jaankari Suvidha", "Contact"],
      heroTitle: "Lok Seva Kendra • AI Pre-Screening Desk",
      heroBody: "Fast application validation, document checks, and risk analysis for CSC operators.",
      notice: "AI Copilot performs pre-validation only. Final submission happens on eDistrict.",
      loginTitle: "CSC Operator Access",
      loginSub: "Please enter your operator details.",
      operatorId: "Operator ID *",
      name: "Name",
      district: "District",
      loginBtn: "Login & Continue",
      citizenLogin: "Citizen Login"
    }
  } as const;

  const t = copy[lang];
  const heroImages = lang === "hi" ? [heroHi] : [heroEn];
  const [activeTab, setActiveTab] = useState<"g2c" | "b2c">("g2c");
  const [activeFilter, setActiveFilter] = useState<"central" | "state" | "other">("central");

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.operator_id) {
      alert("Operator ID is required.");
      return;
    }
    setLoading(true);
    try {
      await api.createOperator(form);
      localStorage.setItem("operator_id", form.operator_id);
      localStorage.setItem("operator_name", form.name || form.operator_id);
      localStorage.setItem("operator_district", form.district || "");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="topbar">
        <div className="shell">
          <div className="lang-select">
            <span>{lang === "hi" ? "भाषा चुनें" : "Select Language"}</span>
            <select
              value={lang}
              onChange={(event) => {
                const next = event.target.value as "hi" | "en";
                setLang(next);
                localStorage.setItem("ui_lang", next);
              }}
            >
              <option value="hi">हिंदी</option>
              <option value="en">English</option>
            </select>
          </div>
          <span>{t.topRight}</span>
        </div>
      </div>

      <div className="nav">
        <div className="shell">
          <div className="logo">
            <img src={digitalSevaLogo} alt="CSC Digital India" style={{ height: "44px" }} />
            <div>
              <strong>{t.navTitle}</strong>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{t.navSubtitle}</div>
            </div>
          </div>
          <div className="nav-links">
            {t.navLinks.map((link) => (
              <span key={link}>{link}</span>
            ))}
          </div>
          <div className="nav-actions">
            <button className="btn secondary" type="button">
              Join Us as a VLE
            </button>
            <button className="btn" type="button">
              Login
            </button>
          </div>
        </div>
      </div>

      <div className="shell">
        <div className="login-grid">
          <div>
            <div className="notice" style={{ fontWeight: 700 }}>
              {lang === "hi"
                ? "यह केवल फ़ॉर्म सहायता के लिए है, वास्तविक सबमिशन मुख्य पोर्टल पर ही होगा।"
                : "This is only for form assistance. Actual submission happens on the main portal only."}
            </div>
            <div className="hero">
              <img src={heroImages[heroIndex]} alt="Digital Seva Banner" />
            </div>

            <div className="notice">
              <strong>सूचना:</strong>
              <span>{t.notice}</span>
            </div>
          </div>

          <div className="login-card">
            <div className="pill">Operator Login</div>
            <h2 style={{ fontSize: "22px", marginTop: "10px" }}>{t.loginTitle}</h2>
            <p className="subtitle">{t.loginSub}</p>
            <form style={{ marginTop: "20px" }} onSubmit={handleSubmit}>
              <div className="form-row">
                <label>{t.operatorId}</label>
                <input
                  type="text"
                  value={form.operator_id}
                  onChange={(event) => handleChange("operator_id", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label>{t.name}</label>
                <input type="text" value={form.name} onChange={(event) => handleChange("name", event.target.value)} />
              </div>
              <div className="form-row">
                <label>{t.district}</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(event) => handleChange("district", event.target.value)}
                />
              </div>
              <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Signing in..." : t.loginBtn}
              </button>
              <button className="btn secondary" type="button" style={{ width: "100%", marginTop: "10px" }}>
                {t.citizenLogin}
              </button>
            </form>
          </div>
        </div>

        <div className="services-showcase">
          <h2>
            {lang === "hi" ? "हमारी सेवाएँ" : "Our Services"}{" "}
            <span style={{ color: "#f97316" }}>{lang === "hi" ? "उपलब्ध" : "Available"}</span>
          </h2>
          <div className="services-tabs">
            <button
              className={`services-tab ${activeTab === "g2c" ? "active" : ""}`}
              onClick={() => setActiveTab("g2c")}
              type="button"
            >
              Government to Citizen Services (G2C)
            </button>
            <button
              className={`services-tab ${activeTab === "b2c" ? "active" : ""}`}
              onClick={() => setActiveTab("b2c")}
              type="button"
            >
              Business to Citizen Services (B2C)
            </button>
          </div>
          <div className="services-filters">
            {[
              { key: "central", label: "Central Government Services" },
              { key: "state", label: "State Government Services" },
              { key: "other", label: "Other Government Services" }
            ].map((filter) => (
              <button
                key={filter.key}
                className={`services-filter ${activeFilter === filter.key ? "active" : ""}`}
                onClick={() => setActiveFilter(filter.key as "central" | "state" | "other")}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="services-grid-digital">
            {[
              {
                label: "Income Certificate",
                meta: "income_certificate",
                group: "state",
                icon: incomeIcon
              },
              {
                label: "Domicile Certificate",
                meta: "domicile_certificate",
                group: "state",
                icon: domicileIcon
              },
              {
                label: "SC/ST Certificate",
                meta: "sc_st_certificate",
                group: "state",
                icon: scstIcon
              },
              {
                label: "OBC Certificate",
                meta: "obc_certificate",
                group: "state",
                icon: obcIcon
              },
              {
                label: "Land Use Information",
                meta: "land_use_information",
                group: "state",
                icon: landIcon
              },
              {
                label: "Birth Certificate Correction",
                meta: "birth_certificate_correction",
                group: "state",
                icon: birthIcon
              },
              {
                label: "Aadhaar",
                meta: "aadhaar_service",
                group: "central",
                icon: aadhaarIcon
              },
              {
                label: "Ayushman Bharat",
                meta: "ayushman",
                group: "central",
                icon: ayushmanIcon
              },
              {
                label: "PAN",
                meta: "pan_service",
                group: "central",
                icon: panIcon
              },
              {
                label: "Passport",
                meta: "passport_service",
                group: "central",
                icon: passportIcon
              },
              {
                label: "Udyam Services",
                meta: "udyam_service",
                group: "other",
                icon: null
              },
              {
                label: "PM-SVANidhi",
                meta: "pmsvanidhi",
                group: "other",
                icon: null
              }
            ]
              .filter((item) => activeFilter === item.group)
              .map((item) => (
                <div className="service-tile" key={item.meta}>
                  <div className="icon">
                    {item.icon ? (
                      <img src={item.icon} alt={item.label} />
                    ) : (
                      <span>{item.label.split(" ")[0]}</span>
                    )}
                  </div>
                  <div className="label">{item.label}</div>
                  <div className="meta">{item.meta}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
