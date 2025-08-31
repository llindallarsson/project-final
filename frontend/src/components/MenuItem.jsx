import { NavLink } from 'react-router-dom';

export default function MenuItem({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-xl transition ${
          isActive ? 'bg-white/15 text-white' : 'text-white/90 hover:bg-white/10'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={`shrink-0 transition ${
              isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            }`}
            aria-hidden="true"
          />
          <span className="font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}
