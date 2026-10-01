import { Bath, Bed, Package, Settings, Stethoscope, type LucideIcon } from 'lucide-react';
import { ProcedureCategory } from './types';

export type ActiveTab = ProcedureCategory | 'insumos' | 'configuracoes';

export interface SectionInfo {
  id: ActiveTab;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Cor da marcação da aba ativa sobre a barra azul-marinho */
  navIndicator: string;
}

/** Cada seção tem sua cor de destaque (ver data-section em index.css). */
export const SECTIONS: SectionInfo[] = [
  { id: 'banho_tosa', label: 'Banho & Tosa', href: '/banho-tosa.html', icon: Bath, navIndicator: 'bg-sky-400' },
  { id: 'cirurgia', label: 'Cirurgias', href: '/cirurgia.html', icon: Stethoscope, navIndicator: 'bg-rose-400' },
  { id: 'internacao', label: 'Internação', href: '/internacao.html', icon: Bed, navIndicator: 'bg-amber-400' },
  { id: 'insumos', label: 'Insumos', href: '/insumos.html', icon: Package, navIndicator: 'bg-violet-400' },
  { id: 'configuracoes', label: 'Configurações', href: '/configuracoes.html', icon: Settings, navIndicator: 'bg-brand-500' },
];

export const getSection = (id: ActiveTab): SectionInfo => SECTIONS.find((s) => s.id === id) ?? SECTIONS[1];
