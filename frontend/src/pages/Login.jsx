import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../api';
import Button from '../components/ui/Button';
import Input, { PasswordInput } from '../components/ui/Input';
import { useAuth } from '../store/auth';
import AuthLayout from './auth/AuthLayout';

export default function Login() {
  const nav = useNavigate();
  const setToken = useAuth((s) => s.setToken);

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;

    setErr('');

    const emailNorm = email.trim().toLowerCase();
    const pwNorm = pw;

    // enkel klientvalidering
    if (!emailNorm) return setErr('Ange en giltig e-postadress.');
    if (!pwNorm) return setErr('Ange ditt lösenord.');

    setBusy(true);
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { email: emailNorm, password: pwNorm },
      });
      if (!res?.token) throw new Error('Ogiltigt svar från servern.');
      setToken(res.token);
      nav('/');
    } catch (e2) {
      setErr(e2?.message || 'Kunde inte logga in. Försök igen.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Logga in">
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        {/* Email */}
        <Input
          label="E-post"
          id="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          // vi visar inte fältfel här för att slippa duplicera serverfelet
          // men markerar invalid när err finns och fältet är tomt
          // (om du vill: byt till error="…" för per-fält-meddelande)
          // hint="Ange din e-postadress"
        />

        {/* Password */}
        <PasswordInput
          label="Lösenord"
          id="pw"
          required
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />

        {/* Error (övergripande) */}
        {err && (
          <p role="alert" aria-live="polite" className="text-sm text-red-600">
            {err}
          </p>
        )}

        {/* Submit */}
        <Button type="submit" isLoading={busy} fullWidth>
          Logga in
        </Button>

        {/* Footer link */}
        <p className="text-sm text-gray-600">
          Har du inget konto?{' '}
          <Link to="/signup" className="text-brand-accent hover:underline">
            Skapa konto
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
