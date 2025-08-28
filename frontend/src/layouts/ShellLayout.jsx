import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { Waves, Ship, MapPin, User, PlusCircle, LogOut } from "lucide-react";

const noop = () => {};

/** Small, reusable menu item with active state styling */
function MenuItem({ to, label, Icon, onClick }) {
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
          <Icon
            size={18}
            className={`shrink-0 transition ${
              isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
            }`}
            aria-hidden='true'
          />
          <span className='font-medium'>{label}</span>
        </>
      )}
    </NavLink>
  );
}

/** Drawer contents reused for both desktop sidebar and mobile panel */
function DrawerContent({ onClose, onOpenLogMenu, onLogout }) {
  return (
    <div className='h-full overflow-y-auto flex flex-col gap-4 p-4 bg-gradient-to-b from-brand-primary to-brand-secondary text-white'>
      {/* Brand / close */}
      <div className='flex items-center justify-between'>
        <Link to='/' className='flex items-center gap-2' onClick={onClose}>
          <span className='text-2xl font-semibold tracking-tight'>Vindra.</span>
        </Link>
        <button
          className='md:hidden text-white/90 hover:text-white'
          aria-label='Close menu'
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Main nav */}
      <nav className='mt-1 space-y-2'>
        <MenuItem to='/' label='Resor' Icon={Waves} onClick={onClose} />
        <MenuItem to='/boats' label='Båtar' Icon={Ship} onClick={onClose} />
        <MenuItem to='/places' label='Hamnar' Icon={MapPin} onClick={onClose} />
        <MenuItem to='/profile' label='Profil' Icon={User} onClick={onClose} />
      </nav>

      <hr className='border-white/30 my-2' />

      {/* Primary actions */}
      <button
        onClick={onOpenLogMenu}
        className='w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent hover:bg-brand-accent-600 text-white font-semibold py-2.5 shadow-soft'
      >
        <PlusCircle size={18} aria-hidden='true' />
        Logga resa
      </button>

      <button
        onClick={onLogout}
        className='w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold py-2.5'
      >
        <LogOut size={18} aria-hidden='true' />
        Logga ut
      </button>

      <div className='mt-auto text-center text-xs text-white/80'>
        Developed by Linda Larsson
      </div>
    </div>
  );
}

export default function ShellLayout() {
  const [open, setOpen] = useState(false);
  const [logMenuOpen, setLogMenuOpen] = useState(false);
  const nav = useNavigate();
  const logout = useAuth((s) => s.logout);

  /** Prevent background scroll when the mobile drawer is open */
  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  /** Sign out and go to login */
  const handleLogout = () => {
    logout();
    nav("/login");
  };

  /** Navigate from modal shortcuts and close drawers */
  const goAndClose = (path) => {
    setLogMenuOpen(false);
    setOpen(false);
    nav(path);
  };

  return (
    <div className='min-h-screen bg-brand-surface-100 text-gray-900'>
      {/* Skip link for keyboard users */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[2001] rounded bg-white px-3 py-2 shadow'
      >
        Hoppa till innehåll
      </a>

      {/* Desktop fixed sidebar (full height) */}
      <aside
        className='hidden md:block fixed inset-y-0 left-0 w-72 h-screen z-30'
        aria-label='Sidomeny'
      >
        <DrawerContent
          onClose={noop}
          onOpenLogMenu={() => setLogMenuOpen(true)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile top bar */}
      <div className='md:hidden fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur border-b border-brand-border/40'>
        <div className='h-14 flex items-center justify-between px-4'>
          <button
            onClick={() => setOpen(true)}
            aria-label='Open menu'
            aria-expanded={open}
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

      {/* Mobile drawer (kept above maps with high z-index) */}
      <div
        className={`md:hidden fixed inset-0 z-[1000] transition ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity z-[1000] ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Panel */}
        <div
          className={`absolute inset-y-0 left-0 w-80 max-w-[85%] border-r border-white/20 shadow-xl
                bg-transparent z-[1010]
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
      </div>

      {/* Main content (shifted right by the fixed desktop sidebar) */}
      <main
        id='main-content'
        className='min-w-0 overflow-x-hidden pt-14 md:pt-6 md:ml-72'
      >
        {/* Container width & horizontal padding aligned with TripForm */}
        <div className='mx-auto max-w-6xl px-4 md:px-6'>
          <Outlet />
        </div>
      </main>

      {/* Mobile FAB to open quick log menu */}
      {!open && (
        <button
          type='button'
          onClick={() => setLogMenuOpen(true)}
          aria-label='Logga resa'
          className='md:hidden fixed right-4 h-14 w-14 rounded-full flex items-center justify-center 
               bg-brand-accent hover:bg-brand-accent-600 text-white shadow-lg z-[1500] focus:outline-none
               focus:ring-2 focus:ring-white/70'
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <PlusCircle size={26} aria-hidden='true' />
        </button>
      )}

      {/* Quick action dialog: choose how to log a trip */}
      {logMenuOpen && (
        <div
          className='fixed inset-0 z-[2000] grid place-items-center bg-black/40 p-4'
          role='dialog'
          aria-modal='true'
          aria-labelledby='log-dialog-title'
          onClick={() => setLogMenuOpen(false)}
        >
          <div
            className='w-full max-w-sm rounded-2xl bg-white p-5 md:p-6 shadow-soft'
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id='log-dialog-title' className='text-lg font-semibold mb-2'>
              Logga en resa
            </h3>
            <p className='text-sm text-gray-600 mb-4'>
              Välj om du vill spåra resan i realtid eller registrera den i
              efterhand.
            </p>
            <div className='grid gap-2'>
              <button
                onClick={() => goAndClose("/live")}
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
