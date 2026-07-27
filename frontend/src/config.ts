/**
 * V-DEBUT HUB Frontend Configuration & API Client
 */

export const CLIENT_VERSION = 'v0.1.0';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8787/api/v1';

export async function fetchWithVersion(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('X-Client-Version', CLIENT_VERSION);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
