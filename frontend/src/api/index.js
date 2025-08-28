const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export async function api(
  path,
  { method = "GET", body, token, isMultipart } = {}
) {
  const headers = { Accept: "application/json" };
  let payload = body;

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
    payload = body ? JSON.stringify(body) : undefined;
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${API_URL}${path.startsWith("/") ? path : `/${path}`}`,
    {
      method,
      headers,
      body: payload,
    }
  );

  // 204 No Content
  if (res.status === 204) return null;

  // Försök tolka svar som JSON; annars fall tillbaka till text
  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      res.statusText ||
      "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
