import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Clock, 
  Printer, 
  Copy, 
  Check, 
  Sparkles,
  TrendingUp,
  FileText,
  Zap
} from 'lucide-react';
import { ClinicSettings, Insumo, Procedure, ProcedureItem } from '../types';
import { calculateEnergyAndOperational, formatBRL, formatDecimal, formatDuration, formatPercent, getCategoryLabel } from '../utils/costCalculations';

interface QuickSimulatorProps {
  procedures: Procedure[];
  insumos: Insumo[];
  settings: ClinicSettings;
}

export const QuickSimulator: React.FC<QuickSimulatorProps> = ({
  procedures,
  insumos,
  settings,
}) => {
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>(procedures[0]?.id || '');
  const [patientName, setPatientName] = useState<string>('');
  const [tutorName, setTutorName] = useState<string>('');
  const [animalType, setAnimalType] = useState<string>('Canino');
  const [animalWeight, setAnimalWeight] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [targetMargin, setTargetMargin] = useState<number>(55);
  const [copied, setCopied] = useState<boolean>(false);

  // Itens simulados
  const [simulatedItems, setSimulatedItems] = useState<ProcedureItem[]>([]);
  const [extraInsumoId, setExtraInsumoId] = useState<string>('');
  const [extraQuantity, setExtraQuantity] = useState<number>(1);
  const [extraNotes, setExtraNotes] = useState<string>('');

  const insumosMap = new Map<string, Insumo>();
  insumos.forEach((ins) => insumosMap.set(ins.id, ins));

  // Quando seleciona um procedimento base, carrega os itens padrão
  const handleSelectProcedure = (procId: string) => {
    setSelectedProcedureId(procId);
    const proc = procedures.find((p) => p.id === procId);
    if (proc) {
      setSimulatedItems(proc.items.map((it) => ({ ...it })));
      setDurationMinutes(proc.durationMinutes);
      setTargetMargin(proc.targetMarginPercent || 40);
    }
  };

  // Inicializa com o primeiro procedimento se vazio
  React.useEffect(() => {
    if (procedures.length > 0 && simulatedItems.length === 0) {
      handleSelectProcedure(procedures[0].id);
    }
  }, [procedures]);

  const handleAddItem = () => {
    if (!extraInsumoId) return;
    const existingIndex = simulatedItems.findIndex((i) => i.insumoId === extraInsumoId);
    if (existingIndex >= 0) {
      const updated = [...simulatedItems];
      updated[existingIndex].quantity += extraQuantity;
      if (extraNotes) updated[existingIndex].notes = extraNotes;
      setSimulatedItems(updated);
    } else {
      setSimulatedItems([
        ...simulatedItems,
        {
          insumoId: extraInsumoId,
          quantity: extraQuantity,
          notes: extraNotes,
        },
      ]);
    }
    setExtraInsumoId('');
    setExtraQuantity(1);
    setExtraNotes('');
  };

  const handleRemoveItem = (index: number) => {
    setSimulatedItems(simulatedItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQuantity = (index: number, qty: number) => {
    const updated = [...simulatedItems];
    updated[index].quantity = Math.max(0.01, qty);
    setSimulatedItems(updated);
  };

  // Cálculos
  let directCost = 0;
  simulatedItems.forEach((it) => {
    const ins = insumosMap.get(it.insumoId);
    if (ins) {
      directCost += (it.quantity || 0) * ins.costPerUnit;
    }
  });

  const currentProc = procedures.find((p) => p.id === selectedProcedureId);
  const anesthesiaCost = currentProc?.category === 'cirurgia'
    ? (currentProc.anesthesiaCost !== undefined ? currentProc.anesthesiaCost : (settings.defaultAnesthesiaCost ?? 250))
    : 0;

  const operationalCost = settings.includeLaborInCost
    ? (durationMinutes / 60) * settings.hourlyOperationalRate
    : 0;

  // Comissão do Veterinário
  let vetCommissionCost = 0;
  if (currentProc?.vetCommissionType === 'fixed') {
    vetCommissionCost = currentProc.vetCommissionValue || 0;
  } else {
    const pct = currentProc?.vetCommissionValue !== undefined
      ? currentProc.vetCommissionValue
      : (currentProc?.category === 'cirurgia'
          ? (settings.defaultVetCommissionSurgeryPercent ?? 25)
          : currentProc?.category === 'internacao'
          ? (settings.defaultVetCommissionInternmentPercent ?? 20)
          : (settings.defaultVetCommissionBathPercent ?? 15));
    if (pct > 0) {
      const baseVal = directCost + anesthesiaCost + operationalCost;
      vetCommissionCost = (baseVal * pct) / 100;
    }
  }

  const totalCost = directCost + anesthesiaCost + operationalCost + vetCommissionCost;

  const suggestedPrice = targetMargin > 0 && targetMargin < 95
    ? totalCost / (1 - targetMargin / 100)
    : totalCost * (1 + targetMargin / 100);

  const profit = suggestedPrice - totalCost;

  const energyImpact = calculateEnergyAndOperational(durationMinutes, currentProc?.category || 'cirurgia', settings);

  const handleCopyBudget = () => {
    const formattedTime = formatDuration(durationMinutes, currentProc?.category || 'cirurgia');
    const lines = [
      `🐾 ORÇAMENTO / ESTIMATIVA DE CUSTOS - ${settings.clinicName}`,
      `Paciente: ${patientName || 'Não informado'} | Espécie: ${animalType} | Peso: ${animalWeight || 'N/I'}`,
      `Procedimento: ${currentProc?.name || 'Personalizado'}`,
      `Duração Estimada: ${formattedTime}`,
      `Gasto Estimado de Energia/Luz: ~${formatDecimal(energyImpact.estimatedKwh, 1)} kWh (${formatBRL(energyImpact.energyCost)})`,
      `----------------------------------------`,
      `Insumos Utilizados:`,
      ...simulatedItems.map((it) => {
        const ins = insumosMap.get(it.insumoId);
        const sub = (it.quantity || 0) * (ins?.costPerUnit || 0);
        return `• ${ins?.name || 'Item'}: ${it.quantity} ${ins?.unit} (${formatBRL(sub)})`;
      }),
      `----------------------------------------`,
      `Custo Real de Insumos: ${formatBRL(directCost)}`,
      ...(anesthesiaCost > 0 ? [`Anestesista Terceirizado: ${formatBRL(anesthesiaCost)}`] : []),
      ...(vetCommissionCost > 0 ? [`Comissão do Veterinário: ${formatBRL(vetCommissionCost)}`] : []),
      `Custo Operacional Estimado (Sala/Luz): ${formatBRL(operationalCost)}`,
      `Custo Total da Clínica: ${formatBRL(totalCost)}`,
      `VALOR ESTIMADO AO TUTOR: ${formatBRL(suggestedPrice)}`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Simulador de Atendimento & Orçamento
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simule o custo exato de um caso clínico real ajustando a dosagem de anestésicos, fios, toalhas ou diárias extras.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-budget"
            onClick={handleCopyBudget}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            {copied ? 'Copiado!' : 'Copiar Resumo'}
          </button>
          <button
            id="btn-print-budget"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Procedure & Patient Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Procedure Base Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Carregar Procedimento Modelo:
              </label>
              <select
                id="select-simulate-procedure"
                value={selectedProcedureId}
                onChange={(e) => handleSelectProcedure(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{getCategoryLabel(p.category)}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nome do Pet
                </label>
                <input
                  type="text"
                  placeholder="Ex: Thor"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Espécie
                </label>
                <select
                  value={animalType}
                  onChange={(e) => setAnimalType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Canino">Canino</option>
                  <option value="Felino">Felino</option>
                  <option value="Silvestre">Silvestre</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12.5 kg"
                  value={animalWeight}
                  onChange={(e) => setAnimalWeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Tempo / Duração
                  </label>
                  <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    {formatDuration(durationMinutes, currentProc?.category || 'cirurgia')}
                  </span>
                </div>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Quick presets for duration */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 mr-0.5">⏱️ Ajustar tempo:</span>
              {currentProc?.category === 'internacao' ? (
                [
                  { label: '12h (1/2 Diária)', mins: 720 },
                  { label: '24h (1 Diária)', mins: 1440 },
                  { label: '48h (2 Diárias)', mins: 2880 },
                  { label: '72h (3 Diárias)', mins: 4320 },
                ].map((preset) => (
                  <button
                    key={preset.mins}
                    type="button"
                    onClick={() => setDurationMinutes(preset.mins)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                      durationMinutes === preset.mins
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))
              ) : currentProc?.category === 'banho_tosa' ? (
                [
                  { label: '30 min', mins: 30 },
                  { label: '45 min', mins: 45 },
                  { label: '60 min (1h)', mins: 60 },
                  { label: '90 min (1h30)', mins: 90 },
                  { label: '120 min (2h)', mins: 120 },
                ].map((preset) => (
                  <button
                    key={preset.mins}
                    type="button"
                    onClick={() => setDurationMinutes(preset.mins)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                      durationMinutes === preset.mins
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))
              ) : (
                [
                  { label: '30 min', mins: 30 },
                  { label: '45 min', mins: 45 },
                  { label: '60 min (1h)', mins: 60 },
                  { label: '90 min (1h30)', mins: 90 },
                  { label: '120 min (2h)', mins: 120 },
                  { label: '180 min (3h)', mins: 180 },
                ].map((preset) => (
                  <button
                    key={preset.mins}
                    type="button"
                    onClick={() => setDurationMinutes(preset.mins)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                      durationMinutes === preset.mins
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Items & Consumables in this simulation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                Insumos & Descartáveis no Atendimento ({simulatedItems.length})
              </h3>
              <span className="text-xs text-slate-500">
                Ajuste as quantidades consumidas pelo paciente
              </span>
            </div>

            {/* Quick Add Extra Insumo */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                + Adicionar Item Adicional ao Atendimento:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <select
                    id="select-sim-extra-insumo"
                    value={extraInsumoId}
                    onChange={(e) => setExtraInsumoId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="">-- Selecione um Insumo --</option>
                    {insumos.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name} ({formatBRL(ins.costPerUnit)} / {ins.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    placeholder="Qtd"
                    value={extraQuantity}
                    onChange={(e) => setExtraQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Motivo (ex: animal agitado)"
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    disabled={!extraInsumoId || extraQuantity <= 0}
                    onClick={handleAddItem}
                    className="w-full h-full py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center font-bold text-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Item Consumido</th>
                    <th className="px-2 py-2 text-center w-24">Qtd</th>
                    <th className="px-3 py-2 text-right">Custo</th>
                    <th className="px-2 py-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {simulatedItems.map((item, idx) => {
                    const ins = insumosMap.get(item.insumoId);
                    const subtotal = (item.quantity || 0) * (ins?.costPerUnit || 0);

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5">
                          <span className="font-semibold text-slate-900 block">
                            {ins?.name || 'Insumo'}
                          </span>
                          {item.notes && (
                            <span className="text-[10px] text-slate-500 block">
                              {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(idx, parseFloat(e.target.value) || 0)}
                              className="w-14 px-1 py-0.5 text-center font-bold border border-slate-300 rounded text-xs"
                            />
                            <span className="text-[11px] text-slate-400">
                              {ins?.unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold text-slate-900">
                          {formatBRL(subtotal)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Financial Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block">
                  Resultado Financeiro Real
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  Fechamento do Procedimento
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            {/* Financial Line Items */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">📦 Custo Total de Insumos:</span>
                <span className="font-bold text-white text-base">
                  {formatBRL(directCost)}
                </span>
              </div>

              {anesthesiaCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sky-400">💉 Anestesista Terceirizado:</span>
                  <span className="font-bold text-sky-200 text-base">
                    {formatBRL(anesthesiaCost)}
                  </span>
                </div>
              )}

              {vetCommissionCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-indigo-400">👨‍⚕️ Comissão Veterinário:</span>
                  <span className="font-bold text-indigo-200 text-base">
                    {formatBRL(vetCommissionCost)}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">
                    ⏱️ Rateio Operacional ({formatDuration(durationMinutes, currentProc?.category || 'cirurgia')}):
                  </span>
                  <span className="font-bold text-white text-base">
                    {formatBRL(operationalCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pl-4">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Energia & Luz estimada:
                  </span>
                  <span className="text-slate-300 font-medium">
                    ~{formatDecimal(energyImpact.estimatedKwh, 1)} kWh ({formatBRL(energyImpact.energyCost)})
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-300">💰 CUSTO TOTAL CLÍNICA:</span>
                <span className="font-extrabold text-teal-300 text-lg">
                  {formatBRL(totalCost)}
                </span>
              </div>
            </div>

            {/* Target Margin Slider */}
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Margem de Lucro Desejada:
                </span>
                <span className="text-sm font-extrabold text-teal-400">
                  {targetMargin}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="1"
                value={targetMargin}
                onChange={(e) => setTargetMargin(parseInt(e.target.value) || 0)}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>10% (Baixa)</span>
                <span>50% (Padrão)</span>
                <span>85% (Alta)</span>
              </div>
            </div>

            {/* Final Sale Price Banner */}
            <div className="p-4 bg-teal-950/80 border border-teal-500/30 rounded-xl text-center space-y-1">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                Preço Sugerido ao Tutor
              </span>
              <span className="text-3xl font-black text-white block tracking-tight">
                {formatBRL(suggestedPrice)}
              </span>
              <span className="text-xs font-semibold text-emerald-400 block pt-1">
                Lucro Bruto Líquido: {formatBRL(profit)} ({targetMargin}% margem)
              </span>
            </div>

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Baseado na mão de obra de {formatBRL(settings.hourlyOperationalRate)}/h e {simulatedItems.length} materiais descartáveis aplicados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
