import Sidebar from './Sidebar';

export default function MobileDrawer({ isOpen, onClose, onOpenLogMenu, onLogout }) {
  if (!isOpen) return null;

  return (
    <div
      className="md:hidden fixed inset-0 z-[1000] transition"
      aria-hidden={!isOpen}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 transition-opacity z-[1000] opacity-100" />

      {/* Panel */}
      <div
        className="absolute inset-y-0 left-0 w-80 max-w-[85%] border-r border-white/20 shadow-xl bg-transparent z-[1010] transition-transform duration-200 translate-x-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Sidebar onClose={onClose} onOpenLogMenu={onOpenLogMenu} onLogout={onLogout} />
      </div>
    </div>
  );
}
