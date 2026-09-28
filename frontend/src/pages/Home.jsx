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
  Sun,
  Zap,
  Heart
} from "lucide-react";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import BrandMark from "../components/BrandMark.jsx";
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
        <Icon size={22} strokeWidth={2.2} />
      </div>
      <div className="home-card-title">{title}</div>
      <div className="home-card-desc">{desc}</div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const nav = useNavigate();

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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

        /* === THEME VARIABLES === */
        .home-wrap {
          --bg-main: #F4F7FF;
          --bg-card: #FFFFFF;
          --bg-card-alt: linear-gradient(165deg, #FFFFFF 0%, #F8FAFF 100%);
          --bg-header: rgba(255, 255, 255, 0.82);
          --text-main: #0F172A;
          --text-muted: #64748B;
          --border: #E2E8F0;
          
          --primary: #2563EB;
          --primary-hover: #1D4ED8;
          --primary-soft: #EFF6FF;
          --accent: #0EA5E9;
          --accent-soft: #E0F2FE;
          --success: #10B981;
          
          --hero-bg: linear-gradient(145deg, #1E3A8A 0%, #1E40AF 45%, #0F766E 100%);
          --strip-bg: linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%);
          --strip-text: #FFFFFF;
          
          --card-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 10px 24px -6px rgba(15, 23, 42, 0.08);
          --card-shadow-hover: 0 20px 40px -12px rgba(37, 99, 235, 0.18);
        }

        .home-wrap.dark {
          --bg-main: #0B1120;
          --bg-card: #151E32;
          --bg-card-alt: linear-gradient(165deg, #151E32 0%, #0F172A 100%);
          --bg-header: rgba(11, 17, 32, 0.85);
          --text-main: #F1F5F9;
          --text-muted: #94A3B8;
          --border: #1E293B;
          
          --primary: #3B82F6;
          --primary-hover: #60A5FA;
          --primary-soft: #1E293B;
          --accent: #38BDF8;
          --accent-soft: #0F172A;
          --success: #34D399;
          
          --hero-bg: linear-gradient(145deg, #020617 0%, #0F172A 50%, #0C4A6E 100%);
          --strip-bg: linear-gradient(135deg, #1E40AF 0%, #0369A1 100%);
          --strip-text: #F8FAFC;
          
          --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 10px 24px -6px rgba(0, 0, 0, 0.4);
          --card-shadow-hover: 0 20px 40px -12px rgba(59, 130, 246, 0.25);
        }

        /* === GLOBAL === */
        .home-wrap {
          min-height: 100vh;
          background: var(--bg-main);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-main);
          overflow-x: hidden;
          transition: background 0.35s ease, color 0.35s ease;
        }

        /* Header */
        .home-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--bg-header);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid var(--border);
          transition: background 0.35s ease, border-color 0.35s ease;
        }

        .home-header-inner {
          max-width: 1160px;
          margin: 0 auto;
          padding: 12px 20px;
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

        .home-brand-name {
          font-weight: 700;
          color: var(--text-main);
          font-size: 16px;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }

        .home-brand-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .home-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .home-link {
          border: 0;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.18s ease;
        }
        
        .home-link:hover {
          background: var(--primary-soft);
          color: var(--primary);
        }

        .home-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .theme-toggle {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          transition: all 0.18s ease;
        }
        .theme-toggle:hover {
          background: var(--primary-soft);
          color: var(--primary);
        }

        /* Buttons */
        .btn {
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          letter-spacing: -0.01em;
        }

        .btn-primary {
          background: var(--primary);
          color: #fff;
          box-shadow: 0 4px 14px -3px rgba(37, 99, 235, 0.45);
        }
        .btn-primary:hover { 
          background: var(--primary-hover); 
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.5);
        }

        .btn-outline {
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          color: var(--text-main);
        }
        .btn-outline:hover { 
          border-color: var(--primary); 
          color: var(--primary);
          background: var(--primary-soft);
        }

        .btn-outline-light {
          border: 1.5px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.12);
          color: #fff;
          backdrop-filter: blur(8px);
        }
        .btn-outline-light:hover { 
          background: rgba(255,255,255,0.22);
          border-color: rgba(255,255,255,0.5);
        }

        /* Hero */
        .home-hero {
          position: relative;
          background: var(--hero-bg);
          color: #fff;
          overflow: hidden;
          padding: 72px 20px 100px;
        }

        .home-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(56, 189, 248, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(16, 185, 129, 0.2) 0%, transparent 45%);
          pointer-events: none;
        }

        .home-hero-inner {
          max-width: 1160px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 48px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .home-hero-text h1 {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: clamp(34px, 4.2vw, 48px);
          line-height: 1.12;
          letter-spacing: -0.025em;
          margin: 0;
          color: #fff;
        }

        .home-hero-text p {
          margin: 18px 0 28px;
          font-size: 17px;
          line-height: 1.65;
          color: rgba(255,255,255,0.88);
          max-width: 480px;
        }

        .home-hero-cta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .home-hero-note {
          margin-top: 22px;
          font-size: 13.5px;
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .home-hero-image-wrap {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 32px 64px -16px rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.15);
          transform: perspective(1200px) rotateY(-6deg) rotateX(2deg);
          transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .home-hero-image-wrap:hover {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg);
        }

        .home-hero-image {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          aspect-ratio: 4/3;
        }

        /* Floating decorative pills on hero image */
        .hero-float {
          position: absolute;
          background: rgba(255,255,255,0.95);
          color: #0F172A;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          animation: float 5s ease-in-out infinite;
        }
        .hero-float-1 {
          top: 18%;
          left: -12px;
          animation-delay: 0s;
        }
        .hero-float-2 {
          bottom: 22%;
          right: -8px;
          animation-delay: 1.2s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Mini badges */
        .home-badges-grid {
          max-width: 1160px;
          margin: -52px auto 0;
          position: relative;
          z-index: 10;
          padding: 0 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .home-mini {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 22px 22px 20px;
          box-shadow: var(--card-shadow);
          transition: all 0.25s ease;
        }
        .home-mini:hover {
          transform: translateY(-4px);
          box-shadow: var(--card-shadow-hover);
          border-color: color-mix(in srgb, var(--primary) 30%, var(--border));
        }

        .home-mini-title {
          font-weight: 700;
          color: var(--text-main);
          font-size: 15.5px;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .home-mini-desc {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.55;
        }

        /* Sections */
        .home-section {
          max-width: 1160px;
          margin: 0 auto;
          padding: 72px 20px;
        }

        .section-title-wrap {
          text-align: center;
          margin-bottom: 44px;
        }

        .section-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(26px, 3.2vw, 34px);
          font-weight: 600;
          color: var(--text-main);
          margin: 0 0 12px 0;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 16px;
          color: var(--text-muted);
          margin: 0 auto;
          max-width: 520px;
          line-height: 1.55;
        }

        /* Feature cards */
        .home-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        .home-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          padding: 28px 26px;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .home-card:hover {
          border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
          transform: translateY(-6px);
          box-shadow: var(--card-shadow-hover);
        }

        .home-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: var(--primary-soft);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          transition: all 0.25s ease;
        }
        .home-card:hover .home-card-icon {
          background: var(--primary);
          color: #fff;
          transform: scale(1.06);
        }

        .home-card-title {
          font-weight: 700;
          font-size: 17.5px;
          color: var(--text-main);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .home-card-desc {
          font-size: 14.5px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* Roles */
        .home-role {
          background: var(--bg-card-alt);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          padding: 26px 24px;
          transition: all 0.28s ease;
        }
        .home-role:hover {
          border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
          transform: translateY(-4px);
          box-shadow: var(--card-shadow-hover);
        }

        .home-role-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .home-role-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 21px;
          color: var(--text-main);
          margin: 0;
          letter-spacing: -0.015em;
        }

        .home-role-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: var(--primary-soft);
          color: var(--primary);
          transition: all 0.25s ease;
        }
        .home-role:hover .home-role-badge {
          background: var(--primary);
          color: #fff;
        }

        .home-role-desc {
          color: var(--text-muted);
          font-size: 14.5px;
          line-height: 1.6;
        }

        /* CTA Strip */
        .home-strip {
          margin-top: 56px;
          background: var(--strip-bg);
          border-radius: 24px;
          padding: 36px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
          color: var(--strip-text);
          box-shadow: 0 16px 40px -12px rgba(37, 99, 235, 0.4);
          position: relative;
          overflow: hidden;
        }
        .home-strip::after {
          content: "";
          position: absolute;
          top: -40%;
          right: -10%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .home-strip h3 {
          font-family: 'Fraunces', serif;
          font-size: 25px;
          font-weight: 600;
          margin: 0 0 6px 0;
          color: var(--strip-text);
          letter-spacing: -0.015em;
        }

        .home-strip p {
          margin: 0;
          opacity: 0.9;
          font-size: 15px;
        }

        /* About */
        .about-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 28px;
          padding: 48px 40px;
          text-align: center;
          box-shadow: var(--card-shadow);
        }

        .about-card p {
          color: var(--text-muted);
          font-size: 16px;
          line-height: 1.75;
          max-width: 720px;
          margin: 0 auto 14px auto;
        }

        .legalNote {
          font-size: 12.5px;
          color: var(--text-muted);
          opacity: 0.75;
          margin-top: 28px;
        }

        /* Footer */
        .home-footer {
          background: var(--bg-card);
          border-top: 1px solid var(--border);
          padding: 28px 20px;
        }

        .home-footer-inner {
          max-width: 1160px;
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
          .home-hero {
            padding: 56px 20px 80px;
          }
          .home-hero-inner {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 36px;
          }
          .home-hero-text p {
            margin: 18px auto 28px;
          }
          .home-hero-cta {
            justify-content: center;
          }
          .home-hero-note {
            justify-content: center;
          }
          .home-hero-image-wrap {
            transform: none;
            max-width: 480px;
            margin: 0 auto;
          }
          .home-hero-image-wrap:hover {
            transform: none;
          }
          .hero-float {
            display: none;
          }
          .home-badges-grid {
            grid-template-columns: 1fr;
            margin-top: -36px;
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
            padding: 32px 24px;
          }
          .about-card {
            padding: 36px 24px;
          }
        }

        @media (max-width: 640px) {
          .home-header-actions .btn-outline {
            display: none;
          }
          .home-hero-text h1 {
            font-size: 32px;
          }
        }
      `}</style>

      {/* Header */}
      <header className="home-header">
        <div className="home-header-inner">
          <div className="home-brand" onClick={() => nav("/")}>
            <BrandMark size={36} />
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

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h1>{t("homeHeroTitle")}</h1>
            <p>{t("homeHeroDesc")}</p>

            <div className="home-hero-cta">
              <button 
                className="btn btn-primary" 
                style={{ padding: "13px 26px", fontSize: 15 }} 
                onClick={() => nav("/login")}
              >
                {t("homeCtaLogin")} <ArrowRight size={17} />
              </button>
              <button 
                className="btn btn-outline-light" 
                style={{ padding: "13px 26px", fontSize: 15 }} 
                onClick={() => nav("/subscription")}
              >
                {t("homeCtaSubscription")}
              </button>
            </div>

            <div className="home-hero-note">
              <ShieldCheck size={15} /> {t("homeHeroNote")}
            </div>
          </div>

          <div className="home-hero-image-wrap">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80" 
              alt="Students collaborating" 
              className="home-hero-image" 
            />
            <div className="hero-float hero-float-1">
              <Zap size={16} color="#2563EB" /> Live classes
            </div>
            <div className="hero-float hero-float-2">
              <Heart size={16} color="#10B981" /> Loved by students
            </div>
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

        {/* CTA Strip */}
        <div className="home-strip">
          <div>
            <h3>{t("homeStripTitle")}</h3>
            <p>{t("homeStripDesc")}</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button 
              className="btn" 
              style={{ 
                background: isDark ? "rgba(255,255,255,0.12)" : "#fff", 
                color: isDark ? "#fff" : "#1D4ED8",
                border: isDark ? "1px solid rgba(255,255,255,0.2)" : "none"
              }} 
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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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