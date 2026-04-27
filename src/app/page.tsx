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

  const spinnerStyle: React.CSSProperties = {
    display: "flex", minHeight: "100vh", alignItems: "center",
    justifyContent: "center", background: isDark ? "#0B0E27" : "#5C6FD1",
  };
  const spinEl = (
    <div style={spinnerStyle}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "4px solid rgba(111,122,230,0.3)", borderTopColor: "#6F7AE6", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (status === "loading" || session) return spinEl;

  const bgImages = [
    "/Login-bg-1.jpg",
    "/Login-bg-2.jpg",
    "/Login-bg-3.jpg",
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
        .auth-input:focus { outline: none; border-color: #3A8F7A !important; box-shadow: 0 0 0 3px rgba(58,143,122,0.18); }
        .social-btn:hover { background: rgba(58,143,122,0.12) !important; border-color: #3A8F7A !important; }
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

      {/* ── Overlay: color wash so card stays legible ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: isDark
          ? "linear-gradient(135deg, rgba(11,14,39,0.72) 0%, rgba(31,37,84,0.65) 100%)"
          : "linear-gradient(135deg, rgba(63,74,168,0.55) 0%, rgba(92,111,209,0.45) 100%)",
        backdropFilter: "blur(2px)",
      }} />

      {/* ── Outer card ── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", width: "100%", maxWidth: 920, minHeight: 560,
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(169,216,200,0.1)",
        animation: "cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* ══════════════════════════════════════════
            LEFT PANEL — hero image + brand
            ══════════════════════════════════════════ */}
        <div style={{
          position: "relative", width: "42%", minWidth: 300, flexShrink: 0,
          background: isDark
            ? "linear-gradient(160deg, #0a4035 0%, #072b22 60%, #050f0c 100%)"
            : "linear-gradient(160deg, #144E42 0%, #0d3830 60%, #072b22 100%)",
          overflow: "hidden", display: "flex", flexDirection: "column",
        }} className="hidden lg:flex">

          {/* Ambient blobs */}
          <div style={{ position: "absolute", top: "-10%", left: "-15%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(58,143,122,0.35), transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "5%", right: "-10%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(192,138,90,0.2), transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "40%", right: "10%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(169,216,200,0.1), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

          {/* Dot grid pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.07,
            backgroundImage: "radial-gradient(circle, #A9D8C8 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />

          {/* Top bar */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 0" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg, #3A8F7A, #144E42)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(58,143,122,0.4)",
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#EDE3D1", letterSpacing: "-0.5px" }}>M</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#EDE3D1", letterSpacing: "-0.3px" }}>MediPanel</span>
            </div>

            {/* Back pill */}
            <button
              onClick={() => router.push("/")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(237,227,209,0.12)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(237,227,209,0.18)", borderRadius: 99,
                padding: "6px 14px", fontSize: 12, fontWeight: 500,
                color: "rgba(237,227,209,0.75)", cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(237,227,209,0.2)"; e.currentTarget.style.color = "#EDE3D1"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(237,227,209,0.12)"; e.currentTarget.style.color = "rgba(237,227,209,0.75)"; }}
            >
              Back to website
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </button>
          </div>

          {/* Floating stat cards */}
          <div style={{ position: "absolute", inset: "80px 16px 120px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 280, height: 260 }}>
              {/* Card 1 */}
              <div style={{
                position: "absolute", left: 0, top: 0, width: 160,
                background: "rgba(20,78,66,0.55)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(169,216,200,0.15)", borderRadius: 16,
                padding: 16, boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
                animation: "float1 5s ease-in-out infinite",
              }}>
                <div style={{ fontSize: 10, color: "rgba(169,216,200,0.65)", fontWeight: 500, marginBottom: 4 }}>Today's Appointments</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#EDE3D1", letterSpacing: "-0.5px", lineHeight: 1 }}>24</div>
                <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
                  {[55,40,75,50,65,35,80].map((h,i) => (
                    <div key={i} style={{ flex: 1, borderRadius: 3, background: "linear-gradient(to top, #3A8F7A, #A9D8C8)", height: h * 0.35, opacity: 0.8 }} />
                  ))}
                </div>
              </div>
              {/* Card 2 */}
              <div style={{
                position: "absolute", right: 0, top: 20, width: 140,
                background: "rgba(20,78,66,0.5)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(169,216,200,0.15)", borderRadius: 16,
                padding: 16, boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
                animation: "float1 5s ease-in-out infinite 1.5s",
              }}>
                <div style={{ fontSize: 10, color: "rgba(169,216,200,0.65)", fontWeight: 500, marginBottom: 4 }}>Patients</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#EDE3D1", letterSpacing: "-0.5px", lineHeight: 1 }}>1,248</div>
                <div style={{ fontSize: 11, color: "#A9D8C8", marginTop: 6 }}>↑ 12% this month</div>
              </div>
              {/* Card 3 */}
              <div style={{
                position: "absolute", left: 16, bottom: 0, width: 190,
                background: "rgba(20,78,66,0.5)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(169,216,200,0.15)", borderRadius: 16,
                padding: 16, boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
                animation: "float1 5s ease-in-out infinite 3s",
              }}>
                <div style={{ fontSize: 10, color: "rgba(169,216,200,0.65)", fontWeight: 500, marginBottom: 4 }}>Monthly Revenue</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#EDE3D1", letterSpacing: "-0.5px", lineHeight: 1 }}>$48.5K</div>
                <div style={{ height: 5, borderRadius: 99, background: "rgba(169,216,200,0.15)", marginTop: 10, overflow: "hidden" }}>
                  <div style={{ width: "75%", height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #3A8F7A, #A9D8C8)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom tagline + carousel dots */}
          <div style={{ position: "relative", zIndex: 10, marginTop: "auto", padding: "0 28px 28px" }}>
            <div key={slideIndex} style={{ animation: "fadeSwap 0.5s ease both" }}>
              <h2 style={{
                fontSize: 22, fontWeight: 800, color: "#EDE3D1",
                margin: "0 0 6px", lineHeight: 1.3, whiteSpace: "pre-line",
              }}>
                {slides[slideIndex].tagline}
              </h2>
              <p style={{ fontSize: 13, color: "rgba(169,216,200,0.65)", margin: 0, lineHeight: 1.5 }}>
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
                    background: i === slideIndex ? "#A9D8C8" : "rgba(169,216,200,0.25)",
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

        {/* ══════════════════════════════════════════
            RIGHT PANEL — auth form
            ══════════════════════════════════════════ */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "48px 48px",
          background: isDark ? "#0f2d27" : "#ffffff",
          position: "relative", overflowY: "auto",
        }}>
          {/* Subtle bg dot pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.025,
            backgroundImage: "radial-gradient(circle, #3A8F7A 1px, transparent 1px)",
            backgroundSize: "20px 20px", pointerEvents: "none",
          }} />

          <AuthForm />

          <p style={{
            marginTop: 28, textAlign: "center", fontSize: 11,
            color: isDark ? "rgba(169,216,200,0.3)" : "rgba(20,78,66,0.35)",
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
            background: "linear-gradient(135deg, #3A8F7A, #144E42)",
            color: "#EDE3D1", border: "none",
            boxShadow: "0 6px 20px rgba(58,143,122,0.4)",
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
