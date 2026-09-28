import { useMemo, useState } from 'react';
import {
  COUNTRY_OPTIONS,
  assessTransaction,
  currency,
  defaultInput,
  modelRun,
  modelSampleTransactions,
  type Assessment,
  type MerchantCategory,
  type RiskLevel,
  type Transaction,
  type TransactionInput,
} from '../lib/fraudData';

const merchants: MerchantCategory[] = ['Supermercado', 'Restaurante', 'Tecnología', 'Viajes', 'Joyería', 'Gaming'];

const levelClass: Record<RiskLevel, string> = {
  Bajo: 'risk-low',
  Medio: 'risk-medium',
  Alto: 'risk-high',
};

type DistanceUnit = 'm' | 'km';
type SignalGlyph = 'amount' | 'payment' | 'resale' | 'velocity' | 'delivery' | 'location';

const bankRiskSignals = [
  { title: 'Importe inusualmente alto', detail: 'Una compra grande frente al patrón habitual merece elevar la revisión.', feature: 'log_importe · importe_vs_promedio', tag: 'IMPORTE', glyph: 'amount' as SignalGlyph },
  { title: 'Pago sin tarjeta presente', detail: 'Una operación remota necesita contrastarse con el perfil y otras señales del cliente.', feature: 'tarjeta_no_presente · pago_virtual', tag: 'PAGO', glyph: 'payment' as SignalGlyph },
  { title: 'Producto de fácil reventa', detail: 'Categorías de alta demanda pueden aumentar la exposición cuando se combinan con otras alertas.', feature: 'comercio_joyeria', tag: 'COMERCIO', glyph: 'resale' as SignalGlyph },
  { title: 'Órdenes repetidas en poco tiempo', detail: 'La velocidad transaccional permite identificar actividad fuera de lo normal.', feature: 'transacciones_24h', tag: 'VELOCIDAD', glyph: 'velocity' as SignalGlyph },
  { title: 'Fricción antes de pagar', detail: 'Intentos fallidos o un dispositivo nuevo pueden justificar una verificación adicional.', feature: 'intentos_fallidos · dispositivo_nuevo', tag: 'FRICCIÓN', glyph: 'payment' as SignalGlyph },
  { title: 'Destino fuera del área habitual', detail: 'Una ubicación inesperada debe evaluarse contra el perfil conocido del cliente.', feature: 'pais_riesgo_alto · log_distancia', tag: 'UBICACIÓN', glyph: 'location' as SignalGlyph },
];

function percentage(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

function modelPercentage(value: number) {
  return percentage(value * 100);
}

function formatDistance(kilometers: number) {
  if (kilometers < 1) return `${Math.round(kilometers * 1000).toLocaleString('es-CO')} m`;
  return `${kilometers.toLocaleString('es-CO', { maximumFractionDigits: kilometers < 10 ? 1 : 0 })} km`;
}

function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`risk-badge ${levelClass[level]}`}>{level}</span>;
}

function SignalIcon({ glyph }: { glyph: SignalGlyph }) {
  return (
    <svg className="source-card__glyph" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" stroke="currentColor" strokeWidth="2.25" strokeLinecap="square" strokeLinejoin="miter">
      {glyph === 'amount' && <><path d="M5 9h22M5 16h22M5 23h14" /><path d="M23 5v7m-3-4h6" /></>}
      {glyph === 'payment' && <><rect x="5" y="7" width="18" height="12" /><path d="M5 11h18" /><rect x="10" y="14" width="17" height="11" /></>}
      {glyph === 'resale' && <><path d="M5 5h13l9 9-13 13-9-9z" /><path d="M10 10h.01" /></>}
      {glyph === 'velocity' && <><path d="m5 23 8-8 5 4 9-10" /><path d="M21 9h6v6" /><path d="M5 27h22" /></>}
      {glyph === 'delivery' && <><path d="M5 11h15v13H5zM20 15h4l3 4v5h-7z" /><path d="M9 9v4M16 9v4M9 17h6" /></>}
      {glyph === 'location' && <><path d="M16 27s8-7.2 8-14a8 8 0 1 0-16 0c0 6.8 8 14 8 14Z" /><path d="M16 13h.01" /></>}
    </svg>
  );
}

function ExternalArrow() {
  return <svg className="source-card__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"><path d="M3 13 13 3M6 3h7v7" /></svg>;
}

function MetricCard({ icon, label, value, detail }: { icon: string; label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <div className="metric-icon" aria-hidden="true">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

export default function FraudDashboard() {
  const transactions = useMemo(() => modelSampleTransactions, []);
  const [form, setForm] = useState<TransactionInput>(defaultInput);
  const [assessment, setAssessment] = useState<Assessment>(() => assessTransaction(defaultInput));
  const [evaluatedInput, setEvaluatedInput] = useState<TransactionInput>(defaultInput);
  const [queue, setQueue] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'Todos' | RiskLevel>('Todos');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');

  const summary = useMemo(() => ({
    confirmedFraud: Math.round(modelRun.dataset.processedRows * modelRun.dataset.fraudRate),
    highRisk: modelRun.distribution.Alto,
    averageAmount: modelRun.dataset.averageAmount,
    ...modelRun.confusion,
  }), []);

  const distribution = useMemo(
    () => (['Bajo', 'Medio', 'Alto'] as RiskLevel[]).map((level) => ({ level, count: modelRun.distribution[level] })),
    [],
  );

  const visibleRows = useMemo(() => {
    const allRows = [...queue, ...transactions];
    const matches = filter === 'Todos' ? allRows : allRows.filter((item) => item.riskLevel === filter);
    return matches.slice(0, 8);
  }, [filter, queue, transactions]);

  const update = <K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const evaluate = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const nextAssessment = assessTransaction(form);
    setAssessment(nextAssessment);
    setEvaluatedInput(form);
    const added: Transaction = {
      ...form,
      id: `NUEVA-${String(queue.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      riskScore: nextAssessment.score,
      riskLevel: nextAssessment.level,
      fraudActual: false,
    };
    setQueue((current) => [added, ...current]);
  };

  const maxDistribution = Math.max(...distribution.map((item) => item.count));

  return (
    <main className="fraud-page">
      <header className="topbar fraud-nav">
        <a className="brand" href="/" aria-label="GoldGuard, inicio">
          <span className="brand-mark">G</span>
          <span>GOLD<span>//GUARD</span></span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="/">Idea</a>
          <a href="#panel">Panel</a>
          <a href="#modelo">Modelo Python</a>
          <a href="#evidencia">Cartas de evidencia</a>
        </nav>
        <span className="demo-pill">MODO DEMO</span>
        <details className="mobile-section-nav">
          <summary>SECCIONES</summary>
          <nav aria-label="Secciones de la demostración">
            <a href="#panel">Panel</a>
            <a href="#modelo">Modelo</a>
            <a href="#evaluar">Calcular</a>
            <a href="#evidencia">Evidencia</a>
          </nav>
        </details>
      </header>

      <section id="inicio" className="hero">
        <div className="hero-content">
          <p className="hero-kicker"><span></span>SISTEMA DE EVALUACIÓN DE FRAUDE</p>
          <h1>Riesgo de fraude,<br /><em>en contexto.</em></h1>
          <p className="hero-copy">Explora patrones, prioriza alertas y entiende qué señales sostienen cada decisión.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#evaluar">Evaluar transacción <span>→</span></a>
            <span className="hero-data"><strong>10.000</strong> transacciones preparadas</span>
          </div>
        </div>
        <aside className="hero-preview" aria-label="Ejemplo de alerta de riesgo alto">
          <div className="preview-top"><div><span>TRANSACCIÓN</span><strong>TRX-01024</strong></div><small>RECIÉN RECIBIDA</small></div>
          <div className="preview-score"><div><span>NIVEL ESTIMADO</span><strong>Alto</strong></div><b>82</b></div>
          <div className="preview-scale"><i></i><i></i><i></i></div>
          <div className="preview-factors"><p>SEÑALES DETECTADAS</p><div><span className="factor-danger"></span>Dispositivo no reconocido <b>+15</b></div><div><span className="factor-warn"></span>Importe fuera del patrón <b>+16</b></div></div>
          <div className="preview-footer">Requiere verificación manual <span>→</span></div>
        </aside>
      </section>

      <section className="notice" aria-label="Contexto de los datos">
        <span aria-hidden="true">ⓘ</span>
        <p><strong>Datos sintéticos reproducibles.</strong> Esta versión entrena un artefacto de Python con 10.000 transacciones procesadas para demostrar el flujo. Sustituye el CSV y vuelve a ejecutar la corrida antes de la entrega final.</p>
      </section>

      <section id="panel" className="content-section" aria-labelledby="panel-title">
        <div className="section-heading"><div><p className="eyebrow">VISTA GENERAL</p><h2 id="panel-title">El estado del portafolio, en un vistazo.</h2></div><span className="data-status"><i></i> Muestra sintética</span></div>
        <div className="metrics-grid">
          <MetricCard icon="▦" label="Transacciones analizadas" value={modelRun.dataset.processedRows.toLocaleString('es-CO')} detail={`${modelRun.features.selected} variables transformadas`} />
          <MetricCard icon="◉" label="Fraude sintético" value={summary.confirmedFraud.toLocaleString('es-CO')} detail={`${modelPercentage(modelRun.dataset.fraudRate)} del conjunto procesado`} />
          <MetricCard icon="◈" label="Alto riesgo detectado" value={summary.highRisk.toLocaleString('es-CO')} detail="requieren priorización" />
          <MetricCard icon="$" label="Importe promedio" value={currency.format(summary.averageAmount)} detail="por transacción" />
        </div>

        <div className="dashboard-grid">
          <article className="panel-card distribution-card">
            <div className="card-title"><div><h3>Distribución del riesgo</h3><p>Clasificación calculada por el motor de puntuación.</p></div><span className="run-stamp">CORRIDA BASE</span></div>
            <div className="bars">
              {distribution.map((item) => <div className="bar-row" key={item.level}><div className="bar-label"><RiskBadge level={item.level} /><span>{item.count.toLocaleString('es-CO')} transacciones</span></div><div className="bar-track"><div className={`bar-fill ${levelClass[item.level]}`} style={{ width: `${(item.count / maxDistribution) * 100}%` }} /></div></div>)}
            </div>
            <p className="chart-caption">El umbral de revisión prioritaria es {modelPercentage(modelRun.thresholds.high)}.</p>
          </article>
          <article className="panel-card model-card">
            <div className="card-title"><div><h3>Modelo Python de minería</h3><p>{modelRun.run.name} sobre datos sintéticos.</p></div><span className="model-tag">PYTHON + NUMPY</span></div>
            <div className="model-score"><span>{assessment.score}</span><div><strong>Probabilidad de revisión</strong><p>Salida del artefacto entrenado</p></div></div>
            <div className="score-line"><span style={{ width: `${assessment.score}%` }}></span></div>
            <div className="model-legend"><span><i className="dot low"></i>Bajo &lt; {modelPercentage(modelRun.thresholds.medium)}</span><span><i className="dot medium"></i>Medio {modelPercentage(modelRun.thresholds.medium)}–&lt; {modelPercentage(modelRun.thresholds.high)}</span><span><i className="dot high"></i>Alto ≥ {modelPercentage(modelRun.thresholds.high)}</span></div>
          </article>
        </div>
      </section>

      <section id="modelo" className="model-report-section" aria-labelledby="model-report-title">
        <div className="model-report-heading">
          <p className="eyebrow">INFORME DE MINERÍA</p>
          <h2 id="model-report-title">Expediente 10K: de pista a alerta.</h2>
          <p>Una corrida de Python transforma el CSV procesado en un artefacto pequeño que la calculadora puede consultar. No confirma fraude: ordena qué casos merecen revisión primero.</p>
        </div>
        <div className="model-report-layout">
          <ol className="model-story">
            <li><span>01</span><div><strong>Caja de evidencia</strong><p>{modelRun.dataset.rawRows.toLocaleString('es-CO')} registros iniciales pasan a {modelRun.dataset.processedRows.toLocaleString('es-CO')} transacciones limpias.</p></div></li>
            <li><span>02</span><div><strong>Huellas útiles</strong><p>El script conserva {modelRun.features.selected} variables transformadas y evita duplicar señales o filtrar la etiqueta.</p></div></li>
            <li><span>03</span><div><strong>Ensayo controlado</strong><p>Python separa {modelRun.dataset.splits.train.toLocaleString('es-CO')} para entrenar, {modelRun.dataset.splits.validation.toLocaleString('es-CO')} para ajustar y {modelRun.dataset.splits.test.toLocaleString('es-CO')} para probar.</p></div></li>
            <li><span>04</span><div><strong>Alerta explicada</strong><p>La interfaz aplica los pesos exportados y traduce la probabilidad en bajo, medio o alto riesgo.</p></div></li>
          </ol>
          <aside className="model-ledger" aria-label="Resultados de la corrida de prueba">
            <header><span>CORRIDA DE PRUEBA</span><code>{modelRun.run.engine}</code></header>
            <dl className="model-metrics">
              <div><dt>RECALL</dt><dd>{modelPercentage(modelRun.metrics.recall)}</dd><p>recupera {summary.tp} de {summary.tp + summary.fn} fraudes sintéticos.</p></div>
              <div><dt>PRECISIÓN</dt><dd>{modelPercentage(modelRun.metrics.precision)}</dd><p>alertas que luego coinciden con la etiqueta sintética.</p></div>
              <div><dt>F1</dt><dd>{modelPercentage(modelRun.metrics.f1)}</dd><p>equilibra recall y precisión en la prueba reservada.</p></div>
              <div><dt>PR-AUC</dt><dd>{modelPercentage(modelRun.metrics.prAuc)}</dd><p>mide la calidad ante una clase minoritaria.</p></div>
            </dl>
            <p className="model-ledger-note">El umbral alto se eligió en validación: {modelPercentage(modelRun.thresholds.high)}. Por eso no se selecciona el modelo solo por exactitud.</p>
          </aside>
        </div>
        <div className="model-code-map">
          <div><h3>Qué hace el código</h3><p>Cuatro piezas se pasan el testigo sin depender de un banco ni de una API externa.</p></div>
          <ol>
            <li><code>generate-datasets.mjs</code><span>Crea los CSV reproducibles y los problemas iniciales de limpieza.</span></li>
            <li><code>train_fraud_model.py</code><span>Prepara variables, entrena la regresión logística y mide el holdout.</span></li>
            <li><code>model-run.json</code><span>Guarda pesos, umbrales, métricas y una muestra de la corrida.</span></li>
            <li><code>FraudDashboard.tsx</code><span>Muestra la evidencia y calcula nuevas probabilidades en la interfaz.</span></li>
          </ol>
          <p className="model-page-summary"><strong>La página:</strong> presenta la idea, expone el estado de los datos, evalúa una transacción, conserva una cola de prueba y documenta el modelo, la matriz y las señales que justifican la revisión.</p>
        </div>
      </section>

      <section id="evaluar" className="content-section evaluate-section" aria-labelledby="evaluate-title">
        <div className="section-heading"><div><p className="eyebrow">SIMULADOR INTERACTIVO</p><h2 id="evaluate-title">Construye la historia de la transacción.</h2><p className="section-copy">Completa el perfil y mira cómo cada señal cambia el riesgo estimado.</p></div></div>
        <div className="evaluator-layout pixel-calculator">
          <form className="transaction-form calculator-form" onSubmit={evaluate}>
            <div className="form-heading"><span className="form-chip">PASO 01 · PERFIL</span><h3>Datos de la operación</h3><p>Los campos con contexto del cliente mejoran la estimación.</p></div>
            <div className="form-grid">
              <label>Importe (COP)<input type="number" min="0" step="1000" value={form.amount} onChange={(event) => update('amount', Number(event.target.value))} /></label>
              <label>Hora (0–23)<input type="number" min="0" max="23" value={form.hour} onChange={(event) => update('hour', Number(event.target.value))} /></label>
              <label>País<select value={form.country} onChange={(event) => { const selection = COUNTRY_OPTIONS.find((item) => item.name === event.target.value)!; setForm((current) => ({ ...current, country: selection.name, countryRisk: selection.risk })); }}>
                {COUNTRY_OPTIONS.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select></label>
              <label>Categoría<select value={form.merchant} onChange={(event) => update('merchant', event.target.value as MerchantCategory)}>{merchants.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Método de pago<select value={form.paymentMethod} onChange={(event) => update('paymentMethod', event.target.value as TransactionInput['paymentMethod'])}><option>Tarjeta virtual</option><option>Tarjeta física</option><option>Billetera digital</option></select></label>
              <label>Operaciones últimas 24 h<input type="number" min="0" max="30" value={form.transactionCount24h} onChange={(event) => update('transactionCount24h', Number(event.target.value))} /></label>
              <label>Antigüedad de cuenta (días)<input type="number" min="0" value={form.accountAgeDays} onChange={(event) => update('accountAgeDays', Number(event.target.value))} /></label>
              <label>Intentos fallidos<input type="number" min="0" max="20" value={form.failedAttempts} onChange={(event) => update('failedAttempts', Number(event.target.value))} /></label>
              <label className="distance-field"><span>Distancia desde última compra</span><div className="distance-control"><input type="number" min="0" step={distanceUnit === 'm' ? '1' : '0.1'} value={distanceUnit === 'm' ? Math.round(form.distanceKm * 1000) : form.distanceKm} onChange={(event) => { const value = Math.max(0, Number(event.target.value) || 0); update('distanceKm', distanceUnit === 'm' ? value / 1000 : value); }} /><select aria-label="Unidad de distancia" value={distanceUnit} onChange={(event) => setDistanceUnit(event.target.value as DistanceUnit)}><option value="m">m</option><option value="km">km</option></select></div><small>Se convierte internamente a km; también admite trayectos cortos en metros.</small></label>
              <label>Importe / promedio cliente<input type="number" min="0" max="20" step="0.1" value={form.amountVsAverage} onChange={(event) => update('amountVsAverage', Number(event.target.value))} /></label>
            </div>
            <label className="toggle-row">
              <input className="switch-input" type="checkbox" checked={form.deviceTrusted} onChange={(event) => update('deviceTrusted', event.target.checked)} />
              <span className="switch" aria-hidden="true"></span>
              <span className="toggle-copy"><strong>Dispositivo reconocido</strong><span>El cliente ha usado este dispositivo anteriormente.</span></span>
            </label>
            <label className="toggle-row">
              <input className="switch-input" type="checkbox" checked={form.cardPresent} onChange={(event) => update('cardPresent', event.target.checked)} />
              <span className="switch" aria-hidden="true"></span>
              <span className="toggle-copy"><strong>Tarjeta presente</strong><span>La compra se realizó físicamente en el comercio.</span></span>
            </label>
            <button className="primary-button full-button" type="submit">Calcular nivel de riesgo <span>→</span></button>
          </form>

          <aside className={`assessment-card calculator-result ${levelClass[assessment.level]}`} aria-live="polite" aria-atomic="true">
            <p className="eyebrow">PASO 02 · RESULTADO</p>
            <div className="assessment-header"><div className="risk-orb">{assessment.score}</div><div><span className="muted">Nivel estimado</span><h3>Riesgo <RiskBadge level={assessment.level} /></h3><p>Probabilidad orientativa: <strong>{assessment.probability}%</strong></p></div></div>
            <div className="assessment-rule"></div>
            <div className="assessment-dossier"><div className="dossier-heading"><h4>Señales principales</h4><span>IMPACTO</span></div><ul className="reasons reason-list">{assessment.reasons.map((reason) => <li key={reason.label}><span className={`reason-dot ${reason.impact}`}></span><span>{reason.label}</span><b>{reason.impact === 'alto' ? 'ALTO' : 'MEDIO'}</b></li>)}</ul></div>
            <div className="assessment-readout"><p>PERFIL EVALUADO</p><dl><div><dt>Distancia</dt><dd>{formatDistance(evaluatedInput.distanceKm)}</dd></div><div><dt>Actividad</dt><dd>{evaluatedInput.transactionCount24h} / 24 h</dd></div><div><dt>Dispositivo</dt><dd>{evaluatedInput.deviceTrusted ? 'Conocido' : 'Nuevo'}</dd></div><div><dt>Antigüedad</dt><dd>{evaluatedInput.accountAgeDays} días</dd></div></dl></div>
            <div className="recommendation"><span>↗</span><p><strong>Recomendación</strong>{assessment.recommendation}</p></div>
            <p className="fine-print">La puntuación es apoyo a la decisión; una persona debe confirmar los casos relevantes.</p>
          </aside>
        </div>
      </section>

      <section className="content-section" aria-labelledby="queue-title">
        <div className="section-heading table-heading"><div><p className="eyebrow">CONSULTA Y SEGUIMIENTO</p><h2 id="queue-title">Transacciones recientes</h2><p className="section-copy">Cada evaluación nueva queda temporalmente en esta cola durante la demostración.</p></div><div className="queue-actions"><p className="queue-status" aria-live="polite">Mostrando <strong>{visibleRows.length}</strong> de la muestra</p><div className="filter-tabs" role="group" aria-label="Filtrar por nivel de riesgo">{(['Todos', 'Bajo', 'Medio', 'Alto'] as const).map((item) => <button className={filter === item ? 'active' : ''} aria-pressed={filter === item} type="button" onClick={() => setFilter(item)} key={item}>{item}</button>)}</div></div></div>
        <div className="table-shell"><table><thead><tr><th>ID</th><th>Importe</th><th>Comercio</th><th>Origen</th><th>Señal principal</th><th>Riesgo</th></tr></thead><tbody>{visibleRows.length ? visibleRows.map((row) => <tr key={row.id}><td><strong>{row.id}</strong><small>{new Date(row.createdAt).toLocaleDateString('es-CO')}</small></td><td>{currency.format(row.amount)}</td><td>{row.merchant}<small>{row.paymentMethod}</small></td><td>{row.country}</td><td>{row.failedAttempts > 0 ? `${row.failedAttempts} intento(s) fallido(s)` : row.deviceTrusted ? 'Dispositivo conocido' : 'Dispositivo nuevo'}</td><td><RiskBadge level={row.riskLevel} /></td></tr>) : <tr className="empty-row"><td colSpan={6}>No hay transacciones de riesgo {filter} en la muestra actual. Prueba otro filtro o evalúa una nueva operación.</td></tr>}</tbody></table></div>
      </section>

      <section id="evidencia" className="evidence-section" aria-labelledby="evidence-title">
        <div className="evidence-intro"><p className="eyebrow">TRAZABILIDAD DEL PROYECTO</p><h2 id="evidence-title">Evidencia para contar la historia completa de los datos.</h2><p>Estas tarjetas convierten los requisitos de la exposición en una guía concreta. Reemplaza los valores de demostración por las capturas y métricas de la corrida final.</p></div>
        <div className="evidence-grid">
          <article className="evidence-card"><span className="step-number">01</span><h3>Antes y después</h3><div className="quality-comparison"><div><small>Entrada inicial</small><strong>10.438</strong><p>registros<br />nulos · duplicados · formatos mixtos</p></div><span>→</span><div className="clean"><small>Dataset procesado</small><strong>10.000</strong><p>registros<br />{modelRun.features.selected} variables seleccionadas para el modelo</p></div></div><p className="card-note">Conserva ambos archivos y toma una captura de cada perfilado.</p></article>
          <article className="evidence-card feature-evidence"><span className="step-number">02</span><h3>Ingeniería de variables</h3><dl className="feature-definitions"><div><dt>importe</dt><dd>Monto total de la transacción actual (COP).</dd></div><div><dt>promedio_cliente</dt><dd>Promedio de los montos históricos del mismo cliente.</dd></div></dl><div className="feature-formula"><code>importe ÷ promedio_cliente</code><strong>importe_vs_promedio</strong><p>Si vale 3, la compra equivale a tres veces su gasto habitual.</p></div><ul className="feature-list feature-list--compact"><li><b>velocidad_24h</b><span>Cuenta operaciones recientes.</span></li><li><b>es_horario_nocturno</b><span>Identifica actividad entre 23:00 y 05:00.</span></li></ul><p className="card-note">Variables de una muestra sintética: orientan la revisión, no confirman fraude.</p></article>
          <article className="evidence-card findings-evidence"><span className="step-number">03</span><h3>Lectura exploratoria</h3><ol className="exploration-list"><li><b>01</b><span><strong>Importe relativo</strong> · contrasta el valor con el promedio.</span></li><li><b>02</b><span><strong>Velocidad</strong> · revisa acumulación en 24 horas.</span></li><li><b>03</b><span><strong>Geografía</strong> · cruza país y distancia.</span></li><li><b>04</b><span><strong>Horario</strong> · separa actividad nocturna.</span></li><li><b>05</b><span><strong>Fricción</strong> · une fallos y dispositivo nuevo.</span></li></ol><p className="card-note">Convierte cada lectura en un hallazgo con gráfica, evidencia y conclusión.</p></article>
        </div>
      </section>

      <section className="classification-section" aria-labelledby="classification-title">
        <div className="classification-shell">
          <div className="classification-copy">
            <h2 id="classification-title">Cómo se lee la prueba del modelo.</h2>
            <p>La matriz compara la predicción del artefacto con la etiqueta sintética en las {modelRun.dataset.splits.test.toLocaleString('es-CO')} transacciones que Python dejó fuera del entrenamiento. Mide la simulación; no valida fraude bancario real.</p>
            <ul className="classification-notes">
              <li><strong>Recall</strong><span>{modelPercentage(modelRun.metrics.recall)}: reduce los fraudes sintéticos que se dejan pasar.</span></li>
              <li><strong>PR-AUC</strong><span>{modelPercentage(modelRun.metrics.prAuc)}: evalúa una clase minoritaria sin confiar solo en exactitud.</span></li>
              <li><strong>Entrega</strong><span>Compara recall, precisión, F1 y PR-AUC antes de elegir un modelo.</span></li>
            </ul>
          </div>
          <figure className="classification-figure">
            <header><span>MATRIZ DE PRUEBA</span><span>PYTHON + NUMPY</span></header>
            <p className="matrix-explainer">Positivo = revisión alta (probabilidad ≥ {modelPercentage(modelRun.thresholds.high)}); negativo = riesgo bajo o medio.</p>
            <div className="matrix-scroll">
              <div className="confusion pixel-matrix" role="group" aria-label="Matriz de clasificación del holdout sintético">
                <span className="matrix-corner">REAL \ PREDICCIÓN</span><span className="matrix-heading">REVISIÓN ALTA</span><span className="matrix-heading">SIN ALERTA</span><span className="matrix-row-label">FRAUDE</span>
                <div className="matrix-cell matrix-tp"><span>VP</span><b>{summary.tp}</b><small>alertó y era fraude</small></div>
                <div className="matrix-cell matrix-fn"><span>FN · PRIORIDAD</span><b>{summary.fn}</b><small>no alertó y era fraude</small></div>
                <span className="matrix-row-label">SIN FRAUDE</span>
                <div className="matrix-cell matrix-fp"><span>FP</span><b>{summary.fp}</b><small>alertó sin confirmar</small></div>
                <div className="matrix-cell matrix-tn"><span>VN</span><b>{summary.tn}</b><small>permitió sin alerta</small></div>
              </div>
            </div>
            <figcaption>Holdout sintético reservado: la etiqueta final sigue siendo una demostración, no una confirmación bancaria.</figcaption>
          </figure>
        </div>
      </section>

      <section className="evidence-section signal-evidence-section" aria-labelledby="signals-title">
        <div className="findings-block"><div className="findings-copy"><p className="eyebrow">6 SEÑALES DE REVISIÓN</p><h2 id="signals-title">Señales que justifican una revisión.</h2><p className="reference-note">Cada ficha conecta una pista de prevención publicada por Bank of America con una variable didáctica que sí entra en este modelo; una señal aislada no confirma fraude.</p><a className="source-link" href="https://business.bankofamerica.com/en/resources/protect-your-small-business-from-ecommerce-fraud" target="_blank" rel="noreferrer">Abrir fuente primaria <ExternalArrow /></a></div><div className="source-cards">{bankRiskSignals.map((signal, index) => <article className="source-card" key={signal.title}><div className="source-card__emblem"><SignalIcon glyph={signal.glyph} /></div><header className="source-card__header"><span className="source-index">SEÑAL 0{index + 1}</span><span className="source-tag">{signal.tag}</span></header><h3>{signal.title}</h3><p className="source-card__detail">{signal.detail}</p><dl className="source-card__mapping"><div><dt>VARIABLE DEL MODELO</dt><dd><code>{signal.feature}</code></dd></div></dl><a className="source-card__action" aria-label={`Abrir la fuente de Bank of America para ${signal.title}`} href="https://business.bankofamerica.com/en/resources/protect-your-small-business-from-ecommerce-fraud" target="_blank" rel="noreferrer"><span>Consultar fuente</span><ExternalArrow /></a></article>)}</div></div>
      </section>

      <footer><span className="brand"><span className="brand-mark">◈</span><span>Fraud<span>Lens</span></span></span><p>Proyecto integrador · Detección y evaluación de fraude</p><a href="#inicio">Volver arriba ↑</a></footer>
    </main>
  );
}
