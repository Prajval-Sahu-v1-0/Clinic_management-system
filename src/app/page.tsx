"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthForm from "@/components/AuthForm";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const role = session.user?.role || "patient";
      router.push(`/${role}`);
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0d3830" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "4px solid rgba(58,143,122,0.3)", borderTopColor: "#3A8F7A", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (session) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0d3830" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "4px solid rgba(58,143,122,0.3)", borderTopColor: "#3A8F7A", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <main style={{ position: "relative", display: "flex", minHeight: "100vh", overflow: "hidden", background: "#0a2e25", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes floatCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL — deep forest gradient + floating cards
         ═══════════════════════════════════════════════════════ */}
      <div style={{ position: "relative", width: "55%", overflow: "hidden", display: "none" }} className="lg:!block">
        {/* Gradient background */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #144E42 0%, #0d3830 40%, #0a2e25 100%)" }} />

        {/* Subtle pattern overlay */}
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.06,
            backgroundImage: "radial-gradient(circle at 25% 25%, #A9D8C8 1px, transparent 1px), radial-gradient(circle at 75% 75%, #A9D8C8 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "20%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(58,143,122,0.2), transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "20%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(192,138,90,0.15), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

        {/* Side navigation hint icons */}
        <div style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 20, zIndex: 10 }}>
          {[
            "fa-solid fa-gauge-high",
            "fa-solid fa-calendar-check",
            "fa-solid fa-chart-line",
            "fa-solid fa-user-group",
          ].map((icon, i) => (
            <div
              key={i}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(169,216,200,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(169,216,200,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                cursor: "default",
              }}
            >
              <i className={icon} style={{ color: "rgba(237,227,209,0.6)", fontSize: 15 }} />
            </div>
          ))}
        </div>

        {/* Floating blurred dashboard preview cards */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 500 }}>
            {/* Card 1 — Appointments */}
            <div style={{ position: "absolute", left: -16, top: 16, width: 260, background: "rgba(20,78,66,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(169,216,200,0.12)", borderRadius: 18, padding: 22, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animation: "floatCard 5s ease-in-out infinite", animationDelay: "0s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, #3A8F7A, #144E42)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(58,143,122,0.3)" }}>
                  <i className="fa-solid fa-calendar-check" style={{ color: "#EDE3D1", fontSize: 17 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(169,216,200,0.6)", fontWeight: 500 }}>Today's Appointments</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#EDE3D1", letterSpacing: "-0.5px" }}>24</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {[65, 45, 85, 55, 70, 40, 90].map((h, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: 99, background: "rgba(58,143,122,0.3)", height: h * 0.4 }} />
                ))}
              </div>
            </div>

            {/* Card 2 — Patients */}
            <div style={{ position: "absolute", right: 0, top: 0, width: 230, background: "rgba(20,78,66,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(169,216,200,0.12)", borderRadius: 18, padding: 22, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animation: "floatCard 5s ease-in-out infinite", animationDelay: "1s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, #A9D8C8, #3A8F7A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(169,216,200,0.2)" }}>
                  <i className="fa-solid fa-user-group" style={{ color: "#144E42", fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(169,216,200,0.6)", fontWeight: 500 }}>Total Patients</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#EDE3D1", letterSpacing: "-0.5px" }}>1,248</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "rgba(169,216,200,0.5)" }}>
                <span style={{ fontWeight: 600, color: "#A9D8C8" }}>+12%</span> from last month
              </div>
            </div>

            {/* Card 3 — Revenue */}
            <div style={{ position: "absolute", bottom: 0, left: 32, width: 246, background: "rgba(20,78,66,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(169,216,200,0.12)", borderRadius: 18, padding: 22, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animation: "floatCard 5s ease-in-out infinite", animationDelay: "2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, #C08A5A, #96693e)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(192,138,90,0.3)" }}>
                  <i className="fa-solid fa-chart-line" style={{ color: "#EDE3D1", fontSize: 17 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(169,216,200,0.6)", fontWeight: 500 }}>Monthly Revenue</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#EDE3D1", letterSpacing: "-0.5px" }}>$48.5K</div>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(169,216,200,0.1)", overflow: "hidden" }}>
                <div style={{ width: "75%", height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #3A8F7A, #A9D8C8)" }} />
              </div>
            </div>

            {/* Card 4 — Inventory */}
            <div style={{ position: "absolute", right: -16, bottom: 32, width: 196, background: "rgba(20,78,66,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(169,216,200,0.12)", borderRadius: 16, padding: 18, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animation: "floatCard 5s ease-in-out infinite", animationDelay: "3s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #C08A5A, #96693e)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(192,138,90,0.25)" }}>
                  <i className="fa-solid fa-boxes-stacked" style={{ color: "#EDE3D1", fontSize: 14 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(169,216,200,0.6)", fontWeight: 500 }}>Inventory</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#EDE3D1" }}>96%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand text */}
        <div style={{ position: "absolute", bottom: 40, left: 24, right: 24, zIndex: 10 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#EDE3D1", margin: 0, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.3px" }}>
            MediPanel
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "rgba(169,216,200,0.6)", lineHeight: 1.6 }}>
            Streamline your healthcare operations with our comprehensive management platform.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — auth form
         ═══════════════════════════════════════════════════════ */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", background: "#0d3830" }}>
        {/* Subtle background pattern */}
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.03,
            backgroundImage: "radial-gradient(circle, #A9D8C8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <AuthForm />

        {/* Footer */}
        <p style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: "rgba(169,216,200,0.3)" }}>
          © 2026 MediPanel. All rights reserved.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FLOATING "+" BUTTON
         ═══════════════════════════════════════════════════════ */}
      <button
        style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 50,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #3A8F7A, #2d7a66)",
          color: "#EDE3D1", border: "none",
          boxShadow: "0 8px 24px rgba(58,143,122,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s",
          fontSize: 22,
        }}
        onClick={() => alert("Quick actions — coming soon!")}
        title="Quick actions"
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(58,143,122,0.5)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(58,143,122,0.4)"; }}
      >
        <i className="fa-solid fa-plus" />
      </button>
    </main>
  );
}
