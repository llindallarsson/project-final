import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import AuthLayout from "./auth/AuthLayout";

/**
 * Login page
 * - Uses AuthLayout for consistent public-page shell.
 * - Trims and normalizes inputs before submit.
 * - Shows accessible error message (aria-live).
 * - Disables submit while request is in-flight.
 */
export default function Login() {
  const nav = useNavigate();
  const setToken = useAuth((s) => s.setToken);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;

    // reset error and normalize inputs
    setErr("");
    const emailNorm = email.trim().toLowerCase();
    const pwNorm = pw; // keep exact password

    // quick client-side validation
    if (!emailNorm) return setErr("Ange en giltig e-postadress.");
    if (!pwNorm) return setErr("Ange ditt lösenord.");

    setBusy(true);
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: { email: emailNorm, password: pwNorm },
      });
      if (!res?.token) throw new Error("Ogiltigt svar från servern.");
      setToken(res.token);
      nav("/");
    } catch (e2) {
      // keep message concise and user-friendly
      setErr(e2?.message || "Kunde inte logga in. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title='Logga in' subtitle='Välkommen tillbaka.'>
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
            autoFocus
            autoComplete='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='mt-1 w-full border border-brand-border rounded-lg px-3 py-2 outline-none focus:ring-4 focus:ring-brand-secondary/25 focus:border-brand-secondary'
            aria-invalid={!!err && !email ? "true" : "false"}
          />
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
            autoComplete='current-password'
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className='mt-1 w-full border border-brand-border rounded-lg px-3 py-2 outline-none focus:ring-4 focus:ring-brand-secondary/25 focus:border-brand-secondary'
            aria-invalid={!!err && !pw ? "true" : "false"}
          />
        </div>

        {/* Error */}
        {err && (
          <p role='alert' aria-live='polite' className='text-sm text-red-600'>
            {err}
          </p>
        )}

        {/* Submit */}
        <button
          type='submit'
          disabled={busy}
          className='inline-flex justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-white font-medium hover:bg-brand-primary-600 focus:outline-none focus:ring-4 focus:ring-brand-secondary/30 disabled:opacity-60'
        >
          {busy ? "Loggar in…" : "Logga in"}
        </button>

        {/* Footer link */}
        <p className='text-sm text-gray-600'>
          Har du inget konto?{" "}
          <Link to='/signup' className='text-brand-accent hover:underline'>
            Skapa konto
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
