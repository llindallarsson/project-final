export default function LogTripModal({ isOpen, onClose, onNavigate }) {
  if (!isOpen) return null;

  const handleNavigate = (path) => {
    onNavigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[2000] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-dialog-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 md:p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="log-dialog-title" className="text-lg font-semibold mb-2">
          Logga en resa
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Välj om du vill spåra resan i realtid eller registrera den i efterhand.
        </p>
        <div className="grid gap-2">
          <button
            onClick={() => handleNavigate('/live')}
            className="w-full rounded-lg bg-brand-primary hover:bg-brand-primary-600 text-white font-medium py-2.5"
          >
            Live-tracking
          </button>
          <button
            onClick={() => handleNavigate('/trips/new')}
            className="w-full rounded-lg bg-brand-secondary hover:bg-brand-secondary-600 text-white font-medium py-2.5"
          >
            Registrera i efterhand
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-brand-border/60 bg-white py-2.5"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}
