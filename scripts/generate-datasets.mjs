import { mkdir, writeFile } from 'node:fs/promises';

const OUTPUT_DIRECTORY = new URL('../data/', import.meta.url);
const random = mulberry32(20260924);
const countries = [
  ['Colombia', 'Bajo'], ['México', 'Medio'], ['Estados Unidos', 'Bajo'],
  ['Brasil', 'Medio'], ['España', 'Bajo'], ['Origen no habitual', 'Alto'],
];
const merchants = ['Supermercado', 'Restaurante', 'Tecnología', 'Viajes', 'Joyería', 'Gaming'];
const paymentMethods = ['Tarjeta virtual', 'Tarjeta física', 'Billetera digital'];
const merchantWeights = { Supermercado: 0, Restaurante: 1, Tecnología: 7, Viajes: 8, Joyería: 12, Gaming: 5 };

function mulberry32(seed) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(items) { return items[Math.floor(random() * items.length)]; }
function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function csvValue(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function toCsv(rows, columns) {
  return [columns.join(','), ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(','))].join('\n') + '\n';
}

function riskScore(row) {
  let score = 3;
  if (row.amount_cop >= 1_800_000) score += 20; else if (row.amount_cop >= 650_000) score += 11;
  if (row.amount_vs_average >= 4) score += 16; else if (row.amount_vs_average >= 2) score += 8;
  if (row.country_risk === 'Alto') score += 18; else if (row.country_risk === 'Medio') score += 8;
  if (row.device_trusted === 'No') score += 15;
  if (row.transactions_24h >= 7) score += 14; else if (row.transactions_24h >= 4) score += 7;
  if (row.failed_attempts >= 3) score += 13; else if (row.failed_attempts > 0) score += 5;
  if (row.account_age_days < 30) score += 10;
  if (row.distance_km >= 500) score += 9;
  if (row.transaction_hour <= 5 || row.transaction_hour >= 23) score += 7;
  if (row.card_present === 'No' && row.payment_method === 'Tarjeta virtual') score += 4;
  return Math.round(clamp(score + merchantWeights[row.merchant_category], 1, 99));
}

function newTransaction(index) {
  const [country, countryRisk] = pick(countries);
  const amount = Math.round(clamp(18_000 + -Math.log(1 - random()) * 240_000 + (random() > 0.94 ? random() * 2_100_000 : 0), 8_000, 4_200_000));
  const transactionHour = Math.floor(random() * 24);
  const customerAverage = Math.round(75_000 + random() * 240_000);
  const row = {
    transaction_id: `TRX-${String(index + 1).padStart(5, '0')}`,
    transaction_datetime: new Date(Date.UTC(2026, 8, 1 + Math.floor(random() * 23), transactionHour, Math.floor(random() * 60))).toISOString(),
    transaction_hour: transactionHour,
    amount_cop: amount,
    country,
    country_risk: countryRisk,
    merchant_category: pick(merchants),
    payment_method: pick(paymentMethods),
    device_trusted: random() > 0.16 ? 'Sí' : 'No',
    card_present: random() > 0.69 ? 'Sí' : 'No',
    transactions_24h: Math.floor(random() * random() * 9),
    account_age_days: Math.floor(3 + Math.pow(random(), 0.42) * 1800),
    failed_attempts: random() > 0.82 ? Math.floor(1 + random() * 4) : 0,
    distance_km: Math.round(random() > 0.86 ? 150 + random() * 1450 : random() * 140),
    customer_average_cop: customerAverage,
  };
  row.amount_vs_average = Number((amount / customerAverage).toFixed(2));
  row.velocity_24h = row.transactions_24h >= 7 ? 'Alta' : row.transactions_24h >= 4 ? 'Media' : 'Baja';
  row.is_night_operation = transactionHour <= 5 || transactionHour >= 23 ? 'Sí' : 'No';
  const score = riskScore(row);
  const actualProbability = 1 / (1 + Math.exp(-(score - 64) / 7.5));
  row.fraud_label = random() < actualProbability ? 'Fraude' : 'No fraude';
  return row;
}

const cleanedRows = Array.from({ length: 10_000 }, (_, index) => newTransaction(index));
const rawRows = cleanedRows.map((row) => ({ ...row }));

// Problemas deliberados para documentar y repetir la limpieza.
for (let index = 0; index < 160; index += 1) rawRows.push({ ...cleanedRows[index] });
for (let index = 0; index < 140; index += 1) rawRows.push({ ...cleanedRows[160 + index], amount_cop: '', distance_km: '' });
for (let index = 0; index < 88; index += 1) rawRows.push({ ...cleanedRows[300 + index], transaction_datetime: 'fecha_desconocida', country: 'colombia ' });
for (let index = 0; index < 50; index += 1) rawRows.push({ ...cleanedRows[388 + index], amount_cop: -1, customer_average_cop: 'N/A' });

const rawColumns = ['transaction_id', 'transaction_datetime', 'transaction_hour', 'amount_cop', 'country', 'country_risk', 'merchant_category', 'payment_method', 'device_trusted', 'card_present', 'transactions_24h', 'account_age_days', 'failed_attempts', 'distance_km', 'customer_average_cop', 'amount_vs_average', 'velocity_24h', 'is_night_operation', 'fraud_label'];
await mkdir(OUTPUT_DIRECTORY, { recursive: true });
await writeFile(new URL('transacciones_originales_sinteticas.csv', OUTPUT_DIRECTORY), toCsv(rawRows, rawColumns), 'utf8');
await writeFile(new URL('transacciones_procesadas.csv', OUTPUT_DIRECTORY), toCsv(cleanedRows, rawColumns), 'utf8');

console.log(`Datos creados: ${rawRows.length} filas originales y ${cleanedRows.length} filas procesadas.`);
