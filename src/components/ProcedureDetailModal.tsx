import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Printer, 
  Edit3, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle,
  CheckCircle2,
  PieChart,
  Zap
} from 'lucide-react';
import { ClinicSettings, Insumo, Procedure } from '../types';
import { calculateEnergyAndOperational, calculateProcedure, formatBRL, formatDecimal, formatDuration, formatPercent, getCategoryBadge, getCategoryLabel } from '../utils/costCalculations';

interface ProcedureDetailModalProps {
  procedure: Procedure | null;
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
  if (!procedure) return null;

  const calc = calculateProcedure(procedure, insumosMap, settings);
  const badge = getCategoryBadge(procedure.category);

  // Simulador de preço interativo rápido dentro da ficha
  const [customPrice, setCustomPrice] = useState<number>(procedure.suggestedPrice || 0);

  const simulatedProfit = customPrice - calc.breakdown.totalCost;
  const simulatedMargin = customPrice > 0 ? (simulatedProfit / customPrice) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="modal-procedure-details"
        className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                {getCategoryLabel(procedure.category)}
              </span>
              {procedure.targetWeightKg && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  ⚖️ Paciente Referência: {procedure.targetWeightKg} kg
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Tempo estimado: {formatDuration(procedure.durationMinutes, procedure.category)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {procedure.name}
            </h2>
            {procedure.description && (
              <p className="text-sm text-slate-600 mt-1">
                {procedure.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(procedure);
              }}
              title="Editar Insumos e Preço"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Editar Itens</span>
            </button>
            <button
              id="btn-print-procedure"
              onClick={handlePrint}
              title="Imprimir Ficha Técnica de Custos"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Financial KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                📦 Insumos
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 block mt-0.5">
                {formatBRL(calc.breakdown.directCost)}
              </span>
              <span className="text-[11px] text-slate-500">
                {calc.itemDetails.length} itens usados
              </span>
            </div>

            {procedure.category === 'cirurgia' ? (
              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200">
                <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider block">
                  💉 Anestesia
                </span>
                <span className="text-base sm:text-lg font-extrabold text-sky-950 block mt-0.5">
                  {formatBRL(calc.breakdown.anesthesiaCost)}
                </span>
                <span className="text-[11px] text-sky-700">
                  Preço fixo acordado
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  💉 Anestesia
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-400 block mt-0.5">
                  R$ 0,00
                </span>
                <span className="text-[11px] text-slate-400">
                  Não aplicável
                </span>
              </div>
            )}

            <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider block">
                👨‍⚕️ Comissão Vet
              </span>
              <span className="text-base sm:text-lg font-extrabold text-indigo-950 block mt-0.5">
                {formatBRL(calc.breakdown.vetCommissionCost)}
              </span>
              <span className="text-[11px] text-indigo-700">
                {procedure.vetCommissionRole || (procedure.category === 'cirurgia' ? 'Cirurgião' : 'Veterinário')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                ⏱️ Operacional
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 block mt-0.5">
                {formatBRL(calc.breakdown.operationalCost)}
              </span>
              <span className="text-[11px] text-slate-500">
                {procedure.durationMinutes} min de estrutura
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 bg-teal-600 text-white rounded-xl border border-teal-700 shadow-xs">
              <span className="text-[11px] font-bold text-teal-100 uppercase tracking-wider block">
                💰 Custo Total
              </span>
              <span className="text-base sm:text-lg font-black text-white block mt-0.5">
                {formatBRL(calc.breakdown.totalCost)}
              </span>
              <span className="text-[11px] text-teal-100">
                Custo real gerado
              </span>
            </div>
          </div>

          {/* Duração & Detalhamento de Energia Elétrica e Luz */}
          {(() => {
            const energyImpact = calculateEnergyAndOperational(procedure.durationMinutes, procedure.category, settings);

            return (
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                procedure.category === 'internacao'
                  ? 'bg-amber-50/60 border-amber-200'
                  : procedure.category === 'banho_tosa'
                  ? 'bg-teal-50/60 border-teal-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${
                    procedure.category === 'internacao'
                      ? 'bg-amber-100 text-amber-800'
                      : procedure.category === 'banho_tosa'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {procedure.category === 'internacao'
                          ? '🏥 Tempo de Internação & Despesas Hospitalares'
                          : procedure.category === 'banho_tosa'
                          ? '🧼 Tempo de Banho & Consumo de Energia/Luz'
                          : '🩺 Tempo de Centro Cirúrgico & Estrutura'}
                      </h4>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[11px] font-extrabold text-slate-800 shadow-2xs">
                        ⏱️ {formatDuration(procedure.durationMinutes, procedure.category)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {procedure.category === 'internacao'
                        ? 'Na internação, cada dia ou hora adicional eleva o custo com climatização do canil/gatil, bombas de infusão, oxigênio e acompanhamento veterinário.'
                        : procedure.category === 'banho_tosa'
                        ? 'Secadores, sopradores e máquinas de tosa têm motores de 1500W-2400W. O tempo de execução determina a conta de energia e taxa de sala.'
                        : 'Equipamentos cirúrgicos (foco de alta potência, bisturi elétrico, climatização e monitores) consomem energia constante durante todo o procedimento.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      Energia Elétrica / Luz
                    </div>
                    <div className="text-xs font-black text-slate-900">
                      ~{formatDecimal(energyImpact.estimatedKwh, 1)} kWh ({formatBRL(energyImpact.energyCost)})
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200"></div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      Rateio de Sala
                    </div>
                    <div className="text-xs font-black text-teal-800">
                      {formatBRL(energyImpact.operationalCost)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Table of Insumos / Basic Items */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-teal-600" />
                  Composição Detalhada dos Insumos Básicos ({calc.itemDetails.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Materiais descartáveis, medicamentos e consumíveis calculados
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(procedure);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                title="Adicionar novos insumos, alterar quantidades ou remover itens deste procedimento"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar Itens (Adicionar / Remover)
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Insumo / Material</th>
                      <th className="px-3 py-3 text-right">Qtd Usada</th>
                      <th className="px-3 py-3 text-right">Custo Unitário</th>
                      <th className="px-4 py-3 text-right">Custo Total</th>
                      <th className="px-4 py-3 text-right">% do Material</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {calc.itemDetails.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {item.insumoName}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-slate-500 font-normal">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                          {formatDecimal(item.quantity)} {item.unit}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500 whitespace-nowrap">
                          {formatBRL(item.costPerUnit)} / {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatBRL(item.totalItemCost)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <span className="text-xs font-semibold text-slate-700">
                              {formatPercent(item.percentageOfDirectCost)}
                            </span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-teal-500 rounded-full" 
                                style={{ width: `${Math.min(100, Math.max(0, item.percentageOfDirectCost))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-2.5 text-right text-xs uppercase tracking-wider text-slate-500">
                        Subtotal Insumos & Materiais:
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-slate-800">
                        {formatBRL(calc.breakdown.directCost)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-500">
                        -
                      </td>
                    </tr>
                    {calc.breakdown.anesthesiaCost > 0 && (
                      <tr className="bg-sky-50/50 text-sky-950">
                        <td colSpan={3} className="px-4 py-2.5 text-right text-xs uppercase tracking-wider text-sky-800">
                          💉 Anestesista Terceirizado (Preço Fixo):
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-extrabold text-sky-900">
                          {formatBRL(calc.breakdown.anesthesiaCost)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-sky-700">
                          Fixo
                        </td>
                      </tr>
                    )}
                    {calc.breakdown.vetCommissionCost > 0 && (
                      <tr className="bg-indigo-50/50 text-indigo-950">
                        <td colSpan={3} className="px-4 py-2.5 text-right text-xs uppercase tracking-wider text-indigo-800">
                          👨‍⚕️ Comissão do Veterinário ({procedure.vetCommissionRole || 'Cirurgião'}):
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-extrabold text-indigo-900">
                          {formatBRL(calc.breakdown.vetCommissionCost)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-indigo-700">
                          {procedure.vetCommissionType === 'fixed' ? 'Fixo' : `${procedure.vetCommissionValue ?? 25}%`}
                        </td>
                      </tr>
                    )}
                    {calc.breakdown.operationalCost > 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-right text-xs uppercase tracking-wider text-slate-500">
                          ⏱️ Custo Operacional Sala ({procedure.durationMinutes} min):
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm text-slate-700">
                          {formatBRL(calc.breakdown.operationalCost)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-500">
                          -
                        </td>
                      </tr>
                    )}
                    <tr className="bg-teal-50 text-teal-950 border-t-2 border-teal-600 font-black">
                      <td colSpan={3} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-teal-900">
                        💰 Custo Total da Clínica (Insumos + Anestesia + Comissão + Operacional):
                      </td>
                      <td className="px-4 py-3 text-right text-base text-teal-900">
                        {formatBRL(calc.breakdown.totalCost)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-teal-700 font-bold">
                        100% Custo
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Interactive Margin & Price Simulator */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Simulação Rápida de Precificação & Margem
              </h4>
              <span className="text-xs text-slate-500">
                Custo Total Base: {formatBRL(calc.breakdown.totalCost)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Testar Preço de Venda (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Lucro Líquido Estimado
                </span>
                <span className={`text-base font-extrabold ${simulatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatBRL(simulatedProfit)}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Margem de Lucro Resultante
                </span>
                <span className={`text-base font-extrabold ${simulatedMargin >= 40 ? 'text-emerald-700' : simulatedMargin >= 25 ? 'text-amber-700' : 'text-rose-700'}`}>
                  {formatPercent(simulatedMargin)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
              <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
              Preço sugerido pela meta de {procedure.targetMarginPercent}% de margem:{' '}
              <strong className="text-slate-700">{formatBRL(calc.breakdown.suggestedPriceByMargin || 0)}</strong>
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            id="btn-edit-procedure-from-modal"
            onClick={() => {
              onClose();
              onEdit(procedure);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-xs"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            Editar Insumos & Parâmetros
          </button>

          <button
            id="btn-close-modal-footer"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
