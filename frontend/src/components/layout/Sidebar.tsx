import { NavLink } from "react-router-dom";
import { Ship, X } from "lucide-react";
import { NAV_GROUPS } from "./navConfig";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-900 text-ink-100 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
              <Ship size={20} strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Moveredei</p>
              <p className="text-[11px] text-brand-200">Gestão de Importações</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-300">
                {grupo.titulo}
              </p>
              <div className="space-y-0.5">
                {grupo.itens.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-brand-100 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <item.icon size={17} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
              TH
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-white">Thiago</p>
              <p className="truncate text-[11px] text-brand-300">Administrador</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
