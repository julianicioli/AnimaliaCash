import React from 'react';
import { Pencil, Printer, AlertTriangle } from 'lucide-react';
import { ClinicSettings, Insumo, Procedure } from '../types';
import { calculateProcedure, formatBRL, formatDecimal, formatDuration, getCategoryLabel, getDefaultCommissionPercent, formatUnitCost, getLaborMinutes } from '../utils/costCalculations';
import { Modal, primaryButtonClass, secondaryButtonClass } from './Modal';

interface ProcedureDetailModalProps {
  procedure: Procedure;
  insumosMap: Map<string, Insumo>;
  settings: ClinicSettings;
  onClose: () => void;
  onEdit: (procedure: Procedure) => void;
}

export const ProcedureDetailModal: React.FC<ProcedureDetailModalProps> = ({
  procedure,
  insumosMap,
  settings,
  onClose,
  onEdit,
}) => {
  const calc = calculateProcedure(procedure, insumosMap, settings);
  const { breakdown } = calc;

  const commissionLabel = procedure.vetCommissionType === 'fixed'
    ? 'valor fixo'
    : `${formatDecimal(procedure.vetCommissionValue ?? getDefaultCommissionPercent(procedure.category, settings))}% ${procedure.suggestedPrice ? 'do preço' : 'do custo'}`;

  const composition = [
    { label: 'Insumos', detail: `${calc.itemsCount} itens`, value: breakdown.directCost, color: 'bg-accent-500' },
    ...(breakdown.anesthesiaCost > 0
      ? [{ label: 'Anestesia', detail: 'terceirizada', value: breakdown.anesthesiaCost, color: 'bg-sky-500' }]
      : []),
    {
      label: 'Comissão',
      detail: [procedure.vetCommissionRole, commissionLabel].filter(Boolean).join(' · '),
      value: breakdown.vetCommissionCost,
      color: 'bg-violet-500',
    },
    {
      label: 'Operacional',
      detail: settings.includeLaborInCost
        ? `${formatDuration(getLaborMinutes(procedure))} × ${formatBRL(settings.hourlyOperationalRate)}/h`
        : 'mão de obra não incluída',
      value: breakdown.operationalCost,
      color: 'bg-slate-400',
    },
  ];

  const subtitle = [
    getCategoryLabel(procedure.category),
    procedure.targetWeightKg ? `${procedure.targetWeightKg} kg` : null,
    formatDuration(procedure.durationMinutes, procedure.category),
  ].filter(Boolean).join(' · ');

  return (
    <Modal
      id="modal-procedure-details"
      title={procedure.name}
      subtitle={subtitle}
      size="lg"
      onClose={onClose}
      headerActions={
        <button
          id="btn-print-procedure"
          type="button"
          onClick={() => window.print()}
          title="Imprimir ficha"
          aria-label="Imprimir ficha"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Printer className="w-5 h-5" />
        </button>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Fechar
          </button>
          <button id="btn-edit-procedure-from-modal" type="button" onClick={() => onEdit(procedure)} className={primaryButtonClass}>
            <Pencil className="w-4 h-4" />
            Editar
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-8">
        {procedure.description && <p className="text-sm text-slate-600 leading-relaxed">{procedure.description}</p>}

        {/* Custo total + composição */}
        <section>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500">Custo total</span>
            <span className="text-3xl font-bold text-slate-900 tabular-nums">{formatBRL(breakdown.totalCost)}</span>
          </div>

          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mt-4" aria-hidden>
            {composition.map((c) =>
              breakdown.totalCost > 0 && c.value > 0 ? (
                <div key={c.label} className={c.color} style={{ width: `${(c.value / breakdown.totalCost) * 100}%` }} />
              ) : null
            )}
          </div>

          <dl className="mt-4 divide-y divide-slate-100">
            {composition.map((c) => (
              <div key={c.label} className="flex items-center justify-between py-2.5 text-sm">
                <dt className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.color}`} />
                  <span className="font-medium text-slate-800">{c.label}</span>
                  {c.detail && <span className="text-slate-400 truncate">{c.detail}</span>}
                </dt>
                <dd className="font-semibold text-slate-900 tabular-nums">{formatBRL(c.value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Insumos */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Insumos utilizados</h3>
          {calc.itemDetails.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 font-medium text-right">Qtd.</th>
                  <th className="py-2 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calc.itemDetails.map((item, idx) => (
                  <tr key={`${item.insumoId}-${idx}`} className={item.missing ? 'text-amber-700' : ''}>
                    <td className="py-2.5 pr-3">
                      <div className={`flex items-center gap-1.5 ${item.missing ? '' : 'text-slate-800'}`}>
                        {item.missing && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                        {item.missing ? `Insumo não encontrado (${item.insumoId})` : item.insumoName}
                      </div>
                      {!item.missing && (
                        <div className="text-xs text-slate-400">{formatUnitCost(item.costPerUnit)} / {item.unit}</div>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 whitespace-nowrap tabular-nums">
                      {formatDecimal(item.quantity, 3)} {item.unit}
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-900 whitespace-nowrap tabular-nums">
                      {formatBRL(item.totalItemCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">Nenhum insumo vinculado.</p>
          )}
        </section>
      </div>
    </Modal>
  );
};
