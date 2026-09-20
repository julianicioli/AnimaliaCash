import React, { useState } from 'react';
import { X, Calculator, AlertCircle } from 'lucide-react';
import { Insumo, InsumoCategory, UnitType } from '../types';
import { formatBRL } from '../utils/costCalculations';

interface InsumoModalProps {
  insumo: Insumo | null; // null se novo
  defaultCategory?: InsumoCategory;
  onClose: () => void;
  onSave: (savedInsumo: Insumo) => void;
}

export const InsumoModal: React.FC<InsumoModalProps> = ({
  insumo,
  defaultCategory = 'geral',
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(insumo);

  const [name, setName] = useState(insumo?.name || '');
  const [category, setCategory] = useState<InsumoCategory>(insumo?.category || defaultCategory);
  const [unit, setUnit] = useState<UnitType>(insumo?.unit || 'un');
  const [costPerUnit, setCostPerUnit] = useState<number>(insumo?.costPerUnit || 0);
  const [packagePrice, setPackagePrice] = useState<number>(insumo?.packagePrice || 0);
  const [packageSize, setPackageSize] = useState<number>(insumo?.packageSize || 0);
  const [usePackageCalc, setUsePackageCalc] = useState<boolean>(Boolean(insumo?.packagePrice && insumo?.packageSize));
  const [notes, setNotes] = useState(insumo?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePackageCalculate = (price: number, size: number) => {
    setPackagePrice(price);
    setPackageSize(size);
    if (price > 0 && size > 0) {
      const calculated = price / size;
      setCostPerUnit(Number(calculated.toFixed(4)));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do insumo.');
      return;
    }
    if (costPerUnit <= 0) {
      setErrorMsg('O custo unitário deve ser maior que zero.');
      return;
    }

    const saved: Insumo = {
      id: insumo?.id || `ins_${Date.now()}`,
      name: name.trim(),
      category,
      unit,
      costPerUnit,
      packagePrice: usePackageCalc ? packagePrice : undefined,
      packageSize: usePackageCalc ? packageSize : undefined,
      notes: notes.trim(),
    };

    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="modal-insumo-form"
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto"
      >
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Editar Insumo / Material' : 'Cadastrar Novo Insumo'}
            </h3>
            <p className="text-xs text-slate-500">
              O custo unitário cadastrado será refletido em todos os procedimentos
            </p>
          </div>
          <button
            id="btn-close-insumo-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Material / Insumo *
            </label>
            <input
              id="input-insumo-name"
              type="text"
              required
              placeholder="Ex: Fio de Sutura Nylon 3-0 ou Shampoo Neutro"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                id="select-insumo-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as InsumoCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="banho_tosa">🧼 Banho & Tosa</option>
                <option value="cirurgia">🩺 Cirurgia</option>
                <option value="internacao">🏥 Internação</option>
                <option value="geral">📦 Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unidade de Medida
              </label>
              <select
                id="select-insumo-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="un">unidade (un)</option>
                <option value="ml">mililitros (ml)</option>
                <option value="l">litros (l)</option>
                <option value="g">gramas (g)</option>
                <option value="kg">quilos (kg)</option>
                <option value="par">par (luvas/algodão)</option>
                <option value="m">metros (fita/gaze)</option>
                <option value="kwh">quilowatt-hora (kWh)</option>
                <option value="dose">dose / aplicação</option>
                <option value="diaria">diária / leito</option>
                <option value="hora">hora (oxigênio)</option>
              </select>
            </div>
          </div>

          {/* Calculadora de Frasco / Embalagem fechada */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-teal-600" />
                Calcular Custo a partir da Embalagem / Galão
              </span>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePackageCalc}
                  onChange={(e) => setUsePackageCalc(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                Ativar
              </label>
            </div>

            {usePackageCalc && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Preço da Embalagem (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 120.00"
                    value={packagePrice || ''}
                    onChange={(e) => handlePackageCalculate(parseFloat(e.target.value) || 0, packageSize)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Tamanho / Qtd Total ({unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Ex: 5000"
                    value={packageSize || ''}
                    onChange={(e) => handlePackageCalculate(packagePrice, parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Custo Unitário Final (por {unit}):
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500">R$</span>
                <input
                  id="input-insumo-cost"
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm font-extrabold text-teal-800 text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notas / Especificações
            </label>
            <input
              id="input-insumo-notes"
              type="text"
              placeholder="Ex: Diluição recomendada 1:4, lâmina 15 estéril descartável"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-insumo"
              className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-xs"
            >
              Salvar Insumo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
