import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scissors, 
  Stethoscope, 
  Bed, 
  Plus, 
  Search, 
  Package, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ClinicSettings, Insumo, Procedure, ProcedureCategory } from './types';
import { initialClinicSettings, initialInsumos, initialProcedures } from './data/initialData';
import { Navbar, ActiveTab } from './components/Navbar';
import { ProcedureCard } from './components/ProcedureCard';
import { ProcedureDetailModal } from './components/ProcedureDetailModal';
import { ProcedureEditModal } from './components/ProcedureEditModal';
import { InsumosManager } from './components/InsumosManager';
import { InsumoModal } from './components/InsumoModal';
import { getCategoryLabel } from './utils/costCalculations';

interface AppProps {
  initialTab?: ActiveTab;
}

export default function App({ initialTab = 'cirurgia' }: AppProps) {
  // LocalStorage state initialization with fallback to rich preset data
  const [settings, setSettings] = useState<ClinicSettings>(() => {
    try {
      const saved = localStorage.getItem('vetcusto_settings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialClinicSettings,
          ...parsed,
          projectName: (parsed.projectName === 'VetCusto' || !parsed.projectName) ? 'Animalia Cash' : parsed.projectName,
          tagline: '',
          logoUrl: parsed.logoUrl || '/logo.jpg',
        };
      }
      return initialClinicSettings;
    } catch {
      return initialClinicSettings;
    }
  });

  const [insumos, setInsumos] = useState<Insumo[]>(() => {
    try {
      const saved = localStorage.getItem('vetcusto_insumos_v2');
      return saved ? JSON.parse(saved) : initialInsumos;
    } catch {
      return initialInsumos;
    }
  });

  const [procedures, setProcedures] = useState<Procedure[]>(() => {
    try {
      const saved = localStorage.getItem('vetcusto_procedures_v2');
      return saved ? JSON.parse(saved) : initialProcedures;
    } catch {
      return initialProcedures;
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vetcusto_settings_v2', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('vetcusto_insumos_v2', JSON.stringify(insumos));
    } catch (e) {
      console.error(e);
    }
  }, [insumos]);

  useEffect(() => {
    try {
      localStorage.setItem('vetcusto_procedures_v2', JSON.stringify(procedures));
    } catch (e) {
      console.error(e);
    }
  }, [procedures]);

  // View state: strictly focused on requested categories
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedWeightFilter, setSelectedWeightFilter] = useState<string>('todos');

  // Modals
  const [detailProcedure, setDetailProcedure] = useState<Procedure | null>(null);
  const [editProcedure, setEditProcedure] = useState<Procedure | null>(null);
  const [isCreatingProcedure, setIsCreatingProcedure] = useState<boolean>(false);
  const [createCategory, setCreateCategory] = useState<ProcedureCategory>('cirurgia');

  const [editInsumo, setEditInsumo] = useState<Insumo | null>(null);
  const [isCreatingInsumo, setIsCreatingInsumo] = useState<boolean>(false);

  // Map of insumos for fast lookup
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
    if (confirm('Tem certeza que deseja remover este procedimento de custo?')) {
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
    if (count > 0) {
      if (!confirm(`Este insumo é usado em ${count} procedimento(s). Deseja realmente excluí-lo?`)) {
        return;
      }
    } else {
      if (!confirm('Deseja excluir este insumo?')) return;
    }

    setInsumos((prev) => prev.filter((i) => i.id !== id));
    setProcedures((prev) =>
      prev.map((p) => ({
        ...p,
        items: p.items.filter((it) => it.insumoId !== id),
      }))
    );
  };

  // Filtered procedures for current category view
  const currentCategoryProcedures = useMemo(() => {
    if (activeTab === 'insumos') return [];

    return procedures
      .filter((p) => p.category === activeTab)
      .filter((p) => {
        // Weight filter
        if (selectedWeightFilter === '10kg') {
          return (p.targetWeightKg && p.targetWeightKg <= 10) || p.name.includes('10 kg') || p.name.includes('Pequeno') || p.name.includes('Mini');
        }
        if (selectedWeightFilter === '20kg') {
          return p.targetWeightKg === 20 || p.name.includes('20 kg');
        }
        if (selectedWeightFilter === '30kg') {
          return p.targetWeightKg === 30 || p.name.includes('30 kg');
        }
        if (selectedWeightFilter === '40kg') {
          return (p.targetWeightKg && p.targetWeightKg >= 40) || p.name.includes('40 kg') || p.name.includes('Gigante');
        }
        return true;
      })
      .filter((p) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      });
  }, [procedures, activeTab, searchTerm, selectedWeightFilter]);

  // Category Header config
  const getCategoryHeaderInfo = () => {
    switch (activeTab) {
      case 'banho_tosa':
        return {
          title: 'Custos de Banho & Tosa',
          description: 'Custo detalhado por porte e peso (10 kg, 20 kg, 30 kg, 40 kg+): água encanada/aquecida, shampoos, energia de secadores e sopradores, toalhas higienizadas, lâminas e adereços.',
          icon: Scissors,
          colorClass: 'text-teal-700 bg-teal-50 border-teal-200',
        };
      case 'cirurgia':
        return {
          title: 'Custos de Cirurgias Veterinárias',
          description: 'Custos pré-definidos por peso do animal (10 kg, 20 kg, 30 kg, 40 kg+): luvas estéreis, lâminas de bisturi descartáveis, fios de sutura (nylon/vicryl), campos, anestésicos (propofol, isoflurano), oxigênio e fluidoterapia.',
          icon: Stethoscope,
          colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      case 'internacao':
        return {
          title: 'Custos de Internação Hospitalar',
          description: 'Custos pré-definidos de diárias por porte (10 kg, 20 kg, 30 kg, 40 kg+): bolsas de soro Ringer Lactato, tapetes descartáveis por nível de diurese, cateteres, equipos, luvas de procedimento, seringas e leito hospitalar.',
          icon: Bed,
          colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
        };
      default:
        return null;
    }
  };

  const categoryInfo = getCategoryHeaderInfo();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchTerm('');
          setSelectedWeightFilter('todos');
        }}
        settings={settings}
        totalProcedures={procedures.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Category Views: Banho e Tosa, Cirurgias, Internação */}
        {(activeTab === 'banho_tosa' || activeTab === 'cirurgia' || activeTab === 'internacao') && categoryInfo && (
          <div className="space-y-6">
            {/* Category Header Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${categoryInfo.colorClass}`}>
                  <categoryInfo.icon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {categoryInfo.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    {categoryInfo.description}
                  </p>
                </div>
              </div>

              <button
                id={`btn-new-procedure-${activeTab}`}
                onClick={() => {
                  setCreateCategory(activeTab);
                  setIsCreatingProcedure(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {activeTab === 'cirurgia'
                  ? 'Nova Cirurgia Pré-definida'
                  : activeTab === 'banho_tosa'
                  ? 'Novo Banho & Tosa Pré-definido'
                  : 'Nova Diária de Internação Pré-definida'}
              </button>
            </div>

            {/* Weight Filter Bar & Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Weight Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                    Filtrar por Peso do Cão:
                  </span>
                  {[
                    { id: 'todos', label: 'Todos os Pesos' },
                    { id: '10kg', label: 'Até 10 kg (Pequeno)' },
                    { id: '20kg', label: '20 kg (Médio)' },
                    { id: '30kg', label: '30 kg (Grande)' },
                    { id: '40kg', label: '40 kg+ (Gigante)' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedWeightFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedWeightFilter === filter.id
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-search-procedures"
                    type="text"
                    placeholder="Buscar procedimento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                <span>
                  Exibindo <strong>{currentCategoryProcedures.length}</strong> procedimentos pré-definidos com custo de insumos, mão de obra e margem calculados.
                </span>
                {selectedWeightFilter !== 'todos' && (
                  <button 
                    onClick={() => setSelectedWeightFilter('todos')}
                    className="text-teal-700 hover:underline font-semibold"
                  >
                    Limpar filtro de peso
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Procedure Cards */}
            {currentCategoryProcedures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentCategoryProcedures.map((proc) => (
                  <ProcedureCard
                    key={proc.id}
                    procedure={proc}
                    insumosMap={insumosMap}
                    settings={settings}
                    onViewDetails={(p) => setDetailProcedure(p)}
                    onEdit={(p) => setEditProcedure(p)}
                    onDuplicate={(p) => handleDuplicateProcedure(p)}
                    onDelete={(id) => handleDeleteProcedure(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-sm font-bold text-slate-700">
                  Nenhum procedimento encontrado para esta faixa de peso ou busca.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Clique no botão "Novo Procedimento Pré-definido" acima para cadastrar a ficha de custos.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Cadastro de Itens & Insumos (Lançamento de luvas, energia, etc.) */}
        {activeTab === 'insumos' && (
          <InsumosManager
            insumos={insumos}
            procedures={procedures}
            onAddInsumo={() => setIsCreatingInsumo(true)}
            onEditInsumo={(ins) => setEditInsumo(ins)}
            onDeleteInsumo={(id) => handleDeleteInsumo(id)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 mt-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} <strong>{settings.projectName || 'Animalia Cash'}</strong> • {settings.tagline || 'Soluções Financeiras'} — Gestão de Custos
          </span>
          <span className="text-slate-400 font-medium">
            Pré-definição de insumos calibrada por peso (10 kg, 20 kg, 30 kg, 40 kg+)
          </span>
        </div>
      </footer>

      {/* Modals */}
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

      {(isCreatingProcedure || editProcedure) && (
        <ProcedureEditModal
          procedure={editProcedure}
          defaultCategory={createCategory}
          insumos={insumos}
          settings={settings}
          onClose={() => {
            setEditProcedure(null);
            setIsCreatingProcedure(false);
          }}
          onSave={handleSaveProcedure}
          onQuickCreateInsumo={handleSaveInsumo}
        />
      )}

      {(isCreatingInsumo || editInsumo) && (
        <InsumoModal
          insumo={editInsumo}
          defaultCategory={
            activeTab === 'banho_tosa' || activeTab === 'cirurgia' || activeTab === 'internacao'
              ? activeTab
              : 'geral'
          }
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
