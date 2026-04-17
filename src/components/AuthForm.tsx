"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import GoogleButton from "./GoogleButton";

type Tab = "login" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ── handlers ────────────────────────────────────────────── */
  async function handleLogin(email: string, password: string) {
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/patient");
  }

  async function handleSignup(
    name: string,
    email: string,
    password: string
  ) {
    setError("");
    setLoading(true);

    try {
      // Register via server API
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

      // Sign in with the new credentials
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please try logging in.");
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

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div style={{ width: "100%", maxWidth: 420, animation: "fadeInUp 0.5s ease-out" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          borderRadius: 99, background: "rgba(58,143,122,0.15)",
          padding: "6px 16px", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "#A9D8C8", marginBottom: 16,
          border: "1px solid rgba(58,143,122,0.2)",
        }}>
          <i className="fa-solid fa-plus" style={{ fontSize: 12 }} />
          Clinic Portal
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: "#EDE3D1",
          fontFamily: "'Inter', sans-serif", letterSpacing: "-0.5px", margin: 0,
        }}>
          {activeTab === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "rgba(169,216,200,0.5)" }}>
          {activeTab === "login"
            ? "Manage appointments, patients, and inventory"
            : "Join the clinic portal to get started"}
        </p>
      </div>

      {/* ── Tab toggle ─────────────────────────────────────── */}
      <div style={{
        display: "flex", borderRadius: 12,
        background: "rgba(20,78,66,0.5)",
        padding: 4, marginBottom: 24,
        border: "1px solid rgba(169,216,200,0.1)",
      }}>
        {(["login", "signup"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setError("");
            }}
            style={{
              flex: 1, borderRadius: 9, padding: "10px 0",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              border: "none", cursor: "pointer",
              transition: "all 0.2s",
              background: activeTab === tab ? "rgba(58,143,122,0.25)" : "transparent",
              color: activeTab === tab ? "#EDE3D1" : "rgba(169,216,200,0.4)",
              boxShadow: activeTab === tab ? "0 2px 8px rgba(58,143,122,0.15)" : "none",
            }}
          >
            {tab === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* ── Form ───────────────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div
          key={activeTab}
          style={{ animation: "fadeInUp 0.35s ease-out" }}
        >
          {activeTab === "login" ? (
            <LoginForm
              onLogin={handleLogin}
              error={error}
              loading={loading}
            />
          ) : (
            <SignupForm
              onSignup={handleSignup}
              error={error}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
        <div style={{ height: 1, flex: 1, background: "rgba(169,216,200,0.1)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(169,216,200,0.3)" }}>
          or
        </span>
        <div style={{ height: 1, flex: 1, background: "rgba(169,216,200,0.1)" }} />
      </div>

      {/* ── Google button ──────────────────────────────────── */}
      <GoogleButton onClick={handleGoogleLogin} disabled={loading} />

      {/* ── Footer toggle ──────────────────────────────────── */}
      <p style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "rgba(169,216,200,0.4)" }}>
        {activeTab === "login"
          ? "Don't have an account? "
          : "Already have an account? "}
        <button
          onClick={() => {
            setActiveTab(activeTab === "login" ? "signup" : "login");
            setError("");
          }}
          style={{
            fontWeight: 700, color: "#C08A5A", background: "none",
            border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 14, transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#d4a373")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#C08A5A")}
        >
          {activeTab === "login" ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </div>
  );
}
