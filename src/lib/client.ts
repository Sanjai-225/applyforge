import type { ApiResponse } from "./types";

const BASE = typeof window !== "undefined" ? "" : (process.env.APP_ORIGIN ?? "http://localhost:3000");

async function request<T>(
  url: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return res.json() as Promise<ApiResponse<T>>;
}

export async function post<T = unknown>(
  url: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return request<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export async function get<T = unknown>(
  url: string
): Promise<ApiResponse<T>> {
  return request<T>(url, { method: "GET" });
}
