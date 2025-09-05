const API_BASE = (() => {
  const env = import.meta.env;
  // PROD / explicit base
  if (env.VITE_API_URL) return String(env.VITE_API_URL).replace(/\/$/, '');
  // DEV: använd Vite proxy (relativ bas)
  if (env.DEV) return '';
  // Fallback: same-origin
  return '';
})();

function buildUrl(path) {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function api(path, { method = 'GET', body, token, isMultipart } = {}) {
  const headers = { Accept: 'application/json' };
  let payload = body;

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
    payload = body ? JSON.stringify(body) : undefined;
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(buildUrl(path), { method, headers, body: payload });
  } catch (e) {
    // Nätverksnivå (t.ex. connection refused)
    throw new Error('Kunde inte nå API:t. Är backend igång och port/proxy korrekt?');
  }

  if (res.status === 204) return null;

  // Läs säkert som JSON, falla tillbaka till text
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || res.statusText || 'Request failed';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
