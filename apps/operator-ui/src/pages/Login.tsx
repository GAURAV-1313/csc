import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, type ServiceSchema } from "../services/api";
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
  const [services, setServices] = useState<ServiceSchema[]>([]);
  const [waLink, setWaLink] = useState<string | null>(null);

  const copy = {
    hi: {
      topLeft: "हिंदी | भाषा चुनें • हेल्पलाइन: 0771-2992035",
      topRight: "डिजिटल भारत के साथ जारी रखें",
      navTitle: "कॉमन सर्विस सेंटर",
      navSubtitle: "Digital Seva Portal",
      navLinks: [
        { label: "होम", href: "#" },
        { label: "CSC Locator", href: "https://locator.csccloud.in/" },
        { label: "जानकारी सुविधा", href: "https://jaankari.csccloud.in/" },
        { label: "संपर्क", href: "#" }
      ],
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
      navLinks: [
        { label: "Home", href: "#" },
        { label: "CSC Locator", href: "https://locator.csccloud.in/" },
        { label: "Jaankari Suvidha", href: "https://jaankari.csccloud.in/" },
        { label: "Contact", href: "#" }
      ],
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
  const [activeFilter, setActiveFilter] = useState<"all" | "central" | "state" | "other">("all");

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    let mounted = true;
    api
      .getServices()
      .then((data) => {
        if (!mounted) return;
        setServices(data.services || []);
      })
      .catch((error) => {
        console.error(error);
        if (!mounted) return;
        setServices([]);
      });

    api
      .getWhatsappLaunchConfig()
      .then((cfg) => {
        if (!mounted) return;
        const link = cfg?.deep_link || cfg?.whatsapp_url || cfg?.fallback_link;
        setWaLink(link || null);
      })
      .catch(() => {
        if (!mounted) return;
        setWaLink(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const serviceGroup = (service: ServiceSchema): "central" | "state" | "other" => {
    const category = String(service.category || "").toLowerCase();
    if (category.includes("central")) return "central";
    if (category.includes("state") || category.includes("certificate") || category.includes("land")) return "state";
    return "other";
  };

  const showcaseServices = services
    .filter((service) => String(service.service_name || "").trim().length > 0)
    .filter((service) => {
      if (activeTab === "b2c") {
        return serviceGroup(service) === "other";
      }

      if (activeFilter === "all") return true;
      return serviceGroup(service) === activeFilter;
    })
    .slice(0, 40);

  const serviceIcons: Record<string, string> = {
    aadhaar: aadhaarIcon,
    ayushman: ayushmanIcon,
    "jeevan pramaan": jeevanIcon,
    passport: passportIcon,
    pan: panIcon,
    income_certificate: incomeIcon,
    domicile_certificate: domicileIcon,
    sc_st_certificate: scstIcon,
    obc_certificate: obcIcon,
    land_use_information: landIcon,
    birth_certificate_correction: birthIcon
  };

  const getServiceIcon = (service: ServiceSchema) => {
    const typeKey = String(service.service_type || "").toLowerCase();
    if (serviceIcons[typeKey]) return serviceIcons[typeKey];
    const nameKey = String(service.service_name || "").toLowerCase();
    const matchKey = Object.keys(serviceIcons).find((key) => nameKey.includes(key));
    return matchKey ? serviceIcons[matchKey] : "";
  };

  const getIconKind = (service: ServiceSchema) => {
    const name = String(service.service_name || "").toLowerCase();
    const type = String(service.service_type || "").toLowerCase();
    if (name.includes("certificate") || type.includes("certificate")) return "certificate";
    if (name.includes("license") || name.includes("licence") || type.includes("license")) return "license";
    if (name.includes("registration") || type.includes("registration")) return "registration";
    if (name.includes("pension")) return "pension";
    if (name.includes("land") || name.includes("mutation")) return "land";
    if (name.includes("water") || name.includes("tap")) return "water";
    if (name.includes("grievance")) return "grievance";
    return "service";
  };

  const renderFallbackIcon = (kind: string) => {
    switch (kind) {
      case "certificate":
        return (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="10" y="10" width="44" height="44" rx="8" fill="#FFF7ED" stroke="#FDBA74" />
            <rect x="18" y="22" width="28" height="4" rx="2" fill="#FB923C" />
            <rect x="18" y="30" width="20" height="4" rx="2" fill="#FDBA74" />
            <circle cx="46" cy="42" r="6" fill="#F97316" />
          </svg>
        );
      case "license":
        return (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="10" y="14" width="44" height="36" rx="6" fill="#EEF2FF" stroke="#A5B4FC" />
            <rect x="16" y="22" width="18" height="16" rx="4" fill="#6366F1" />
            <rect x="38" y="24" width="14" height="4" rx="2" fill="#94A3B8" />
            <rect x="38" y="32" width="10" height="4" rx="2" fill="#CBD5F5" />
          </svg>
        );
      case "registration":
        return (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="14" y="10" width="36" height="44" rx="8" fill="#ECFCCB" stroke="#A3E635" />
            <rect x="20" y="20" width="24" height="4" rx="2" fill="#65A30D" />
            <rect x="20" y="28" width="18" height="4" rx="2" fill="#84CC16" />
            <circle cx="44" cy="42" r="6" fill="#4D7C0F" />
          </svg>
        );
      case "pension":
        return (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="12" y="14" width="40" height="36" rx="10" fill="#FEF3C7" stroke="#FDE68A" />
            <circle cx="32" cy="32" r="10" fill="#F59E0B" />
            <rect x="30" y="22" width="4" height="20" rx="2" fill="#92400E" />
          </svg>
        );
      case "land":
        return (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="12" y="12" width="40" height="40" rx="8" fill="#DCFCE7" stroke="#86EFAC" />
            <path d="M20 40c6-8 18-8 24 0" fill="#22C55E" />
            <circle cx="24" cy="26" r="6" fill="#16A34A" />
          </svg>
        );
      case "water":
        return (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="14" y="10" width="36" height="44" rx="8" fill="#E0F2FE" stroke="#7DD3FC" />
            <path d="M32 20c6 8 8 12 8 16a8 8 0 1 1-16 0c0-4 2-8 8-16z" fill="#38BDF8" />
          </svg>
        );
      case "grievance":
        return (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="12" y="12" width="40" height="40" rx="8" fill="#FFE4E6" stroke="#FDA4AF" />
            <path d="M32 20v16" stroke="#F43F5E" strokeWidth="4" strokeLinecap="round" />
            <circle cx="32" cy="42" r="3" fill="#F43F5E" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="12" y="12" width="40" height="40" rx="8" fill="#F3F4F6" stroke="#CBD5E1" />
            <path d="M22 34h20" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
            <path d="M22 26h14" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );
    }
  };

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
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
          <div className="nav-actions">
            <button className="btn" type="button">
              Login
            </button>
          </div>
        </div>
      </div>

      <div className="shell">
        <div className="login-grid">
          <div className="login-primary-column">
            <div className="notice" style={{ fontWeight: 700 }}>
              {lang === "hi"
                ? "यह केवल फ़ॉर्म सहायता के लिए है, वास्तविक सबमिशन मुख्य पोर्टल पर ही होगा।"
                : "This is only for form assistance. Actual submission happens on the main portal only."}
            </div>
            <div className="hero">
              <img src={heroImages[heroIndex]} alt="Digital Seva Banner" />
            </div>

            {waLink && (
              <a className="wa-banner" href={waLink} target="_blank" rel="noreferrer">
                <div className="wa-banner-icon" aria-hidden="true">📱</div>
                <div className="wa-banner-content">
                  <strong>{lang === "hi" ? "WhatsApp प्री-चेक शुरू करें" : "Start Pre-Check on WhatsApp"}</strong>
                  <span>
                    {lang === "hi"
                      ? "नागरिक अपना रेफरेंस आईडी लेकर रिपोर्ट मंगवा सकते हैं"
                      : "Citizens can use their Reference ID to fetch the report"}
                  </span>
                </div>
                <div className="wa-banner-cta">
                  {lang === "hi" ? "WhatsApp खोलें" : "Open WhatsApp"}
                </div>
              </a>
            )}

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
                  data-testid="login-operator-id"
                  value={form.operator_id}
                  onChange={(event) => handleChange("operator_id", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label>{t.name}</label>
                <input
                  type="text"
                  data-testid="login-name"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                />
              </div>
              <div className="form-row">
                <label>{t.district}</label>
                <input
                  type="text"
                  data-testid="login-district"
                  value={form.district}
                  onChange={(event) => handleChange("district", event.target.value)}
                />
              </div>
              <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Signing in..." : t.loginBtn}
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
              { key: "all", label: "All Services" },
              { key: "central", label: "Central Government Services" },
              { key: "state", label: "State Government Services" },
              { key: "other", label: "Other Government Services" }
            ].map((filter) => (
              <button
                key={filter.key}
                className={`services-filter ${activeFilter === filter.key ? "active" : ""}`}
                onClick={() => setActiveFilter(filter.key as "all" | "central" | "state" | "other")}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="services-grid-digital">
            {showcaseServices.length === 0 && (
              <div className="card" style={{ gridColumn: "1 / -1" }}>
                No services found for this filter.
              </div>
            )}
            {showcaseServices.map((item, index) => {
              const serviceKey = `${item.service_id || "svc"}_${item.service_type || "unknown"}_${index}`;
              const icon = getServiceIcon(item);
              const fallbackKind = getIconKind(item);
              return (
              <div className="service-tile" key={serviceKey}>
                <div className="icon">
                  {icon ? (
                    <img src={icon} alt={item.service_name} />
                  ) : (
                    <div className="service-icon-fallback">{renderFallbackIcon(fallbackKind)}</div>
                  )}
                </div>
                <div className="label">{item.service_name}</div>
              </div>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}
