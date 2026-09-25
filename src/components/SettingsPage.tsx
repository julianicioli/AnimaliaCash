import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { ClinicSettings, ExternalProfessional } from '../types';
import { SectionHeader } from './SectionHeader';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './Modal';
import { formatBRL } from '../utils/costCalculations';
import { NumericInput } from './NumericInput';

interface SettingsPageProps {
  settings: ClinicSettings;
  onSave: (settings: ClinicSettings) => void;
  onResetData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSave, onResetData }) => {
  const [form, setForm] = useState<ClinicSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [newProfessionalName, setNewProfessionalName] = useState('');
  const [newProfessionalSpecialty, setNewProfessionalSpecialty] = useState('');
  const [newProfessionalCost, setNewProfessionalCost] = useState(0);
  const [editingProfessionalId, setEditingProfessionalId] = useState<string | null>(null);

  const update = <K extends keyof ClinicSettings>(key: K, value: ClinicSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const clearProfessionalForm = () => {
    setEditingProfessionalId(null);
    setNewProfessionalName('');
    setNewProfessionalSpecialty('');
    setNewProfessionalCost(0);
  };

  const saveProfessional = () => {
    const name = newProfessionalName.trim();
    const specialty = newProfessionalSpecialty.trim();
    if (!name || !specialty) return;

    const professional: ExternalProfessional = {
      id: editingProfessionalId ?? `professional_${Date.now()}`,
      name,
      specialty,
      defaultCost: Math.max(0, newProfessionalCost),
    };
    const professionals = form.externalProfessionals ?? [];
    update(
      'externalProfessionals',
      editingProfessionalId
        ? professionals.map((item) => item.id === editingProfessionalId ? professional : item)
        : [...professionals, professional]
    );
    clearProfessionalForm();
  };

  const editProfessional = (professional: ExternalProfessional) => {
    setEditingProfessionalId(professional.id);
    setNewProfessionalName(professional.name);
    setNewProfessionalSpecialty(professional.specialty);
    setNewProfessionalCost(professional.defaultCost);
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, clinicName: form.clinicName.trim() });
    setSaved(true);
  };

  return (
    <div className="space-y-8">
      <SectionHeader section="configuracoes" description="Valores padrão usados no cálculo de todos os procedimentos." />

      <div className="max-w-2xl space-y-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          <Section title="Clínica">
            <div>
              <label htmlFor="input-clinic-name" className={labelClass}>Nome da clínica</label>
              <input
                id="input-clinic-name"
                type="text"
                value={form.clinicName}
                onChange={(e) => update('clinicName', e.target.value)}
                className={inputClass}
              />
            </div>
          </Section>

          <Section title="Custo operacional" description="Custo por hora da estrutura e da equipe de apoio (sala, energia, água, auxiliares).">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoneyField
                id="input-hourly-rate"
                label="Custo por hora"
                value={form.hourlyOperationalRate}
                onChange={(v) => update('hourlyOperationalRate', v)}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeLaborInCost}
                onChange={(e) => update('includeLaborInCost', e.target.checked)}
                className="rounded border-slate-300 text-accent-600 focus:ring-accent-500"
              />
              Incluir o custo por hora no custo dos procedimentos
            </label>
          </Section>

          <Section title="Profissionais terceirizados" description="Cadastre anestesistas, especialistas e seus valores padrão por procedimento.">
            {(form.externalProfessionals ?? []).length > 0 && (
              <ul className="divide-y divide-slate-100">
                {(form.externalProfessionals ?? []).map((professional) => (
                  <li key={professional.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{professional.name}</p>
                      <p className="text-sm text-slate-500 truncate">{professional.specialty} · {formatBRL(professional.defaultCost)} por procedimento</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => editProfessional(professional)}
                        title={`Editar ${professional.name}`}
                        aria-label={`Editar ${professional.name}`}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          update('externalProfessionals', (form.externalProfessionals ?? []).filter((item) => item.id !== professional.id));
                          if (editingProfessionalId === professional.id) clearProfessionalForm();
                        }}
                        title={`Excluir ${professional.name}`}
                        aria-label={`Excluir ${professional.name}`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="input-new-professional-name" className={labelClass}>Nome</label>
                <input
                  id="input-new-professional-name"
                  type="text"
                  value={newProfessionalName}
                  onChange={(e) => setNewProfessionalName(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Dra. Ana Silva"
                />
              </div>
              <div>
                <label htmlFor="input-new-professional-specialty" className={labelClass}>Especialidade</label>
                <input
                  id="input-new-professional-specialty"
                  type="text"
                  value={newProfessionalSpecialty}
                  onChange={(e) => setNewProfessionalSpecialty(e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Anestesiologia"
                />
              </div>
              <MoneyField
                id="input-new-professional-cost"
                label="Custo padrão por procedimento"
                value={newProfessionalCost}
                onChange={setNewProfessionalCost}
              />
            </div>
            <button
              type="button"
              onClick={saveProfessional}
              disabled={!newProfessionalName.trim() || !newProfessionalSpecialty.trim()}
              className={secondaryButtonClass}
            >
              {editingProfessionalId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingProfessionalId ? 'Salvar profissional' : 'Adicionar profissional'}
            </button>
            {editingProfessionalId && (
              <button type="button" onClick={clearProfessionalForm} className="ml-3 text-sm text-slate-500 hover:text-slate-800">
                Cancelar edição
              </button>
            )}
          </Section>

          <Section title="Comissões padrão" description="Aplicado aos procedimentos sem comissão própria e sugerido ao criar novos.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PercentField
                id="input-commission-surgery"
                label="Cirurgias"
                value={form.defaultVetCommissionSurgeryPercent ?? 0}
                onChange={(v) => update('defaultVetCommissionSurgeryPercent', v)}
              />
              <PercentField
                id="input-commission-internment"
                label="Internação"
                value={form.defaultVetCommissionInternmentPercent ?? 0}
                onChange={(v) => update('defaultVetCommissionInternmentPercent', v)}
              />
              <PercentField
                id="input-commission-bath"
                label="Banho & Tosa"
                value={form.defaultVetCommissionBathPercent ?? 0}
                onChange={(v) => update('defaultVetCommissionBathPercent', v)}
              />
            </div>
          </Section>

          <div className="px-6 py-4 bg-slate-50/60 rounded-b-xl flex items-center justify-end gap-3">
            {saved && !isDirty && (
              <span className="inline-flex items-center gap-1.5 text-sm text-accent-700">
                <Check className="w-4 h-4" />
                Salvo
              </span>
            )}
            <button type="submit" disabled={!isDirty} className={primaryButtonClass}>
              Salvar configurações
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Restaurar dados de exemplo</h2>
            <p className="text-sm text-slate-500 mt-1">
              Substitui todos os procedimentos e insumos pelos dados iniciais. As configurações acima são mantidas.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetData}
            className={`${secondaryButtonClass} shrink-0 text-rose-700 hover:bg-rose-50 border-rose-200`}
          >
            Restaurar
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="p-6 space-y-4">
    <div>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
    </div>
    {children}
  </section>
);

const MoneyField: React.FC<{ id: string; label: string; value: number; onChange: (v: number) => void }> = ({ id, label, value, onChange }) => (
  <div>
    <label htmlFor={id} className={labelClass}>{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">R$</span>
      <NumericInput
        id={id}
        min="0"
        step="any"
        value={value}
        onChange={onChange}
        className={`${inputClass} pl-10`}
      />
    </div>
  </div>
);

const PercentField: React.FC<{ id: string; label: string; value: number; onChange: (v: number) => void }> = ({ id, label, value, onChange }) => (
  <div>
    <label htmlFor={id} className={labelClass}>{label}</label>
    <div className="relative">
      <NumericInput
        id={id}
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={onChange}
        className={`${inputClass} pr-8`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">%</span>
    </div>
  </div>
);
