import React, { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Insumo, Procedure } from '../types';
import { formatBRL, formatUnitCost, getCategoryDotClass, getCategoryLabel } from '../utils/costCalculations';
import { primaryButtonClass } from './Modal';
import { CATEGORY_OPTIONS } from './InsumoModal';

interface InsumosManagerProps {
  insumos: Insumo[];
  procedures: Procedure[];
  onAddInsumo: () => void;
  onEditInsumo: (insumo: Insumo) => void;
  onDeleteInsumo: (id: string) => void;
}

export const InsumosManager: React.FC<InsumosManagerProps> = ({
  insumos,
  procedures,
  onAddInsumo,
  onEditInsumo,
  onDeleteInsumo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');

  // Quantos procedimentos usam cada insumo
  const usageCountMap = useMemo(() => {
    const map = new Map<string, number>();
    procedures.forEach((p) => {
      new Set(p.items.map((it) => it.insumoId)).forEach((id) => map.set(id, (map.get(id) || 0) + 1));
    });
    return map;
  }, [procedures]);

  const filteredInsumos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return insumos
      .filter((ins) => filterCategory === 'todos' || ins.category === filterCategory)
      .filter((ins) => !q || ins.name.toLowerCase().includes(q) || (ins.notes ?? '').toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [insumos, searchTerm, filterCategory]);

  const filters = [{ value: 'todos', label: 'Todos' }, ...CATEGORY_OPTIONS];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Insumos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Materiais e medicamentos com custo unitário. Alterar um custo aqui recalcula todos os procedimentos que o utilizam.
          </p>
        </div>
        <button id="btn-add-new-insumo" onClick={onAddInsumo} className={`${primaryButtonClass} shrink-0`}>
          <Plus className="w-4 h-4" />
          Novo insumo
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex max-w-full p-1 bg-slate-200/60 rounded-lg overflow-x-auto self-start">
          {filters.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterCategory === cat.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-search-insumos"
            type="text"
            placeholder="Buscar insumo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Custo unitário</th>
                <th className="px-4 py-3 font-medium text-right">Usado em</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInsumos.map((ins) => {
                const usageCount = usageCountMap.get(ins.id) || 0;
                return (
                  <tr key={ins.id} className="group hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{ins.name}</div>
                      {ins.notes && <div className="text-xs text-slate-500 mt-0.5">{ins.notes}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <span className={`w-2 h-2 rounded-full ${getCategoryDotClass(ins.category)}`} />
                        {getCategoryLabel(ins.category)}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap tabular-nums"
                      title={ins.packagePrice && ins.packageSize ? `Embalagem: ${formatBRL(ins.packagePrice)} por ${ins.packageSize} ${ins.unit}` : undefined}
                    >
                      <span className="font-medium text-slate-900">{formatUnitCost(ins.costPerUnit)}</span>
                      <span className="text-slate-400"> / {ins.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap tabular-nums">
                      {usageCount === 0 ? <span className="text-slate-400">—</span> : `${usageCount} ${usageCount === 1 ? 'procedimento' : 'procedimentos'}`}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                        <button
                          id={`btn-edit-insumo-${ins.id}`}
                          onClick={() => onEditInsumo(ins)}
                          title="Editar"
                          aria-label={`Editar ${ins.name}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-insumo-${ins.id}`}
                          onClick={() => onDeleteInsumo(ins.id)}
                          title="Excluir"
                          aria-label={`Excluir ${ins.name}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInsumos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    Nenhum insumo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
