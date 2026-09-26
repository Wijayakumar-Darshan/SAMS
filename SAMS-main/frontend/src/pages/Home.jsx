import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  MonitorPlay,
  Moon,
  Sun
} from "lucide-react";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import { useI18n } from "../i18n/i18n.jsx";

function SectionTitle({ title, subtitle }) {
  return (
    <div className="section-title-wrap">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}

function FeatureCard({ title, desc, icon: Icon }) {
  return (
    <div className="home-card">
      <div className="home-card-icon">
        <Icon size={24} />
      </div>
      <div className="home-card-title">{title}</div>
      <div className="home-card-desc">{desc}</div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const nav = useNavigate();

  // Dark Mode State Management
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={`home-wrap ${isDark ? "dark" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        /* === THEME VARIABLES === */
        .home-wrap {
          --bg-main: #EEF3FC;
          --bg-card: #FFFFFF;
          --bg-card-alt: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
          --bg-header: rgba(255, 255, 255, 0.95);
          --text-main: #0B1220;
          --text-muted: #5B657A;
          --border: #DCE3F0;
          
          --primary: #1D4ED8;
          --primary-hover: #1741B8;
          --primary-bg: #EFF4FE;
          
          --hero-bg: linear-gradient(165deg, #14306B 0%, #0B1F4B 100%);
          --strip-bg: #1D4ED8;
          --strip-text: #FFFFFF;
          
          --card-shadow: 0 10px 30px -10px rgba(11, 31, 75, 0.1);
        }

        .home-wrap.dark {
          --bg-main: #0B1121; /* Deep navy/slate */
          --bg-card: #151F32;
          --bg-card-alt: linear-gradient(180deg, #151F32 0%, #0F172A 100%);
          --bg-header: rgba(15, 23, 42, 0.95);
          --text-main: #F8FAFC;
          --text-muted: #94A3B8;
          --border: #2A3B54;
          
          --primary: #3B82F6; /* Lighter blue for dark mode visibility */
          --primary-hover: #60A5FA;
          --primary-bg: #1E293B;
          
          --hero-bg: linear-gradient(165deg, #090E1A 0%, #04080F 100%);
          --strip-bg: #151F32;
          --strip-text: #F8FAFC;
          
          --card-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        }

        /* === GLOBAL STYLES === */
        .home-wrap {
          min-height: 100vh;
          background: var(--bg-main);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-main);
          overflow-x: hidden;
          transition: background 0.3s ease, color 0.3s ease;
        }

        /* Header */
        .home-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--bg-header);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .home-header-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .home-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }

        .home-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--primary);
          display: grid;
          place-items: center;
          color: #fff;
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 18px;
        }

        .home-brand-name {
          font-weight: 700;
          color: var(--text-main);
          font-size: 16px;
          line-height: 1.1;
        }

        .home-brand-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .home-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .home-link {
          border: 0;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.15s ease, color 0.15s ease;
        }
        
        .home-link:hover {
          background: var(--primary-bg);
          color: var(--primary);
        }

        .home-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .theme-toggle {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }
        .theme-toggle:hover {
          background: var(--primary-bg);
          color: var(--primary);
        }

        /* Buttons */
        .btn {
          padding: 10px 16px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s ease;
          border: none;
        }

        .btn-primary {
          background: var(--primary);
          color: #fff;
        }
        .btn-primary:hover { 
          background: var(--primary-hover); 
          transform: translateY(-1px); 
        }

        .btn-outline {
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          color: var(--text-main);
        }
        .btn-outline:hover { 
          border-color: var(--primary); 
          color: var(--primary); 
        }

        .btn-outline-light {
          border: 1.5px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .btn-outline-light:hover { background: rgba(255,255,255,0.2); }

        /* Hero Section */
        .home-hero {
          position: relative;
          background: var(--hero-bg);
          color: #fff;
          overflow: hidden;
          padding: 80px 20px;
          transition: background 0.3s ease;
        }

        .home-hero-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .home-hero-text h1 {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: 46px;
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin: 0;
          color: #fff; /* Always white inside dark gradient */
        }

        .home-hero-text p {
          margin: 20px 0 30px;
          font-size: 17px;
          line-height: 1.6;
          color: rgba(255,255,255,0.85);
          max-width: 520px;
        }

        .home-hero-cta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .home-hero-note {
          margin-top: 20px;
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .home-hero-image-wrap {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          transform: perspective(1000px) rotateY(-5deg);
          transition: transform 0.3s ease;
        }
        
        .home-hero-image-wrap:hover {
          transform: perspective(1000px) rotateY(0deg);
        }

        .home-hero-image {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          aspect-ratio: 4/3;
        }

        /* Hero Badges (Mini cards) */
        .home-badges-grid {
          max-width: 1180px;
          margin: -40px auto 0;
          position: relative;
          z-index: 10;
          padding: 0 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .home-mini {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--card-shadow);
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .home-mini-title {
          font-weight: 700;
          color: var(--text-main);
          font-size: 15px;
          margin-bottom: 6px;
        }

        .home-mini-desc {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* General Sections */
        .home-section {
          max-width: 1180px;
          margin: 0 auto;
          padding: 80px 20px;
        }

        .section-title-wrap {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-title {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          font-weight: 500;
          color: var(--text-main);
          margin: 0 0 12px 0;
        }

        .section-subtitle {
          font-size: 16px;
          color: var(--text-muted);
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Grids & Cards */
        .home-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .home-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          transition: border-color 0.2s ease, transform 0.2s ease, background 0.3s ease;
        }
        
        .home-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: var(--card-shadow);
        }

        .home-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--primary-bg);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .home-card-title {
          font-weight: 700;
          font-size: 18px;
          color: var(--text-main);
          margin-bottom: 10px;
        }

        .home-card-desc {
          font-size: 14.5px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* Roles Section */
        .home-role {
          background: var(--bg-card-alt);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .home-role-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .home-role-title {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: 22px;
          color: var(--text-main);
          margin: 0;
        }

        .home-role-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--primary-bg);
          color: var(--primary);
        }

        .home-role-desc {
          color: var(--text-muted);
          font-size: 14.5px;
          line-height: 1.6;
        }

        /* Call to Action Strip */
        .home-strip {
          margin-top: 60px;
          background: var(--strip-bg);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          color: var(--strip-text);
          box-shadow: var(--card-shadow);
          transition: background 0.3s ease;
        }

        .home-strip h3 {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 500;
          margin: 0 0 8px 0;
          color: var(--strip-text);
        }

        .home-strip p {
          margin: 0;
          opacity: 0.85;
          font-size: 15px;
        }

        /* About */
        .about-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 24px;
          padding: 48px;
          text-align: center;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .about-card p {
          color: var(--text-muted);
          font-size: 16px;
          line-height: 1.8;
          max-width: 800px;
          margin: 0 auto 16px auto;
        }

        .legalNote {
          font-size: 12.5px;
          color: var(--text-muted);
          opacity: 0.8;
          margin-top: 24px;
        }

        /* Footer */
        .home-footer {
          background: var(--bg-card);
          border-top: 1px solid var(--border);
          padding: 30px 20px;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .home-footer-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-text {
          font-size: 14px;
          color: var(--text-muted);
        }

        .footer-text strong {
          color: var(--text-main);
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 960px) {
          .home-hero-inner {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .home-hero-text p {
            margin: 20px auto 30px;
          }
          .home-hero-cta {
            justify-content: center;
          }
          .home-hero-note {
            justify-content: center;
          }
          .home-badges-grid {
            grid-template-columns: 1fr;
            margin-top: -20px;
          }
          .home-grid-3 {
            grid-template-columns: 1fr;
          }
          .home-nav {
            display: none;
          }
          .home-strip {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      {/* Header */}
      <header className="home-header">
        <div className="home-header-inner">
          <div className="home-brand" onClick={() => nav("/")}>
            <div className="home-logo">S</div>
            <div>
              <div className="home-brand-name">{t("appName")}</div>
              <div className="home-brand-sub">{t("homeTagline")}</div>
            </div>
          </div>

          <nav className="home-nav" aria-label="Home navigation">
            <button className="home-link" onClick={() => scrollTo("features")}>
              {t("homeNavFeatures")}
            </button>
            <button className="home-link" onClick={() => scrollTo("roles")}>
              Roles
            </button>
            <button className="home-link" onClick={() => scrollTo("about")}>
              {t("homeNavAbout")}
            </button>
          </nav>

          <div className="home-header-actions">
            <button 
              className="theme-toggle" 
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <LanguageSwitch />
            <button className="btn btn-outline" onClick={() => nav("/login")}>
              {t("login")}
            </button>
            <button className="btn btn-primary" onClick={() => nav("/register")}>
              {t("register")}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h1>{t("homeHeroTitle")}</h1>
            <p>{t("homeHeroDesc")}</p>

            <div className="home-hero-cta">
              <button className="btn btn-primary" style={{ padding: "12px 24px" }} onClick={() => nav("/login")}>
                {t("homeCtaLogin")} <ArrowRight size={16} />
              </button>
              <button className="btn btn-outline-light" style={{ padding: "12px 24px" }} onClick={() => nav("/subscription")}>
                {t("homeCtaSubscription")}
              </button>
            </div>

            <div className="home-hero-note">
              <ShieldCheck size={14} /> {t("homeHeroNote")}
            </div>
          </div>

          <div className="home-hero-image-wrap">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80" 
              alt="Students collaborating" 
              className="home-hero-image" 
            />
          </div>
        </div>
      </section>

      {/* Floating Badges */}
      <div className="home-badges-grid">
        <div className="home-mini">
          <div className="home-mini-title">{t("homeMini1Title")}</div>
          <div className="home-mini-desc">{t("homeMini1Desc")}</div>
        </div>
        <div className="home-mini">
          <div className="home-mini-title">{t("homeMini2Title")}</div>
          <div className="home-mini-desc">{t("homeMini2Desc")}</div>
        </div>
        <div className="home-mini">
          <div className="home-mini-title">{t("homeMini3Title")}</div>
          <div className="home-mini-desc">{t("homeMini3Desc")}</div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="home-section">
        <SectionTitle title={t("homeFeaturesTitle")} subtitle={t("homeFeaturesSubtitle")} />

        <div className="home-grid-3">
          <FeatureCard 
            icon={BookOpen}
            title={t("homeFeature1Title")} 
            desc={t("homeFeature1Desc")} 
          />
          <FeatureCard 
            icon={Clock}
            title={t("homeFeature2Title")} 
            desc={t("homeFeature2Desc")} 
          />
          <FeatureCard 
            icon={Sparkles}
            title={t("homeFeature3Title")} 
            desc={t("homeFeature3Desc")} 
          />
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="home-section" style={{ paddingTop: 0 }}>
        <SectionTitle title={t("homeRolesTitle")} subtitle={t("homeRolesSubtitle")} />

        <div className="home-grid-3">
          <div className="home-role">
            <div className="home-role-top">
              <h3 className="home-role-title">{t("homeRoleStudentTitle")}</h3>
              <div className="home-role-badge"><GraduationCap size={20} /></div>
            </div>
            <div className="home-role-desc">{t("homeRoleStudentDesc")}</div>
          </div>

          <div className="home-role">
            <div className="home-role-top">
              <h3 className="home-role-title">{t("homeRoleTeacherTitle")}</h3>
              <div className="home-role-badge"><MonitorPlay size={20} /></div>
            </div>
            <div className="home-role-desc">{t("homeRoleTeacherDesc")}</div>
          </div>

          <div className="home-role">
            <div className="home-role-top">
              <h3 className="home-role-title">{t("homeRoleParentTitle")}</h3>
              <div className="home-role-badge"><Users size={20} /></div>
            </div>
            <div className="home-role-desc">{t("homeRoleParentDesc")}</div>
          </div>
        </div>

        {/* Call to Action Strip */}
        <div className="home-strip">
          <div>
            <h3>{t("homeStripTitle")}</h3>
            <p>{t("homeStripDesc")}</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button 
              className="btn" 
              style={{ background: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#1D4ED8', border: 'none' }} 
              onClick={() => nav("/subscription")}
            >
              {t("subscription")}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => nav("/register")}
            >
              {t("register")} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="home-section" style={{ paddingTop: 0 }}>
        <div className="about-card">
          <SectionTitle title={t("aboutTitle")} subtitle={t("aboutSubtitle")} />
          <p>{t("aboutDesc1")}</p>
          <p>{t("aboutDesc2")}</p>
          <div className="legalNote">{t("aboutLegal")}</div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="home-footer">
        <div className="home-footer-inner">
          <div className="footer-text">
            <strong>{t("appName")}</strong> &copy; {new Date().getFullYear()} — {t("footerLine")}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-outline" onClick={() => nav("/login")}>
              {t("login")}
            </button>
            <button className="btn btn-outline" onClick={() => nav("/subscription")}>
              {t("subscription")}
            </button>
            <button className="btn btn-outline" onClick={() => nav("/admin-login")}>
              {t("footerAdmin")}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}