/**
 * Shared frontend configuration values.
 * API_BASE: Base URL used for server (Express) API calls.
 * Falls back to localhost:4000 for local development when env var not set.
 * Set NEXT_PUBLIC_API_BASE_URL in .env.local to override for deployments.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
