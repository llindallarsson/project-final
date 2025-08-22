import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

function MenuItem({ to, label, onClick }) {
  // NavLink stödjer render-prop som ger isActive
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-xl transition
         ${
           isActive
             ? "bg-white/15 text-white"
             : "text-white/90 hover:bg-white/10"
         }`
      }
    >
      {({ isActive }) => (
        <>
          <span className='h-5 w-5 rounded-full border border-white/70 grid place-items-center'>
            <span
              className={`h-2.5 w-2.5 rounded-full transition
                ${
                  isActive
                    ? "bg-white"
                    : "bg-transparent group-hover:bg-white/60"
                }`}
            />
          </span>
          <span className='font-medium'>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function DrawerContent({ onClose, onOpenLogMenu, onLogout }) {
  return (
    <div className='h-full flex flex-col gap-4 p-4 bg-gradient-to-b from-brand-primary to-brand-secondary text-white'>
      <div className='flex items-center justify-between'>
        <Link to='/' className='flex items-center gap-2' onClick={onClose}>
          <span className='text-2xl font-semibold tracking-tight'>Vindra.</span>
        </Link>
        <button
          className='md:hidden text-white/90 hover:text-white'
          aria-label='Stäng meny'
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <nav className='mt-1 space-y-2'>
        <MenuItem to='/' label='Resor' onClick={onClose} />
        <MenuItem to='/boats' label='Båtar' onClick={onClose} />
        <MenuItem to='/places' label='Hamnar' onClick={onClose} />
        <MenuItem to='/track' label='Serviceloggar' onClick={onClose} />
        {/* OBS: “Serviceloggar” pekar nu till /track bara som placeholder.
            När du har en riktig sida, byt till /service-logs */}
        <MenuItem to='/profile' label='Profil' onClick={onClose} />
      </nav>

      <hr className='border-white/30 my-2' />

      <button
        onClick={onOpenLogMenu}
        className='w-full rounded-xl bg-brand-accent hover:bg-brand-accent-600 text-white font-semibold py-2.5 shadow-soft'
      >
        + Logga resa
      </button>

      <button
        onClick={onLogout}
        className='w-full rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold py-2.5'
      >
        Logga ut
      </button>

      <div className='mt-auto text-center text-xs text-white/80'>
        Developed by Linda Larsson
      </div>
    </div>
  );
}

export default function ShellLayout() {
  const [open, setOpen] = useState(false); // mobil-drawer
  const [logMenuOpen, setLogMenuOpen] = useState(false); // val-dialog för "Logga resa"
  const nav = useNavigate();
  const logout = useAuth((s) => s.logout);

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const goAndClose = (path) => {
    setLogMenuOpen(false);
    setOpen(false);
    nav(path);
  };

  return (
    <div className='min-h-screen bg-brand-surface-100 text-gray-900 flex'>
      {/* Desktop sidebar */}
      <aside className='hidden md:flex md:w-72 md:flex-col'>
        <DrawerContent
          onClose={() => {}}
          onOpenLogMenu={() => setLogMenuOpen(true)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile topbar */}
      <div className='md:hidden fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur border-b border-brand-border/40'>
        <div className='h-14 flex items-center justify-between px-4'>
          <button
            onClick={() => setOpen(true)}
            aria-label='Öppna meny'
            className='px-2 py-1'
          >
            ☰
          </button>
          <Link to='/' className='flex items-center gap-2'>
            <span className='font-semibold text-brand-primary'>Vindra</span>
          </Link>
          <span className='w-6' />
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div
          className={`absolute inset-y-0 left-0 w-80 max-w-[85%] border-r border-white/20 shadow-xl
                      transition-transform duration-200
                      ${open ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <DrawerContent
            onClose={() => setOpen(false)}
            onOpenLogMenu={() => setLogMenuOpen(true)}
            onLogout={handleLogout}
          />
        </div>
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Content area */}
      <main className='flex-1 w-full px-4 md:px-8 pt-16 md:pt-6'>
        <Outlet />
      </main>

      {/* Dialog: Välj typ av loggning */}
      {logMenuOpen && (
        <div
          className='fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4'
          role='dialog'
          aria-modal='true'
          onClick={() => setLogMenuOpen(false)}
        >
          <div
            className='w-full max-w-sm rounded-2xl bg-white p-5 md:p-6 shadow-soft'
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className='text-lg font-semibold mb-2'>Logga en resa</h3>
            <p className='text-sm text-gray-600 mb-4'>
              Välj om du vill spåra resan i realtid eller registrera den i
              efterhand.
            </p>
            <div className='grid gap-2'>
              <button
                onClick={() => goAndClose("/track")}
                className='w-full rounded-lg bg-brand-primary hover:bg-brand-primary-600 text-white font-medium py-2.5'
              >
                Live-tracking
              </button>
              <button
                onClick={() => goAndClose("/trips/new")}
                className='w-full rounded-lg bg-brand-secondary hover:bg-brand-secondary-600 text-white font-medium py-2.5'
              >
                Registrera i efterhand
              </button>
              <button
                onClick={() => setLogMenuOpen(false)}
                className='w-full rounded-lg border border-brand-border/60 bg-white py-2.5'
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
