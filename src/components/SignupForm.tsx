"use client";

import { useState } from "react";

interface SignupFormProps {
  onSignup: (name: string, email: string, password: string) => void;
  error: string;
  loading: boolean;
}

export default function SignupForm({
  onSignup,
  error,
  loading,
}: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate(): boolean {
    const errors: typeof validationErrors = {};
    if (!name.trim()) errors.name = "Full name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onSignup(name, email, password);
    }
  }

  /* ── helper: render a labelled input row ───────────────────── */
  function renderField(
    id: string,
    label: string,
    type: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    icon: React.ReactNode,
    errorKey: keyof typeof validationErrors,
    isPassword?: boolean
  ) {
    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <div className="input-glow relative rounded-xl border border-gray-200 transition-all duration-200">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            {icon}
          </div>
          <input
            id={id}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            value={value}
            onChange={(e) => {
              setter(e.target.value);
              if (validationErrors[errorKey])
                setValidationErrors((v) => ({ ...v, [errorKey]: undefined }));
            }}
            className="w-full rounded-xl bg-transparent py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none"
            placeholder={placeholder}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {validationErrors[errorKey] && (
          <p className="mt-1 text-xs text-red-500">
            {validationErrors[errorKey]}
          </p>
        )}
      </div>
    );
  }

  /* ── shared icon components ────────────────────────────────── */
  const userIcon = (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  );
  const emailIcon = (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
      />
    </svg>
  );
  const lockIcon = (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderField(
        "signup-name",
        "Full Name",
        "text",
        name,
        setName,
        "John Doe",
        userIcon,
        "name"
      )}
      {renderField(
        "signup-email",
        "Email Address",
        "email",
        email,
        setEmail,
        "you@example.com",
        emailIcon,
        "email"
      )}
      {renderField(
        "signup-password",
        "Password",
        "password",
        password,
        setPassword,
        "Min. 6 characters",
        lockIcon,
        "password",
        true
      )}
      {renderField(
        "signup-confirm",
        "Confirm Password",
        "password",
        confirmPassword,
        setConfirmPassword,
        "Re-enter password",
        lockIcon,
        "confirmPassword",
        true
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="
          group relative w-full overflow-hidden rounded-xl
          bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-3.5
          text-sm font-semibold text-white shadow-lg shadow-teal-500/25
          transition-all duration-200
          hover:from-teal-600 hover:to-teal-700 hover:shadow-xl hover:shadow-teal-500/30
          focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2
          active:scale-[0.98]
          disabled:cursor-not-allowed disabled:opacity-60
        "
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </span>
      </button>
    </form>
  );
}
