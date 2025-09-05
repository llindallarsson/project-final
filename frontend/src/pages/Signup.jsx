import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api';
import Button from '../components/ui/Button';
import Input, { PasswordInput } from '../components/ui/Input';
import { useAuth } from '../store/auth';
import AuthLayout from './auth/AuthLayout';

export default function Signup() {
  const nav = useNavigate();
  const setToken = useAuth((s) => s.setToken);

  // Local form state
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  // UI state
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});

  // --- Validation (client-side) ---
  const emailTrimmed = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const pwValid = pw.length >= 8;
  const pwMatch = pw === pw2;
  const formValid = emailValid && pwValid && pwMatch;

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setTouched({ email: true, pw: true, pw2: true });
    if (!formValid) return;

    setBusy(true);
    try {
      const res = await api('/api/auth/signup', {
        method: 'POST',
        body: { email: emailTrimmed, password: pw },
      });
      if (res?.token) {
        setToken(res.token);
        nav('/');
      } else {
        throw new Error('Signup succeeded but no token returned.');
      }
    } catch (e2) {
      setErr(e2?.message || 'Kunde inte skapa konto just nu. Försök igen om en stund.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Skapa konto">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        {/* Email */}
        <Input
          label="E-post"
          id="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          spellCheck="false"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => touch('email')}
          error={touched.email && !emailValid ? 'Ange en giltig e-postadress.' : undefined}
        />

        {/* Password */}
        <PasswordInput
          label="Lösenord"
          id="pw"
          required
          minLength={8}
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onBlur={() => touch('pw')}
          error={touched.pw && !pwValid ? 'Lösenordet måste vara minst 8 tecken.' : undefined}
        />

        {/* Confirm password */}
        <PasswordInput
          label="Bekräfta lösenord"
          id="pw2"
          required
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          onBlur={() => touch('pw2')}
          error={touched.pw2 && !pwMatch ? 'Lösenorden matchar inte.' : undefined}
        />

        {/* Top-level error (API/network) */}
        {err && (
          <p role="alert" aria-live="polite" className="text-sm text-red-600">
            {err}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          variant="accent"
          isLoading={busy}
          disabled={busy || !formValid}
          fullWidth
        >
          Skapa konto
        </Button>

        {/* Link to login */}
        <p className="text-sm text-gray-600">
          Har du redan konto?{' '}
          <Link to="/login" className="text-brand-secondary hover:underline">
            Logga in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
