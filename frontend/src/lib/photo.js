// src/lib/photo.js

const apiBase =
  import.meta.env.VITE_API_URL ??
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : 'https://vindra.onrender.com');

export function getPhotoUrl(raw) {
  if (!raw) return '';
  const u = typeof raw === 'string' ? raw : raw.url || raw.path || raw.filename || '';
  if (!u) return '';
  return u.startsWith('http') ? u : `${apiBase}${u.startsWith('/') ? '' : '/'}${u}`;
}
