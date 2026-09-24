import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { ClinicSettings, Insumo, Procedure, ProcedureCategory } from './types';
import { initialClinicSettings, initialInsumos, initialProcedures } from './data/initialData';
import { Navbar, ActiveTab } from './components/Navbar';
import { ProcedureCard } from './components/ProcedureCard';
import { ProcedureDetailModal } from './components/ProcedureDetailModal';
import { ProcedureEditModal } from './components/ProcedureEditModal';
import { InsumosManager } from './components/InsumosManager';
import { InsumoModal } from './components/InsumoModal';
import { SettingsPage } from './components/SettingsPage';
import { primaryButtonClass } from './components/Modal';
import { matchesWeightRange, WEIGHT_RANGES, WeightRange } from './utils/costCalculations';

interface AppProps {
  initialTab?: ActiveTab;
}

const CATEGORY_HEADER: Record<ProcedureCategory, { title: string; description: string; newLabel: string }> = {
  banho_tosa: {
    title: 'Banho & Tosa',
    description: 'Custo de cada serviço por porte do animal.',
    newLabel: 'Novo banho & tosa',
  },
  cirurgia: {
    title: 'Cirurgias',
    description: 'Custo de cada cirurgia por peso do paciente, incluindo anestesia e comissão.',
    newLabel: 'Nova cirurgia',
  },
  internacao: {
    title: 'Internação',
    description: 'Custo das diárias de internação por porte do animal.',
    newLabel: 'Nova diária',
  },
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function usePersistedState<T>(key: string, value: T) {
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  }, [key, value]);
}

export default function App({ initialTab = 'cirurgia' }: AppProps) {
  const [settings, setSettings] = useState<ClinicSettings>(() => {
    const parsed = loadFromStorage<Partial<ClinicSettings> | null>('vetcusto_settings_v2', null);
    if (!parsed) return initialClinicSettings;
    return {
      ...initialClinicSettings,
      ...parsed,
      projectName: (parsed.projectName === 'VetCusto' || !parsed.projectName) ? 'Animalia Cash' : parsed.projectName,
      logoUrl: parsed.logoUrl || '/logo.jpg',
    };
  });
  const [procedures, setProcedures] = useState<Procedure[]>(() =>
    loadFromStorage('vetcusto_procedures_v2', initialProcedures).map((p) =>
      // Dados antigos de internação guardavam só as horas de atendimento em durationMinutes
      p.category === 'internacao' && p.laborMinutes === undefined && p.durationMinutes < 1440
        ? { ...p, durationMinutes: 1440, laborMinutes: p.durationMinutes }
        : p
    )
  );
  const [insumos, setInsumos] = useState<Insumo[]>(() => {
    const saved = loadFromStorage('vetcusto_insumos_v2', initialInsumos);
    // Recupera insumos padrão que algum procedimento referencia mas que faltam nos dados salvos
    // (ex: insumos adicionados ao catálogo inicial depois que os dados foram gravados)
    const savedIds = new Set(saved.map((i) => i.id));
    const referencedIds = new Set(procedures.flatMap((p) => p.items.map((it) => it.insumoId)));
    const missing = initialInsumos.filter((i) => !savedIds.has(i.id) && referencedIds.has(i.id));
    return missing.length > 0 ? [...saved, ...missing] : saved;
  });

  usePersistedState('vetcusto_settings_v2', settings);
  usePersistedState('vetcusto_insumos_v2', insumos);
  usePersistedState('vetcusto_procedures_v2', procedures);

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [weightRange, setWeightRange] = useState<WeightRange>('todos');

  // Modals
  const [detailProcedure, setDetailProcedure] = useState<Procedure | null>(null);
  const [editProcedure, setEditProcedure] = useState<Procedure | null>(null);
  const [isCreatingProcedure, setIsCreatingProcedure] = useState<boolean>(false);
  const [editInsumo, setEditInsumo] = useState<Insumo | null>(null);
  const [isCreatingInsumo, setIsCreatingInsumo] = useState<boolean>(false);

  const insumosMap = useMemo(() => {
    const map = new Map<string, Insumo>();
    insumos.forEach((ins) => map.set(ins.id, ins));
    return map;
  }, [insumos]);

  // Procedure handlers
  const handleSaveProcedure = (saved: Procedure) => {
    setProcedures((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setEditProcedure(null);
    setIsCreatingProcedure(false);
  };

  const handleDuplicateProcedure = (procedure: Procedure) => {
    const clone: Procedure = {
      ...procedure,
      id: `proc_${Date.now()}`,
      name: `${procedure.name} (Cópia)`,
      items: procedure.items.map((i) => ({ ...i })),
    };
    setProcedures((prev) => [clone, ...prev]);
  };

  const handleDeleteProcedure = (id: string) => {
    if (confirm('Tem certeza que deseja remover este procedimento?')) {
      setProcedures((prev) => prev.filter((p) => p.id !== id));
      if (detailProcedure?.id === id) setDetailProcedure(null);
    }
  };

  // Insumo handlers
  const handleSaveInsumo = (saved: Insumo) => {
    setInsumos((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setEditInsumo(null);
    setIsCreatingInsumo(false);
  };

  const handleDeleteInsumo = (id: string) => {
    const count = procedures.filter((p) => p.items.some((it) => it.insumoId === id)).length;
    const message = count > 0
      ? `Este insumo é usado em ${count} procedimento(s). Deseja realmente excluí-lo?`
      : 'Deseja excluir este insumo?';
    if (!confirm(message)) return;

    setInsumos((prev) => prev.filter((i) => i.id !== id));
    setProcedures((prev) =>
      prev.map((p) => ({
        ...p,
        items: p.items.filter((it) => it.insumoId !== id),
      }))
    );
  };

  const handleResetData = () => {
    if (!confirm('Substituir todos os procedimentos e insumos pelos dados de exemplo? As alterações feitas serão perdidas.')) return;
    setInsumos(initialInsumos);
    setProcedures(initialProcedures);
  };

  const procedureCategory: ProcedureCategory | null = activeTab in CATEGORY_HEADER ? (activeTab as ProcedureCategory) : null;

  const categoryProcedures = useMemo(
    () => (procedureCategory ? procedures.filter((p) => p.category === procedureCategory) : []),
    [procedures, procedureCategory]
  );

  const visibleProcedures = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return categoryProcedures
      .filter((p) => matchesWeightRange(p.targetWeightKg, weightRange))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR') || (a.targetWeightKg ?? 0) - (b.targetWeightKg ?? 0));
  }, [categoryProcedures, searchTerm, weightRange]);

  const isFiltering = weightRange !== 'todos' || searchTerm.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchTerm('');
          setWeightRange('todos');
        }}
        settings={settings}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {procedureCategory && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{CATEGORY_HEADER[procedureCategory].title}</h1>
                <p className="text-sm text-slate-500 mt-1">{CATEGORY_HEADER[procedureCategory].description}</p>
              </div>
              <button
                id={`btn-new-procedure-${activeTab}`}
                onClick={() => setIsCreatingProcedure(true)}
                className={`${primaryButtonClass} shrink-0`}
              >
                <Plus className="w-4 h-4" />
                {CATEGORY_HEADER[procedureCategory].newLabel}
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="inline-flex max-w-full p-1 bg-slate-200/60 rounded-lg overflow-x-auto self-start">
                {WEIGHT_RANGES.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setWeightRange(range.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      weightRange === range.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-search-procedures"
                  type="text"
                  placeholder="Buscar procedimento"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {visibleProcedures.length > 0 ? (
              <>
                <p className="text-sm text-slate-500">
                  {visibleProcedures.length} de {categoryProcedures.length} procedimentos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleProcedures.map((proc) => (
                    <ProcedureCard
                      key={proc.id}
                      procedure={proc}
                      insumosMap={insumosMap}
                      settings={settings}
                      onViewDetails={setDetailProcedure}
                      onEdit={setEditProcedure}
                      onDuplicate={handleDuplicateProcedure}
                      onDelete={handleDeleteProcedure}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <p className="font-medium text-slate-700">
                  {isFiltering ? 'Nenhum procedimento encontrado.' : 'Nenhum procedimento cadastrado ainda.'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {isFiltering ? 'Tente outra faixa de peso ou outro termo de busca.' : `Clique em "${CATEGORY_HEADER[procedureCategory].newLabel}" para começar.`}
                </p>
                {isFiltering && (
                  <button
                    onClick={() => {
                      setWeightRange('todos');
                      setSearchTerm('');
                    }}
                    className="mt-4 text-sm font-semibold text-brand-700 hover:underline cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'insumos' && (
          <InsumosManager
            insumos={insumos}
            procedures={procedures}
            onAddInsumo={() => setIsCreatingInsumo(true)}
            onEditInsumo={setEditInsumo}
            onDeleteInsumo={handleDeleteInsumo}
          />
        )}

        {activeTab === 'configuracoes' && (
          <SettingsPage settings={settings} onSave={setSettings} onResetData={handleResetData} />
        )}
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {settings.projectName || 'Animalia Cash'} · Gestão de custos veterinários
      </footer>

      {detailProcedure && (
        <ProcedureDetailModal
          procedure={detailProcedure}
          insumosMap={insumosMap}
          settings={settings}
          onClose={() => setDetailProcedure(null)}
          onEdit={(p) => {
            setDetailProcedure(null);
            setEditProcedure(p);
          }}
        />
      )}

      {(isCreatingProcedure || editProcedure) && procedureCategory && (
        <ProcedureEditModal
          procedure={editProcedure}
          defaultCategory={procedureCategory}
          insumos={insumos}
          insumosMap={insumosMap}
          settings={settings}
          onClose={() => {
            setEditProcedure(null);
            setIsCreatingProcedure(false);
          }}
          onSave={handleSaveProcedure}
          onQuickCreateInsumo={(ins) => setInsumos((prev) => [ins, ...prev])}
        />
      )}

      {(isCreatingInsumo || editInsumo) && (
        <InsumoModal
          insumo={editInsumo}
          onClose={() => {
            setEditInsumo(null);
            setIsCreatingInsumo(false);
          }}
          onSave={handleSaveInsumo}
        />
      )}
    </div>
  );
}
