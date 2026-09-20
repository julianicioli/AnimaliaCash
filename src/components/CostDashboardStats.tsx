import React from 'react';
import { 
  Scissors, 
  Stethoscope, 
  Bed, 
  TrendingUp, 
  Layers, 
  AlertCircle, 
  ArrowUpRight,
  Calculator,
  ShieldCheck,
  Package
} from 'lucide-react';
import { ClinicSettings, Insumo, Procedure, ProcedureCategory } from '../types';
import { calculateProcedure, formatBRL, formatPercent } from '../utils/costCalculations';

interface CostDashboardStatsProps {
  procedures: Procedure[];
  insumos: Insumo[];
  settings: ClinicSettings;
  onNavigateCategory: (category: ProcedureCategory) => void;
  onNavigateSimulator: () => void;
  onNavigateInsumos: () => void;
}

export const CostDashboardStats: React.FC<CostDashboardStatsProps> = ({
  procedures,
  insumos,
  settings,
  onNavigateCategory,
  onNavigateSimulator,
  onNavigateInsumos,
}) => {
  const insumosMap = new Map<string, Insumo>();
  insumos.forEach((ins) => insumosMap.set(ins.id, ins));

  // Agrupar e calcular estatísticas por categoria
  const getCategoryStats = (cat: ProcedureCategory) => {
    const procs = procedures.filter((p) => p.category === cat);
    if (procs.length === 0) {
      return { count: 0, avgCost: 0, avgPrice: 0, avgMargin: 0, topProc: null };
    }

    let sumCost = 0;
    let sumPrice = 0;
    let sumMargin = 0;

    procs.forEach((p) => {
      const calc = calculateProcedure(p, insumosMap, settings);
      sumCost += calc.breakdown.totalCost;
      sumPrice += calc.breakdown.currentPrice || 0;
      sumMargin += calc.breakdown.marginAtCurrentPrice || 0;
    });

    return {
      count: procs.length,
      avgCost: sumCost / procs.length,
      avgPrice: sumPrice / procs.length,
      avgMargin: sumMargin / procs.length,
      topProc: procs[0],
    };
  };

  const btStats = getCategoryStats('banho_tosa');
  const cirStats = getCategoryStats('cirurgia');
  const intStats = getCategoryStats('internacao');

  // Identificar os insumos de maior custo unitário ou maior relevância
  const sortedInsumos = [...insumos].sort((a, b) => b.costPerUnit - a.costPerUnit).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Apuração Real de Custos Hospitalares
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Controle e Apuração de Custos Veterinários
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Descubra o custo exato de cada procedimento veterinário somando insumos descartáveis (luvas, gazes, fios de sutura, medicamentos), anestesia terceirizada com preço fixo, comissão dos veterinários e custos operacionais da clínica (energia, água, sala e equipe de apoio).
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigateCategory('cirurgia')}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Stethoscope className="w-4 h-4" />
              Ver Custos de Cirurgias
            </button>
            <button
              onClick={() => onNavigateCategory('banho_tosa')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Scissors className="w-4 h-4 text-teal-300" />
              Custos Banho & Tosa
            </button>
            <button
              onClick={() => onNavigateCategory('internacao')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Bed className="w-4 h-4 text-amber-300" />
              Custos de Internação
            </button>
          </div>
        </div>
      </div>

      {/* The 3 Core Clinic Pillars Requested by User */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Banho e Tosa Card */}
        <div 
          onClick={() => onNavigateCategory('banho_tosa')}
          className="bg-white rounded-2xl border border-teal-100 hover:border-teal-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-700 flex items-center gap-0.5">
                Custo Médio: {formatBRL(btStats.avgCost)}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Banho e Tosa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Água, shampoos, toalha, secadores/energia, lâminas e adereços.
            </p>

            <div className="mt-4 p-3 bg-teal-50/50 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Procedimentos Cadastrados:</span>
                <span className="font-bold text-slate-900">{btStats.count} modelos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Custo Médio de Insumos:</span>
                <span className="font-bold text-teal-900">{formatBRL(btStats.avgCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Preço Médio Cobrado:</span>
                <span className="font-extrabold text-teal-700">{formatBRL(btStats.avgPrice)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
            <span>Gerenciar Banho & Tosa</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Cirurgias Card */}
        <div 
          onClick={() => onNavigateCategory('cirurgia')}
          className="bg-white rounded-2xl border border-rose-100 hover:border-rose-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-rose-700 flex items-center gap-0.5">
                Custo Médio: {formatBRL(cirStats.avgCost)}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Cirurgias Veterinárias
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bisturis descartáveis, luvas cirúrgicas, fios de nylon/vicryl, gazes e anestesia terceirizada.
            </p>

            <div className="mt-4 p-3 bg-rose-50/50 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Cirurgias Cadastradas:</span>
                <span className="font-bold text-slate-900">{cirStats.count} cirurgias</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Custo Médio Total Gerado:</span>
                <span className="font-bold text-rose-900">{formatBRL(cirStats.avgCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Anestesia Terceirizada:</span>
                <span className="font-bold text-sky-700">Preço fixo no custo</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
            <span>Gerenciar Cirurgias ({cirStats.count})</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Internações Card */}
        <div 
          onClick={() => onNavigateCategory('internacao')}
          className="bg-white rounded-2xl border border-amber-100 hover:border-amber-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bed className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-amber-700 flex items-center gap-0.5">
                Custo Médio: {formatBRL(intStats.avgCost)}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Internação
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Diária de box, tapetes higiênicos, cateteres, equipos, soros Ringer e medicações.
            </p>

            <div className="mt-4 p-3 bg-amber-50/50 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Modelos de Diária:</span>
                <span className="font-bold text-slate-900">{intStats.count} planos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Custo Médio da Diária:</span>
                <span className="font-bold text-amber-900">{formatBRL(intStats.avgCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Valor Médio da Diária:</span>
                <span className="font-extrabold text-amber-700">{formatBRL(intStats.avgPrice)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
            <span>Gerenciar Internação</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Bottom Row: Insumos Catalog highlights & Simulator CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Insumos Spotlight */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600" />
                Materiais de Alto Impacto Cadastrados
              </h4>
              <p className="text-xs text-slate-500">
                Insumos de maior valor unitário no estoque da clínica
              </p>
            </div>
            <button
              onClick={onNavigateInsumos}
              className="text-xs font-bold text-teal-700 hover:underline"
            >
              Ver todos ({insumos.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {sortedInsumos.map((ins) => (
              <div key={ins.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{ins.name}</span>
                  <span className="text-[11px] text-slate-400 capitalize">{ins.category.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900 block">{formatBRL(ins.costPerUnit)}</span>
                  <span className="text-[10px] text-slate-400">por {ins.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Simulator CTA */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 p-5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">
              Precisa orçar um paciente específico?
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Use o Simulador Rápido para calcular casos atípicos: cirurgias com dosagem extra de anestésico, banhos com tosa tesoura prolongada ou diárias com oxigenoterapia.
            </p>
          </div>

          <button
            onClick={onNavigateSimulator}
            className="mt-4 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Calculator className="w-4 h-4" />
            Abrir Simulador de Atendimento
          </button>
        </div>
      </div>
    </div>
  );
};
