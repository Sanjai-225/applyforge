"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";
import {
  Mail,
  Lock,
  User,
  Phone,
  Hash,
  GraduationCap,
  Calendar,
  BookOpen,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-sm font-medium text-surface-300">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-surface-800 border border-surface-600 pl-10 pr-4 py-3 text-sm text-white placeholder-surface-500 transition-all hover:border-surface-500 focus:border-primary-500"
              placeholder="you@college.edu"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-sm font-medium text-surface-300">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-surface-800 border border-surface-600 pl-10 pr-12 py-3 text-sm text-white placeholder-surface-500 transition-all hover:border-surface-500 focus:border-primary-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/30 transition-all hover:from-primary-500 hover:to-primary-600 disabled:opacity-60 disabled:cursor-not-allowed btn-lift"
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
    password: "",
    rollNumber: "",
    department: "CSE" as string,
    batchYear: "2027",
    cgpa: "",
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
      password: form.password,
      rollNumber: form.rollNumber,
      department: form.department,
      batchYear: parseInt(form.batchYear),
      cgpa: form.cgpa ? parseFloat(form.cgpa) : 0,
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
      label: "Email Address",
      field: "email",
      type: "email",
      icon: <Mail className="h-4 w-4" />,
      placeholder: "arun@college.edu",
      required: true,
    },
    {
      id: "reg-phone",
      label: "Phone Number (WhatsApp)",
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
    {
      id: "reg-roll",
      label: "Roll Number",
      field: "rollNumber",
      type: "text",
      icon: <Hash className="h-4 w-4" />,
      placeholder: "711523BCS042",
      required: true,
    },
  ];

  return (
    <>
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((f) => (
          <div key={f.id} className="space-y-1.5">
            <label htmlFor={f.id} className="block text-sm font-medium text-surface-300">
              {f.label}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
                {f.icon}
              </span>
              <input
                id={f.id}
                type={f.field === "password" ? (showPassword ? "text" : "password") : f.type}
                required={f.required}
                value={form[f.field as keyof typeof form]}
                onChange={(e) => update(f.field, e.target.value)}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 pl-10 pr-4 py-3 text-sm text-white placeholder-surface-500 transition-all hover:border-surface-500 focus:border-primary-500"
                placeholder={f.placeholder}
              />
              {f.field === "password" && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="reg-dept" className="block text-sm font-medium text-surface-300">
              Department
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <select
                id="reg-dept"
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 pl-10 pr-4 py-3 text-sm text-white transition-all hover:border-surface-500 focus:border-primary-500 appearance-none cursor-pointer"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-batch" className="block text-sm font-medium text-surface-300">
              Batch Year
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input
                id="reg-batch"
                type="number"
                required
                min="2020"
                max="2035"
                value={form.batchYear}
                onChange={(e) => update("batchYear", e.target.value)}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 pl-10 pr-4 py-3 text-sm text-white transition-all hover:border-surface-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-cgpa" className="block text-sm font-medium text-surface-300">
              CGPA
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
              <input
                id="reg-cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={form.cgpa}
                onChange={(e) => update("cgpa", e.target.value)}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 pl-10 pr-4 py-3 text-sm text-white placeholder-surface-500 transition-all hover:border-surface-500 focus:border-primary-500"
                placeholder="8.50"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/30 transition-all hover:from-primary-500 hover:to-primary-600 disabled:opacity-60 disabled:cursor-not-allowed btn-lift"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}
