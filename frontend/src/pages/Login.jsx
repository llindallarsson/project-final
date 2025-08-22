import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import AuthLayout from "./auth/AuthLayout";

export default function Login() {
  const nav = useNavigate();
  const setToken = useAuth((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: { email, password: pw },
      });
      setToken(res.token);
      nav("/");
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title='Logga in' subtitle='Välkommen tillbaka.'>
      <form onSubmit={onSubmit} className='grid gap-4' noValidate>
        <div>
          <label htmlFor='email' className='block text-sm font-medium'>
            E-post
          </label>
          <input
            id='email'
            type='email'
            required
            autoComplete='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='mt-1 w-full border border-brand-border rounded-lg px-3 py-2 outline-none focus:ring-4 focus:ring-brand-secondary/25 focus:border-brand-secondary'
          />
        </div>

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
          />
        </div>

        {err && (
          <p role='alert' className='text-sm text-red-600'>
            {err}
          </p>
        )}

        <button
          disabled={busy}
          className='inline-flex justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-white font-medium hover:bg-brand-primary-600 focus:outline-none focus:ring-4 focus:ring-brand-secondary/30 disabled:opacity-60'
        >
          {busy ? "Loggar in…" : "Logga in"}
        </button>

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
