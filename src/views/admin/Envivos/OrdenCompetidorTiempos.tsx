// OrdenCompetidorTiempos.tsx
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/AdminOrdenYPesos.module.css';

type Competencia = { id_competencia: number; nombre: string; };
type Competidor = {
  id_competidor: number; nombre: string; apellidos: string; peso: string | number; edad: number;
  categoria: string; telefono?: string; correo?: string; pagado?: string; id_competencia?: number;
  fecha_inscripcion?: string; nombre_competencia?: string;
};
type OrdenItem = { id_competidor: number; orden: number; tiempo_por_ejercicio: number; estado?: string; };

const EJERCICIOS = [
  { id: 1, nombre: 'Press Banca' },
  { id: 2, nombre: 'Sentadilla' },
  { id: 3, nombre: 'Peso Muerto' },
];

export default function OrdenCompetidorTiempos() {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [selectedCompetencia, setSelectedCompetencia] = useState<number | null>(null);
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [orden, setOrden] = useState<OrdenItem[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros y UI state
  const [q, setQ] = useState('');
  const [pesoMin, setPesoMin] = useState<string>('');
  const [pesoMax, setPesoMax] = useState<string>('');
  const [selectedCompetidor, setSelectedCompetidor] = useState<Competidor | null>(null);
  const [pesos, setPesos] = useState<Record<string, Record<number, Record<number, string>>>>({});

  useEffect(() => { fetchCompetencias(); }, []);

  // Cuando cambia la competencia: cargar competidores y luego la orden (sin carreras)
  useEffect(() => {
    if (selectedCompetencia === null) {
      setCompetidores([]);
      setOrden([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const comps = await fetchCompetidores(selectedCompetencia); // retorna array
        await fetchOrden(selectedCompetencia, comps);
      } catch (err) {
        console.error('load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompetencia]);

  // --- Fetchers ---

  async function fetchCompetencias() {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/competenciasadmin');
      const data = await res.json();
      setCompetencias(data || []);
    } catch (err) {
      console.error('fetchCompetencias:', err);
      setCompetencias([]);
    } finally {
      setLoading(false);
    }
  }

  // ahora retorna la lista para que quien llame pueda usarla inmediatamente
  async function fetchCompetidores(id_competencia: number): Promise<Competidor[]> {
    try {
      const res = await fetch(`http://localhost:3001/api/competidor?competenciaId=${id_competencia}`);
      const data: Competidor[] = await res.json();
      setCompetidores(data || []);

      // Inicializa estructura de pesos si no existe
      setPesos((prev) => {
        const p: any = {};
        (data || []).forEach((c) => {
          const key = String(c.id_competidor);
          p[key] = {};
          EJERCICIOS.forEach((ej) => { p[key][ej.id] = { 1: '', 2: '', 3: '' }; });
        });
        return { ...p, ...prev };
      });

      return data || [];
    } catch (err) {
      console.error('fetchCompetidores:', err);
      setCompetidores([]);
      return [];
    }
  }

  // fetchOrden acepta opcionalmente la lista de competidores para crear fallback correcto
  async function fetchOrden(id_competencia: number, compsForFallback?: Competidor[]) {
    try {
      const res = await fetch(`http://localhost:3001/api/orden/${id_competencia}/orden`);
      if (!res.ok) {
        // no hay orden guardada: crear por defecto usando la lista de competidores (si la tenemos)
        const comps = compsForFallback ?? competidores;
        if (comps && comps.length) {
          const defaultOrden = comps.map((c, i) => ({ id_competidor: c.id_competidor, orden: i + 1, tiempo_por_ejercicio: 60 }));
          setOrden(defaultOrden);
        } else {
          setOrden([]);
        }
        return;
      }
      const data: OrdenItem[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setOrden(data.map((it, idx) => ({ ...it, orden: it.orden ?? idx + 1 })));
      } else {
        // fallback: generar por competidores actuales
        const comps = compsForFallback ?? competidores;
        if (comps && comps.length) {
          setOrden(comps.map((c, i) => ({ id_competidor: c.id_competidor, orden: i + 1, tiempo_por_ejercicio: 60 })));
        } else {
          setOrden([]);
        }
      }
    } catch (err) {
      console.error('fetchOrden:', err);
      const comps = compsForFallback ?? competidores;
      if (comps && comps.length) {
        setOrden(comps.map((c, i) => ({ id_competidor: c.id_competidor, orden: i + 1, tiempo_por_ejercicio: 60 })));
      } else {
        setOrden([]);
      }
    }
  }

  // --- Drag & Drop & orden manip ---
  function onDragStart(e: React.DragEvent, index: number) { e.dataTransfer.setData('text/plain', String(index)); }
  function onDrop(e: React.DragEvent, dropIndex: number) {
    const dragIndex = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(dragIndex)) return;
    const newOrden = [...orden];
    const [moved] = newOrden.splice(dragIndex, 1);
    newOrden.splice(dropIndex, 0, moved);
    setOrden(newOrden.map((it, idx) => ({ ...it, orden: idx + 1 })));
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function moveUp(i: number) { if (i === 0) return; const newOrden = [...orden]; [newOrden[i - 1], newOrden[i]] = [newOrden[i], newOrden[i - 1]]; setOrden(newOrden.map((it, idx) => ({ ...it, orden: idx + 1 }))); }
  function moveDown(i: number) { if (i === orden.length - 1) return; const newOrden = [...orden]; [newOrden[i + 1], newOrden[i]] = [newOrden[i], newOrden[i + 1]]; setOrden(newOrden.map((it, idx) => ({ ...it, orden: idx + 1 }))); }

  // --- Guardado ---
  async function saveOrden() {
    if (!selectedCompetencia) return alert('Selecciona competencia');
    if (!Array.isArray(orden) || orden.length === 0) return alert('No hay orden para guardar');
    try {
      const res = await fetch(`http://localhost:3001/api/orden/${selectedCompetencia}/orden`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orden })
      });
      if (!res.ok) {
        const t = await res.text().catch(() => ''); throw new Error(t || 'Error guardando orden');
      }
      alert('Orden guardada correctamente');
      await fetchOrden(selectedCompetencia);
    } catch (err) {
      console.error('saveOrden:', err);
      alert('Error guardando orden');
    }
  }

  // --- Pesos ---
  function handlePesoChange(id_competidor: number, id_ejercicio: number, intento: number, value: string) {
    setPesos((prev) => {
      const copy = { ...prev } as any;
      const key = String(id_competidor);
      if (!copy[key]) copy[key] = {};
      if (!copy[key][id_ejercicio]) copy[key][id_ejercicio] = { 1: '', 2: '', 3: '' };
      copy[key][id_ejercicio][intento] = value;
      return copy;
    });
  }
  async function savePesosForCompetidor(id_competidor: number) {
    if (!selectedCompetencia) return alert('Selecciona competencia');
    const payload: any[] = [];
    const key = String(id_competidor);
    if (!pesos[key]) return alert('No hay pesos para este competidor');
    for (const ejIdStr of Object.keys(pesos[key])) {
      const ejId = Number(ejIdStr);
      for (const intentoStr of Object.keys(pesos[key][ejId])) {
        const intento = Number(intentoStr);
        const pesoVal = String(pesos[key][ejId][intento]).trim();
        if (pesoVal !== '') payload.push({ id_competencia: selectedCompetencia, id_competidor, id_ejercicio: ejId, intento, peso: pesoVal });
      }
    }
    if (payload.length === 0) return alert('No hay valores para guardar');
    try {
      const res = await fetch(`http://localhost:3001/api/orden/${selectedCompetencia}/pesos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pesos: payload })
      });
      if (!res.ok) {
        const t = await res.text().catch(() => ''); throw new Error(t || 'Error guardando pesos');
      }
      alert('Pesos guardados');
      await fetchOrden(selectedCompetencia);
    } catch (err) {
      console.error('savePesosForCompetidor:', err);
      alert('Error guardando pesos');
    }
  }

  // --- Control de tiempo ---
  async function controlAction(action: 'start' | 'pause' | 'resume' | 'next', id_competidor: number) {
    if (!selectedCompetencia) return;
    try {
      const res = await fetch(`http://localhost:3001/api/orden/${selectedCompetencia}/orden/${id_competidor}/${action}`, { method: 'PATCH' });
      if (!res.ok) {
        const t = await res.text().catch(() => ''); throw new Error(t || 'Error en control');
      }
      await res.json().catch(() => ({}));
      alert('Acción ejecutada: ' + action);
      await fetchOrden(selectedCompetencia);
    } catch (err) {
      console.error('controlAction:', err);
      alert('Error en control');
    }
  }

  // Filtros
  const filteredCompetidores = competidores.filter((c) => {
    const full = (c.nombre + ' ' + c.apellidos).toLowerCase();
    const matchesQ = q.trim() === '' ? true : full.includes(q.toLowerCase());
    const pesoNum = Number(c.peso);
    const minOk = pesoMin.trim() === '' ? true : pesoNum >= Number(pesoMin);
    const maxOk = pesoMax.trim() === '' ? true : pesoNum <= Number(pesoMax);
    return matchesQ && minOk && maxOk;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}><h1>Administración: Orden y Pesos</h1></header>

      <section className={styles.controls}>
        <div className={styles.selectWrap}>
          <label>Competencia</label>
          <select value={selectedCompetencia ?? ''} onChange={(e) => setSelectedCompetencia(e.target.value ? Number(e.target.value) : null)}>
            <option value="">-- Seleccione --</option>
            {competencias.map((c) => <option key={c.id_competencia} value={c.id_competencia}>{c.nombre}</option>)}
          </select>
        </div>

        <div className={styles.searchWrap}>
          <input placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} className={styles.input} />
          <div className={styles.pesoFilters}>
            <input placeholder="Peso min" value={pesoMin} onChange={(e) => setPesoMin(e.target.value)} className={styles.inputSmall} />
            <input placeholder="Peso max" value={pesoMax} onChange={(e) => setPesoMax(e.target.value)} className={styles.inputSmall} />
          </div>
        </div>
      </section>

      {loading && <div className={styles.loading}>Cargando...</div>}

      <main className={styles.main}>
        <div className={styles.left}>
          <div className={styles.ordenHeader}>
            <h2>Orden de participación</h2>
            <div className={styles.actionButtons}><button className={styles.primary} onClick={saveOrden}>Guardar orden</button></div>
          </div>

          <div className={styles.ordenList}>
            {orden.map((item, i) => {
              const comp = competidores.find((c) => c.id_competidor === item.id_competidor);
              if (!comp) return null;
              if (!filteredCompetidores.find((x) => x.id_competidor === comp.id_competidor)) return null;
              return (
                <div key={item.id_competidor} className={styles.ordenItem} draggable onDragStart={(e) => onDragStart(e, i)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, i)}>
                  <div className={styles.itemLeft} onClick={() => setSelectedCompetidor(comp)}>
                    <div className={styles.ordenBadge}>{item.orden}</div>
                    <div>
                      <div className={styles.name}>{comp.nombre} {comp.apellidos}</div>
                      <div className={styles.meta}>Peso: {comp.peso} kg · {comp.categoria}</div>
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <input type="number" value={item.tiempo_por_ejercicio} onChange={(e) => { const t = Number(e.target.value); setOrden((prev) => prev.map((x) => x.id_competidor === item.id_competidor ? { ...x, tiempo_por_ejercicio: t } : x)); }} className={styles.timeInput} />
                    <div className={styles.controlsSmall}>
                      <button onClick={() => moveUp(i)}>▲</button>
                      <button onClick={() => moveDown(i)}>▼</button>
                      <button onClick={() => controlAction('start', item.id_competidor)}>Start</button>
                      <button onClick={() => controlAction('pause', item.id_competidor)}>Pause</button>
                      <button onClick={() => controlAction('resume', item.id_competidor)}>Resume</button>
                      <button onClick={() => controlAction('next', item.id_competidor)}>Next</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {orden.length === 0 && <div className={styles.empty}>No hay competidores para esta competencia.</div>}
          </div>
        </div>

        <aside className={styles.right}>
          <h3>Asignar Pesos</h3>
          <p className={styles.help}>Haz click en un competidor a la izquierda para editar sus pesos por ejercicio (3 intentos).</p>

          {selectedCompetidor ? (
            <div className={styles.selectedCard}>
              <div className={styles.selectedHeader}>
                <div>
                  <div className={styles.nameLarge}>{selectedCompetidor.nombre} {selectedCompetidor.apellidos}</div>
                  <div className={styles.meta}>Peso corporal: {selectedCompetidor.peso} kg · {selectedCompetidor.categoria}</div>
                </div>
                <button className={styles.closeBtn} onClick={() => setSelectedCompetidor(null)}>Cerrar</button>
              </div>

              <div className={styles.pesosGrid}>
                {EJERCICIOS.map((ej) => (
                  <div key={ej.id} className={styles.ejercicioCard}>
                    <div className={styles.ejercicioTitle}>{ej.nombre}</div>
                    <div className={styles.intentosRow}>
                      {[1,2,3].map((intento) => (
                        <div key={intento} className={styles.intentoBox}>
                          <label className={styles.intentoLabel}>Intento {intento}</label>
                          <input type="number" value={(pesos[String(selectedCompetidor.id_competidor)]?.[ej.id]?.[intento]) ?? ''} onChange={(e) => handlePesoChange(selectedCompetidor.id_competidor, ej.id, intento, e.target.value)} className={styles.pesoInput} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.footerActions}>
                <button className={styles.primary} onClick={() => savePesosForCompetidor(selectedCompetidor.id_competidor)}>Guardar pesos</button>
                <button onClick={() => { const key = String(selectedCompetidor.id_competidor); const copy = { ...pesos }; if (!copy[key]) copy[key] = {}; EJERCICIOS.forEach(ej => { copy[key][ej.id] = { 1: '100', 2: '105', 3: '110' }; }); setPesos(copy); }}>Auto llenar (demo)</button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyRight}>Selecciona un competidor para asignar pesos.</div>
          )}
        </aside>
      </main>
    </div>
  );
}
