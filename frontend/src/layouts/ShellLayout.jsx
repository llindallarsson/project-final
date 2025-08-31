import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import LogTripModal from '../components/LogTripModal';
import MobileDrawer from '../components/MobileDrawer';
import MobileHeader from '../components/MobileHeader';
import Fab from '../components/QuickLogFab';
// Components
import Sidebar from '../components/Sidebar';
import { useAuth } from '../store/auth';

export default function ShellLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logMenuOpen, setLogMenuOpen] = useState(false);

  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigateAndClose = (path) => {
    setLogMenuOpen(false);
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-brand-surface-100 text-gray-900">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[2001] rounded bg-white px-3 py-2 shadow"
      >
        Hoppa till innehåll
      </a>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:block fixed inset-y-0 left-0 w-72 h-screen z-30"
        aria-label="Sidomeny"
      >
        <Sidebar onOpenLogMenu={() => setLogMenuOpen(true)} onLogout={handleLogout} />
      </aside>

      {/* Mobile header */}
      <MobileHeader onOpenMenu={() => setDrawerOpen(true)} isMenuOpen={drawerOpen} />

      {/* Mobile drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenLogMenu={() => {
          setDrawerOpen(false);
          setLogMenuOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main id="main-content" className="min-w-0 overflow-x-hidden pt-14 md:pt-6 md:ml-72">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button */}
      <Fab onClick={() => setLogMenuOpen(true)} isVisible={!drawerOpen} />

      {/* Log Trip Modal */}
      <LogTripModal
        isOpen={logMenuOpen}
        onClose={() => setLogMenuOpen(false)}
        onNavigate={handleNavigateAndClose}
      />
    </div>
  );
}
