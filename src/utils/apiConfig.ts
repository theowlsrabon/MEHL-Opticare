/**
 * Central API base URL configuration and resilient response parser.
 *
 * - If VITE_API_URL is empty, use relative paths (Vite proxy or same-origin API).
 * - If VITE_API_URL is set, send requests to that configured backend.
 */
const env = (import.meta as any).env || {};
const rawApiUrl = (typeof env.VITE_API_URL === 'string' ? env.VITE_API_URL : '').trim();
export const API_BASE = (rawApiUrl || (env.PROD ? 'https://mehl-api.onrender.com' : '')).replace(/\/+$/, '');

export interface SafeJsonResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtml?: boolean;
}

/**
 * Safely parse JSON from a fetch Response.
 * Protects against HTML error pages (e.g. Vercel SPA rewrites, Render cold start pages,
 * or 404/502/503 HTML starting with '<!DOCTYPE html>') that crash standard `response.json()`.
 */
export async function safeParseJsonResponse<T = any>(
  response: Response
): Promise<SafeJsonResult<T>> {
  let rawText = '';
  try {
    const contentType = response.headers.get('content-type') || '';
    rawText = await response.text();
    const trimmed = rawText.trim();

    // Check if the response is HTML instead of JSON
    if (trimmed.startsWith('<') || contentType.includes('text/html')) {
      return {
        ok: false,
        status: response.status,
        data: null,
        error: `Server returned an HTML page (${response.status} ${response.statusText || 'OK'}). Backend may be offline, sleeping, or unconfigured.`,
        isHtml: true,
      };
    }

    if (!trimmed) {
      return {
        ok: response.ok,
        status: response.status,
        data: null,
      };
    }

    const data = JSON.parse(trimmed) as T;
    return {
      ok: response.ok,
      status: response.status,
      data,
      error: !response.ok ? ((data as any)?.error || `HTTP ${response.status}`) : undefined,
      isHtml: false,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: response.status,
      data: null,
      error: rawText.trim()
        ? `Server returned an invalid JSON response (${response.status}): ${rawText.trim().slice(0, 200)}`
        : err?.message || 'Failed to parse server JSON response.',
      isHtml: false,
    };
  }
}

/**
 * Resilient fetch wrapper that never throws on HTML responses or network cold starts.
 */
export async function fetchJsonSafe<T = any>(
  url: string,
  init?: RequestInit
): Promise<SafeJsonResult<T>> {
  try {
    const response = await fetch(url, init);
    return await safeParseJsonResponse<T>(response);
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network request failed or server unreachable.',
      isHtml: false,
    };
  }
}
