import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Insumo, InsumoCategory, PackageType, UnitType } from '../types';
import { formatBRL, formatDecimal, formatUnitCost } from '../utils/costCalculations';
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

export const PACKAGE_OPTIONS: { value: PackageType; label: string }[] = [
  { value: 'caixa', label: 'Caixa' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'frasco', label: 'Frasco' },
  { value: 'galao', label: 'Galão' },
  { value: 'ampola', label: 'Ampola' },
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'rolo', label: 'Rolo' },
  { value: 'fardo', label: 'Fardo' },
  { value: 'kit', label: 'Kit' },
  { value: 'unidade', label: 'Unidade avulsa' },
];

export const CATEGORY_OPTIONS: { value: InsumoCategory; label: string }[] = [
  { value: 'cirurgia', label: 'Cirurgia' },
  { value: 'internacao', label: 'Internação' },
  { value: 'banho_tosa', label: 'Banho & Tosa' },
  { value: 'geral', label: 'Geral' },
];

/** Ex: "Caixa com 20 par · R$ 90,00". Retorna null se o insumo não tem embalagem cadastrada. */
export function describePackage(insumo: Insumo): string | null {
  if (!insumo.packagePrice || !insumo.packageSize) return null;
  const type = PACKAGE_OPTIONS.find((p) => p.value === insumo.packageType)?.label ?? 'Embalagem';
  return `${type} com ${formatDecimal(insumo.packageSize, 3)} ${insumo.unit} · ${formatBRL(insumo.packagePrice)}`;
}

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
  const hasPackage = Boolean(insumo?.packagePrice && insumo?.packageSize);

  const [name, setName] = useState(insumo?.name ?? '');
  const [category, setCategory] = useState<InsumoCategory>(insumo?.category ?? 'geral');
  const [unit, setUnit] = useState<UnitType>(insumo?.unit ?? 'un');
  // Novo insumo começa pela compra em embalagem; existente sem embalagem abre no custo direto
  const [directCost, setDirectCost] = useState<boolean>(isEditing && !hasPackage);
  const [packageType, setPackageType] = useState<PackageType | ''>(insumo?.packageType ?? (isEditing ? '' : 'caixa'));
  const [packagePrice, setPackagePrice] = useState<number>(insumo?.packagePrice ?? 0);
  const [packageSize, setPackageSize] = useState<number>(insumo?.packageSize ?? 0);
  const [manualCost, setManualCost] = useState<number>(insumo?.costPerUnit ?? 0);
  const [notes, setNotes] = useState(insumo?.notes ?? '');
  const [errorMsg, setErrorMsg] = useState('');

  const packageLabel = PACKAGE_OPTIONS.find((p) => p.value === packageType)?.label.toLowerCase() ?? 'embalagem';
  const isMasculine = (['pacote', 'frasco', 'galao', 'rolo', 'fardo', 'kit'] as (PackageType | '')[]).includes(packageType);
  const ofThe = isMasculine ? 'do' : 'da';
  const inThe = isMasculine ? 'no' : 'na';
  const costPerUnit = directCost ? manualCost : packagePrice > 0 && packageSize > 0 ? packagePrice / packageSize : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg('Informe o nome do insumo.');
    if (!directCost) {
      if (packagePrice <= 0) return setErrorMsg(`Informe o preço pago ${isMasculine ? 'pelo' : 'pela'} ${packageLabel}.`);
      if (packageSize <= 0) return setErrorMsg(`Informe a quantidade que vem ${inThe} ${packageLabel}.`);
    } else if (manualCost <= 0) {
      return setErrorMsg('O custo unitário deve ser maior que zero.');
    }

    onSave({
      id: insumo?.id ?? `ins_${Date.now()}`,
      name: name.trim(),
      category,
      unit,
      costPerUnit,
      packageType: directCost || !packageType ? undefined : packageType,
      packagePrice: directCost ? undefined : packagePrice,
      packageSize: directCost ? undefined : packageSize,
      notes: notes.trim() || undefined,
    });
  };

  const clearError = () => setErrorMsg('');

  const unitSelect = (id: string) => (
    <select
      id={id}
      value={unit}
      onChange={(e) => setUnit(e.target.value as UnitType)}
      aria-label="Unidade de uso"
      className={`${inputClass} w-auto`}
    >
      {UNIT_OPTIONS.map((u) => (
        <option key={u.value} value={u.value}>{u.label}</option>
      ))}
    </select>
  );

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
      <form id="form-insumo" onSubmit={handleSave} className="p-6 space-y-6">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="input-insumo-name" className={labelClass}>Nome</label>
            <input
              id="input-insumo-name"
              type="text"
              placeholder="Ex: Luvas cirúrgicas estéreis"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError();
              }}
              className={inputClass}
            />
          </div>
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
        </div>

        {!directCost ? (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900 mb-3">Como você compra</legend>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="select-package-type" className={labelClass}>Embalagem</label>
                <select
                  id="select-package-type"
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value as PackageType | '')}
                  className={inputClass}
                >
                  {packageType === '' && <option value="">Selecione</option>}
                  {PACKAGE_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="input-package-price" className={labelClass}>Preço {ofThe} {packageLabel}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">R$</span>
                  <input
                    id="input-package-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={packagePrice || ''}
                    onChange={(e) => {
                      setPackagePrice(toNumber(e.target.value));
                      clearError();
                    }}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="input-package-size" className={labelClass}>Quantidade {inThe} {packageLabel}</label>
              <div className="flex items-center gap-2">
                <input
                  id="input-package-size"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ex: 20"
                  value={packageSize || ''}
                  onChange={(e) => {
                    setPackageSize(toNumber(e.target.value));
                    clearError();
                  }}
                  className={`${inputClass} w-32`}
                />
                {unitSelect('select-insumo-unit')}
                <span className="text-sm text-slate-500 whitespace-nowrap">por {packageLabel}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Use a unidade em que o item é gasto nos procedimentos (ex: caixa de luvas = 50 par; frasco de shampoo = 5000 ml).
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg bg-accent-50 border border-accent-100 px-4 py-3">
              <div>
                <span className="text-sm text-slate-600 block">Custo unitário</span>
                {costPerUnit > 0 && (
                  <span className="text-xs text-slate-500">
                    {formatBRL(packagePrice)} ÷ {formatDecimal(packageSize, 3)} {unit}
                  </span>
                )}
              </div>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {costPerUnit > 0 ? `${formatUnitCost(costPerUnit)} / ${unit}` : '—'}
              </span>
            </div>
          </fieldset>
        ) : (
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900 mb-3">Custo unitário</legend>
            <div className="flex items-center gap-2">
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">R$</span>
                <input
                  id="input-insumo-cost"
                  type="number"
                  step="any"
                  min="0"
                  value={manualCost || ''}
                  onChange={(e) => {
                    setManualCost(toNumber(e.target.value));
                    clearError();
                  }}
                  className={`${inputClass} pl-10`}
                />
              </div>
              <span className="text-sm text-slate-500">por</span>
              {unitSelect('select-insumo-unit')}
            </div>
          </fieldset>
        )}

        <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={directCost}
            onChange={(e) => {
              const checked = e.target.checked;
              // Ao trocar para custo direto, parte do valor que a embalagem calculava
              if (checked && costPerUnit > 0) setManualCost(Number(costPerUnit.toFixed(4)));
              setDirectCost(checked);
              clearError();
            }}
            className="rounded border-slate-300 text-accent-600 focus:ring-accent-500"
          />
          Informar custo unitário direto (sem embalagem, ex: kWh, diária)
        </label>

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
