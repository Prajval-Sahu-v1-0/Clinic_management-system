"use client";

import { useState } from "react";

interface SignupFormProps {
  onSignup: (name: string, email: string, password: string) => void;
  error: string;
  loading: boolean;
  isDark: boolean;
}

export default function SignupForm({ onSignup, error, loading, isDark }: SignupFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    firstName?: string; lastName?: string;
    email?: string; password?: string;
  }>({}); 

  const inputBg     = isDark ? "rgba(43,47,69,0.55)" : "rgba(111,122,230,0.04)";
  const inputBorder = isDark ? "rgba(74,80,112,0.6)" : "rgba(111,122,230,0.2)";
  const textColor   = isDark ? "var(--theme-text1)" : "var(--theme-text1)";
  const eyeColor    = isDark ? "rgba(165,171,200,0.5)" : "rgba(111,122,230,0.45)";

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
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "At least 6 characters";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSignup(`${firstName} ${lastName}`.trim(), email, password);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* First + Last name row */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <input
            id="signup-first"
            type="text"
            value={firstName}
            onChange={e => { setFirstName(e.target.value); if (validationErrors.firstName) setValidationErrors(v => ({ ...v, firstName: undefined })); }}
            className="auth-input"
            style={{ ...inputStyle, borderColor: validationErrors.firstName ? "#dc2626" : inputBorder }}
            placeholder="First name"
          />
          {validationErrors.firstName && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#dc2626" }}>{validationErrors.firstName}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <input
            id="signup-last"
            type="text"
            value={lastName}
            onChange={e => { setLastName(e.target.value); if (validationErrors.lastName) setValidationErrors(v => ({ ...v, lastName: undefined })); }}
            className="auth-input"
            style={{ ...inputStyle, borderColor: validationErrors.lastName ? "#dc2626" : inputBorder }}
            placeholder="Last name"
          />
          {validationErrors.lastName && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#dc2626" }}>{validationErrors.lastName}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (validationErrors.email) setValidationErrors(v => ({ ...v, email: undefined })); }}
          className="auth-input"
          style={{ ...inputStyle, borderColor: validationErrors.email ? "#dc2626" : inputBorder }}
          placeholder="Email"
        />
        {validationErrors.email && <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#dc2626" }}>{validationErrors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <div style={{ position: "relative" }}>
          <input
            id="signup-password"
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
              color: eyeColor,
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
          background: isDark
            ? "linear-gradient(135deg, #6C7A9E 0%, #3A3F5A 100%)"
            : "linear-gradient(135deg, #6F7AE6 0%, #3F4AA8 100%)",
          color: isDark ? "#FFFFFF" : "#E8ECFF",
          fontSize: 14.5, fontWeight: 700,
          fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1, transition: "all 0.2s",
          boxShadow: isDark
            ? "0 4px 16px rgba(108,122,158,0.4)"
            : "0 4px 16px rgba(111,122,230,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          marginTop: 2,
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = isDark ? "0 6px 22px rgba(108,122,158,0.55)" : "0 6px 22px rgba(111,122,230,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = isDark ? "0 4px 16px rgba(108,122,158,0.4)" : "0 4px 16px rgba(111,122,230,0.35)"; }}
        onMouseDown={e => { if (!loading) e.currentTarget.style.transform = "scale(0.985)"; }}
        onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account…
          </>
        ) : "Create account"}
      </button>
    </form>
  );
}
