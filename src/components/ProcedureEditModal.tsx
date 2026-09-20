import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Layers, 
  Search, 
  Minus, 
  PackagePlus, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  Calculator,
  UserCheck,
  Stethoscope,
  Building2,
  Syringe,
  Percent,
  DollarSign,
  AlertCircle,
  Zap
} from 'lucide-react';
import { ClinicSettings, Insumo, Procedure, ProcedureCategory, ProcedureItem, UnitType } from '../types';
import { calculateEnergyAndOperational, formatBRL, formatDecimal, formatDuration, formatPercent } from '../utils/costCalculations';

interface ProcedureEditModalProps {
  procedure: Procedure | null; // null se for novo
  defaultCategory?: ProcedureCategory;
  insumos: Insumo[];
  settings: ClinicSettings;
  onClose: () => void;
  onSave: (savedProcedure: Procedure) => void;
  onQuickCreateInsumo?: (newInsumo: Insumo) => void;
}

export const ProcedureEditModal: React.FC<ProcedureEditModalProps> = ({
  procedure,
  defaultCategory = 'cirurgia',
  insumos,
  settings,
  onClose,
  onSave,
  onQuickCreateInsumo,
}) => {
  const isEditing = Boolean(procedure);

  const [category, setCategory] = useState<ProcedureCategory>(procedure?.category || defaultCategory);
  const [targetWeightKg, setTargetWeightKg] = useState<number | undefined>(procedure?.targetWeightKg);
  
  // Name initialization: surgery uses procedure?.name || '', while banho_tosa/internacao use automatic titles
  const getAutoName = (cat: ProcedureCategory, weight?: number) => {
    if (cat === 'banho_tosa') {
      return weight ? `Banho & Tosa (${weight} kg)` : 'Banho & Tosa';
    }
    if (cat === 'internacao') {
      return weight ? `Diária de Internação (${weight} kg)` : 'Diária de Internação';
    }
    return '';
  };

  const [name, setName] = useState(() => {
    if (procedure?.name) return procedure.name;
    return getAutoName(procedure?.category || defaultCategory, procedure?.targetWeightKg);
  });
  const [isCustomNameOpen, setIsCustomNameOpen] = useState<boolean>(
    Boolean(isEditing && procedure?.name && category !== 'cirurgia' && !procedure.name.startsWith('Banho & Tosa') && !procedure.name.startsWith('Diária de Internação') && !procedure.name.startsWith('Internação'))
  );

  const [description, setDescription] = useState(procedure?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(() => {
    if (procedure?.durationMinutes) return procedure.durationMinutes;
    if ((procedure?.category || defaultCategory) === 'internacao') return 1440; // 24h padrão para internação
    return 60;
  });
  const [targetMarginPercent, setTargetMarginPercent] = useState(procedure?.targetMarginPercent || 55);
  const [suggestedPrice, setSuggestedPrice] = useState(procedure?.suggestedPrice || 100);
  const [anesthesiaCost, setAnesthesiaCost] = useState<number>(
    procedure?.anesthesiaCost !== undefined
      ? procedure.anesthesiaCost
      : (settings.defaultAnesthesiaCost ?? 250)
  );

  // Veterinarian Commission State
  const defaultCommissionPercent = 
    category === 'cirurgia'
      ? (settings.defaultVetCommissionSurgeryPercent ?? 25)
      : category === 'internacao'
      ? (settings.defaultVetCommissionInternmentPercent ?? 20)
      : (settings.defaultVetCommissionBathPercent ?? 15);

  const [vetCommissionType, setVetCommissionType] = useState<'percent' | 'fixed'>(
    procedure?.vetCommissionType || 'percent'
  );
  const [vetCommissionValue, setVetCommissionValue] = useState<number>(
    procedure?.vetCommissionValue !== undefined
      ? procedure.vetCommissionValue
      : defaultCommissionPercent
  );
  const [vetCommissionRole, setVetCommissionRole] = useState<string>(
    procedure?.vetCommissionRole ||
      (category === 'cirurgia'
        ? 'Cirurgião Veterinário'
        : category === 'internacao'
        ? 'Veterinário Internista / Plantonista'
        : 'Profissional Responsável')
  );

  const [items, setItems] = useState<ProcedureItem[]>(procedure?.items || []);
  
  // Insumo selector & filters
  const [selectedInsumoId, setSelectedInsumoId] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newNotes, setNewNotes] = useState<string>('');
  const [insumoFilterCategory, setInsumoFilterCategory] = useState<string>('todos');
  const [insumoSearchTerm, setInsumoSearchTerm] = useState<string>('');
  
  // Quick Create New Insumo State
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState<boolean>(false);
  const [quickName, setQuickName] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<ProcedureCategory | 'geral'>('cirurgia');
  const [quickCost, setQuickCost] = useState<number>(10);
  const [quickUnit, setQuickUnit] = useState<UnitType>('un');
  const [quickError, setQuickError] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');

  const insumosMap = new Map<string, Insumo>();
  insumos.forEach((ins) => insumosMap.set(ins.id, ins));

  // Helper de filtragem avançada por categorias e palavras-chave
  const filteredInsumos = insumos.filter((ins) => {
    const nameLower = ins.name.toLowerCase();
    const notesLower = (ins.notes || '').toLowerCase();
    const unitLower = ins.unit.toLowerCase();

    // Filtro por subcategoria temática
    if (insumoFilterCategory !== 'todos') {
      if (insumoFilterCategory === 'cirurgia') {
        if (ins.category !== 'cirurgia') return false;
      } else if (insumoFilterCategory === 'medicamento') {
        const isMed = (ins.category as string) === 'medicamento' || 
          nameLower.includes('mg') || 
          nameLower.includes('ml') || 
          nameLower.includes('amp') || 
          nameLower.includes('compr') ||
          nameLower.includes('frasco') ||
          nameLower.includes('propofol') ||
          nameLower.includes('meloxicam') ||
          nameLower.includes('tramadol') ||
          nameLower.includes('isoflurano');
        if (!isMed) return false;
      } else if (insumoFilterCategory === 'fios') {
        const isFio = nameLower.includes('fio') || 
          nameLower.includes('nylon') || 
          nameLower.includes('vicryl') || 
          nameLower.includes('sutura') || 
          nameLower.includes('pga') || 
          nameLower.includes('catgut') ||
          nameLower.includes('agulhado');
        if (!isFio) return false;
      } else if (insumoFilterCategory === 'descartaveis') {
        const isDesc = nameLower.includes('luva') || 
          nameLower.includes('bisturi') || 
          nameLower.includes('gaze') || 
          nameLower.includes('campo') || 
          nameLower.includes('seringa') || 
          nameLower.includes('agulha') || 
          nameLower.includes('avental') || 
          nameLower.includes('cateter') || 
          nameLower.includes('equipo') || 
          nameLower.includes('curativo') || 
          nameLower.includes('propé') || 
          nameLower.includes('máscara');
        if (!isDesc) return false;
      } else if (insumoFilterCategory === 'fluidos') {
        const isFluido = nameLower.includes('soro') || 
          nameLower.includes('ringer') || 
          nameLower.includes('fisiol') || 
          nameLower.includes('glicos') || 
          nameLower.includes('cloreto') || 
          nameLower.includes('solução');
        if (!isFluido) return false;
      } else if (insumoFilterCategory === 'internacao') {
        const isIntern = ins.category === 'internacao' || 
          nameLower.includes('tapete') || 
          nameLower.includes('sonda') || 
          nameLower.includes('cânula') || 
          nameLower.includes('fralda') || 
          nameLower.includes('ração') || 
          nameLower.includes('diária');
        if (!isIntern) return false;
      } else if (insumoFilterCategory === 'banho_tosa') {
        if (ins.category !== 'banho_tosa') return false;
      }
    }

    // Filtro por termo de busca digitado
    if (insumoSearchTerm.trim()) {
      const q = insumoSearchTerm.toLowerCase();
      const matches = nameLower.includes(q) || notesLower.includes(q) || unitLower.includes(q);
      if (!matches) return false;
    }

    return true;
  });

  const selectedInsumo = selectedInsumoId ? insumosMap.get(selectedInsumoId) : null;

  // Custos em tempo real
  let directCost = 0;
  items.forEach((it) => {
    const ins = insumosMap.get(it.insumoId);
    if (ins) {
      directCost += (it.quantity || 0) * ins.costPerUnit;
    }
  });

  const insumosCost = directCost;
  const currentAnesthesiaCost = category === 'cirurgia' ? (Number(anesthesiaCost) || 0) : 0;

  const operationalCost = settings.includeLaborInCost
    ? (durationMinutes / 60) * settings.hourlyOperationalRate
    : 0;

  // Cálculo da comissão veterinária
  let calculatedVetCommission = 0;
  if (vetCommissionType === 'fixed') {
    calculatedVetCommission = Number(vetCommissionValue) || 0;
  } else {
    const pct = Number(vetCommissionValue) || 0;
    const baseVal = suggestedPrice > 0 
      ? suggestedPrice 
      : (insumosCost + currentAnesthesiaCost + operationalCost);
    calculatedVetCommission = (baseVal * pct) / 100;
  }

  // Custo Total da Clínica: Insumos + Anestesia + Comissão Veterinária + Operacional da Clínica
  const totalCost = insumosCost + currentAnesthesiaCost + operationalCost + calculatedVetCommission;

  // Preço e margem
  const calculatedSuggestedPrice = targetMarginPercent > 0 && targetMarginPercent < 95
    ? totalCost / (1 - targetMarginPercent / 100)
    : totalCost * (1 + targetMarginPercent / 100);

  const currentProfit = suggestedPrice - totalCost;
  const currentMargin = suggestedPrice > 0 ? (currentProfit / suggestedPrice) * 100 : 0;

  const handleAddItem = (insId?: string, qtyToAdd?: number) => {
    const targetId = insId || selectedInsumoId;
    const qty = qtyToAdd !== undefined ? qtyToAdd : newQuantity;
    if (!targetId || qty <= 0) return;

    const existingIndex = items.findIndex((i) => i.insumoId === targetId);
    if (existingIndex >= 0) {
      // Atualiza quantidade
      const updated = [...items];
      updated[existingIndex].quantity = Math.round((updated[existingIndex].quantity + qty) * 1000) / 1000;
      if (newNotes && !insId) updated[existingIndex].notes = newNotes;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          insumoId: targetId,
          quantity: qty,
          notes: insId ? '' : newNotes,
        },
      ]);
    }

    // Reset inputs se veio do formulário principal
    if (!insId) {
      setSelectedInsumoId('');
      setNewQuantity(1);
      setNewNotes('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleClearAllItems = () => {
    if (items.length === 0) return;
    if (confirm('Deseja remover todos os insumos vinculados a este procedimento?')) {
      setItems([]);
    }
  };

  const handleUpdateItemQuantity = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(0.001, Math.round(qty * 1000) / 1000);
    setItems(updated);
  };

  const handleStepQuantity = (index: number, delta: number) => {
    const updated = [...items];
    const curr = updated[index].quantity || 0;
    const step = curr <= 1 && delta < 0 ? (curr <= 0.2 ? 0.05 : 0.1) : 1;
    const nextVal = Math.max(0.01, Math.round((curr + delta * step) * 1000) / 1000);
    updated[index].quantity = nextVal;
    setItems(updated);
  };

  const handleUpdateItemNotes = (index: number, notes: string) => {
    const updated = [...items];
    updated[index].notes = notes;
    setItems(updated);
  };

  const handleCreateNewInsumo = () => {
    if (!quickName.trim()) {
      setQuickError('Informe o nome do insumo.');
      return;
    }

    const newInsumo: Insumo = {
      id: `ins_custom_${Date.now()}`,
      name: quickName.trim(),
      category: quickCategory,
      unit: quickUnit,
      costPerUnit: Math.max(0.01, quickCost),
      packageSize: 1,
      packagePrice: Math.max(0.01, quickCost),
    };

    if (onQuickCreateInsumo) {
      onQuickCreateInsumo(newInsumo);
    }
    insumosMap.set(newInsumo.id, newInsumo);

    // Auto add to items
    setItems((prev) => [
      ...prev,
      {
        insumoId: newInsumo.id,
        quantity: 1,
        notes: '',
      },
    ]);

    // Reset form
    setQuickName('');
    setQuickCost(10);
    setQuickUnit('un');
    setIsQuickCreateOpen(false);
    setQuickError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let finalName = name.trim();
    if (category === 'cirurgia') {
      if (!finalName) {
        setErrorMsg('Por favor, informe o nome da cirurgia.');
        return;
      }
    } else {
      if (!finalName || !isCustomNameOpen) {
        finalName = getAutoName(category, targetWeightKg);
      }
    }

    const savedProc: Procedure = {
      id: procedure?.id || `proc_${Date.now()}`,
      name: finalName,
      category,
      description: description.trim(),
      targetWeightKg: targetWeightKg ? Math.max(0, targetWeightKg) : undefined,
      durationMinutes: Math.max(1, durationMinutes),
      anesthesiaCost: category === 'cirurgia' ? Math.max(0, Number(anesthesiaCost) || 0) : undefined,
      vetCommissionType,
      vetCommissionValue: Math.max(0, Number(vetCommissionValue) || 0),
      vetCommissionRole: vetCommissionRole.trim() || undefined,
      targetMarginPercent: Math.max(0, targetMarginPercent),
      suggestedPrice: Math.max(0, suggestedPrice || totalCost),
      items,
    };

    onSave(savedProc);
  };

  const handleWeightChange = (newWeight?: number) => {
    setTargetWeightKg(newWeight);
    if (category !== 'cirurgia' && !isCustomNameOpen) {
      setName(getAutoName(category, newWeight));
    }
  };

  const commonSurgeries = [
    'Castração Fêmea',
    'Castração Macho',
    'Tartarectomia (Limpeza de Tártaro)',
    'Cesariana de Emergência',
    'Piometra',
    'Osteossíntese de Fêmur',
    'Enucleação Ocular',
    'Mastectomia Total / Parcial',
    'Laparotomia Exploratória',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="modal-procedure-edit"
        className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700">
                {category === 'cirurgia' ? '🩺' : category === 'banho_tosa' ? '🧼' : '🏥'}
              </span>
              {isEditing
                ? category === 'cirurgia'
                  ? 'Editar Cirurgia Veterinária'
                  : category === 'banho_tosa'
                  ? 'Editar Custo de Banho & Tosa'
                  : 'Editar Diária de Internação'
                : category === 'cirurgia'
                ? 'Nova Cirurgia Veterinária'
                : category === 'banho_tosa'
                ? 'Novo Custo de Banho & Tosa'
                : 'Nova Diária de Internação'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {category === 'cirurgia'
                ? 'Defina o nome da cirurgia, insumos, anestesia terceirizada e comissão do cirurgião.'
                : category === 'banho_tosa'
                ? 'Defina o peso do animal, shampoos, toalha higienizada e energia dos secadores.'
                : 'Defina o peso do animal, fluidoterapia com Ringer, tapetes higiênicos, cateteres e diária.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dados Principais do Procedimento */}
          {category === 'cirurgia' ? (
            <div className="space-y-3 p-4 bg-rose-50/40 border border-rose-200/80 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-extrabold text-rose-950 uppercase tracking-wider">
                  🩺 Nome da Cirurgia *
                </label>
                <span className="text-[11px] text-rose-800 font-medium">
                  Nas cirurgias, escolha ou digite o tipo exato do procedimento
                </span>
              </div>
              <input
                id="input-procedure-name"
                type="text"
                required
                placeholder="Ex: Castração de Cadela Porte Médio, Tartarectomia, Piometra..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-rose-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
              />

              {/* Cirurgias mais comuns (atalho rápido com 1 clique) */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-rose-900 font-bold mr-1">Sugestões rápidas:</span>
                {commonSurgeries.map((surg) => (
                  <button
                    key={surg}
                    type="button"
                    onClick={() => {
                      setName(surg);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                      name === surg
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-rose-900 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {surg}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              category === 'banho_tosa' 
                ? 'bg-teal-50/70 border-teal-200 text-teal-950' 
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">
                  {category === 'banho_tosa' ? '🧼' : '🏥'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold">
                      {category === 'banho_tosa' ? 'Procedimento: Banho & Tosa' : 'Procedimento: Diária de Internação Hospitalar'}
                    </h3>
                    {targetWeightKg && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        category === 'banho_tosa' ? 'bg-teal-200 text-teal-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {targetWeightKg} kg
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-80 mt-0.5 leading-relaxed">
                    {category === 'banho_tosa'
                      ? 'No Banho & Tosa o procedimento já é o próprio serviço. Não é necessário escolher nome: basta calibrar o peso do animal e os insumos (shampoo, toalha, secador).'
                      : 'Na Internação o procedimento já é a própria diária hospitalar. Não é necessário escolher nome: basta calibrar o peso do animal e os insumos (soros, leito, descartáveis).'}
                  </p>
                  
                  {isCustomNameOpen && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                        Título Personalizado (Opcional)
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={getAutoName(category, targetWeightKg)}
                        className="w-full sm:w-80 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isCustomNameOpen) {
                    setIsCustomNameOpen(true);
                  } else {
                    setIsCustomNameOpen(false);
                    setName(getAutoName(category, targetWeightKg));
                  }
                }}
                className="text-xs font-bold underline hover:opacity-80 shrink-0 self-start sm:self-center cursor-pointer"
              >
                {isCustomNameOpen ? 'Usar nome automático' : 'Personalizar nome (opcional)'}
              </button>
            </div>
          )}

          {/* Peso de Referência do Paciente */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                  ⚖️ Peso do Animal (kg) - Calibração dos Insumos
                </label>
                <span className="text-[11px] text-amber-800">
                  O peso do animal determina o volume de fios, dosagens anestésicas e descartáveis:
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-medium mr-1">Pesos comuns:</span>
                {[4, 8, 12, 18, 25, 35, 45].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleWeightChange(w)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-colors cursor-pointer ${
                      targetWeightKg === w
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-100 hover:border-amber-300'
                    }`}
                  >
                    {w} kg
                  </button>
                ))}
                <div className="w-24 ml-1">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="Outro kg"
                    value={targetWeightKg ?? ''}
                    onChange={(e) => handleWeightChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Campo de Anestesia Terceirizada (Lançado automaticamente para cirurgias) */}
          {category === 'cirurgia' && (
            <div className="p-4 bg-sky-50/90 border border-sky-200 rounded-xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">💉</span>
                    <label className="text-xs font-extrabold text-sky-950 uppercase tracking-wider">
                      Anestesia Terceirizada (Preço Fixo Automático)
                    </label>
                    <span className="px-2 py-0.5 bg-sky-200/80 text-sky-900 rounded-full text-[10px] font-extrabold">
                      Lançado no Custo
                    </span>
                  </div>
                  <p className="text-xs text-sky-800 mt-0.5">
                    Como o anestesista é terceirizado com preço fixo acordado, este valor já vem adicionado automaticamente no custo da cirurgia:
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {[180, 200, 220, 250, 280, 320, 380].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAnesthesiaCost(val)}
                        className={`px-2 py-1 text-xs font-bold rounded-md border transition-colors cursor-pointer ${
                          anesthesiaCost === val
                            ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-100 hover:border-sky-300'
                        }`}
                      >
                        R$ {val}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-32 shrink-0">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      id="input-anesthesia-cost"
                      type="number"
                      min="0"
                      step="10"
                      value={anesthesiaCost}
                      onChange={(e) => setAnesthesiaCost(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-2.5 py-1.5 text-sm font-extrabold text-sky-950 bg-white border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION: COMISSÃO DO VETERINÁRIO (CIRURGIA / INTERNAÇÃO / GERAL) */}
          {/* ============================================================== */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-700" />
                <label className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                  Comissão do Veterinário / Profissional Responsável
                </label>
                <span className="px-2 py-0.5 bg-indigo-200/80 text-indigo-900 rounded-full text-[10px] font-extrabold">
                  Entra no Custo Total
                </span>
              </div>
              <div className="text-xs font-bold text-indigo-900 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                Custo da Comissão: <span className="text-indigo-700 font-black">{formatBRL(calculatedVetCommission)}</span>
              </div>
            </div>

            <p className="text-xs text-indigo-800">
              Cada veterinário recebe comissão por cirurgia realizada ou acompanhamento da internação. Esse valor é somado ao custo total da clínica.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              {/* Função / Papel */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Profissional / Papel
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cirurgião Veterinário"
                  value={vetCommissionRole}
                  onChange={(e) => setVetCommissionRole(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Tipo de comissão (% ou R$ fixo) */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Formato de Repasse
                </label>
                <div className="flex bg-white rounded-lg p-0.5 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setVetCommissionType('percent')}
                    className={`flex-1 py-1 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      vetCommissionType === 'percent'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Percent className="w-3 h-3" />
                    % Perc.
                  </button>
                  <button
                    type="button"
                    onClick={() => setVetCommissionType('fixed')}
                    className={`flex-1 py-1 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      vetCommissionType === 'fixed'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" />
                    R$ Fixo
                  </button>
                </div>
              </div>

              {/* Valor / % */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {vetCommissionType === 'percent' ? 'Comissão (%)' : 'Valor Fixo da Comissão (R$)'}
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                      {vetCommissionType === 'percent' ? '%' : 'R$'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step={vetCommissionType === 'percent' ? '1' : '10'}
                      max={vetCommissionType === 'percent' ? 100 : undefined}
                      value={vetCommissionValue}
                      onChange={(e) => setVetCommissionValue(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs font-black text-indigo-950 bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Quick percentage buttons */}
                  {vetCommissionType === 'percent' && (
                    <div className="flex items-center gap-1">
                      {[15, 20, 25, 30, 35].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setVetCommissionValue(pct)}
                          className={`px-1.5 py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                            vetCommissionValue === pct
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-indigo-50'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION: DURAÇÃO DO PROCEDIMENTO & IMPACTO ENERGÉTICO / LUZ / CUSTO */}
          {/* ============================================================== */}
          {(() => {
            const energyImpact = calculateEnergyAndOperational(durationMinutes, category, settings);
            const internmentDays = Math.round((durationMinutes / 1440) * 10) / 10;
            const internmentHours = Math.round((durationMinutes / 60) * 10) / 10;

            return (
              <div className={`p-4 rounded-2xl border space-y-3 ${
                category === 'internacao'
                  ? 'bg-amber-50/70 border-amber-300/80 text-amber-950'
                  : category === 'banho_tosa'
                  ? 'bg-teal-50/70 border-teal-300/80 text-teal-950'
                  : 'bg-rose-50/60 border-rose-300/80 text-rose-950'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${
                      category === 'internacao' ? 'text-amber-700' : category === 'banho_tosa' ? 'text-teal-700' : 'text-rose-700'
                    }`} />
                    <label className="text-xs font-extrabold uppercase tracking-wider">
                      {category === 'internacao'
                        ? '🏥 Tempo de Internação Hospitalar (Diárias / Horas)'
                        : category === 'banho_tosa'
                        ? '🧼 Tempo de Banho, Secagem & Tosa (Consumo de Energia & Luz)'
                        : '🩺 Tempo de Centro Cirúrgico & Sala de Cirurgia'}
                    </label>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    ⏱️ Duração: <span className="text-teal-700">{formatDuration(durationMinutes, category)}</span>
                  </span>
                </div>

                <p className="text-xs opacity-85 leading-relaxed">
                  {category === 'internacao'
                    ? 'Na internação, quanto maior o tempo de permanência, maior o custo hospitalar acumulado (monitoramento da equipe, bombas de infusão contínuas, climatização/luz do leito e fluidoterapia).'
                    : category === 'banho_tosa'
                    ? 'Secadores e sopradores possuem alta potência (1.500W a 2.400W cada). O tempo de secagem e iluminação define diretamente a conta de energia elétrica (kWh) e mão de obra.'
                    : 'O tempo de cirurgia demanda iluminação cirúrgica de alta intensidade, bisturi elétrico, concentrador de oxigênio, monitor multiparâmetro e climatização estéril ininterrupta.'}
                </p>

                {/* Atalhos Rápidos de Duração conforme a Categoria */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold opacity-75 mr-1">Atalhos rápidos:</span>
                    {category === 'internacao' ? (
                      [
                        { label: '12h (1/2 Diária)', mins: 720 },
                        { label: '24h (1 Diária)', mins: 1440 },
                        { label: '48h (2 Diárias)', mins: 2880 },
                        { label: '72h (3 Diárias)', mins: 4320 },
                        { label: '96h (4 Diárias)', mins: 5760 },
                        { label: '168h (7 Diárias / 1 Sem)', mins: 10080 },
                      ].map((preset) => (
                        <button
                          key={preset.mins}
                          type="button"
                          onClick={() => setDurationMinutes(preset.mins)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                            durationMinutes === preset.mins
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-amber-950 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))
                    ) : category === 'banho_tosa' ? (
                      [
                        { label: '30 min (Pequeno/Rápido)', mins: 30 },
                        { label: '45 min (Porte Médio)', mins: 45 },
                        { label: '60 min (1h - Padrão)', mins: 60 },
                        { label: '75 min (1h15 - Pelagem Média)', mins: 75 },
                        { label: '90 min (1h30 - Porte Grande/Tosa)', mins: 90 },
                        { label: '120 min (2h - Tosa Tesoura/Gigante)', mins: 120 },
                      ].map((preset) => (
                        <button
                          key={preset.mins}
                          type="button"
                          onClick={() => setDurationMinutes(preset.mins)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                            durationMinutes === preset.mins
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white text-teal-950 border-teal-200 hover:bg-teal-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))
                    ) : (
                      [
                        { label: '30 min (Rápida / Tartarectomia)', mins: 30 },
                        { label: '45 min (Curta)', mins: 45 },
                        { label: '60 min (1h - Castração)', mins: 60 },
                        { label: '90 min (1h30 - Média)', mins: 90 },
                        { label: '120 min (2h - Ortopedia/Mastectomia)', mins: 120 },
                        { label: '180 min (3h - Alta Complexidade)', mins: 180 },
                      ].map((preset) => (
                        <button
                          key={preset.mins}
                          type="button"
                          onClick={() => setDurationMinutes(preset.mins)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                            durationMinutes === preset.mins
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-rose-950 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Inputs manuais: Minutos, Horas ou Diárias */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 bg-white/70 p-3 rounded-xl border border-slate-200/80">
                    {category === 'internacao' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          🗓️ Diárias Hospitalares (Dias):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={internmentDays}
                            onChange={(e) => {
                              const days = parseFloat(e.target.value) || 0;
                              setDurationMinutes(Math.round(days * 1440));
                            }}
                            className="w-full px-3 py-1.5 text-xs font-black text-amber-950 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-bold">
                            diárias
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        ⏱️ Horas Totais:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={internmentHours}
                          onChange={(e) => {
                            const hrs = parseFloat(e.target.value) || 0;
                            setDurationMinutes(Math.round(hrs * 60));
                          }}
                          className="w-full px-3 py-1.5 text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-bold">
                          horas
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        ⏱️ Minutos Totais:
                      </label>
                      <div className="relative">
                        <input
                          id="input-procedure-duration"
                          type="number"
                          min="1"
                          step="5"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-bold">
                          min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Impact Card: Gasto de Energia, Luz e Operacional da Duração */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                          Gasto Estimado de Energia / Luz
                        </div>
                        <div className="text-xs font-black text-slate-900">
                          ~{formatDecimal(energyImpact.estimatedKwh, 1)} kWh ({formatBRL(energyImpact.energyCost)})
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {energyImpact.equipmentDescription}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
                      <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                          Rateio Operacional da Estrutura
                        </div>
                        <div className="text-xs font-black text-teal-800">
                          {formatBRL(energyImpact.operationalCost)}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          ({formatDecimal(energyImpact.hours, 1)}h × {formatBRL(settings.hourlyOperationalRate)}/h taxa da clínica)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Descrição e Protocolo Clínico */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição & Protocolo Clínico (Opcional)
            </label>
            <input
              id="input-procedure-desc"
              type="text"
              placeholder="Ex: Anestesia inalatória inclusa, antibioticoterapia e monitorização contínua"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* ============================================================== */}
          {/* SECTION: ITENS E INSUMOS COM FILTRO E BUSCA PODEROSA */}
          {/* ============================================================== */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Itens & Insumos Utilizados no Procedimento ({items.length})
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pesquise e filtre insumos abaixo para adicioná-los ao custo do procedimento.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllItems}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  >
                    Limpar Todos
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-teal-600" />
                  <span>Cadastrar Novo Insumo</span>
                </button>
              </div>
            </div>

            {/* Modal / Card para Cadastrar Novo Insumo Rápido */}
            {isQuickCreateOpen && (
              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Novo Insumo Rápido
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQuickCreateOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {quickError && (
                  <p className="text-xs text-rose-600 font-semibold">{quickError}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nome do insumo (ex: Fio de Aço Ortopédico)"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Custo Unitário (R$)"
                      value={quickCost}
                      onChange={(e) => setQuickCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <select
                      value={quickUnit}
                      onChange={(e) => setQuickUnit(e.target.value as UnitType)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    >
                      <option value="un">un (Unidade)</option>
                      <option value="ml">ml (Mililitro)</option>
                      <option value="par">par (Par)</option>
                      <option value="dose">dose (Dose)</option>
                      <option value="comp">comp (Comprimido)</option>
                      <option value="g">g (Grama)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickCreateOpen(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewInsumo}
                    className="px-4 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
                  >
                    Salvar e Incluir Neste Procedimento
                  </button>
                </div>
              </div>
            )}

            {/* Quick Add Bar with Enhanced Filter & Search */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  Pesquisar & Adicionar Insumos ao Custo:
                </span>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Filtrar:</span>
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'cirurgia', label: '🩺 Cirurgia' },
                    { id: 'medicamento', label: '💊 Medicamentos' },
                    { id: 'fios', label: '🧵 Fios & Suturas' },
                    { id: 'descartaveis', label: '🧤 Descartáveis' },
                    { id: 'fluidos', label: '🩸 Soros / Fluidos' },
                    { id: 'internacao', label: '🏥 Internação' },
                    { id: 'banho_tosa', label: '🧼 Banho' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setInsumoFilterCategory(f.id)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        insumoFilterCategory === f.id
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search + Select + Quantity + Notes + Add button */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Search Term Input with Instant Clear */}
                <div className="sm:col-span-4">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, fio, dosagem..."
                      value={insumoSearchTerm}
                      onChange={(e) => setInsumoSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {insumoSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setInsumoSearchTerm('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown Select */}
                <div className="sm:col-span-4">
                  <select
                    id="select-add-insumo"
                    value={selectedInsumoId}
                    onChange={(e) => setSelectedInsumoId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Selecione ({filteredInsumos.length} insumos encontrados) --</option>
                    {filteredInsumos.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name} • {formatBRL(ins.costPerUnit)} / {ins.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input */}
                <div className="sm:col-span-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Qtd"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-semibold truncate max-w-7">
                      {selectedInsumo?.unit || 'un'}
                    </span>
                  </div>
                </div>

                {/* Add Action Button */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    id="btn-add-item-to-list"
                    disabled={!selectedInsumoId || newQuantity <= 0}
                    onClick={() => handleAddItem()}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Adicionar ao custo deste procedimento"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Optional Notes for the item */}
              {selectedInsumoId && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Observação da dosagem/uso (opcional):</span>
                  <input
                    type="text"
                    placeholder="Ex: Dose 0,2ml/kg, par estéril da instrumentação, etc."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-700"
                  />
                </div>
              )}

              {/* Quick Instant Filter Badges / Search Results Preview */}
              {insumoSearchTerm.trim() && filteredInsumos.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1.5">
                    Sugestões Rápidas de Insumos (Clique para adicionar direto):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto pr-1">
                    {filteredInsumos.slice(0, 8).map((ins) => (
                      <button
                        key={ins.id}
                        type="button"
                        onClick={() => handleAddItem(ins.id, 1)}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-xs font-medium text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs group"
                      >
                        <Plus className="w-3 h-3 text-teal-600 group-hover:scale-125 transition-transform" />
                        <span>{ins.name}</span>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-100/60 px-1.5 py-0.2 rounded">
                          {formatBRL(ins.costPerUnit)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* List of Items currently added to Procedure */}
            {items.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Insumo / Material</th>
                        <th className="px-3 py-2.5 text-center w-28">Quantidade</th>
                        <th className="px-3 py-2.5 text-right w-24">Custo Unit.</th>
                        <th className="px-3 py-2.5">Observação</th>
                        <th className="px-3 py-2.5 text-right w-24">Subtotal</th>
                        <th className="px-2.5 py-2.5 text-center w-12">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {items.map((item, idx) => {
                        const ins = insumosMap.get(item.insumoId);
                        if (!ins) {
                          return (
                            <tr key={idx} className="bg-rose-50 text-rose-800">
                              <td colSpan={5} className="px-3 py-2">
                                Insumo ID "{item.insumoId}" não encontrado no catálogo
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-rose-600 hover:text-rose-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        const itemTotal = item.quantity * ins.costPerUnit;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            {/* Insumo Name & Unit */}
                            <td className="px-3.5 py-2.5">
                              <div className="font-bold text-slate-900">{ins.name}</div>
                              <div className="text-[11px] text-slate-400">
                                {ins.notes || `${ins.packageSize} ${ins.unit} por embalagem`}
                              </div>
                            </td>

                            {/* Quantity Controls with +/- Steppers */}
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStepQuantity(idx, -1)}
                                  className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center cursor-pointer transition-colors"
                                  title="Diminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>

                                <input
                                  type="number"
                                  min="0.001"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(idx, parseFloat(e.target.value) || 0)}
                                  className="w-14 px-1.5 py-0.5 text-center text-xs font-black text-slate-900 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleStepQuantity(idx, 1)}
                                  className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center cursor-pointer transition-colors"
                                  title="Aumentar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] text-slate-500 font-semibold ml-0.5">{ins.unit}</span>
                              </div>
                            </td>

                            {/* Unit Cost */}
                            <td className="px-3 py-2.5 text-right font-medium text-slate-600">
                              {formatBRL(ins.costPerUnit)}
                            </td>

                            {/* Item Notes */}
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                placeholder="Adicionar nota..."
                                value={item.notes || ''}
                                onChange={(e) => handleUpdateItemNotes(idx, e.target.value)}
                                className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded focus:ring-1 focus:ring-teal-500 text-slate-700"
                              />
                            </td>

                            {/* Subtotal */}
                            <td className="px-3 py-2.5 text-right font-black text-slate-900">
                              {formatBRL(itemTotal)}
                            </td>

                            {/* Remove button */}
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remover este item do procedimento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200 text-xs">
                      <tr>
                        <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wider text-slate-500">
                          Total de Insumos ({items.length} itens):
                        </td>
                        <td className="px-3 py-2.5 text-right text-teal-800 text-sm">
                          {formatBRL(directCost)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">
                  Nenhum insumo vinculado a este procedimento ainda.
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                  Utilize o seletor acima para adicionar materiais descartáveis, fios cirúrgicos, medicamentos e anestésicos.
                </p>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* COMPOSIÇÃO E GERAÇÃO DO CUSTO TOTAL DA CLÍNICA */}
          {/* ============================================================== */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-teal-50/40 border border-teal-200/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-700" />
                Composição do Custo Total da Clínica
              </span>
              <span className="text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
                Custo Real Consolidado
              </span>
            </div>

            {/* Grid dos 4 pilares de custo + Custo Total */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* 1. Insumos */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span>📦</span> Insumos
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900 mt-1">
                  {formatBRL(insumosCost)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {items.length} itens usados
                </div>
              </div>

              {/* 2. Anestesia */}
              <div className="p-3 bg-white border border-sky-200 rounded-xl shadow-xs">
                <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                  <span>💉</span> Anestesia
                </div>
                <div className="text-sm sm:text-base font-black text-sky-950 mt-1">
                  {formatBRL(currentAnesthesiaCost)}
                </div>
                <div className="text-[10px] text-sky-600 mt-0.5">
                  {category === 'cirurgia' ? 'Terceirizado' : 'Não aplicável'}
                </div>
              </div>

              {/* 3. Comissão Veterinária */}
              <div className="p-3 bg-white border border-indigo-200 rounded-xl shadow-xs">
                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <span>👨‍⚕️</span> Comissão Vet
                </div>
                <div className="text-sm sm:text-base font-black text-indigo-950 mt-1">
                  {formatBRL(calculatedVetCommission)}
                </div>
                <div className="text-[10px] text-indigo-600 mt-0.5">
                  {vetCommissionType === 'percent' ? `${vetCommissionValue}% repasse` : 'Valor fixo'}
                </div>
              </div>

              {/* 4. Operacional */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span>⏱️</span> Operacional
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900 mt-1">
                  {formatBRL(operationalCost)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {durationMinutes} min de estrutura
                </div>
              </div>

              {/* 5. Custo Total Gerado */}
              <div className="col-span-2 sm:col-span-1 p-3 bg-teal-600 text-white rounded-xl shadow-sm border border-teal-700 flex flex-col justify-between">
                <div className="text-[10px] font-bold text-teal-100 uppercase tracking-wider flex items-center gap-1">
                  <span>💰</span> CUSTO TOTAL
                </div>
                <div className="text-base sm:text-lg font-black text-white mt-1 tracking-tight">
                  {formatBRL(totalCost)}
                </div>
                <div className="text-[10px] text-teal-100/90 mt-0.5">
                  Custo final gerado
                </div>
              </div>
            </div>

            {/* Opcional: Preço de Cobrança ao Tutor */}
            <div className="pt-2 border-t border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">
                Deseja definir também o valor cobrado ao tutor do paciente?
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Preço Cobrado:
                </label>
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={suggestedPrice}
                    onChange={(e) => setSuggestedPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-2 py-1 text-xs font-extrabold text-slate-800 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btn-save-procedure"
              className="px-6 py-2.5 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isEditing ? 'Salvar Alterações do Procedimento' : 'Criar Procedimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
