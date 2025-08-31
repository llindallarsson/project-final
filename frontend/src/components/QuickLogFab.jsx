import { PlusCircle } from 'lucide-react';

export default function FloatingActionButton({ onClick, isVisible }) {
  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Logga resa"
      className="md:hidden fixed right-4 h-14 w-14 rounded-full flex items-center justify-center bg-brand-accent hover:bg-brand-accent-600 text-white shadow-lg z-[1500] focus:outline-none focus:ring-2 focus:ring-white/70"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <PlusCircle size={26} aria-hidden="true" />
    </button>
  );
}
