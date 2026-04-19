"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { useTheme } from "@/hooks/useTheme";

type Tab = "login" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("signup");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tx1 = isDark ? "#EDE3D1" : "#144E42";
  const tx2 = isDark ? "rgba(169,216,200,0.55)" : "rgba(20,78,66,0.55)";

  /* ── handlers ─────────────────────────────────────────────── */
  async function handleLogin(email: string, password: string) {
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }
    router.push("/patient");
  }

  async function handleSignup(name: string, email: string, password: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
        setLoading(false);
        return;
      }
      router.push("/patient");
    } catch {
      setError("Failed to create account. Please try again.");
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    signIn("google", { callbackUrl: "/patient" });
  }

  /* ── render ───────────────────────────────────────────────── */
  return (
    <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

      {/* ── Title block ─────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: tx1,
          margin: "0 0 6px", letterSpacing: "-0.5px", lineHeight: 1.15,
          fontFamily: "'Inter', sans-serif",
        }}>
          {activeTab === "signup" ? "Create an account" : "Welcome back"}
        </h1>
        <p style={{ fontSize: 13.5, color: tx2, margin: 0 }}>
          {activeTab === "signup"
            ? "Fill in the details below to get started."
            : "Sign in to access your clinic dashboard."}
        </p>
      </div>

      {/* ── Tab switcher ────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 24,
        background: isDark ? "rgba(20,78,66,0.5)" : "rgba(20,78,66,0.06)",
        borderRadius: 12, padding: 4,
        border: `1px solid ${isDark ? "rgba(169,216,200,0.1)" : "rgba(20,78,66,0.1)"}`,
      }}>
        {(["signup", "login"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(""); }}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600,
              transition: "all 0.2s",
              background: activeTab === tab
                ? "linear-gradient(135deg, #3A8F7A 0%, #144E42 100%)"
                : "transparent",
              color: activeTab === tab
                ? "#EDE3D1"
                : isDark ? "rgba(169,216,200,0.55)" : "rgba(20,78,66,0.55)",
              boxShadow: activeTab === tab ? "0 3px 10px rgba(58,143,122,0.3)" : "none",
            }}
          >
            {tab === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* ── Forms ───────────────────────────────────────────── */}
      <div key={activeTab} style={{ animation: "fadeSwap 0.3s ease both" }}>
        {activeTab === "login" ? (
          <LoginForm onLogin={handleLogin} error={error} loading={loading} isDark={isDark} />
        ) : (
          <SignupForm onSignup={handleSignup} error={error} loading={loading} isDark={isDark} />
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 18px" }}>
        <div style={{ flex: 1, height: 1, background: isDark ? "rgba(169,216,200,0.1)" : "rgba(20,78,66,0.1)" }} />
        <span style={{ fontSize: 11.5, color: tx2, fontWeight: 500 }}>Or {activeTab === "signup" ? "register" : "sign in"} with</span>
        <div style={{ flex: 1, height: 1, background: isDark ? "rgba(169,216,200,0.1)" : "rgba(20,78,66,0.1)" }} />
      </div>

      {/* ── Social buttons ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10 }}>
        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="social-btn"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 16px", borderRadius: 11, cursor: "pointer",
            background: isDark ? "rgba(20,78,66,0.4)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${isDark ? "rgba(169,216,200,0.14)" : "rgba(20,78,66,0.14)"}`,
            fontSize: 13.5, fontWeight: 600, color: tx1, transition: "all 0.2s",
            fontFamily: "inherit",
          }}
        >
          {/* Google coloured G */}
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        {/* Apple */}
        <button
          onClick={() => alert("Apple sign-in coming soon!")}
          disabled={loading}
          className="social-btn"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 16px", borderRadius: 11, cursor: "pointer",
            background: isDark ? "rgba(20,78,66,0.4)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${isDark ? "rgba(169,216,200,0.14)" : "rgba(20,78,66,0.14)"}`,
            fontSize: 13.5, fontWeight: 600, color: tx1, transition: "all 0.2s",
            fontFamily: "inherit",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 814 1000" fill={isDark ? "#EDE3D1" : "#144E42"}>
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-54.2-155.5-127.4C46 391.1 17.7 268.3 17.7 150.4c0-114.7 32-175.3 93.9-233.5C174 -50.8 253.7-82.2 328.2-82.2c113.3 0 194.8 72 264.4 72 72 0 165.3-78.3 247.5-78.3zm-190 -165.3c-32 24.3-68 55.3-68 117.3 0 59.6 28.5 111.5 78.3 145.4 8.8 5.8 17.1 8 25.3 8 14.7 0 29.4-8.4 40.8-23.1 20.7-25.6 39.5-65.1 39.5-117.3 0-54.2-23.1-104-69.5-135.6-13.5-9.2-27.6-14.7-41.5-14.7-1.3 0-3.2.4-4.9.0z"/>
          </svg>
          Apple
        </button>
      </div>
    </div>
  );
}
