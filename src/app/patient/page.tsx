"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";

export default function PatientDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50/30 dark:from-slate-900 dark:to-slate-800 px-6 transition-colors duration-300">

      {/* Dark mode toggle — top-right */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md text-gray-500 dark:text-amber-400 hover:scale-110 transition-all duration-200"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <i className="fa-solid fa-sun text-amber-400 text-base" />
        ) : (
          <i className="fa-solid fa-moon text-slate-500 text-base" />
        )}
      </button>

      <div className="w-full max-w-lg rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center shadow-xl shadow-gray-200/50 dark:shadow-none transition-colors duration-300">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/25">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Patient Portal</h1>
        <p className="mt-2 text-gray-500 dark:text-slate-400">
          Welcome, <span className="font-medium text-gray-900 dark:text-gray-100">{session.user?.name}</span>!
        </p>
        <p className="text-sm text-teal-600 dark:text-teal-400">{session.user?.role}</p>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Appointments", value: "3" },
            { label: "Prescriptions", value: "7" },
            { label: "Reports", value: "12" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-gray-50 dark:bg-slate-700/60 p-4 border border-transparent dark:border-slate-600/50">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 border border-transparent dark:border-red-800/30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}