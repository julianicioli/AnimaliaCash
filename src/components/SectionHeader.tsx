import React from 'react';
import { ActiveTab, getSection } from '../sections';

interface SectionHeaderProps {
  section: ActiveTab;
  description: string;
  action?: React.ReactNode;
}

/** Faixa de abertura da seção, na cor de destaque dela. */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ section, description, action }) => {
  const { label, icon: Icon } = getSection(section);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-accent-50 border border-accent-100 px-6 py-6 sm:px-8">
      {/* Ícone grande e translúcido como marca d'água */}
      <Icon aria-hidden className="absolute -right-6 -bottom-8 w-40 h-40 text-accent-500 opacity-[0.07] pointer-events-none" strokeWidth={1.5} />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white text-accent-600 border border-accent-100 flex items-center justify-center shrink-0 shadow-xs">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{label}</h1>
            <p className="text-sm text-slate-600 mt-0.5">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </div>
  );
};
