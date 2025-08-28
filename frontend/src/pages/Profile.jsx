import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store/auth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardHeader, CardContent } from "../components/ui/Card";

// --- Utils (display only) ---
function formatSvDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("sv-SE")} ${d
      .toLocaleTimeString("sv-SE")
      .slice(0, 5)}`;
  } catch {
    return "—";
  }
}

// Simple e-mail regex for client-side validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Profile() {
  const nav = useNavigate();
  const token = useAuth((s) => s.token);
  const setToken = useAuth((s) => s.setToken);
  const logout = useAuth((s) => s.logout);

  // Loading & error
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Profile data
  const [profile, setProfile] = useState({ email: "", createdAt: "" });

  // Update email form
  const [newEmail, setNewEmail] = useState("");
  const [currentPwForEmail, setCurrentPwForEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const emailValid = useMemo(() => EMAIL_RE.test(newEmail.trim()), [newEmail]);

  // Update password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const newPwValid = newPw.length >= 8; // enforce minimum length
  const newPwMatch = newPw === newPw2;

  // Danger zone (account deletion)
  const [confirmText, setConfirmText] = useState("");
  const [delMsg, setDelMsg] = useState("");

  // --- Load profile on mount/token change ---
  useEffect(() => {
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const me = await api("/api/me", { token });
        setProfile(me || {});
        setNewEmail(me?.email || "");
      } catch (e) {
        setErr(e.message || "Kunde inte hämta konto.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // --- Update e-mail handler ---
  async function handleUpdateEmail(e) {
    e.preventDefault();
    setEmailMsg("");
    setErr("");

    if (!emailValid) return setErr("Ange en giltig e-postadress.");
    if (!currentPwForEmail)
      return setErr("Nuvarande lösenord krävs för att byta e-post.");

    try {
      const res = await api("/api/me/email", {
        method: "PUT",
        token,
        body: { email: newEmail.trim(), currentPassword: currentPwForEmail },
      });

      // Update local state and rotate token if backend returns a new one
      setProfile((p) => ({ ...p, email: res.email || newEmail.trim() }));
      if (res?.token) setToken(res.token);
      setCurrentPwForEmail("");
      setEmailMsg("E-post uppdaterad.");
    } catch (e2) {
      setErr(e2.message || "Misslyckades att uppdatera e-post.");
    }
  }

  // --- Update password handler ---
  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPwMsg("");
    setErr("");

    if (!currentPw) return setErr("Nuvarande lösenord krävs.");
    if (!newPwValid) return setErr("Nytt lösenord måste vara minst 8 tecken.");
    if (!newPwMatch) return setErr("Lösenorden matchar inte.");

    try {
      const res = await api("/api/me/password", {
        method: "PUT",
        token,
        body: { currentPassword: currentPw, newPassword: newPw },
      });
      if (res?.token) setToken(res.token);

      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
      setPwMsg("Lösenord uppdaterat.");
    } catch (e2) {
      setErr(e2.message || "Misslyckades att uppdatera lösenord.");
    }
  }

  // --- Delete account handler ---
  async function handleDelete(e) {
    e.preventDefault();
    setDelMsg("");
    setErr("");

    if (confirmText !== "DELETE")
      return setErr('Skriv exakt "DELETE" för att bekräfta.');

    try {
      await api("/api/me", {
        method: "DELETE",
        token,
        body: { confirm: "DELETE" },
      });
      // Log out and redirect to signup after deletion
      logout();
      nav("/signup");
    } catch (e2) {
      setErr(e2.message || "Misslyckades att radera konto.");
    }
  }

  if (loading) return <p className='p-4'>Laddar…</p>;

  return (
    <div className='max-w-3xl mx-auto'>
      {/* Page header (aligned with other pages) */}
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl md:text-3xl font-bold'>Konto</h1>
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

      {/* Global error (ARIA live for screen readers) */}
      {err && (
        <p role='alert' aria-live='polite' className='mb-3 text-red-600'>
          {err}
        </p>
      )}

      {/* Profile summary */}
      <Card>
        <CardHeader>
          <h3 className='text-lg font-semibold'>Din profil</h3>
        </CardHeader>
        <CardContent className='space-y-2'>
          <p>
            <strong>E-post:</strong> {profile.email || "—"}
          </p>
          {profile.createdAt && (
            <p className='text-sm text-gray-600'>
              Skapad: {formatSvDateTime(profile.createdAt)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Update e-mail */}
      <Card className='mt-6'>
        <CardHeader>
          <h3 className='text-lg font-semibold'>Uppdatera e-post</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateEmail} className='grid gap-3' noValidate>
            <Input
              id='email'
              label='Ny e-post'
              type='email'
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              aria-invalid={newEmail && !emailValid ? "true" : "false"}
            />
            <Input
              id='epw'
              label='Nuvarande lösenord'
              type='password'
              value={currentPwForEmail}
              onChange={(e) => setCurrentPwForEmail(e.target.value)}
              autoComplete='current-password'
              required
            />

            <div className='flex justify-end gap-2'>
              <Button
                variant='secondary'
                type='button'
                onClick={() => {
                  setNewEmail(profile.email || "");
                  setCurrentPwForEmail("");
                  setEmailMsg("");
                }}
              >
                Avbryt
              </Button>
              <Button
                type='submit'
                disabled={!emailValid || !currentPwForEmail}
              >
                Spara e-post
              </Button>
            </div>

            {emailMsg && (
              <p className='text-green-600 text-sm' aria-live='polite'>
                {emailMsg}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Update password */}
      <Card className='mt-6'>
        <CardHeader>
          <h3 className='text-lg font-semibold'>Byt lösenord</h3>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleUpdatePassword}
            className='grid gap-3'
            noValidate
          >
            <Input
              id='cpw'
              label='Nuvarande lösenord'
              type='password'
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete='current-password'
              required
            />
            <Input
              id='npw'
              label='Nytt lösenord'
              type='password'
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete='new-password'
              required
            />
            <Input
              id='npw2'
              label='Bekräfta nytt lösenord'
              type='password'
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              autoComplete='new-password'
              required
            />

            {/* Inline helper for password rules */}
            <div className='text-xs text-gray-600'>
              Minst 8 tecken. Använd gärna både bokstäver och siffror.
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                variant='secondary'
                type='button'
                onClick={() => {
                  setCurrentPw("");
                  setNewPw("");
                  setNewPw2("");
                  setPwMsg("");
                }}
              >
                Avbryt
              </Button>
              <Button
                type='submit'
                disabled={!currentPw || !newPwValid || !newPwMatch}
              >
                Spara lösenord
              </Button>
            </div>

            {/* Local success message */}
            {pwMsg && (
              <p className='text-green-600 text-sm' aria-live='polite'>
                {pwMsg}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className='mt-6'>
        <CardHeader>
          <h3 className='text-lg font-semibold text-red-700'>Fara-zon</h3>
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
              <Button
                variant='danger'
                type='submit'
                disabled={confirmText !== "DELETE"}
              >
                Radera konto
              </Button>
            </div>
            {delMsg && (
              <p className='text-green-600 text-sm' aria-live='polite'>
                {delMsg}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
