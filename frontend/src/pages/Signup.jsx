import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import AuthLayout from "./auth/AuthLayout";

export default function Signup() {
  const nav = useNavigate();
  const setToken = useAuth((s) => s.setToken);

  // Local form state
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // UI state
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});

  // --- Validation (client-side) ---
  const emailTrimmed = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  const pwValid = pw.length >= 8; // simple min length rule
  const pwMatch = pw === pw2;
  const formValid = emailValid && pwValid && pwMatch;

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    // Mark all as touched so errors become visible
    setTouched({ email: true, pw: true, pw2: true });

    if (!formValid) return;

    setBusy(true);
    try {
      const res = await api("/api/auth/signup", {
        method: "POST",
        body: { email: emailTrimmed, password: pw },
      });

      // Expecting a token back on success
      if (res?.token) {
        setToken(res.token);
        nav("/");
      } else {
        throw new Error("Signup succeeded but no token returned.");
      }
    } catch (e2) {
      // Friendly fallback message; surface server message if present
      const msg =
        e2?.message ||
        "Kunde inte skapa konto just nu. Försök igen om en stund.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title='Skapa konto' subtitle='Från vind till minne.'>
      <form onSubmit={onSubmit} className='grid gap-4' noValidate>
        {/* Email */}
        <div>
          <label htmlFor='email' className='block text-sm font-medium'>
            E-post
          </label>
          <input
            id='email'
            type='email'
            required
            autoComplete='email'
            inputMode='email'
            spellCheck='false'
            autoCapitalize='none'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            aria-invalid={touched.email && !emailValid ? "true" : "false"}
            aria-describedby={
              touched.email && !emailValid ? "email-err" : undefined
            }
            className='mt-1 w-full border border-brand-border rounded-lg px-3 py-2 outline-none focus:ring-4 focus:ring-brand-secondary/25 focus:border-brand-secondary'
          />
          {touched.email && !emailValid && (
            <p id='email-err' className='mt-1 text-sm text-red-600'>
              Ange en giltig e-postadress.
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor='pw' className='block text-sm font-medium'>
            Lösenord
          </label>
          <input
            id='pw'
            type='password'
            required
            minLength={8}
            autoComplete='new-password'
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onBlur={() => touch("pw")}
            aria-invalid={touched.pw && !pwValid ? "true" : "false"}
            aria-describedby={touched.pw && !pwValid ? "pw-err" : undefined}
            className='mt-1 w-full border border-brand-border rounded-lg px-3 py-2 outline-none focus:ring-4 focus:ring-brand-secondary/25 focus:border-brand-secondary'
          />
          {touched.pw && !pwValid && (
            <p id='pw-err' className='mt-1 text-sm text-red-600'>
              Lösenordet måste vara minst 8 tecken.
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor='pw2' className='block text-sm font-medium'>
            Bekräfta lösenord
          </label>
          <input
            id='pw2'
            type='password'
            required
            autoComplete='new-password'
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            onBlur={() => touch("pw2")}
            aria-invalid={touched.pw2 && !pwMatch ? "true" : "false"}
            aria-describedby={touched.pw2 && !pwMatch ? "pw2-err" : undefined}
            className='mt-1 w-full border border-brand-border rounded-lg px-3 py-2 outline-none focus:ring-4 focus:ring-brand-secondary/25 focus:border-brand-secondary'
          />
          {touched.pw2 && !pwMatch && (
            <p id='pw2-err' className='mt-1 text-sm text-red-600'>
              Lösenorden matchar inte.
            </p>
          )}
        </div>

        {/* Top-level error (API/network) */}
        {err && (
          <p role='alert' aria-live='polite' className='text-sm text-red-600'>
            {err}
          </p>
        )}

        {/* Submit */}
        <button
          type='submit'
          disabled={busy || !formValid}
          aria-busy={busy ? "true" : "false"}
          className='inline-flex justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-white font-medium hover:bg-brand-accent-600 focus:outline-none focus:ring-4 focus:ring-brand-secondary/30 disabled:opacity-60'
        >
          {busy ? "Skapar konto…" : "Skapa konto"}
        </button>

        {/* Link to login */}
        <p className='text-sm text-gray-600'>
          Har du redan konto?{" "}
          <Link to='/login' className='text-brand-secondary hover:underline'>
            Logga in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
