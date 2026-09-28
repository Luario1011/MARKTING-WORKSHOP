export default function IdeaPresentation() {
  return (
    <main className="idea-page">
      <header className="idea-nav">
        <a className="idea-brand" href="/" aria-label="GoldGuard, inicio"><span>G</span>GOLD//GUARD</a>
        <nav aria-label="Navegación de la presentación"><a href="#idea">La idea</a><a href="#flujo">Cómo funciona</a><a href="#fuentes">Fuentes</a></nav>
        <a className="pixel-button small" href="/fraude">Abrir simulador ↗</a>
      </header>

      <section id="idea" className="idea-hero">
        <div className="pixel-spark spark-one"></div><div className="pixel-spark spark-two"></div><div className="pixel-spark spark-three"></div>
        <div className="idea-copy">
          <p className="pixel-kicker">[ PROYECTO INTEGRADOR · DATA MINING ]</p>
          <h1>EL ORO ESTÁ<br />EN LA <em>SEÑAL.</em></h1>
          <p>GoldGuard convierte transacciones en pistas claras: detecta patrones, calcula un nivel de riesgo y explica por qué una operación necesita revisión.</p>
          <div className="idea-actions"><a className="pixel-button" href="/fraude">Probar calculadora <span>→</span></a><span><b>10K</b> transacciones para explorar</span></div>
        </div>
        <div className="pixel-stage" aria-label="Ejemplo visual de una transacción evaluada">
          <div className="stage-grid"></div>
          <div className="pixel-coin"><span>G</span><i></i><i></i><i></i><i></i></div>
          <div className="floating-ticket ticket-one"><small>RIESGO</small><strong>ALTO</strong><b>82%</b></div>
          <div className="floating-ticket ticket-two"><small>SEÑAL</small><strong>DISPOSITIVO<br />NUEVO</strong><b>+15</b></div>
          <div className="floating-ticket ticket-three"><small>DATASET</small><strong>10.000</strong><b>LISTO</b></div>
        </div>
      </section>

      <section id="flujo" className="idea-flow">
        <div className="flow-heading"><p className="pixel-kicker">[ DEL DATO A LA DECISIÓN ]</p><h2>Una ruta visible, no una caja negra.</h2><p>Cada paso deja evidencia para el reporte y para la exposición.</p></div>
        <div className="pixel-steps">
          <article><span className="step-pixel">01</span><div className="step-icon">▦</div><h3>Preparamos</h3><p>Conservamos datos originales, limpiamos errores y construimos variables útiles.</p><code>raw → clean</code></article>
          <article><span className="step-pixel">02</span><div className="step-icon">⌁</div><h3>Descubrimos</h3><p>Buscamos desvíos de importe, velocidad, ubicación y comportamiento.</p><code>patterns</code></article>
          <article><span className="step-pixel">03</span><div className="step-icon">◆</div><h3>Explicamos</h3><p>Traducimos la puntuación en bajo, medio o alto riesgo con razones legibles.</p><code>decision</code></article>
        </div>
      </section>

      <section id="fuentes" className="idea-source-banner">
        <div><p className="pixel-kicker">[ RIESGO CON RESPALDO ]</p><h2>Las señales no salen de la nada.</h2><p>El simulador conecta variables del dataset con seis alertas publicadas por Bank of America y factores de monitoreo descritos por Chase.</p></div>
        <a className="pixel-button inverted" href="/fraude#evidencia">Ver cartas de evidencia <span>→</span></a>
      </section>

      <footer className="idea-footer"><span>GOLD//GUARD © 2026</span><a href="/fraude">Simulador de riesgo ↗</a><span>HECHO PARA APRENDER CON DATOS</span></footer>
    </main>
  );
}
