import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Insumo, InsumoCategory, UnitType } from '../types';
import { formatBRL, formatUnitCost } from '../utils/costCalculations';
import { Modal, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './Modal';

export const UNIT_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'kg', label: 'Quilo (kg)' },
  { value: 'par', label: 'Par' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'dose', label: 'Dose' },
  { value: 'diaria', label: 'Diária' },
  { value: 'hora', label: 'Hora' },
  { value: 'min', label: 'Minuto' },
  { value: 'kwh', label: 'kWh' },
];

export const CATEGORY_OPTIONS: { value: InsumoCategory; label: string }[] = [
  { value: 'cirurgia', label: 'Cirurgia' },
  { value: 'internacao', label: 'Internação' },
  { value: 'banho_tosa', label: 'Banho & Tosa' },
  { value: 'geral', label: 'Geral' },
];

interface InsumoModalProps {
  insumo: Insumo | null; // null se novo
  onClose: () => void;
  onSave: (savedInsumo: Insumo) => void;
}

const toNumber = (value: string) => {
  const n = parseFloat(value.replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

export const InsumoModal: React.FC<InsumoModalProps> = ({ insumo, onClose, onSave }) => {
  const isEditing = Boolean(insumo);

  const [name, setName] = useState(insumo?.name ?? '');
  const [category, setCategory] = useState<InsumoCategory>(insumo?.category ?? 'geral');
  const [unit, setUnit] = useState<UnitType>(insumo?.unit ?? 'un');
  const [costPerUnit, setCostPerUnit] = useState<number>(insumo?.costPerUnit ?? 0);
  const [usePackageCalc, setUsePackageCalc] = useState<boolean>(Boolean(insumo?.packagePrice && insumo?.packageSize));
  const [packagePrice, setPackagePrice] = useState<number>(insumo?.packagePrice ?? 0);
  const [packageSize, setPackageSize] = useState<number>(insumo?.packageSize ?? 0);
  const [notes, setNotes] = useState(insumo?.notes ?? '');
  const [errorMsg, setErrorMsg] = useState('');

  const updatePackage = (price: number, size: number) => {
    setPackagePrice(price);
    setPackageSize(size);
    if (price > 0 && size > 0) setCostPerUnit(Number((price / size).toFixed(4)));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg('Informe o nome do insumo.');
    if (costPerUnit <= 0) return setErrorMsg('O custo unitário deve ser maior que zero.');

    onSave({
      id: insumo?.id ?? `ins_${Date.now()}`,
      name: name.trim(),
      category,
      unit,
      costPerUnit,
      packagePrice: usePackageCalc ? packagePrice : undefined,
      packageSize: usePackageCalc ? packageSize : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal
      id="modal-insumo-form"
      title={isEditing ? 'Editar insumo' : 'Novo insumo'}
      subtitle="Alterações no custo refletem em todos os procedimentos que usam este item."
      size="md"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancelar
          </button>
          <button type="submit" form="form-insumo" id="btn-save-insumo" className={primaryButtonClass}>
            Salvar
          </button>
        </div>
      }
    >
      <form id="form-insumo" onSubmit={handleSave} className="p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div>
          <label htmlFor="input-insumo-name" className={labelClass}>Nome</label>
          <input
            id="input-insumo-name"
            type="text"
            placeholder="Ex: Fio de sutura nylon 3-0"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorMsg('');
            }}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="select-insumo-category" className={labelClass}>Categoria</label>
            <select
              id="select-insumo-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as InsumoCategory)}
              className={inputClass}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="select-insumo-unit" className={labelClass}>Unidade</label>
            <select
              id="select-insumo-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitType)}
              className={inputClass}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="input-insumo-cost" className={labelClass}>Custo por {unit}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">R$</span>
            <input
              id="input-insumo-cost"
              type="number"
              step="any"
              min="0"
              value={costPerUnit || ''}
              onChange={(e) => setCostPerUnit(toNumber(e.target.value))}
              disabled={usePackageCalc}
              className={`${inputClass} pl-10 disabled:bg-slate-50 disabled:text-slate-600`}
            />
          </div>

          <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={usePackageCalc}
              onChange={(e) => setUsePackageCalc(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Calcular a partir do preço da embalagem
          </label>

          {usePackageCalc && (
            <div className="mt-3 grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <label htmlFor="input-package-price" className={labelClass}>Preço da embalagem</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">R$</span>
                  <input
                    id="input-package-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={packagePrice || ''}
                    onChange={(e) => updatePackage(toNumber(e.target.value), packageSize)}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="input-package-size" className={labelClass}>Conteúdo ({unit})</label>
                <input
                  id="input-package-size"
                  type="number"
                  step="any"
                  min="0"
                  value={packageSize || ''}
                  onChange={(e) => updatePackage(packagePrice, toNumber(e.target.value))}
                  className={inputClass}
                />
              </div>
              {packagePrice > 0 && packageSize > 0 && (
                <p className="col-span-2 text-xs text-slate-500">
                  {formatBRL(packagePrice)} ÷ {packageSize} {unit} = {formatUnitCost(costPerUnit)} por {unit}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="input-insumo-notes" className={labelClass}>
            Observações <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            id="input-insumo-notes"
            type="text"
            placeholder="Ex: Lâmina nº 15 estéril"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>
      </form>
    </Modal>
  );
};
