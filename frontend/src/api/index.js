const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function api(
  path,
  { method = "GET", body, token, isMultipart } = {}
) {
  const headers = {};
  let payload = body;

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
    payload = body ? JSON.stringify(body) : undefined;
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: payload,
  });
  if (!res.ok) throw new Error((await res.json()).message || "Request failed");
  return res.status === 204 ? null : res.json();
}
