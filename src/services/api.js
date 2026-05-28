const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://cleanstreak-be.onrender.com";

async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    const authValue = String(token).trim();
    headers.Authorization = authValue.includes(" ") ? authValue : `Bearer ${authValue}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data?.detail?.[0]?.msg || data?.detail || data?.message || message;
    } catch {
      // Ignore JSON parse errors and keep the default message.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export function login(email, password) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getBins(token, { skip = 0, limit = 100 } = {}) {
  return apiFetch(`/api/bins/?skip=${skip}&limit=${limit}`, { token });
}

export function getPickupRequests(token, { requestStatus, skip = 0, limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (requestStatus) params.set("request_status", requestStatus);
  params.set("skip", String(skip));
  params.set("limit", String(limit));
  return apiFetch(`/api/pickup-requests/?${params.toString()}`, { token });
}

export function approvePickup(token, requestId) {
  return apiFetch(`/api/pickup-requests/${requestId}/approve`, {
    method: "POST",
    token,
  });
}

export function getClients(token, { skip = 0, limit = 100 } = {}) {
  return apiFetch(`/api/clients/?skip=${skip}&limit=${limit}`, { token });
}

export function createBin(token, { bin_id, bin_type, bin_level } = {}) {
  return apiFetch("/api/bins/", {
    method: "POST",
    token,
    body: { bin_id, bin_type, bin_level },
  });
}

export function assignBin(token, bin_id) {
  return apiFetch("/api/clients/me/assign-bin", {
    method: "PATCH",
    token,
    body: { bin_id },
  });
}
