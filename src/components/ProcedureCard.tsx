import React from 'react';
import { Copy, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { ClinicSettings, Insumo, Procedure } from '../types';
import { calculateProcedure, formatBRL, formatDuration } from '../utils/costCalculations';

interface ProcedureCardProps {
  procedure: Procedure;
  insumosMap: Map<string, Insumo>;
  settings: ClinicSettings;
  onViewDetails: (procedure: Procedure) => void;
  onEdit: (procedure: Procedure) => void;
  onDuplicate: (procedure: Procedure) => void;
  onDelete: (id: string) => void;
}

export const ProcedureCard: React.FC<ProcedureCardProps> = ({
  procedure,
  insumosMap,
  settings,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const calc = calculateProcedure(procedure, insumosMap, settings);
  const hasMissingItems = calc.itemDetails.some((i) => i.missing);

  const meta = [
    procedure.targetWeightKg ? `${procedure.targetWeightKg} kg` : null,
    formatDuration(procedure.durationMinutes, procedure.category),
    `${procedure.items.length} ${procedure.items.length === 1 ? 'insumo' : 'insumos'}`,
  ].filter(Boolean);

  return (
    <div
      id={`card-procedure-${procedure.id}`}
      className="group relative bg-white rounded-xl border border-slate-200 hover:border-accent-200 hover:shadow-md hover:shadow-accent-100/60 transition-all flex flex-col"
    >
      <button
        type="button"
        onClick={() => onViewDetails(procedure)}
        className="text-left p-5 flex-1 flex flex-col cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50"
      >
        <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 pr-16">
          {procedure.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1">{meta.join(' · ')}</p>

        <div className="mt-auto pt-5 flex items-end justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">Custo total</span>
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {formatBRL(calc.breakdown.totalCost)}
            </span>
          </div>
          {hasMissingItems && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700" title="Há insumos não encontrados no catálogo">
              <AlertTriangle className="w-3.5 h-3.5" />
              Revisar insumos
            </span>
          )}
        </div>
      </button>

      {/* Ações rápidas: visíveis ao passar o mouse (sempre visíveis em telas de toque) */}
      <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
        <IconAction title="Editar" onClick={() => onEdit(procedure)} id={`btn-edit-procedure-${procedure.id}`}>
          <Pencil className="w-4 h-4" />
        </IconAction>
        <IconAction title="Duplicar" onClick={() => onDuplicate(procedure)} id={`btn-duplicate-procedure-${procedure.id}`}>
          <Copy className="w-4 h-4" />
        </IconAction>
        <IconAction title="Excluir" danger onClick={() => onDelete(procedure.id)} id={`btn-delete-procedure-${procedure.id}`}>
          <Trash2 className="w-4 h-4" />
        </IconAction>
      </div>
    </div>
  );
};

const IconAction: React.FC<{
  id?: string;
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ id, title, danger, onClick, children }) => (
  <button
    id={id}
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={`p-1.5 rounded-md text-slate-400 transition-colors cursor-pointer ${
      danger ? 'hover:text-rose-600 hover:bg-rose-50' : 'hover:text-slate-700 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);
