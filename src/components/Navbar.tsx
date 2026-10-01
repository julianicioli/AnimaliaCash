import React from 'react';
import { HeartPulse, Menu, X } from 'lucide-react';
import { ClinicSettings } from '../types';
import { ActiveTab, SECTIONS } from '../sections';

export type { ActiveTab };

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  settings: ClinicSettings;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, settings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const projectName = settings.projectName || 'Animalia Cash';

  return (
    <header className="sticky top-0 z-30 bg-ink text-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-xs">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={projectName} className="w-full h-full object-contain p-1" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center">
                  <HeartPulse className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              {projectName === 'Animalia Cash' ? (
                <div className="flex items-baseline font-black tracking-tight text-lg sm:text-xl leading-none">
                  <span className="text-white flex items-center">
                    <span className="relative inline-block">
                      A
                      <span className="absolute -top-1 -right-0.5 w-2 h-2 text-brand-500 pointer-events-none">
                        <svg viewBox="0 0 10 10" fill="currentColor" className="w-2.5 h-2.5">
                          <path d="M1,8 C1,8 2,2 8,2 C8,2 8,8 1,8 Z" />
                        </svg>
                      </span>
                    </span>
                    <span>nimalia</span>
                  </span>
                  <span className="text-brand-500 ml-1">Cash</span>
                </div>
              ) : (
                <span className="font-extrabold text-white text-lg sm:text-xl tracking-tight leading-none">{projectName}</span>
              )}
              <p className="text-xs text-white/60 font-medium truncate max-w-[180px] sm:max-w-xs mt-0.5">
                {settings.clinicName || 'Clínica Veterinária'}
              </p>
            </div>
          </a>

          {/* Desktop */}
          <nav className="hidden lg:flex items-center gap-1 h-full">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeTab === section.id;
              return (
                <a
                  key={section.id}
                  id={`nav-tab-${section.id}`}
                  href={section.href}
                  onClick={() => onSelectTab(section.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative h-full flex items-center gap-2 px-3 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                  {isActive && <span className={`absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full ${section.navIndicator}`} />}
                </a>
              );
            })}
          </nav>

          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-white/10 px-4 py-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeTab === section.id;
            return (
              <a
                key={section.id}
                id={`mobile-tab-${section.id}`}
                href={section.href}
                onClick={() => {
                  onSelectTab(section.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`w-1 h-5 rounded-full ${isActive ? section.navIndicator : 'bg-transparent'}`} />
                <Icon className="w-4 h-4" />
                {section.label}
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
};
