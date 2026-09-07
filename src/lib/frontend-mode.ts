/**
 * Frontend-Only Mode Configuration & State Controller
 *
 * Enables the Ayaan Clothing platform to operate completely standalone
 * without requiring the Laravel / PostgreSQL / Redis backend.
 */

const FRONTEND_ONLY_STORAGE_KEY = "ayaan_frontend_only_mode";

/**
 * Returns whether the application is running in Frontend-First / Mock Mode.
 * Default is TRUE in development or when NEXT_PUBLIC_FRONTEND_ONLY is set.
 */
export function isFrontendOnly(): boolean {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem(FRONTEND_ONLY_STORAGE_KEY);
    if (override !== null) {
      return override === "true";
    }
  }

  // Environment variable override
  const envVal = process.env.NEXT_PUBLIC_FRONTEND_ONLY;
  if (envVal !== undefined) {
    return envVal === "true" || envVal === "1";
  }

  // Default to true for frontend-first development mode
  return true;
}

/**
 * Programmatically toggle or set frontend-only mode in the browser
 */
export function setFrontendOnly(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(FRONTEND_ONLY_STORAGE_KEY, enabled ? "true" : "false");
    window.dispatchEvent(new CustomEvent("ayaan:frontend-mode-changed", { detail: { enabled } }));
  }
}
