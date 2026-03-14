import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, type ServiceSchema } from "../services/api";
import heroHi from "../assets/hero-hi.jpg";
import heroEn from "../assets/hero-en.jpg";
import digitalSevaLogo from "../assets/digital-seva-logo.png";

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
              return (
              <div className="service-tile" key={serviceKey}>
                <div className="icon">
                  <span>{String(item.service_name || "S").charAt(0)}</span>
                </div>
                <div className="label">{item.service_name}</div>
                <div className="meta">{item.service_type}</div>
              </div>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}
