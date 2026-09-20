import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Layers, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { Insumo, InsumoCategory, Procedure } from '../types';
import { formatBRL, getCategoryBadge, getCategoryLabel } from '../utils/costCalculations';

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

  // Conta quantos procedimentos usam cada insumo
  const usageCountMap = new Map<string, number>();
  procedures.forEach((p) => {
    p.items.forEach((it) => {
      usageCountMap.set(it.insumoId, (usageCountMap.get(it.insumoId) || 0) + 1);
    });
  });

  const filteredInsumos = insumos.filter((ins) => {
    const matchesSearch = ins.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ins.notes && ins.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'todos' || ins.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Catálogo de Insumos & Materiais
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre lâminas, luvas, fios de sutura, shampoos, anestésicos e materiais descartáveis com seus custos unitários.
          </p>
        </div>

        <button
          id="btn-add-new-insumo"
          onClick={onAddInsumo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Insumo
        </button>
      </div>

      {/* Info Tip */}
      <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl flex items-start gap-3 text-xs text-teal-900">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <strong>Cálculo Automático Interligado:</strong> Quando você atualiza o custo de compra de um insumo aqui (por exemplo, se o preço do shampoo ou do fio de sutura subir), todos os procedimentos de Banho e Tosa, Cirurgias ou Internação que utilizam esse material têm seus custos e margens recalculados instantaneamente.
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="input-search-insumos"
            type="text"
            placeholder="Buscar por nome (ex: bisturi, vicryl, shampoo, ringer)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'banho_tosa', label: 'Banho & Tosa' },
            { id: 'cirurgia', label: 'Cirurgias' },
            { id: 'internacao', label: 'Internação' },
            { id: 'geral', label: 'Gerais' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insumos Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Nome do Material / Insumo</th>
                <th className="px-3 py-3.5">Categoria</th>
                <th className="px-3 py-3.5 text-center">Unidade</th>
                <th className="px-4 py-3.5 text-right">Custo Unitário</th>
                <th className="px-3 py-3.5 text-center">Procedimentos</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInsumos.length > 0 ? (
                filteredInsumos.map((ins) => {
                  const badge = getCategoryBadge(ins.category);
                  const usageCount = usageCountMap.get(ins.id) || 0;

                  return (
                    <tr key={ins.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {ins.name}
                        </div>
                        {ins.notes && (
                          <div className="text-xs text-slate-500 font-normal">
                            {ins.notes}
                          </div>
                        )}
                        {ins.packagePrice && ins.packageSize && (
                          <div className="text-[11px] text-teal-700 font-medium">
                            Comprado a {formatBRL(ins.packagePrice)} por {ins.packageSize} {ins.unit}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {getCategoryLabel(ins.category)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-slate-600 whitespace-nowrap">
                        {ins.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                        {formatBRL(ins.costPerUnit)} <span className="text-xs text-slate-400 font-normal">/ {ins.unit}</span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {usageCount} {usageCount === 1 ? 'uso' : 'usos'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            id={`btn-edit-insumo-${ins.id}`}
                            onClick={() => onEditInsumo(ins)}
                            title="Editar insumo"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-insumo-${ins.id}`}
                            onClick={() => onDeleteInsumo(ins.id)}
                            title="Excluir insumo"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Nenhum insumo encontrado para este filtro ou busca.
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
