/**
 * Central API base URL configuration.
 *
 * - In development (npm run dev): VITE_API_URL is empty → uses relative paths → Vite proxy or same-origin
 * - In production (Vercel): VITE_API_URL is set to the Render backend URL (e.g. https://mehl-api.onrender.com)
 */
export const API_BASE = (import.meta.env.VITE_API_URL as string) || "";
