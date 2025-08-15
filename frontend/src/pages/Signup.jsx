// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setToken = useAuth((s) => s.setToken);
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api("/api/auth/signup", {
        method: "POST",
        body: { email, password },
      });
      setToken(res.token);
      nav("/");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className='max-w-md mx-auto bg-white p-6 rounded shadow'>
      <h2 className='text-xl font-semibold mb-4'>Registrera</h2>
      {error && <p className='text-red-600 mb-2'>{error}</p>}
      <form onSubmit={onSubmit} className='space-y-3'>
        <input
          className='w-full border p-2 rounded'
          placeholder='E-post'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className='w-full border p-2 rounded'
          placeholder='Lösenord'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className='w-full py-2 rounded bg-blue-600 text-white'>
          Skapa konto
        </button>
      </form>
      <p className='mt-3 text-sm'>
        Har du konto?{" "}
        <Link className='underline' to='/login'>
          Logga in
        </Link>
      </p>
    </div>
  );
}
