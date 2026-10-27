import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import type { ApiResponse } from "./types";

export function ok<T>(data?: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data } as ApiResponse<T>);
}

export function err(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: error.statusCode }
    );
  }
  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    return NextResponse.json(
      { ok: false, error: `Validation error: ${messages}` },
      { status: 400 }
    );
  }
  console.error("[API Error]", error);
  const msg = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ ok: false, error: msg }, { status: 500 });
}
