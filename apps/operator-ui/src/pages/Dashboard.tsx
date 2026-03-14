import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type ServiceSchema } from "../services/api";
import ServiceCard from "../components/ServiceCard";
import digitalSevaLogo from "../assets/digital-seva-logo.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"hi" | "en">(
    (localStorage.getItem("ui_lang") as "hi" | "en") || "hi"
  );
  const operatorName = localStorage.getItem("operator_name") || "Operator";
  const district = localStorage.getItem("operator_district") || "Chhattisgarh";

  useEffect(() => {
    let mounted = true;
    api
      .getServices()
      .then((data) => {
        if (mounted) setServices(data.services || []);
      })
      .catch((error) => console.error(error))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = (service) => {
    navigate(`/service/${service.service_type}`);
  };

  const copy = {
    hi: {
      topRight: "डिजिटल भारत के साथ जारी रखें",
      navTitle: "कॉमन सर्विस सेंटर",
      navSubtitle: "Digital Seva Portal",
      navLinks: ["होम", "CSC Locator", "जानकारी सुविधा", "संपर्क"],
      welcome: "स्वागत है",
      district: "जिला",
      badge: "AI प्री-स्क्रीनिंग डेस्क",
      loading: "सेवाएँ लोड हो रही हैं..."
    },
    en: {
      topRight: "Continue with Digital India",
      navTitle: "Common Service Center",
      navSubtitle: "Digital Seva Portal",
      navLinks: ["Home", "CSC Locator", "Jaankari Suvidha", "Contact"],
      welcome: "Welcome",
      district: "District",
      badge: "AI Pre-Submission Desk",
      loading: "Loading services..."
    }
  } as const;

  const t = copy[lang];

  return (
    <div className="services-page">
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

      <div className="shell" style={{ paddingTop: "32px" }}>
        <div className="services-header">
          <div>
            <h1 className="title">
              {t.welcome}, {operatorName}
            </h1>
            <p className="subtitle">
              {t.district}: {district}
            </p>
          </div>
          <span className="services-badge">{t.badge}</span>
        </div>

        {loading ? (
          <div className="card">{t.loading}</div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard key={service.service_id} service={service} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
