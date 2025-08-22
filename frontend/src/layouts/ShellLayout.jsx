import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function ShellLayout() {
  const [open, setOpen] = useState(false);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();

  const linkBase =
    "block px-3 py-2 rounded-lg hover:bg-brand-surface-200 aria-[current=page]:bg-brand-surface-200";

  return (
    <div className='min-h-screen bg-brand-surface-100 text-gray-900 flex'>
      {/* Desktop sidebar */}
      <aside className='hidden md:flex md:w-64 md:flex-col gap-4 p-4 bg-white border-r border-brand-border/40'>
        <Link to='/' className='flex items-center gap-3 px-2 mt-1'>
          <img src='/brand/logo-mark.svg' alt='' className='h-7 w-7' />
          <span className='text-xl font-semibold text-brand-primary'>
            Vindra
          </span>
        </Link>

        <nav className='mt-4 space-y-1'>
          <NavLink to='/' end className={linkBase}>
            Resor
          </NavLink>
          <NavLink to='/boats' className={linkBase}>
            Båtar
          </NavLink>
          <NavLink to='/places' className={linkBase}>
            Platser
          </NavLink>
          <NavLink to='/account' className={linkBase}>
            Konto
          </NavLink>
        </nav>

        <div className='mt-auto'>
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
            className='w-full px-3 py-2 rounded-lg border hover:bg-brand-surface-200'
          >
            Logga ut
          </button>
        </div>
      </aside>

      {/* Mobile topbar + drawer */}
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
            <img src='/brand/logo-mark.svg' alt='' className='h-6 w-6' />
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
          className={`absolute inset-y-0 left-0 w-72 bg-white border-r border-brand-border/40 p-4
                         transition-transform duration-200 ${
                           open ? "translate-x-0" : "-translate-x-full"
                         }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <img src='/brand/logo-mark.svg' alt='' className='h-6 w-6' />
              <span className='font-semibold text-brand-primary'>Vindra</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label='Stäng meny'>
              ✕
            </button>
          </div>
          <nav className='space-y-1'>
            <NavLink
              to='/'
              end
              className={linkBase}
              onClick={() => setOpen(false)}
            >
              Resor
            </NavLink>
            <NavLink
              to='/boats'
              className={linkBase}
              onClick={() => setOpen(false)}
            >
              Båtar
            </NavLink>
            <NavLink
              to='/places'
              className={linkBase}
              onClick={() => setOpen(false)}
            >
              Platser
            </NavLink>
            <NavLink
              to='/profile'
              className={linkBase}
              onClick={() => setOpen(false)}
            >
              Konto
            </NavLink>
            <NavLink
              to='/track'
              className={linkBase}
              onClick={() => setOpen(false)}
            >
              Live Logg
            </NavLink>
          </nav>
          <button
            onClick={() => {
              logout();
              setOpen(false);
              nav("/login");
            }}
            className='mt-6 w-full px-3 py-2 rounded-lg border hover:bg-brand-surface-200'
          >
            Logga ut
          </button>
        </div>
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Content */}
      <main className='flex-1 w-full md:ml-0 md:pl-0 px-4 md:px-8 pt-16 md:pt-6'>
        <Outlet />
      </main>
    </div>
  );
}
