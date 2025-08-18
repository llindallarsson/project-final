// src/App.jsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./store/auth";

export default function App() {
  const { token, logout } = useAuth();
  const nav = useNavigate();
  const doLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div className='min-h-screen grid grid-cols-[240px_1fr]'>
      <aside className='bg-white border-r p-4 space-y-4'>
        <h1 className='text-2xl font-bold'>Vindra</h1>
        {token ? (
          <>
            <nav className='flex flex-col gap-2'>
              <Link className='hover:underline' to='/'>
                Resor
              </Link>
              <Link className='hover:underline' to='/trips/new'>
                Ny resa
              </Link>
              <Link className='hover:underline' to='/boats'>
                Båtar
              </Link>
              <Link className='hover:underline' to='/places'>
                Platser
              </Link>
              <Link className='hover:underline' to='/track'>
                Live loggning
              </Link>
            </nav>
            <button
              onClick={doLogout}
              className='mt-4 px-3 py-2 rounded bg-gray-900 text-white'
            >
              Logga ut
            </button>
          </>
        ) : (
          <nav className='flex flex-col gap-2'>
            <Link className='hover:underline' to='/login'>
              Logga in
            </Link>
            <Link className='hover:underline' to='/signup'>
              Registrera
            </Link>
          </nav>
        )}
      </aside>

      <main className='p-6'>
        {/* VIKTIGT: inga <Routes> här. Bara <Outlet> */}
        <Outlet />
      </main>
    </div>
  );
}
