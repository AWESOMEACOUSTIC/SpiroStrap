import { NavLink } from "react-router-dom";

function NavItem({ to, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const base =
          "block rounded-md px-3 py-2 text-sm transition " +
          "hover:bg-slate-800/60";
        const active = isActive
          ? "bg-slate-800/70 text-white"
          : "text-slate-300";
        return `${base} ${active}`;
      }}
    >
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden w-54 shrink-0 border-r border-slate-800/70 bg-slate-950/60 p-4 md:block">
      <div className="mb-6">
        <div className="text-lg font-semibold tracking-tight">SpiroStrap</div>
        <div className="text-xs text-slate-400">Breathing Dashboard</div>
      </div>

      <nav className="space-y-1">
        <NavItem to="/live" label="Live" end />
        <NavItem to="/sessions" label="Sessions" />
        <NavItem to="/settings" label="Settings" end />
      </nav>

      <div className="mt-6 border-t border-slate-800/70 pt-4 text-xs text-slate-400">
        Status: <span className="text-slate-200">Simulator</span>
      </div>
    </aside>
  );
}