import { CalculationBreakdown, ClinicSettings, Insumo, Procedure, ProcedureCategory } from '../types';

export function formatBRL(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDecimal(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(1).replace('.', ',')}%`;
}

export function formatDuration(minutes: number, category?: ProcedureCategory | string): string {
  if (!minutes || minutes <= 0) return '0 min';

  if (category === 'internacao') {
    if (minutes >= 1440) {
      const days = minutes / 1440;
      if (Number.isInteger(days)) {
        return days === 1 ? '24h (1 Diária completa)' : `${days * 24}h (${days} Diárias)`;
      }
      const fullDays = Math.floor(days);
      const remainingHours = Math.round((minutes % 1440) / 60);
      return `${fullDays}d ${remainingHours}h (${minutes / 60}h)`;
    }
    if (minutes >= 60) {
      const hours = minutes / 60;
      if (Number.isInteger(hours)) {
        return `${hours}h de internação`;
      }
      return `${Math.floor(hours)}h ${minutes % 60}min`;
    }
    return `${minutes} min`;
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h (${minutes} min)`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

export interface EnergyAndOperationalImpact {
  durationMinutes: number;
  durationFormatted: string;
  hours: number;
  estimatedKwh: number;
  energyCost: number;
  operationalCost: number;
  equipmentDescription: string;
}

export function calculateEnergyAndOperational(
  durationMinutes: number,
  category: ProcedureCategory | string,
  settings: ClinicSettings
): EnergyAndOperationalImpact {
  const hours = (durationMinutes || 0) / 60;
  const kwhRate = settings.kwhCost || 0.95;

  let averageKwPower = 0.6;
  let equipmentDescription = 'Equipamentos e iluminação padrão';

  if (category === 'banho_tosa') {
    averageKwPower = 3.2; // Soprador 1800W + Secador 2200W + Máquina/Luz
    equipmentDescription = 'Soprador de alta potência, secador pedestal, máquina de tosa e iluminação';
  } else if (category === 'cirurgia') {
    averageKwPower = 2.4; // Foco cirúrgico + Bisturi + Monitor + Concentrador O2 + Climatização
    equipmentDescription = 'Foco cirúrgico, bisturi elétrico, monitor multiparâmetro, concentrador de O2 e climatização';
  } else if (category === 'internacao') {
    averageKwPower = 0.8; // Bomba de infusão + Colchão térmico + Climatização/Luz contínua
    equipmentDescription = 'Bomba de infusão contínua, aquecedor térmico, climatização de leito e iluminação hospitalar';
  }

  const estimatedKwh = hours * averageKwPower;
  const energyCost = estimatedKwh * kwhRate;
  const operationalCost = hours * (settings.hourlyOperationalRate || 45);

  return {
    durationMinutes,
    durationFormatted: formatDuration(durationMinutes, category as ProcedureCategory),
    hours,
    estimatedKwh,
    energyCost,
    operationalCost,
    equipmentDescription,
  };
}

export function getCategoryLabel(category: ProcedureCategory | string): string {
  switch (category) {
    case 'banho_tosa':
      return 'Banho & Tosa';
    case 'cirurgia':
      return 'Cirurgias';
    case 'internacao':
      return 'Internação';
    case 'geral':
      return 'Geral';
    default:
      return category;
  }
}

export function getCategoryBadge(category: ProcedureCategory | string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (category) {
    case 'banho_tosa':
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-800',
        border: 'border-teal-200',
        dot: 'bg-teal-500',
      };
    case 'cirurgia':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'internacao':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export interface ItemCostDetail {
  insumoId: string;
  insumoName: string;
  unit: string;
  quantity: number;
  costPerUnit: number;
  totalItemCost: number;
  percentageOfDirectCost: number;
  notes?: string;
}

export interface DetailedProcedureCalculation {
  procedure: Procedure;
  breakdown: CalculationBreakdown;
  itemDetails: ItemCostDetail[];
  itemsCount: number;
}

export function calculateProcedure(
  procedure: Procedure,
  insumosMap: Map<string, Insumo>,
  settings: ClinicSettings
): DetailedProcedureCalculation {
  let directCost = 0;
  const itemDetails: ItemCostDetail[] = [];

  for (const item of procedure.items) {
    const insumo = insumosMap.get(item.insumoId);
    const costPerUnit = insumo ? insumo.costPerUnit : 0;
    const totalItemCost = (item.quantity || 0) * costPerUnit;
    directCost += totalItemCost;

    itemDetails.push({
      insumoId: item.insumoId,
      insumoName: insumo ? insumo.name : 'Item não localizado',
      unit: insumo ? insumo.unit : 'un',
      quantity: item.quantity,
      costPerUnit,
      totalItemCost,
      percentageOfDirectCost: 0, // calculado abaixo
      notes: item.notes || insumo?.notes,
    });
  }

  // Calcular porcentagem de cada insumo no custo direto
  for (const detail of itemDetails) {
    detail.percentageOfDirectCost = directCost > 0 ? (detail.totalItemCost / directCost) * 100 : 0;
  }

  // Ordenar insumos pelo maior impacto financeiro
  itemDetails.sort((a, b) => b.totalItemCost - a.totalItemCost);

  // Mão de obra / Custo Operacional rateado
  const hours = (procedure.durationMinutes || 0) / 60;
  const operationalCost = settings.includeLaborInCost
    ? hours * settings.hourlyOperationalRate + (procedure.fixedOverheadCost || 0)
    : (procedure.fixedOverheadCost || 0);

  // Custo do Anestesista Terceirizado (lançado automaticamente para cirurgias)
  const anesthesiaCost = procedure.category === 'cirurgia'
    ? (procedure.anesthesiaCost !== undefined ? procedure.anesthesiaCost : (settings.defaultAnesthesiaCost ?? 250))
    : (procedure.anesthesiaCost || 0);

  // Comissão do Médico Veterinário / Profissional Responsável
  let vetCommissionCost = 0;
  if (procedure.vetCommissionType === 'fixed') {
    vetCommissionCost = procedure.vetCommissionValue || 0;
  } else {
    // Modo percentual (%)
    let commissionPercent = procedure.vetCommissionValue;
    if (commissionPercent === undefined || commissionPercent === null) {
      if (procedure.category === 'cirurgia') {
        commissionPercent = settings.defaultVetCommissionSurgeryPercent ?? 25;
      } else if (procedure.category === 'internacao') {
        commissionPercent = settings.defaultVetCommissionInternmentPercent ?? 20;
      } else if (procedure.category === 'banho_tosa') {
        commissionPercent = settings.defaultVetCommissionBathPercent ?? 15;
      } else {
        commissionPercent = 0;
      }
    }

    if (commissionPercent > 0) {
      const baseForCommission = procedure.suggestedPrice && procedure.suggestedPrice > 0
        ? procedure.suggestedPrice
        : (directCost + anesthesiaCost + operationalCost);
      vetCommissionCost = (baseForCommission * commissionPercent) / 100;
    }
  }

  // Custo Total da Clínica: Insumos + Anestesia + Comissão Veterinária + Operacional da Clínica
  const totalCost = directCost + anesthesiaCost + operationalCost + vetCommissionCost;

  // Preço sugerido (mantido apenas para compatibilidade opcional)
  const targetMargin = procedure.targetMarginPercent || 50;
  let suggestedPriceByMargin = 0;
  if (targetMargin > 0 && targetMargin < 95) {
    suggestedPriceByMargin = totalCost / (1 - targetMargin / 100);
  } else {
    suggestedPriceByMargin = totalCost * (1 + targetMargin / 100);
  }

  const currentPrice = procedure.suggestedPrice || totalCost;
  const profitAtCurrentPrice = currentPrice - totalCost;
  const marginAtCurrentPrice = currentPrice > 0 ? (profitAtCurrentPrice / currentPrice) * 100 : 0;

  return {
    procedure,
    breakdown: {
      directCost,
      insumosCost: directCost,
      anesthesiaCost,
      vetCommissionCost,
      operationalCost,
      totalCost,
      suggestedPriceByMargin,
      currentPrice,
      profitAtCurrentPrice,
      marginAtCurrentPrice,
    },
    itemDetails,
    itemsCount: itemDetails.length,
  };
}
