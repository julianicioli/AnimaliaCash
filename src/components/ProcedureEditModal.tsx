import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, AlertTriangle, Check } from 'lucide-react';
import { ClinicSettings, Insumo, Procedure, ProcedureCategory, ProcedureItem, UnitType } from '../types';
import { calculateProcedure, formatBRL, formatDecimal, formatUnitCost, getCategoryLabel, getDefaultCommissionPercent } from '../utils/costCalculations';
import { Modal, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './Modal';
import { UNIT_OPTIONS } from './InsumoModal';

interface ProcedureEditModalProps {
  procedure: Procedure | null; // null se for novo
  defaultCategory: ProcedureCategory;
  insumos: Insumo[];
  insumosMap: Map<string, Insumo>;
  settings: ClinicSettings;
  onClose: () => void;
  onSave: (savedProcedure: Procedure) => void;
  onQuickCreateInsumo: (newInsumo: Insumo) => void;
}

type Tab = 'geral' | 'insumos' | 'custos';

const COMMON_SURGERIES = [
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

const DEFAULT_ROLE: Record<ProcedureCategory, string> = {
  cirurgia: 'Cirurgião Veterinário',
  internacao: 'Veterinário Plantonista',
  banho_tosa: 'Banhista / Tosador',
};

const NOUN: Record<ProcedureCategory, { edit: string; create: string }> = {
  cirurgia: { edit: 'Editar cirurgia', create: 'Nova cirurgia' },
  banho_tosa: { edit: 'Editar banho & tosa', create: 'Novo banho & tosa' },
  internacao: { edit: 'Editar diária de internação', create: 'Nova diária de internação' },
};

function getAutoName(category: ProcedureCategory, weight?: number): string {
  if (category === 'banho_tosa') return weight ? `Banho & Tosa (${weight} kg)` : 'Banho & Tosa';
  if (category === 'internacao') return weight ? `Diária de Internação (${weight} kg)` : 'Diária de Internação';
  return '';
}

const toNumber = (value: string) => {
  const n = parseFloat(value.replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

export const ProcedureEditModal: React.FC<ProcedureEditModalProps> = ({
  procedure,
  defaultCategory,
  insumos,
  insumosMap,
  settings,
  onClose,
  onSave,
  onQuickCreateInsumo,
}) => {
  const category = procedure?.category ?? defaultCategory;
  const isEditing = Boolean(procedure);

  const [tab, setTab] = useState<Tab>('geral');
  const [errorMsg, setErrorMsg] = useState('');

  // Dados gerais
  // Nomes automáticos (ex: "Banho & Tosa (20 kg)") ficam vazios para acompanhar a mudança de peso
  const [name, setName] = useState(() =>
    procedure && procedure.name !== getAutoName(category, procedure.targetWeightKg) ? procedure.name : ''
  );
  const [targetWeightKg, setTargetWeightKg] = useState<number | undefined>(procedure?.targetWeightKg);
  const [durationMinutes, setDurationMinutes] = useState<number>(
    procedure?.durationMinutes ?? (category === 'internacao' ? 1440 : 60)
  );
  const [laborMinutes, setLaborMinutes] = useState<number>(procedure?.laborMinutes ?? 180);
  const [description, setDescription] = useState(procedure?.description ?? '');

  // Custos
  // A clínica não tem anestesista próprio: ele é contratado por fora quando necessário.
  // Cirurgia nova começa sem anestesista; existente mantém o que tinha.
  const [hasAnesthetist, setHasAnesthetist] = useState<boolean>(
    procedure ? (procedure.anesthesiaCost ?? settings.defaultAnesthesiaCost ?? 0) > 0 : false
  );
  const [anesthesiaCost, setAnesthesiaCost] = useState<number>(
    procedure?.anesthesiaCost || settings.defaultAnesthesiaCost || 250
  );
  const [vetCommissionType, setVetCommissionType] = useState<'percent' | 'fixed'>(procedure?.vetCommissionType ?? 'percent');
  const [vetCommissionValue, setVetCommissionValue] = useState<number>(
    procedure?.vetCommissionValue ?? getDefaultCommissionPercent(category, settings)
  );
  const [vetCommissionRole, setVetCommissionRole] = useState(procedure?.vetCommissionRole ?? DEFAULT_ROLE[category]);
  const [price, setPrice] = useState<number>(procedure?.suggestedPrice ?? 0);

  // Insumos: cópia própria dos itens, para que "Cancelar" não altere o procedimento original
  const [items, setItems] = useState<ProcedureItem[]>(() => (procedure?.items ?? []).map((i) => ({ ...i })));
  const [insumoSearch, setInsumoSearch] = useState('');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const autoName = getAutoName(category, targetWeightKg);
  const finalName = name.trim() || autoName;

  const draft: Procedure = {
    ...procedure,
    id: procedure?.id ?? `proc_${Date.now()}`,
    name: finalName,
    category,
    description: description.trim(),
    targetWeightKg: targetWeightKg && targetWeightKg > 0 ? targetWeightKg : undefined,
    durationMinutes: Math.max(1, Math.round(durationMinutes)),
    laborMinutes: category === 'internacao' ? Math.max(0, laborMinutes) : procedure?.laborMinutes,
    anesthesiaCost: category === 'cirurgia' ? (hasAnesthetist ? Math.max(0, anesthesiaCost) : 0) : undefined,
    vetCommissionType,
    vetCommissionValue: Math.max(0, vetCommissionValue),
    vetCommissionRole: vetCommissionRole.trim() || undefined,
    suggestedPrice: price > 0 ? price : undefined,
    items,
  };
  const { breakdown } = calculateProcedure(draft, insumosMap, settings);

  // Catálogo: só os insumos da mesma categoria do procedimento (ex: cirurgia)
  const categoryInsumos = useMemo(
    () => insumos.filter((ins) => ins.category === category).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [insumos, category]
  );
  const filteredCatalog = useMemo(() => {
    const q = insumoSearch.trim().toLowerCase();
    return q
      ? categoryInsumos.filter((ins) => ins.name.toLowerCase().includes(q) || (ins.notes ?? '').toLowerCase().includes(q))
      : categoryInsumos;
  }, [categoryInsumos, insumoSearch]);
  const addedQuantity = useMemo(() => new Map(items.map((it) => [it.insumoId, it.quantity])), [items]);

  const updateItem = (index: number, patch: Partial<ProcedureItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const addInsumo = (insumoId: string) => {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.insumoId === insumoId);
      if (existing >= 0) {
        return prev.map((it, i) => (i === existing ? { ...it, quantity: Math.round((it.quantity + 1) * 1000) / 1000 } : it));
      }
      return [...prev, { insumoId, quantity: 1 }];
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalName) {
      setTab('geral');
      setErrorMsg('Informe o nome da cirurgia.');
      return;
    }
    onSave(draft);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'geral', label: 'Dados gerais' },
    { id: 'insumos', label: `Insumos (${items.length})` },
    { id: 'custos', label: 'Custos' },
  ];

  return (
    <Modal
      id="modal-procedure-edit"
      title={isEditing ? NOUN[category].edit : NOUN[category].create}
      size="2xl"
      onClose={onClose}
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">Custo total</span>
            <span className="text-xl font-bold text-slate-900 tabular-nums">{formatBRL(breakdown.totalCost)}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              Cancelar
            </button>
            <button type="submit" form="form-procedure-edit" id="btn-save-procedure" className={primaryButtonClass}>
              {isEditing ? 'Salvar alterações' : 'Criar procedimento'}
            </button>
          </div>
        </div>
      }
    >
      {/* Abas */}
      <div className="sticky top-0 z-10 bg-white px-6 border-b border-slate-200 flex gap-6" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative py-3 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-500 rounded-full" />}
          </button>
        ))}
      </div>

      <form id="form-procedure-edit" onSubmit={handleSave} className="p-6">
        {errorMsg && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-sm text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* ------------------------------ DADOS GERAIS ------------------------------ */}
        {tab === 'geral' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label htmlFor="input-procedure-name" className={labelClass}>
                Nome {category === 'cirurgia' ? '' : <span className="text-slate-400 font-normal">(opcional)</span>}
              </label>
              <input
                id="input-procedure-name"
                type="text"
                list={category === 'cirurgia' ? 'common-surgeries' : undefined}
                placeholder={category === 'cirurgia' ? 'Ex: Castração Fêmea' : autoName}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg('');
                }}
                className={inputClass}
              />
              {category === 'cirurgia' ? (
                <datalist id="common-surgeries">
                  {COMMON_SURGERIES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              ) : (
                <p className="text-xs text-slate-500 mt-1.5">Se deixar em branco, será usado “{autoName}”.</p>
              )}
            </div>

            <div className={`grid grid-cols-1 gap-5 ${category === 'internacao' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              <div>
                <label htmlFor="input-procedure-weight" className={labelClass}>Peso do animal</label>
                <Suffixed suffix="kg">
                  <input
                    id="input-procedure-weight"
                    type="number"
                    min="0"
                    step="0.5"
                    value={targetWeightKg ?? ''}
                    onChange={(e) => setTargetWeightKg(e.target.value ? toNumber(e.target.value) : undefined)}
                    className={`${inputClass} pr-10`}
                  />
                </Suffixed>
              </div>

              {category === 'internacao' ? (
                <div>
                  <label htmlFor="input-procedure-duration" className={labelClass}>Duração</label>
                  <Suffixed suffix="diárias">
                    <input
                      id="input-procedure-duration"
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={Math.round((durationMinutes / 1440) * 100) / 100}
                      onChange={(e) => setDurationMinutes(Math.round(toNumber(e.target.value) * 1440))}
                      className={`${inputClass} pr-16`}
                    />
                  </Suffixed>
                </div>
              ) : (
                <div>
                  <label htmlFor="input-procedure-duration" className={labelClass}>Duração</label>
                  <Suffixed suffix="min">
                    <input
                      id="input-procedure-duration"
                      type="number"
                      min="1"
                      step="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(toNumber(e.target.value))}
                      className={`${inputClass} pr-12`}
                    />
                  </Suffixed>
                </div>
              )}

              {category === 'internacao' && (
                <div>
                  <label htmlFor="input-procedure-labor" className={labelClass}>Tempo de atendimento</label>
                  <Suffixed suffix="h">
                    <input
                      id="input-procedure-labor"
                      type="number"
                      min="0"
                      step="0.5"
                      value={Math.round((laborMinutes / 60) * 100) / 100}
                      onChange={(e) => setLaborMinutes(Math.round(toNumber(e.target.value) * 60))}
                      className={`${inputClass} pr-8`}
                    />
                  </Suffixed>
                  <p className="text-xs text-slate-500 mt-1.5">Horas da equipe no período; é o que entra no custo operacional.</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="input-procedure-desc" className={labelClass}>
                Descrição <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="input-procedure-desc"
                rows={3}
                placeholder="Protocolo, observações clínicas…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        )}

        {/* -------------------------------- INSUMOS -------------------------------- */}
        {tab === 'insumos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Catálogo: insumos da mesma categoria do procedimento */}
            <section className="flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Insumos de {getCategoryLabel(category)} <span className="font-normal text-slate-400">({categoryInsumos.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent-700 hover:underline cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar
                </button>
              </div>

              {isQuickCreateOpen && (
                <div className="mb-3">
                  <QuickCreateInsumo
                    category={category}
                    onCancel={() => setIsQuickCreateOpen(false)}
                    onCreate={(ins) => {
                      onQuickCreateInsumo(ins);
                      setItems((prev) => [...prev, { insumoId: ins.id, quantity: 1 }]);
                      setIsQuickCreateOpen(false);
                    }}
                  />
                </div>
              )}

              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filtrar"
                  aria-label="Filtrar insumos"
                  value={insumoSearch}
                  onChange={(e) => setInsumoSearch(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>

              <ul className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-y-auto max-h-72 lg:max-h-[max(14rem,calc(92vh-23rem))]">
                {filteredCatalog.map((ins) => {
                  const added = addedQuantity.get(ins.id);
                  return (
                    <li key={ins.id}>
                      <button
                        type="button"
                        onClick={() => addInsumo(ins.id)}
                        title={added ? 'Adicionar mais 1' : 'Adicionar'}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent-50 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-slate-800 truncate">{ins.name}</div>
                          <div className="text-xs text-slate-400 tabular-nums">
                            {formatUnitCost(ins.costPerUnit)} / {ins.unit}
                          </div>
                        </div>
                        {added !== undefined ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-700 bg-accent-50 border border-accent-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                            <Check className="w-3 h-3" />
                            {formatDecimal(added, 3)} {ins.unit}
                          </span>
                        ) : (
                          <Plus className="w-4 h-4 text-slate-300 group-hover:text-accent-600 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
                {filteredCatalog.length === 0 && (
                  <li className="px-3 py-6 text-center text-sm text-slate-500">
                    {categoryInsumos.length === 0
                      ? `Nenhum insumo cadastrado na categoria ${getCategoryLabel(category)}.`
                      : 'Nenhum insumo encontrado.'}
                  </li>
                )}
              </ul>
            </section>

            {/* Itens já adicionados ao procedimento */}
            <section className="flex flex-col min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Adicionados <span className="font-normal text-slate-400">({items.length})</span>
              </h3>

              {items.length > 0 ? (
                <div className="border border-slate-200 rounded-lg flex flex-col overflow-hidden">
                  <ul className="divide-y divide-slate-100 overflow-y-auto max-h-80 lg:max-h-[max(14rem,calc(92vh-23rem))]">
                    {items.map((item, idx) => {
                      const ins = insumosMap.get(item.insumoId);
                      return (
                        <li key={`${item.insumoId}-${idx}`} className="px-3 py-2.5 flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            {ins ? (
                              <div className="text-sm text-slate-800 truncate" title={ins.name}>{ins.name}</div>
                            ) : (
                              <div className="text-sm text-amber-700 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Não encontrado ({item.insumoId})</span>
                              </div>
                            )}
                            <input
                              type="text"
                              placeholder="Adicionar observação"
                              value={item.notes ?? ''}
                              onChange={(e) => updateItem(idx, { notes: e.target.value })}
                              className="w-full py-0.5 text-xs text-slate-500 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-accent-500 focus:outline-none placeholder:text-slate-300"
                            />
                          </div>
                          <div className="relative w-24 shrink-0">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              aria-label={`Quantidade de ${ins?.name ?? item.insumoId}`}
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, { quantity: Math.max(0, toNumber(e.target.value)) })}
                              className="w-full pl-2 pr-8 py-1.5 text-sm bg-white border border-slate-300 rounded-md tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                              {ins?.unit ?? ''}
                            </span>
                          </div>
                          <div className="w-20 shrink-0 pt-1.5 text-right text-sm font-medium text-slate-900 tabular-nums whitespace-nowrap">
                            {formatBRL((item.quantity || 0) * (ins?.costPerUnit ?? 0))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                            title="Remover"
                            aria-label="Remover item"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex justify-between px-3 py-2.5 bg-slate-50 border-t border-slate-200 text-sm">
                    <span className="text-slate-600">Total de insumos</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{formatBRL(breakdown.directCost)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 py-12 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">Nenhum insumo adicionado.</p>
                  <p className="text-sm text-slate-500 mt-1">Clique em um insumo da lista para incluí-lo.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* --------------------------------- CUSTOS --------------------------------- */}
        {tab === 'custos' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {category === 'cirurgia' && (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold text-slate-900 mb-3">Anestesia</legend>
                  <Switch
                    id="switch-anesthetist"
                    checked={hasAnesthetist}
                    onChange={setHasAnesthetist}
                    label="Anestesista terceirizado"
                    description="Ative quando contratar um anestesista para esta cirurgia."
                  />
                  {hasAnesthetist && (
                    <div className="sm:w-1/2">
                      <label htmlFor="input-anesthesia-cost" className={labelClass}>Valor do anestesista</label>
                      <Prefixed prefix="R$">
                        <input
                          id="input-anesthesia-cost"
                          type="number"
                          min="0"
                          step="10"
                          value={anesthesiaCost || ''}
                          onChange={(e) => setAnesthesiaCost(toNumber(e.target.value))}
                          className={`${inputClass} pl-10`}
                        />
                      </Prefixed>
                    </div>
                  )}
                </fieldset>
              )}

              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-slate-900 mb-3">Comissão do profissional</legend>
                <div>
                  <label htmlFor="input-commission-role" className={labelClass}>Profissional</label>
                  <input
                    id="input-commission-role"
                    type="text"
                    value={vetCommissionRole}
                    onChange={(e) => setVetCommissionRole(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className={labelClass}>Tipo</span>
                    <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg">
                      {(['percent', 'fixed'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setVetCommissionType(type)}
                          className={`py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                            vetCommissionType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          {type === 'percent' ? 'Percentual' : 'Valor fixo'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="input-commission-value" className={labelClass}>
                      {vetCommissionType === 'percent' ? 'Percentual' : 'Valor'}
                    </label>
                    {vetCommissionType === 'percent' ? (
                      <Suffixed suffix="%">
                        <input
                          id="input-commission-value"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={vetCommissionValue}
                          onChange={(e) => setVetCommissionValue(toNumber(e.target.value))}
                          className={`${inputClass} pr-8`}
                        />
                      </Suffixed>
                    ) : (
                      <Prefixed prefix="R$">
                        <input
                          id="input-commission-value"
                          type="number"
                          min="0"
                          step="10"
                          value={vetCommissionValue}
                          onChange={(e) => setVetCommissionValue(toNumber(e.target.value))}
                          className={`${inputClass} pl-10`}
                        />
                      </Prefixed>
                    )}
                  </div>
                </div>
              </fieldset>

              <div>
                <label htmlFor="input-procedure-price" className={labelClass}>
                  Preço cobrado do tutor <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <Prefixed prefix="R$">
                  <input
                    id="input-procedure-price"
                    type="number"
                    min="0"
                    step="5"
                    value={price || ''}
                    placeholder="0,00"
                    onChange={(e) => setPrice(toNumber(e.target.value))}
                    className={`${inputClass} pl-10`}
                  />
                </Prefixed>
                <p className="text-xs text-slate-500 mt-1.5">
                  Quando informado, a comissão percentual é calculada sobre este preço. Sem preço, ela incide sobre os demais custos.
                </p>
              </div>
            </div>

            {/* Resumo */}
            <div className="lg:col-span-2">
              <div className="bg-slate-50 rounded-lg p-5">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Composição do custo</h4>
                <dl className="space-y-2 text-sm">
                  <SummaryRow label="Insumos" value={breakdown.directCost} />
                  {breakdown.anesthesiaCost > 0 && <SummaryRow label="Anestesia" value={breakdown.anesthesiaCost} />}
                  <SummaryRow label="Comissão" value={breakdown.vetCommissionCost} />
                  <SummaryRow label="Operacional" value={breakdown.operationalCost} />
                  <div className="flex justify-between pt-3 mt-1 border-t border-slate-200 font-semibold text-slate-900">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatBRL(breakdown.totalCost)}</dd>
                  </div>
                </dl>
                <p className="text-xs text-slate-500 mt-3">
                  Operacional: {category === 'internacao' ? 'tempo de atendimento' : 'duração'} × {formatBRL(settings.hourlyOperationalRate)}/h da clínica.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

const Switch: React.FC<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}> = ({ id, checked, onChange, label, description }) => (
  <div className="flex items-start gap-3">
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 ${
        checked ? 'bg-accent-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
    <div>
      <span id={`${id}-label`} className="text-sm font-medium text-slate-800 block">{label}</span>
      {description && <span className="text-xs text-slate-500">{description}</span>}
    </div>
  </div>
);

const SummaryRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex justify-between text-slate-600">
    <dt>{label}</dt>
    <dd className="tabular-nums text-slate-900">{formatBRL(value)}</dd>
  </div>
);

const Suffixed: React.FC<{ suffix: string; children: React.ReactNode }> = ({ suffix, children }) => (
  <div className="relative">
    {children}
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">{suffix}</span>
  </div>
);

const Prefixed: React.FC<{ prefix: string; children: React.ReactNode }> = ({ prefix, children }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">{prefix}</span>
    {children}
  </div>
);

const QuickCreateInsumo: React.FC<{
  category: ProcedureCategory;
  onCancel: () => void;
  onCreate: (insumo: Insumo) => void;
}> = ({ category, onCancel, onCreate }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState(0);
  const [unit, setUnit] = useState<UnitType>('un');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return setError('Informe o nome do insumo.');
    if (cost <= 0) return setError('Informe um custo maior que zero.');
    onCreate({
      id: `ins_custom_${Date.now()}`,
      name: name.trim(),
      category,
      unit,
      costPerUnit: cost,
    });
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
      <p className="text-sm font-semibold text-slate-900">Novo insumo</p>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} sm:col-span-3`}
        />
        <div className="relative sm:col-span-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">R$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Custo"
            aria-label="Custo por unidade"
            value={cost || ''}
            onChange={(e) => setCost(toNumber(e.target.value))}
            className={`${inputClass} pl-10`}
          />
        </div>
        <select value={unit} onChange={(e) => setUnit(e.target.value as UnitType)} aria-label="Unidade" className={inputClass}>
          {UNIT_OPTIONS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.value}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancelar
        </button>
        <button type="button" onClick={handleCreate} className={primaryButtonClass}>
          Adicionar ao procedimento
        </button>
      </div>
    </div>
  );
};
