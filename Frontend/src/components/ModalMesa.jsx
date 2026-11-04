import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './ModalMesa.module.css';

const KIT_BASE_MESA = [
  { nombre: 'DESARMADORES (CRUZ Y PLANO)', cantidad_ideal: 2 },
  { nombre: 'PINZAS (CORTE Y PUNTA)', cantidad_ideal: 2 },
  { nombre: 'PLANTILLA', cantidad_ideal: 1 },
  { nombre: 'CAIMANES', cantidad_ideal: 4 },
  { nombre: 'PUNTAS DE OSCILOSCOPIO', cantidad_ideal: 2 },
  { nombre: 'PUNTA DE GENERADOR', cantidad_ideal: 1 },
  { nombre: 'PUNTAS FUENTE O MULTÍMETRO', cantidad_ideal: 4 }
];

const parsearKit = (kitObj) => {
  if (!kitObj) return [];
  let obj = kitObj;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch (e) {}
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch (e) {}
    }
  }
  if (Array.isArray(obj)) {
    return obj.map(item => ({
      nombre: item.nombre || 'Accesorio',
      cantidad_ideal: item.cantidad_ideal ?? 1
    }));
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, item]) => {
        if (typeof item !== 'object' || item === null) {
          return { nombre: key, cantidad_ideal: 1 };
        }
        return {
          nombre: item.nombre || key,
          cantidad_ideal: item.cantidad_ideal ?? 1
        };
      });
  }
  return [];
};

const leerUsarTimer = (kitObj) => {
  if (!kitObj) return true;
  let obj = kitObj;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch (e) {}
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch (e) {}
    }
  }
  if (typeof obj === 'object' && obj !== null && '_usar_timer' in obj) {
    return Boolean(obj._usar_timer);
  }
  return true;
};

export default function ModalMesa({ onClose, onSaveSuccess, mesaAEditar = null }) {
  const [modelos, setModelos] = useState([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const qrRef = useRef();
  const esEdicion = !!mesaAEditar;

  const [form, setForm] = useState({
    numero: '', 
    osciloscopio_id: '', 
    fuente_id: '', 
    multimetro1_id: '', 
    multimetro2_id: '', 
    generador_id: ''
  });

  const [kitList, setKitList] = useState(KIT_BASE_MESA);
  const [usarTimer, setUsarTimer] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Carga los modelos disponibles y rellena el formulario si está en modo edición
  useEffect(() => {
    async function cargarDatos() {
      try {
        const res = await fetch('http://localhost:3000/api/modelos');
        setModelos(await res.json());
        if (esEdicion) {
          setForm({
            numero: mesaAEditar.numero_mesa,
            osciloscopio_id: mesaAEditar.osciloscopio_id || mesaAEditar.osciloscopio?.id || '',
            fuente_id: mesaAEditar.fuente_id || mesaAEditar.fuente?.id || '',
            multimetro1_id: mesaAEditar.multimetro1_id || mesaAEditar.multimetro1?.id || '',
            multimetro2_id: mesaAEditar.multimetro2_id || mesaAEditar.multimetro2?.id || '',
            generador_id: mesaAEditar.generador_id || mesaAEditar.generador?.id || ''
          });
          const kitActual = parsearKit(mesaAEditar.kit_accesorios);
          setKitList(kitActual.length > 0 ? kitActual : KIT_BASE_MESA);
          setUsarTimer(leerUsarTimer(mesaAEditar.kit_accesorios));
        } else {
          setKitList(KIT_BASE_MESA.map(item => ({ ...item })));
          setUsarTimer(true);
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setCargandoModelos(false); 
      }
    }
    cargarDatos();
  }, [esEdicion, mesaAEditar]);

  const agregarItemKit = () => {
    setKitList([...kitList, { nombre: '', cantidad_ideal: 1 }]);
  };

  const actualizarItemKit = (index, campo, valor) => {
    const nuevaLista = [...kitList];
    nuevaLista[index][campo] = valor;
    setKitList(nuevaLista);
  };

  const eliminarItemKit = (index) => {
    setKitList(kitList.filter((_, i) => i !== index));
  };

  const generatedId = esEdicion ? mesaAEditar.id : `MESA-${form.numero.toString().padStart(2, '0')}`;
  const qrValue = `${import.meta.env.VITE_ALUMNO_APP_URL || 'http://localhost:5173'}/mesa/${generatedId}`;

  // Envía los datos actualizados o el nuevo registro de la mesa
  const handleSubmit = async (e) => {
    const token = localStorage.getItem('token');
    e.preventDefault();
    setGuardando(true);
    try {
      const kitJSON = { _usar_timer: usarTimer };
      kitList.forEach(item => {
        if (item.nombre && item.nombre.trim() !== '') {
          const idInterno = item.nombre.trim().toLowerCase().replace(/\s+/g, '_');
          kitJSON[idInterno] = {
            nombre: item.nombre.trim(),
            cantidad_ideal: Number(item.cantidad_ideal) || 1
          };
        }
      });

      const res = await fetch(esEdicion ? `http://localhost:3000/api/mesas/${mesaAEditar.id}` : 'http://localhost:3000/api/mesas', {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: generatedId,
          numero_mesa: parseInt(form.numero),
          osciloscopio_id: form.osciloscopio_id || null,
          fuente_id: form.fuente_id || null,
          multimetro1_id: form.multimetro1_id || null,
          multimetro2_id: form.multimetro2_id || null,
          generador_id: form.generador_id || null,
          kit_accesorios: kitJSON
        })
      });
      if (!res.ok) throw new Error('Error al guardar mesa');
      onSaveSuccess(); 
      onClose();
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setGuardando(false); 
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.btnClose} onClick={onClose}>&times;</button>
        <h2 className={styles.title}>{esEdicion ? `Editando Mesa ${form.numero}` : 'Registrar Mesa'}</h2>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.gridForm}>
            <div className={styles.inputGroup}>
              <label>Número de Mesa</label>
              <input 
                type="number" 
                value={form.numero} 
                onChange={(e) => setForm({...form, numero: e.target.value})} 
                disabled={esEdicion} 
                required 
              />
            </div>
            
            {['osciloscopio', 'fuente', 'generador'].map(tipo => (
              <div className={styles.inputGroup} key={tipo}>
                <label>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</label>
                <select 
                  name={`${tipo}_id`} 
                  value={form[`${tipo}_id`]} 
                  onChange={(e) => setForm({...form, [e.target.name]: e.target.value})}
                >
                  <option value="">-- No asignado --</option>
                  {modelos
                    .filter(m => m.tipo_equipo === tipo)
                    .map(m => <option key={m.id} value={m.id}>{m.marca} {m.nombre_modelo}</option>)
                  }
                </select>
              </div>
            ))}
            
            <div className={styles.inputGroup}>
              <label>Multímetro 1</label>
              <select 
                value={form.multimetro1_id} 
                onChange={(e) => setForm({...form, multimetro1_id: e.target.value})}
              >
                <option value="">-- No asignado --</option>
                {modelos
                  .filter(m => m.tipo_equipo === 'multimetro')
                  .map(m => <option key={m.id} value={m.id}>{m.marca} {m.nombre_modelo}</option>)
                }
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Multímetro 2</label>
              <select 
                value={form.multimetro2_id} 
                onChange={(e) => setForm({...form, multimetro2_id: e.target.value})}
              >
                <option value="">-- No asignado --</option>
                {modelos
                  .filter(m => m.tipo_equipo === 'multimetro')
                  .map(m => <option key={m.id} value={m.id}>{m.marca} {m.nombre_modelo}</option>)
                }
              </select>
            </div>
          </div>

          {/* Configuración de Temporizador de Corte de Clase */}
          <div className={styles.timerConfigBox}>
            <label className={styles.timerSwitchLabel}>
              <input
                type="checkbox"
                checked={usarTimer}
                onChange={(e) => setUsarTimer(e.target.checked)}
              />
              <div>
                <strong>Usar temporizador de fin de clase (Bloques de 2h: 8:00 a 18:00)</strong>
                <p>
                  Si está activo, la sesión del alumno mostrará la cuenta regresiva y pasará automáticamente a Revisión 15 min antes del fin de clase (09:45, 11:45, 13:45, 15:45, 17:45).
                </p>
              </div>
            </label>
          </div>

          {/* Sección de edición de materiales genéricos / kit de accesorios */}
          <div className={styles.kitSection}>
            <div className={styles.kitHeader}>
              <label>Materiales y Accesorios de la Mesa (CANT. / DESCRIPCIÓN)</label>
              <button type="button" onClick={agregarItemKit} className={styles.btnAddKit}>
                + Añadir Material
              </button>
            </div>
            <div className={styles.kitList}>
              {kitList.map((item, idx) => (
                <div key={idx} className={styles.kitRow}>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad_ideal}
                    onChange={(e) => actualizarItemKit(idx, 'cantidad_ideal', e.target.value)}
                    className={styles.kitCantInput}
                    title="Cantidad"
                  />
                  <input
                    type="text"
                    value={item.nombre}
                    onChange={(e) => actualizarItemKit(idx, 'nombre', e.target.value)}
                    placeholder="Ej. DESARMADORES (CRUZ Y PLANO)"
                    className={styles.kitDescInput}
                  />
                  <button
                    type="button"
                    onClick={() => eliminarItemKit(idx)}
                    className={styles.btnRemoveKit}
                    title="Quitar material"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

          {/* Sección de visualización y descarga del código QR */}
          <div className={styles.qrSection}>
            <p className={styles.qrPreviewTitle}>Código QR de Mesa</p>
            <div ref={qrRef} className={styles.qrBox}>
              <QRCodeCanvas value={qrValue} size={120} level={"H"} />
            </div>
            <button 
              type="button" 
              className={styles.btnDownloadQR} 
              onClick={() => {
                const canvas = qrRef.current.querySelector('canvas');
                const link = document.createElement('a');
                link.download = `QR_${generatedId}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Descargar PNG
            </button>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnSave} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar Datos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}