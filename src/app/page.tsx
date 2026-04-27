"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthForm from "@/components/AuthForm";
import { useTheme } from "@/hooks/useTheme";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [
    {
      tagline: "Streamlining Care,\nOne Click at a Time",
      sub: "Manage patients, appointments, and inventory with ease.",
    },
    {
      tagline: "Your Clinic,\nNow Smarter",
      sub: "Real-time insights that help you make better decisions.",
    },
    {
      tagline: "Healthcare Made\nEffortless",
      sub: "All your clinic operations in one unified platform.",
    },
  ];

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setSlideIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (session) {
      const role = session.user?.role || "patient";
      router.push(`/${role}`);
    }
  }, [session, router]);

  // ── Palette tokens ────────────────────────────────────────────────────
  const P = isDark ? {
    // Dark: Dusk Urban
    leftBg:      "linear-gradient(160deg, #2B2F45 0%, #1C2033 60%, #13162A 100%)",
    rightBg:     "#2B2F45",
    blob1:       "radial-gradient(circle, rgba(108,122,158,0.40), transparent 70%)",
    blob2:       "radial-gradient(circle, rgba(192,122,134,0.25), transparent 70%)",
    blob3:       "radial-gradient(circle, rgba(155,227,106,0.12), transparent 70%)",
    dotGrid:     "#8A90B5",
    logoBg:      "linear-gradient(135deg, #6C7A9E, #3A3F5A)",
    logoShadow:  "0 4px 12px rgba(108,122,158,0.45)",
    logoText:    "#E4E7F2",
    brandText:   "#E4E7F2",
    backBg:      "rgba(228,231,242,0.08)",
    backBorder:  "rgba(228,231,242,0.14)",
    backText:    "rgba(228,231,242,0.65)",
    backHoverBg: "rgba(228,231,242,0.16)",
    backHoverTx: "#E4E7F2",
    cardBg:      "rgba(58,63,90,0.60)",
    cardBorder:  "rgba(74,80,112,0.5)",
    cardLabel:   "rgba(165,171,200,0.65)",
    cardNum:     "#E4E7F2",
    cardSub:     "#8A90B5",
    barFrom:     "#6C7A9E",
    barTo:       "#8A90B5",
    progressBg:  "rgba(74,80,112,0.35)",
    progressBar: "linear-gradient(90deg, #6C7A9E, #9BE36A)",
    taglineText: "#E4E7F2",
    taglineSub:  "rgba(165,171,200,0.65)",
    dotActive:   "#9BE36A",
    dotInactive: "rgba(165,171,200,0.3)",
    rightDotClr: "#6C7A9E",
    copyright:   "rgba(165,171,200,0.35)",
    overlay:     "linear-gradient(135deg, rgba(28,32,51,0.75) 0%, rgba(43,47,69,0.65) 100%)",
    spinBg:      "#1C2033",
    spinBorder:  "rgba(108,122,158,0.35)",
    spinTop:     "#6C7A9E",
    toggleBg:    "linear-gradient(135deg, #6C7A9E, #3A3F5A)",
    toggleText:  "#E4E7F2",
    toggleShadow:"0 6px 20px rgba(108,122,158,0.45)",
    inputFocus:  "#6C7A9E",
    inputFocusRing: "rgba(108,122,158,0.22)",
    socialHoverBg: "rgba(108,122,158,0.14)",
    socialHoverBorder: "#6C7A9E",
    cardShadow:  "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(74,80,112,0.3)",
  } : {
    // Light: Cool Blues
    leftBg:      "linear-gradient(160deg, #6F7AE6 0%, #3F4AA8 60%, #1F2554 100%)",
    rightBg:     "#ffffff",
    blob1:       "radial-gradient(circle, rgba(111,122,230,0.40), transparent 70%)",
    blob2:       "radial-gradient(circle, rgba(242,166,200,0.25), transparent 70%)",
    blob3:       "radial-gradient(circle, rgba(201,212,255,0.20), transparent 70%)",
    dotGrid:     "#C9D4FF",
    logoBg:      "linear-gradient(135deg, #6F7AE6, #3F4AA8)",
    logoShadow:  "0 4px 12px rgba(111,122,230,0.45)",
    logoText:    "#E8ECFF",
    brandText:   "#E8ECFF",
    backBg:      "rgba(232,236,255,0.15)",
    backBorder:  "rgba(232,236,255,0.22)",
    backText:    "rgba(232,236,255,0.75)",
    backHoverBg: "rgba(232,236,255,0.25)",
    backHoverTx: "#E8ECFF",
    cardBg:      "rgba(63,74,168,0.45)",
    cardBorder:  "rgba(201,212,255,0.20)",
    cardLabel:   "rgba(201,212,255,0.75)",
    cardNum:     "#E8ECFF",
    cardSub:     "#C9D4FF",
    barFrom:     "#A7B3FF",
    barTo:       "#E8ECFF",
    progressBg:  "rgba(201,212,255,0.2)",
    progressBar: "linear-gradient(90deg, #6F7AE6, #A7B3FF)",
    taglineText: "#E8ECFF",
    taglineSub:  "rgba(201,212,255,0.75)",
    dotActive:   "#E8ECFF",
    dotInactive: "rgba(201,212,255,0.35)",
    rightDotClr: "#6F7AE6",
    copyright:   "rgba(31,37,84,0.35)",
    overlay:     "linear-gradient(135deg, rgba(31,37,84,0.55) 0%, rgba(63,74,168,0.45) 100%)",
    spinBg:      "#5C6FD1",
    spinBorder:  "rgba(111,122,230,0.35)",
    spinTop:     "#6F7AE6",
    toggleBg:    "linear-gradient(135deg, #6F7AE6, #3F4AA8)",
    toggleText:  "#E8ECFF",
    toggleShadow:"0 6px 20px rgba(111,122,230,0.45)",
    inputFocus:  "#6F7AE6",
    inputFocusRing: "rgba(111,122,230,0.22)",
    socialHoverBg: "rgba(111,122,230,0.12)",
    socialHoverBorder: "#6F7AE6",
    cardShadow:  "0 32px 80px rgba(31,37,84,0.45), 0 0 0 1px rgba(201,212,255,0.15)",
  };

  const spinnerStyle: React.CSSProperties = {
    display: "flex", minHeight: "100vh", alignItems: "center",
    justifyContent: "center", background: P.spinBg,
  };
  const spinEl = (
    <div style={spinnerStyle}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: `4px solid ${P.spinBorder}`, borderTopColor: P.spinTop, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (status === "loading" || session) return spinEl;

  const bgImages = [
    "/login-bg-1.gif",
    "/login-bg-2.gif",
    "/login-bg-3.gif",
  ];

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSwap { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cardIn { from { opacity:0; transform:scale(0.97) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes bgZoom { from { transform: scale(1); } to { transform: scale(1.06); } }
        .auth-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .auth-input:focus { outline: none; border-color: ${P.inputFocus} !important; box-shadow: 0 0 0 3px ${P.inputFocusRing}; }
        .social-btn:hover { background: ${P.socialHoverBg} !important; border-color: ${P.socialHoverBorder} !important; }
      `}</style>

      {/* ── Background image carousel ── */}
      {bgImages.map((src, i) => (
        <div
          key={src}
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: i === slideIndex ? 1 : 0,
            transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)",
            animation: i === slideIndex ? "bgZoom 8s ease-in-out both" : "none",
          }}
        />
      ))}

      {/* ── Overlay ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: P.overlay,
        backdropFilter: "blur(2px)",
      }} />

      {/* ── Outer card ── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", width: "100%", maxWidth: 920, minHeight: 560,
        borderRadius: 24, overflow: "hidden",
        boxShadow: P.cardShadow,
        animation: "cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* ═══════════════════════════════════
            LEFT PANEL — hero + brand
            ═══════════════════════════════════ */}
        <div style={{
          position: "relative", width: "42%", minWidth: 300, flexShrink: 0,
          background: P.leftBg,
          overflow: "hidden", display: "flex", flexDirection: "column",
        }} className="hidden lg:flex">

          {/* Ambient blobs */}
          <div style={{ position: "absolute", top: "-10%", left: "-15%", width: 320, height: 320, borderRadius: "50%", background: P.blob1, filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "5%", right: "-10%", width: 240, height: 240, borderRadius: "50%", background: P.blob2, filter: "blur(50px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "40%", right: "10%", width: 160, height: 160, borderRadius: "50%", background: P.blob3, filter: "blur(40px)", pointerEvents: "none" }} />

          {/* Dot grid pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.07,
            backgroundImage: `radial-gradient(circle, ${P.dotGrid} 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }} />

          {/* Top bar */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", padding: "24px 24px 0" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: P.logoBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: P.logoShadow,
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: P.logoText, letterSpacing: "-0.5px" }}>M</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: P.brandText, letterSpacing: "-0.3px" }}>MediPanel</span>
            </div>
          </div>

          {/* Floating stat cards */}
          <div style={{ position: "absolute", inset: "80px 16px 120px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 280, height: 260 }}>
              {/* Card 1 — Appointments */}
              <div style={{
                position: "absolute", left: 0, top: 0, width: 160,
                background: P.cardBg, backdropFilter: "blur(16px)",
                border: `1px solid ${P.cardBorder}`, borderRadius: 16,
                padding: 16, boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
                animation: "float1 5s ease-in-out infinite",
              }}>
                <div style={{ fontSize: 10, color: P.cardLabel, fontWeight: 500, marginBottom: 4 }}>Today's Appointments</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: P.cardNum, letterSpacing: "-0.5px", lineHeight: 1 }}>24</div>
                <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
                  {[55,40,75,50,65,35,80].map((h,i) => (
                    <div key={i} style={{ flex: 1, borderRadius: 3, background: `linear-gradient(to top, ${P.barFrom}, ${P.barTo})`, height: h * 0.35, opacity: 0.85 }} />
                  ))}
                </div>
              </div>
              {/* Card 2 — Patients */}
              <div style={{
                position: "absolute", right: 0, top: 20, width: 140,
                background: P.cardBg, backdropFilter: "blur(16px)",
                border: `1px solid ${P.cardBorder}`, borderRadius: 16,
                padding: 16, boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
                animation: "float1 5s ease-in-out infinite 1.5s",
              }}>
                <div style={{ fontSize: 10, color: P.cardLabel, fontWeight: 500, marginBottom: 4 }}>Patients</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: P.cardNum, letterSpacing: "-0.5px", lineHeight: 1 }}>1,248</div>
                <div style={{ fontSize: 11, color: P.cardSub, marginTop: 6 }}>↑ 12% this month</div>
              </div>
              {/* Card 3 — Revenue */}
              <div style={{
                position: "absolute", left: 16, bottom: 0, width: 190,
                background: P.cardBg, backdropFilter: "blur(16px)",
                border: `1px solid ${P.cardBorder}`, borderRadius: 16,
                padding: 16, boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
                animation: "float1 5s ease-in-out infinite 3s",
              }}>
                <div style={{ fontSize: 10, color: P.cardLabel, fontWeight: 500, marginBottom: 4 }}>Monthly Revenue</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: P.cardNum, letterSpacing: "-0.5px", lineHeight: 1 }}>$48.5K</div>
                <div style={{ height: 5, borderRadius: 99, background: P.progressBg, marginTop: 10, overflow: "hidden" }}>
                  <div style={{ width: "75%", height: "100%", borderRadius: 99, background: P.progressBar }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom tagline + carousel dots */}
          <div style={{ position: "relative", zIndex: 10, marginTop: "auto", padding: "0 28px 28px" }}>
            <div key={slideIndex} style={{ animation: "fadeSwap 0.5s ease both" }}>
              <h2 style={{
                fontSize: 22, fontWeight: 800, color: P.taglineText,
                margin: "0 0 6px", lineHeight: 1.3, whiteSpace: "pre-line",
              }}>
                {slides[slideIndex].tagline}
              </h2>
              <p style={{ fontSize: 13, color: P.taglineSub, margin: 0, lineHeight: 1.5 }}>
                {slides[slideIndex].sub}
              </p>
            </div>
            {/* Dots */}
            <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  style={{
                    height: 4, borderRadius: 99, border: "none", cursor: "pointer",
                    background: i === slideIndex ? P.dotActive : P.dotInactive,
                    width: i === slideIndex ? 24 : 16,
                    transition: "all 0.3s",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          <style>{`
            @keyframes float1 {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
          `}</style>
        </div>

        {/* ═══════════════════════════════════
            RIGHT PANEL — auth form
            ═══════════════════════════════════ */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "48px 48px",
          background: P.rightBg,
          position: "relative", overflowY: "auto",
        }}>
          {/* Subtle dot pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.03,
            backgroundImage: `radial-gradient(circle, ${P.rightDotClr} 1px, transparent 1px)`,
            backgroundSize: "20px 20px", pointerEvents: "none",
          }} />

          <AuthForm />

          <p style={{
            marginTop: 28, textAlign: "center", fontSize: 11,
            color: P.copyright,
          }}>
            © 2026 MediPanel. All rights reserved.
          </p>
        </div>
      </div>

      {/* Theme toggle */}
      {mounted && (
        <button
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50,
            width: 48, height: 48, borderRadius: "50%",
            background: P.toggleBg,
            color: P.toggleText, border: "none",
            boxShadow: P.toggleShadow,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s", fontSize: 18,
          }}
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <i className={isDark ? "fa-solid fa-sun" : "fa-solid fa-moon"} />
        </button>
      )}
    </main>
  );
}
