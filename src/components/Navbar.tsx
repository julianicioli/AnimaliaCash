import React from 'react';
import { Menu, X } from 'lucide-react';
import { ClinicSettings, ProcedureCategory } from '../types';

export type ActiveTab = ProcedureCategory | 'insumos' | 'configuracoes';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  settings: ClinicSettings;
}

const TABS: { id: ActiveTab; label: string; href: string }[] = [
  { id: 'banho_tosa', label: 'Banho & Tosa', href: '/banho-tosa.html' },
  { id: 'cirurgia', label: 'Cirurgias', href: '/cirurgia.html' },
  { id: 'internacao', label: 'Internação', href: '/internacao.html' },
  { id: 'insumos', label: 'Insumos', href: '/insumos.html' },
  { id: 'configuracoes', label: 'Configurações', href: '/configuracoes.html' },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, settings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const projectName = settings.projectName || 'Animalia Cash';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          <a href="/" className="flex items-center gap-3 min-w-0">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain border border-slate-200 p-0.5" />
            )}
            <div className="min-w-0">
              {projectName === 'Animalia Cash' ? (
                <div className="font-extrabold tracking-tight leading-none">
                  <span className="text-ink">Animalia</span> <span className="text-brand-500">Cash</span>
                </div>
              ) : (
                <div className="font-extrabold tracking-tight leading-none text-slate-900">{projectName}</div>
              )}
              <p className="text-xs text-slate-500 truncate mt-1">{settings.clinicName || 'Clínica Veterinária'}</p>
            </div>
          </a>

          {/* Desktop */}
          <nav className="hidden md:flex items-center gap-1 h-full">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  href={tab.href}
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative h-full flex items-center px-3 text-sm font-medium transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  {isActive && <span className="absolute left-3 right-3 bottom-0 h-0.5 bg-brand-500 rounded-full" />}
                </a>
              );
            })}
          </nav>

          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                id={`mobile-tab-${tab.id}`}
                href={tab.href}
                onClick={() => {
                  onSelectTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
};
