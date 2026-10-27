"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";
import {
  Mail,
  Lock,
  User,
  Phone,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Hash,
} from "lucide-react";
import { DEPARTMENTS } from "@/lib/types";
import { Toast } from "./shared";

/* ─── Login Form ──────────────────────────────────────── */
export function LoginForm({ adminMode = false }: { adminMode?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await post<{ redirect: string; role?: string }>("/api/auth/login", {
      email,
      password,
    });

    if (res.ok && res.data) {
      if (adminMode && res.data.role !== "admin") {
        setError("Access denied. This login is for placement officers only.");
        setLoading(false);
        return;
      }
      router.push(res.data.redirect);
      router.refresh();
    } else {
      setError(res.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <>
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-xs font-semibold text-surface-300">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl glass-input pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-surface-500"
              placeholder="you@college.edu"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-xs font-semibold text-surface-300">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl glass-input pl-10 pr-12 py-3 text-xs sm:text-sm text-white placeholder-surface-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl btn-vibrant-primary px-6 py-3.5 text-xs sm:text-sm font-bold shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

/* ─── Registration Form ──────────────────────────────── */
export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    rollNumber: "",
    password: "",
    department: "CSE" as string,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await post<{ redirect: string }>("/api/auth/register", {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      rollNumber: form.rollNumber || undefined,
      password: form.password,
      department: form.department,
    });

    if (res.ok && res.data) {
      router.push(res.data.redirect);
      router.refresh();
    } else {
      setError(res.error || "Registration failed");
      setLoading(false);
    }
  }

  const fields = [
    {
      id: "reg-name",
      label: "Full Name",
      field: "fullName",
      type: "text",
      icon: <User className="h-4 w-4" />,
      placeholder: "Arun Kumar S",
      required: true,
    },
    {
      id: "reg-email",
      label: "College Email Address",
      field: "email",
      type: "email",
      icon: <Mail className="h-4 w-4" />,
      placeholder: "arun@college.edu",
      required: true,
    },
    {
      id: "reg-roll",
      label: "Roll / Register Number",
      field: "rollNumber",
      type: "text",
      icon: <Hash className="h-4 w-4" />,
      placeholder: "711523BCS001",
      required: false,
    },
    {
      id: "reg-phone",
      label: "Phone Number (WhatsApp Alerts)",
      field: "phone",
      type: "tel",
      icon: <Phone className="h-4 w-4" />,
      placeholder: "9876543210",
      required: true,
    },
    {
      id: "reg-password",
      label: "Password",
      field: "password",
      type: "password",
      icon: <Lock className="h-4 w-4" />,
      placeholder: "Min 8 characters",
      required: true,
    },
  ];

  return (
    <>
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {fields.map((f) => (
          <div key={f.id} className="space-y-1">
            <label htmlFor={f.id} className="block text-xs font-semibold text-surface-300">
              {f.label}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
                {f.icon}
              </span>
              <input
                id={f.id}
                type={f.field === "password" ? (showPassword ? "text" : "password") : f.type}
                required={f.required}
                value={form[f.field as keyof typeof form]}
                onChange={(e) => update(f.field, e.target.value)}
                className="w-full rounded-2xl glass-input pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-surface-500"
                placeholder={f.placeholder}
              />
              {f.field === "password" && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="space-y-1">
          <label htmlFor="reg-dept" className="block text-xs font-semibold text-surface-300">
            Department
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <select
              id="reg-dept"
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              className="w-full rounded-2xl glass-input pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white appearance-none cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="bg-surface-900">
                  {d}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl btn-vibrant-primary px-6 py-3.5 text-xs sm:text-sm font-bold shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Create Student Profile
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}
