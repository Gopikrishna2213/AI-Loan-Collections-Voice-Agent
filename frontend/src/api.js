// All calls go to the same FastAPI endpoints Vapi uses.
// Dev: relative URLs + Vite proxy. Prod: set VITE_BACKEND_URL at build time.
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

async function request(method, path, body) {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data;
    try { data = await res.json(); } catch { data = {}; }
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: { error: e.message } };
  }
}

export const get = (path, params) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request("GET", path + qs);
};
export const post = (path, body) => request("POST", path, body);
export const del = (path) => request("DELETE", path);

export const webCallUrl = (customerId) => {
  const base = BACKEND_URL || window.location.origin;
  return `${base}/webcall?customer_id=${encodeURIComponent(customerId)}`;
};

export const inr = (n) => (n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`);

export const errorText = (data) =>
  typeof data?.detail === "string" ? data.detail : data?.error || JSON.stringify(data?.detail || data);
