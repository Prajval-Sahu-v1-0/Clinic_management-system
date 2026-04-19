"use client";

import { useState } from "react";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  error: string;
  loading: boolean;
  isDark: boolean;
}

export default function LoginForm({ onLogin, error, loading, isDark }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const inputBg   = isDark ? "rgba(20,78,66,0.45)" : "rgba(20,78,66,0.04)";
  const inputBorder = isDark ? "rgba(169,216,200,0.15)" : "rgba(20,78,66,0.15)";
  const textColor = isDark ? "#EDE3D1" : "#144E42";
  const placeholderColor = isDark ? "rgba(169,216,200,0.4)" : "rgba(20,78,66,0.4)";

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "12px 14px", borderRadius: 10,
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textColor, fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  function validate(): boolean {
    const errors: typeof validationErrors = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email";
    if (!password) errors.password = "Password is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onLogin(email, password);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Email */}
      <div>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (validationErrors.email) setValidationErrors(v => ({ ...v, email: undefined })); }}
          className="auth-input"
          style={{ ...inputStyle, borderColor: validationErrors.email ? "#dc2626" : inputBorder }}
          placeholder="Email"
        />
        <style>{`.auth-input::placeholder { color: ${placeholderColor}; }`}</style>
        {validationErrors.email && <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#dc2626" }}>{validationErrors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <div style={{ position: "relative" }}>
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => { setPassword(e.target.value); if (validationErrors.password) setValidationErrors(v => ({ ...v, password: undefined })); }}
            className="auth-input"
            style={{ ...inputStyle, paddingRight: 42, borderColor: validationErrors.password ? "#dc2626" : inputBorder }}
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 2,
              color: isDark ? "rgba(169,216,200,0.45)" : "rgba(20,78,66,0.45)",
              display: "flex", alignItems: "center",
            }}
          >
            {showPassword ? (
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>
        {validationErrors.password && <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#dc2626" }}>{validationErrors.password}</p>}
      </div>

      {/* Forgot password */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4 }}>
        <button
          type="button"
          onClick={() => alert("Password reset coming soon!")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12.5, fontWeight: 600, color: "#3A8F7A",
            fontFamily: "inherit", padding: 0,
          }}
        >
          Forgot password?
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)",
          borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#dc2626",
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", padding: "13px 0", borderRadius: 11, border: "none",
          background: "linear-gradient(135deg, #3A8F7A 0%, #144E42 100%)",
          color: "#EDE3D1", fontSize: 14.5, fontWeight: 700,
          fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1, transition: "all 0.2s",
          boxShadow: "0 4px 16px rgba(58,143,122,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = "0 6px 22px rgba(58,143,122,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(58,143,122,0.35)"; }}
        onMouseDown={e => { if (!loading) e.currentTarget.style.transform = "scale(0.985)"; }}
        onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in…
          </>
        ) : "Sign In"}
      </button>
    </form>
  );
}
