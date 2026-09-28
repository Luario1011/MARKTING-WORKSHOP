import modelArtifact from '../data/model-run.json';

export type RiskLevel = 'Bajo' | 'Medio' | 'Alto';
export type CountryRisk = 'Bajo' | 'Medio' | 'Alto';
export type MerchantCategory = 'Supermercado' | 'Restaurante' | 'Tecnología' | 'Viajes' | 'Joyería' | 'Gaming';

export interface TransactionInput {
  amount: number;
  hour: number;
  country: string;
  countryRisk: CountryRisk;
  merchant: MerchantCategory;
  paymentMethod: 'Tarjeta virtual' | 'Tarjeta física' | 'Billetera digital';
  deviceTrusted: boolean;
  cardPresent: boolean;
  transactionCount24h: number;
  accountAgeDays: number;
  failedAttempts: number;
  distanceKm: number;
  amountVsAverage: number;
}

export interface Transaction extends TransactionInput {
  id: string;
  createdAt: string;
  riskScore: number;
  riskLevel: RiskLevel;
  fraudActual: boolean;
}

export interface Assessment {
  score: number;
  probability: number;
  level: RiskLevel;
  reasons: { label: string; impact: 'alto' | 'medio' }[];
  recommendation: string;
}

type FeatureSpec = {
  name: string;
  source: string;
  transform: string;
  label: string;
};

type ModelRun = {
  run: { name: string; engine: string; source: string; seed: number; note: string };
  dataset: {
    rawRows: number;
    processedRows: number;
    columns: number;
    target: string;
    fraudRate: number;
    averageAmount: number;
    splits: { train: number; validation: number; test: number };
  };
  features: {
    selected: number;
    specs: FeatureSpec[];
    derived: { name: string; formula: string; purpose: string }[];
    excluded: string;
  };
  thresholds: { medium: number; high: number };
  metrics: { accuracy: number; precision: number; recall: number; f1: number; prAuc: number };
  confusion: { tp: number; fp: number; tn: number; fn: number };
  distribution: Record<RiskLevel, number>;
  model: {
    intercept: number;
    weights: number[];
    means: number[];
    scales: number[];
    topFeatures: { name: string; label: string; direction: 'eleva' | 'reduce'; weight: number }[];
  };
  samples: Transaction[];
};

// El JSON es el artefacto generado por scripts/train_fraud_model.py.
// Al importarlo aquí, la interfaz usa la misma corrida que se documenta en Python.
export const modelRun = modelArtifact as ModelRun;
export const modelSampleTransactions = modelRun.samples;

export const COUNTRY_OPTIONS: { name: string; risk: CountryRisk }[] = [
  { name: 'Colombia', risk: 'Bajo' },
  { name: 'México', risk: 'Medio' },
  { name: 'Estados Unidos', risk: 'Bajo' },
  { name: 'Brasil', risk: 'Medio' },
  { name: 'España', risk: 'Bajo' },
  { name: 'Origen no habitual', risk: 'Alto' },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sigmoid(value: number) {
  const clipped = clamp(value, -35, 35);
  return 1 / (1 + Math.exp(-clipped));
}

function featureValue(input: TransactionInput, spec: FeatureSpec) {
  const sources: Record<string, number | string> = {
    amount: input.amount,
    amountVsAverage: input.amountVsAverage,
    transactionCount24h: input.transactionCount24h,
    accountAgeDays: input.accountAgeDays,
    failedAttempts: input.failedAttempts,
    distanceKm: input.distanceKm,
    isNight: input.hour <= 5 || input.hour >= 23 ? 1 : 0,
    deviceNew: input.deviceTrusted ? 0 : 1,
    cardNotPresent: input.cardPresent ? 0 : 1,
    countryRisk: input.countryRisk,
    merchant: input.merchant,
    paymentMethod: input.paymentMethod,
  };
  const source = sources[spec.source];

  if (spec.transform === 'log1p') return Math.log1p(Number(source));
  if (spec.transform === 'identity' || spec.transform === 'binary') return Number(source);
  if (spec.transform.startsWith('equals:')) return String(source) === spec.transform.slice('equals:'.length) ? 1 : 0;
  return 0;
}

export function probabilityFromModel(input: TransactionInput) {
  const standardized = modelRun.features.specs.map((spec, index) => {
    const rawValue = featureValue(input, spec);
    return (rawValue - modelRun.model.means[index]) / modelRun.model.scales[index];
  });
  const logit = standardized.reduce((total, value, index) => total + value * modelRun.model.weights[index], modelRun.model.intercept);
  return sigmoid(logit);
}

function levelFromProbability(probability: number): RiskLevel {
  if (probability >= modelRun.thresholds.high) return 'Alto';
  if (probability >= modelRun.thresholds.medium) return 'Medio';
  return 'Bajo';
}

const explanationLabels: Record<string, (input: TransactionInput) => string> = {
  log_importe: (input) => `Importe de ${currency.format(input.amount)} por encima de la referencia del modelo`,
  importe_vs_promedio: (input) => `El importe equivale a ${input.amountVsAverage.toLocaleString('es-CO', { maximumFractionDigits: 1 })} veces el promedio del cliente`,
  transacciones_24h: (input) => `${input.transactionCount24h} operaciones acumuladas en las últimas 24 horas`,
  log_antiguedad: (input) => `Antigüedad de cuenta de ${input.accountAgeDays.toLocaleString('es-CO')} días`,
  intentos_fallidos: (input) => `${input.failedAttempts} intento(s) fallido(s) antes de la compra`,
  log_distancia: (input) => `Distancia de ${input.distanceKm.toLocaleString('es-CO', { maximumFractionDigits: 1 })} km frente a la última actividad`,
  horario_nocturno: () => 'Operación realizada en horario nocturno',
  dispositivo_nuevo: () => 'Dispositivo no reconocido previamente',
  tarjeta_no_presente: () => 'La tarjeta no estuvo presente en el comercio',
  pais_riesgo_medio: () => 'Transacción desde una ubicación de riesgo moderado',
  pais_riesgo_alto: () => 'La ubicación no coincide con el perfil geográfico',
  comercio_tecnologia: () => 'Categoría de tecnología incluida en el perfil de revisión',
  comercio_viajes: () => 'Categoría de viajes incluida en el perfil de revisión',
  comercio_joyeria: () => 'Categoría de joyería incluida en el perfil de revisión',
  pago_virtual: () => 'Pago con tarjeta virtual',
  billetera_digital: () => 'Pago con billetera digital',
};

function explain(input: TransactionInput): Assessment['reasons'] {
  const contributions = modelRun.features.specs
    .map((spec, index) => {
      const normalized = (featureValue(input, spec) - modelRun.model.means[index]) / modelRun.model.scales[index];
      return { spec, contribution: normalized * modelRun.model.weights[index] };
    })
    .filter(({ contribution }) => contribution > 0.05)
    .sort((left, right) => right.contribution - left.contribution)
    .slice(0, 4)
    .map(({ spec, contribution }) => ({
      label: explanationLabels[spec.name]?.(input) ?? spec.label,
      impact: contribution >= 0.35 ? 'alto' : 'medio',
    }));

  return contributions.length ? contributions : [{ label: 'Comportamiento consistente con el patrón conocido', impact: 'medio' }];
}

export function assessTransaction(input: TransactionInput): Assessment {
  const probabilityDecimal = probabilityFromModel(input);
  const level = levelFromProbability(probabilityDecimal);
  return {
    score: clamp(Math.round(probabilityDecimal * 100), 1, 99),
    probability: Math.round(probabilityDecimal * 100),
    level,
    reasons: explain(input),
    recommendation:
      level === 'Alto'
        ? 'Retener temporalmente y solicitar validación adicional al cliente.'
        : level === 'Medio'
          ? 'Permitir con monitoreo y priorizar una revisión si se repite el patrón.'
          : 'Aprobar. Mantener el registro para el monitoreo normal del perfil.',
  };
}

export const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export const defaultInput: TransactionInput = {
  amount: 245000,
  hour: 14,
  country: 'Colombia',
  countryRisk: 'Bajo',
  merchant: 'Tecnología',
  paymentMethod: 'Tarjeta virtual',
  deviceTrusted: true,
  cardPresent: false,
  transactionCount24h: 2,
  accountAgeDays: 420,
  failedAttempts: 0,
  distanceKm: 12,
  amountVsAverage: 1.4,
};
