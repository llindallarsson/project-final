import { Link } from 'react-router-dom';
import { Waves, Ship, MapPin, User, PlusCircle, LogOut } from 'lucide-react';
import MenuItem from './MenuItem';

export default function Sidebar({ onOpenLogMenu, onLogout, onClose = () => {} }) {
  return (
    <div className="h-full overflow-y-auto flex flex-col gap-4 p-4 bg-gradient-to-b from-brand-primary to-brand-secondary text-white">
      {/* Brand / close */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={onClose}>
          <span className="text-2xl font-semibold tracking-tight">Vindra.</span>
        </Link>
        <button
          className="md:hidden text-white/90 hover:text-white"
          aria-label="Close menu"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Main nav */}
      <nav className="mt-1 space-y-2">
        <MenuItem to="/" label="Resor" Icon={Waves} onClick={onClose} />
        <MenuItem to="/boats" label="Båtar" Icon={Ship} onClick={onClose} />
        <MenuItem to="/places" label="Hamnar" Icon={MapPin} onClick={onClose} />
        <MenuItem to="/profile" label="Profil" Icon={User} onClick={onClose} />
      </nav>

      <hr className="border-white/30 my-2" />

      {/* Primary actions */}
      <button
        onClick={onOpenLogMenu}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent hover:bg-brand-accent-600 text-white font-semibold py-2.5 shadow-soft"
      >
        <PlusCircle size={18} aria-hidden="true" />
        Logga resa
      </button>

      <button
        onClick={onLogout}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold py-2.5"
      >
        <LogOut size={18} aria-hidden="true" />
        Logga ut
      </button>

      <div className="mt-auto text-center text-xs text-white/80">Developed by Linda Larsson</div>
    </div>
  );
}
