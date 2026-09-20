import React from 'react';
import { 
  Scissors, 
  Stethoscope, 
  Bed, 
  Package, 
  Menu, 
  X,
  HeartPulse
} from 'lucide-react';
import { ClinicSettings, ProcedureCategory } from '../types';

export type ActiveTab = ProcedureCategory | 'insumos';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  settings: ClinicSettings;
  totalProcedures: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  settings,
  totalProcedures,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const tabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'banho_tosa', label: 'Banho & Tosa', icon: Scissors },
    { id: 'cirurgia', label: 'Cirurgias', icon: Stethoscope },
    { id: 'internacao', label: 'Internação', icon: Bed },
    { id: 'insumos', label: 'Cadastro de Itens', icon: Package },
  ];

  const pageByTab: Record<ActiveTab, string> = {
    banho_tosa: '/banho-tosa.html',
    cirurgia: '/cirurgia.html',
    internacao: '/internacao.html',
    insumos: '/insumos.html',
  };

  const projectName = settings.projectName || 'Animalia Cash';
  const tagline = settings.tagline;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project / Clinic Name */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shadow-xs">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={projectName}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center">
                  <HeartPulse className="w-6 h-6" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                {projectName === 'Animalia Cash' ? (
                  <div className="flex items-baseline font-black tracking-tight text-lg sm:text-xl leading-none">
                    <span className="text-[#0B2545] flex items-center">
                      <span className="relative inline-block">
                        A
                        <span className="absolute -top-1 -right-0.5 w-2 h-2 text-emerald-600 pointer-events-none">
                          <svg viewBox="0 0 10 10" fill="currentColor" className="w-2.5 h-2.5">
                            <path d="M1,8 C1,8 2,2 8,2 C8,2 8,8 1,8 Z" />
                          </svg>
                        </span>
                      </span>
                      <span>nimalia</span>
                    </span>
                    <span className="text-[#00A868] ml-1">Cash</span>
                  </div>
                ) : (
                  <span className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight leading-none">
                    {projectName}
                  </span>
                )}

                {tagline ? (
                  <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {tagline}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[160px] sm:max-w-xs mt-0.5">
                {settings.clinicName || 'Clínica Veterinária'}
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  href={pageByTab[tab.id]}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
                  {tab.label}
                </a>
              );
            })}
          </nav>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                id={`mobile-tab-${tab.id}`}
                href={pageByTab[tab.id]}
                onClick={() => {
                  onSelectTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                {tab.label}
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
};
