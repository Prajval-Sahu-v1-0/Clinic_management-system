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
    <div className="w-full max-w-md animate-fade-in-up">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-teal-700 uppercase">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Clinic Portal
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {activeTab === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {activeTab === "login"
            ? "Manage appointments, patients, and inventory"
            : "Join the clinic portal to get started"}
        </p>
      </div>

      {/* ── Tab toggle ─────────────────────────────────────── */}
      <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
        {(["login", "signup"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setError("");
            }}
            className={`
              flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200
              ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            {tab === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* ── Form ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div
          className="transition-all duration-300 ease-in-out"
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
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
          or
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* ── Google button ──────────────────────────────────── */}
      <GoogleButton onClick={handleGoogleLogin} disabled={loading} />

      {/* ── Footer toggle ──────────────────────────────────── */}
      <p className="mt-8 text-center text-sm text-gray-500">
        {activeTab === "login"
          ? "Don't have an account? "
          : "Already have an account? "}
        <button
          onClick={() => {
            setActiveTab(activeTab === "login" ? "signup" : "login");
            setError("");
          }}
          className="font-semibold text-teal-600 transition-colors hover:text-teal-700"
        >
          {activeTab === "login" ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </div>
  );
}
