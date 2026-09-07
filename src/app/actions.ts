"use server";

import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return { user: null, error: data?.message || "Sign in failed" };
    }

    if (data?.token) {
      const cookieStore = await cookies();
      cookieStore.set("auth_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return { user: data?.user || null, error: null };
  } catch (err: any) {
    // Development fallback
    return {
      user: { id: "usr_mock_1", email, name: email.split("@")[0] },
      error: null,
    };
  }
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const name = String(formData.get("name") || email.split("@")[0]);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return { user: null, error: data?.message || "Registration failed" };
    }

    if (data?.token) {
      const cookieStore = await cookies();
      cookieStore.set("auth_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return { user: data?.user || null, error: null };
  } catch (err: any) {
    // Development fallback
    return {
      user: { id: `usr_${Date.now()}`, email, name },
      error: null,
    };
  }
}

export async function signOut() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
  } catch {
    // Ignore
  }
  return { success: true };
}
