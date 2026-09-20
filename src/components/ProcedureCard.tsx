import React from 'react';
import { 
  Clock, 
  Layers, 
  TrendingUp, 
  ArrowRight, 
  Edit3, 
  Copy, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { ClinicSettings, Insumo, Procedure } from '../types';
import { calculateProcedure, formatBRL, formatDuration, formatPercent, getCategoryBadge, getCategoryLabel } from '../utils/costCalculations';

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
  const badge = getCategoryBadge(procedure.category);

  const margin = calc.breakdown.marginAtCurrentPrice ?? 0;
  let marginColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (margin < 30) {
    marginColorClass = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (margin < 45) {
    marginColorClass = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  // Pegar os 3 insumos de maior custo
  const topInsumos = calc.itemDetails.slice(0, 3);

  return (
    <div 
      id={`card-procedure-${procedure.id}`}
      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                {getCategoryLabel(procedure.category)}
              </span>
              {procedure.targetWeightKg && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  ⚖️ {procedure.targetWeightKg} kg
                </span>
              )}
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                procedure.category === 'internacao'
                  ? 'bg-amber-100/70 text-amber-950 border-amber-300'
                  : procedure.category === 'banho_tosa'
                  ? 'bg-teal-50 text-teal-900 border-teal-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                <Clock className="w-3.5 h-3.5 opacity-70" />
                {formatDuration(procedure.durationMinutes, procedure.category)}
              </span>
              <button
                type="button"
                onClick={() => onEdit(procedure)}
                title="Clique para adicionar, remover ou alterar insumos"
                className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                {procedure.items.length} {procedure.items.length === 1 ? 'insumo' : 'insumos'} (Editar)
              </button>
            </div>
            <h3 
              className="font-bold text-slate-900 text-base leading-snug truncate cursor-pointer hover:text-teal-700 transition-colors" 
              title={procedure.name}
              onClick={() => onViewDetails(procedure)}
            >
              {procedure.name}
            </h3>
            {procedure.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                {procedure.description}
              </p>
            )}
          </div>

          {/* Custo Total Badge */}
          <div className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-900 text-xs font-black whitespace-nowrap flex flex-col items-end shadow-2xs">
            <span className="text-[10px] uppercase font-extrabold text-teal-600 tracking-wider">Custo Gerado</span>
            <span className="text-sm">{formatBRL(calc.breakdown.totalCost)}</span>
          </div>
        </div>

        {/* Financial Highlights Grid - Foco Total em CUSTO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider truncate">
              📦 Insumos
            </span>
            <span className="text-xs font-bold text-slate-800">
              {formatBRL(calc.breakdown.directCost)}
            </span>
          </div>

          {procedure.category === 'cirurgia' ? (
            <div>
              <span className="text-[10px] font-bold text-sky-600 block uppercase tracking-wider truncate">
                💉 Anestesia
              </span>
              <span className="text-xs font-bold text-sky-950">
                {formatBRL(calc.breakdown.anesthesiaCost)}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider truncate">
                ⏱️ Operacional
              </span>
              <span className="text-xs font-bold text-slate-800">
                {formatBRL(calc.breakdown.operationalCost)}
              </span>
            </div>
          )}

          <div>
            <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-wider truncate">
              👨‍⚕️ Comissão
            </span>
            <span className="text-xs font-bold text-indigo-950">
              {formatBRL(calc.breakdown.vetCommissionCost)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-teal-700 block uppercase tracking-wider truncate">
              💰 Custo Total
            </span>
            <span className="text-xs font-black text-teal-900">
              {formatBRL(calc.breakdown.totalCost)}
            </span>
          </div>
        </div>

        {/* Top 3 Insumos Breakdown preview */}
        <div className="space-y-1.5 mb-2">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Principais Gastos do Procedimento:
          </span>
          {topInsumos.length > 0 ? (
            topInsumos.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                <span className="truncate pr-2 font-medium">
                  • {item.insumoName} <span className="text-slate-400 font-normal">({item.quantity} {item.unit})</span>
                </span>
                <span className="font-semibold text-slate-800 whitespace-nowrap">
                  {formatBRL(item.totalItemCost)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Nenhum insumo vinculado a este procedimento
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5">
          <button
            id={`btn-edit-procedure-${procedure.id}`}
            onClick={() => onEdit(procedure)}
            title="Editar Insumos, Adicionar/Remover Materiais e Alterar Preço"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Editar Itens / Preço</span>
          </button>

          <button
            id={`btn-duplicate-procedure-${procedure.id}`}
            onClick={() => onDuplicate(procedure)}
            title="Duplicar Procedimento"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-delete-procedure-${procedure.id}`}
            onClick={() => onDelete(procedure.id)}
            title="Excluir Procedimento"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          id={`btn-view-details-${procedure.id}`}
          onClick={() => onViewDetails(procedure)}
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
        >
          Ficha Detalhada
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
