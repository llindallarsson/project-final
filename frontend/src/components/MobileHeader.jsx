import { Link } from 'react-router-dom';

export default function MobileHeader({ onOpenMenu, isMenuOpen }) {
  return (
    <div className="md:hidden fixed inset-x-0 top-0 z-40 bg-white/80 backdrop-blur border-b border-brand-border/40">
      <div className="h-14 flex items-center justify-between px-4">
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          className="px-2 py-1"
        >
          ☰
        </button>
        <Link to="/" className="flex items-center gap-2">
          <span className="font-semibold text-brand-primary">Vindra</span>
        </Link>
        <span className="w-6" />
      </div>
    </div>
  );
}
