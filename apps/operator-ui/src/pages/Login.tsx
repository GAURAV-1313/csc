import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, type ServiceSchema, type WhatsappLaunchConfig } from "../services/api";
import heroHi from "../assets/hero-hi.jpg";
import heroEn from "../assets/hero-en.jpg";
import digitalSevaLogo from "../assets/digital-seva-logo.png";

function resolveServiceIcon(service: ServiceSchema) {
  const text = `${service.service_type || ""} ${service.service_name || ""}`.toLowerCase();
  if (text.includes("birth") || text.includes("death") || text.includes("marriage")) return "document";
  if (text.includes("income") || text.includes("pension") || text.includes("solvency")) return "wallet";
  if (text.includes("domicile") || text.includes("land") || text.includes("residential")) return "home";
  if (text.includes("certificate") || text.includes("caste") || text.includes("obc") || text.includes("sc_st")) return "badge";
  if (text.includes("rti") || text.includes("grievance")) return "message";
  if (text.includes("license") || text.includes("registration") || text.includes("trade")) return "briefcase";
  return "grid";
}

function ServiceIcon({ kind }: { kind: string }) {
  if (kind === "document") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 3h7l5 5v13H7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 12h6M10 16h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "wallet") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="14" r="1.4" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 11.5 12 5l8 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 10.5V19h11v-8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "badge") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3 5.5 6v5.5c0 4.1 2.8 7.9 6.5 9.5 3.7-1.6 6.5-5.4 6.5-9.5V6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m9.4 12.2 1.8 1.8 3.6-3.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "message") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 6.5h14v9H11l-4.5 3v-3H5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 10h8M8 13h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "briefcase") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="4" y="7" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 7V5h6v2M4 12h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

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
  const [waConfig, setWaConfig] = useState<WhatsappLaunchConfig | null>(null);
  const waFallbackLink = import.meta.env.VITE_WHATSAPP_FALLBACK_URL || "https://wa.me/";

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
      waButton: "WhatsApp शुरू करें",
      waHint: "नागरिक के लिए WhatsApp प्री-चेक शुरू करें",
      waBannerTitle: "WhatsApp त्वरित सहायता",
      waBannerText: "दस्तावेज़ प्री-चेक और रेफरेंस आईडी जनरेट करने के लिए WhatsApp फ्लो शुरू करें।"
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
      waButton: "Start on WhatsApp",
      waHint: "Start WhatsApp pre-check for citizen",
      waBannerTitle: "WhatsApp Quick Assist",
      waBannerText: "Launch citizen pre-check on WhatsApp and get a reference ID before form submission."
    }
  } as const;

  const t = copy[lang];
  const waLink = waConfig?.deep_link || waConfig?.whatsapp_url || waConfig?.fallback_link || waFallbackLink;
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
        setWaConfig(cfg);
      })
      .catch(() => {
        if (!mounted) return;
        setWaConfig(null);
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
    .filter((service) => {
      const title = String(service.service_name || "").trim();
      const type = String(service.service_type || "").trim();
      return title.length > 0 && type.length > 0;
    })
    .filter((service) => {
      if (activeTab === "b2c") {
        return serviceGroup(service) === "other";
      }

      if (activeFilter === "all") return true;
      return serviceGroup(service) === activeFilter;
    })
    .slice(0, 40);

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
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn"
              title={t.waHint}
              style={{
                background: "#25D366",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t.waButton}
            </a>
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

            <div className="wa-inline-banner" role="region" aria-label={t.waBannerTitle}>
              <div className="wa-inline-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div className="wa-inline-copy">
                <strong>{t.waBannerTitle}</strong>
                <p>{t.waBannerText}</p>
              </div>
              <a href={waLink} target="_blank" rel="noreferrer" className="btn wa-inline-btn">
                {t.waButton}
              </a>
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
              const iconKind = resolveServiceIcon(item);
              return (
              <div className="service-tile" key={serviceKey}>
                <div className="icon">
                  <ServiceIcon kind={iconKind} />
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
