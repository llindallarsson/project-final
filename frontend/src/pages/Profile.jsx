import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardHeader, CardContent } from "../components/ui/Card";

export default function Profile() {
  const nav = useNavigate();
  const token = useAuth((s) => s.token);
  const setToken = useAuth((s) => s.setToken);
  const logout = useAuth((s) => s.logout);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ email: "" });
  const [err, setErr] = useState("");

  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [currentPwForEmail, setCurrentPwForEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  // Delete
  const [confirmText, setConfirmText] = useState("");
  const [delMsg, setDelMsg] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const me = await api("/api/me", { token });
        setProfile(me);
        setNewEmail(me.email || "");
      } catch (e) {
        setErr(e.message || "Kunde inte hämta konto");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function handleUpdateEmail(e) {
    e.preventDefault();
    setEmailMsg("");
    setErr("");
    try {
      const res = await api("/api/me/email", {
        method: "PUT",
        token,
        body: { email: newEmail, currentPassword: currentPwForEmail },
      });
      // uppdatera lokalt och rotera token om backend skickar nytt
      setProfile((p) => ({ ...p, email: res.email }));
      if (res.token) setToken(res.token);
      setCurrentPwForEmail("");
      setEmailMsg("E-post uppdaterad.");
    } catch (e) {
      setErr(e.message || "Misslyckades att uppdatera e-post");
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPwMsg("");
    setErr("");
    if (newPw.length < 6)
      return setErr("Nytt lösenord måste vara minst 6 tecken.");
    if (newPw !== newPw2) return setErr("Lösenorden matchar inte.");
    try {
      const res = await api("/api/me/password", {
        method: "PUT",
        token,
        body: { currentPassword: currentPw, newPassword: newPw },
      });
      if (res.token) setToken(res.token);
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
      setPwMsg("Lösenord uppdaterat.");
    } catch (e) {
      setErr(e.message || "Misslyckades att uppdatera lösenord");
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    setDelMsg("");
    setErr("");
    if (confirmText !== "DELETE")
      return setErr("Skriv exakt DELETE för att bekräfta.");
    try {
      await api("/api/me", {
        method: "DELETE",
        token,
        body: { confirm: "DELETE" },
      });
      // logga ut och skicka till signup/login
      logout();
      nav("/signup");
    } catch (e) {
      setErr(e.message || "Misslyckades att radera konto");
    }
  }

  if (loading) return <p className='p-4'>Laddar…</p>;
  return (
    <div className='max-w-3xl mx-auto p-4 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1>Konto</h1>
        <Button
          variant='ghost'
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          Logga ut
        </Button>
      </div>

      {err && <p className='text-red-600'>{err}</p>}

      <Card>
        <CardHeader>
          <h3>Din profil</h3>
        </CardHeader>
        <CardContent className='space-y-2'>
          <p>
            <strong>E-post:</strong> {profile.email}
          </p>
          {profile.createdAt && (
            <p className='text-sm text-gray-600'>
              Skapad: {new Date(profile.createdAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3>Uppdatera e-post</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className='grid gap-3'>
            <Input
              id='email'
              label='Ny e-post'
              type='email'
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <Input
              id='epw'
              label='Nuvarande lösenord'
              type='password'
              value={currentPwForEmail}
              onChange={(e) => setCurrentPwForEmail(e.target.value)}
              required
            />
            <div className='flex justify-end gap-2'>
              <Button
                variant='secondary'
                type='button'
                onClick={() => {
                  setNewEmail(profile.email || "");
                  setCurrentPwForEmail("");
                }}
              >
                Avbryt
              </Button>
              <Button type='submit'>Spara e-post</Button>
            </div>
            {emailMsg && <p className='text-green-600 text-sm'>{emailMsg}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3>Byt lösenord</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className='grid gap-3'>
            <Input
              id='cpw'
              label='Nuvarande lösenord'
              type='password'
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
            <Input
              id='npw'
              label='Nytt lösenord'
              type='password'
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
            />
            <Input
              id='npw2'
              label='Bekräfta nytt lösenord'
              type='password'
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              required
            />
            <div className='flex justify-end gap-2'>
              <Button
                variant='secondary'
                type='button'
                onClick={() => {
                  setCurrentPw("");
                  setNewPw("");
                  setNewPw2("");
                }}
              >
                Avbryt
              </Button>
              <Button type='submit'>Spara lösenord</Button>
            </div>
            {pwMsg && <p className='text-green-600 text-sm'>{pwMsg}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3>Fara-zon</h3>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-sm text-gray-700'>
            Detta raderar ditt konto och all data (resor, båtar, platser,
            tracking). Detta går inte att ångra.
          </p>
          <form onSubmit={handleDelete} className='grid gap-3'>
            <Input
              id='confirm'
              label='Skriv DELETE för att bekräfta'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <div className='flex justify-end'>
              <Button variant='danger' type='submit'>
                Radera konto
              </Button>
            </div>
            {delMsg && <p className='text-green-600 text-sm'>{delMsg}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
