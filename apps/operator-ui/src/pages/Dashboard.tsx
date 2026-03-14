import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type ServiceSchema, type WhatsappLaunchConfig } from "../services/api";
import ServiceCard from "../components/ServiceCard";
import digitalSevaLogo from "../assets/digital-seva-logo.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"hi" | "en">(
    (localStorage.getItem("ui_lang") as "hi" | "en") || "hi"
  );
  const [waConfig, setWaConfig] = useState<WhatsappLaunchConfig | null>(null);
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

    api
      .getWhatsappLaunchConfig()
      .then((cfg) => { if (mounted) setWaConfig(cfg); })
      .catch(() => { /* non-critical — button just won't show */ });

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
      loading: "सेवाएँ लोड हो रही हैं...",
      waButton: "WhatsApp पर शुरू करें",
      waHint: "नागरिक को WhatsApp पर प्री-चेक शुरू करने के लिए भेजें"
    },
    en: {
      topRight: "Continue with Digital India",
      navTitle: "Common Service Center",
      navSubtitle: "Digital Seva Portal",
      navLinks: ["Home", "CSC Locator", "Jaankari Suvidha", "Contact"],
      welcome: "Welcome",
      district: "District",
      badge: "AI Pre-Submission Desk",
      loading: "Loading services...",
      waButton: "Start on WhatsApp",
      waHint: "Send to citizen to begin WhatsApp pre-check"
    }
  } as const;

  const t = copy[lang];
  const waLink = waConfig?.deep_link || waConfig?.whatsapp_url || waConfig?.fallback_link;

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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span className="services-badge">{t.badge}</span>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="btn"
                title={t.waHint}
                style={{ background: "#25D366", border: "none", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t.waButton}
              </a>
            )}
          </div>
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
