import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardHeader, CardContent } from "../components/ui/Card";

export default function Signup() {
  const nav = useNavigate();
  const setToken = useAuth((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api("/api/auth/signup", {
        method: "POST",
        body: { email, password },
      });
      setToken(res.token);
      nav("/");
    } catch (e) {
      setErr(e.message || "Signup failed");
    }
  }

  return (
    <div className='min-h-[60vh] grid place-items-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <h1>Skapa konto</h1>
        </CardHeader>
        <CardContent className='space-y-4'>
          {err && <p className='text-red-600 text-sm'>{err}</p>}
          <form onSubmit={onSubmit} className='space-y-3'>
            <Input
              id='email'
              label='E-post'
              type='email'
              autoComplete='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id='password'
              label='Lösenord'
              type='password'
              autoComplete='new-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className='flex justify-end gap-2'>
              <Button
                variant='secondary'
                type='button'
                onClick={() => {
                  setEmail("");
                  setPassword("");
                }}
              >
                Rensa
              </Button>
              <Button type='submit'>Skapa konto</Button>
            </div>
          </form>

          <p className='text-sm'>
            Har du redan konto? <Link to='/login'>Logga in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
