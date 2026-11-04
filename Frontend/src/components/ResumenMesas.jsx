import { useState, useEffect, useCallback } from 'react';
import styles from './ResumenMesas.module.css';

export default function ResumenMesas() {
  const [mesas, setMesas] = useState([]);
  const [sesionesActivas, setSesionesActivas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todas'); 
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  // Estados locales para la edición de notas de mantenimiento y kits de accesorios
  const [editNotas, setEditNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [editKitList, setEditKitList] = useState([]);
  const [editUsarTimer, setEditUsarTimer] = useState(true);

  // Carga paralela de mesas y sesiones activas utilizando el token del administrador
  const cargarDatos = useCallback(async () => {
    try {
      const tokenActual = localStorage.getItem('token'); 
      const [resMesas, resSesiones] = await Promise.all([
        fetch('http://localhost:3000/api/mesas'),
        fetch('http://localhost:3000/api/sesiones', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenActual}` 
          }
        })
      ]);

      if (!resSesiones.ok) return;

      const dataMesas = await resMesas.json();
      const dataSesiones = await resSesiones.json();
      setMesas(dataMesas.sort((a, b) => a.id.localeCompare(b.id)));
      setSesionesActivas(dataSesiones.filter(s => ['solicitada', 'activa', 'finalizada_alumno'].includes(s.estado_sesion)));
    } catch (e) { 
      console.error(e); 
    } finally { 
      setCargando(false); 
    }
  }, []);

  // Intervalo para actualizar el estado del mapa en tiempo real
  useEffect(() => {
    cargarDatos();
    const i = setInterval(cargarDatos, 5000);
    return () => clearInterval(i);
  }, [cargarDatos]);

  // Retorna el esquema de color adecuado para representar el estado en el mapa
  const obtenerColorMesa = (est) => {
    if (['ocupada', 'en_uso'].includes(est)) return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' };
    if (est === 'en_peticion') return { bg: '#fefce8', border: '#eab308', text: '#854d0e' };
    return { bg: '#f0fdf4', border: '#22c55e', text: '#166534' };
  };

  const agregarItemKit = () => {
    setEditKitList([...editKitList, { nombre: '', cantidad_ideal: 1 }]);
  };

  const actualizarItemKit = (index, campo, valor) => {
    const nuevaLista = [...editKitList];
    nuevaLista[index][campo] = valor;
    setEditKitList(nuevaLista);
  };

  const eliminarItemKit = (index) => {
    const nuevaLista = editKitList.filter((_, i) => i !== index);
    setEditKitList(nuevaLista);
  };

  // Procesa y serializa el kit interactivo a JSON para guardarlo en la base de datos
  const handleGuardarCambios = async () => {
    setGuardando(true);
    try {
      const tokenActual = localStorage.getItem('token');
      const kitJSON = { _usar_timer: editUsarTimer };
      
      editKitList.forEach(item => {
        if (item.nombre.trim() !== '') {
          const idInterno = item.nombre.trim().toLowerCase().replace(/\s+/g, '_');
          kitJSON[idInterno] = {
            nombre: item.nombre.trim(),
            cantidad_ideal: Number(item.cantidad_ideal) || 1
          };
        }
      });

      const res = await fetch(`http://localhost:3000/api/mesas/${mesaSeleccionada.mesa.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenActual}` 
        },
        body: JSON.stringify({
          notas_mantenimiento: editNotas,
          kit_accesorios: kitJSON 
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor: ${res.status}`);
      }
      
      cargarDatos();
      setMesaSeleccionada(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Abre el panel de control de la mesa parseando las notas y el kit de accesorios
  const abrirModalMesa = (m, ses) => {
    setMesaSeleccionada({ mesa: m, sesion: ses });
    setEditNotas(m.notas_mantenimiento || "");
    
    let kitObj = m.kit_accesorios;
    if (!kitObj) {
      setEditKitList([]);
      return;
    }

    // Deserialización segura del kit de accesorios
    if (typeof kitObj === 'string') {
      try { kitObj = JSON.parse(kitObj); } catch (e) {}
      if (typeof kitObj === 'string') {
        try { kitObj = JSON.parse(kitObj); } catch (e) {}
      }
    }

    let kitArreglo = [];
    if (Array.isArray(kitObj)) {
      setEditUsarTimer(true);
      kitArreglo = kitObj.map(item => ({
        nombre: item.nombre || 'Accesorio',
        cantidad_ideal: item.cantidad_ideal || 1
      }));
    } else if (typeof kitObj === 'object' && kitObj !== null) {
      setEditUsarTimer('_usar_timer' in kitObj ? Boolean(kitObj._usar_timer) : true);
      kitArreglo = Object.entries(kitObj)
        .filter(([key]) => !key.startsWith('_'))
        .map(([key, item]) => {
          if (typeof item !== 'object' || item === null) {
            return { nombre: key, cantidad_ideal: 1 };
          }
          return {
            nombre: item.nombre || key,
            cantidad_ideal: item.cantidad_ideal || 1
          };
        });
    }
    setEditKitList(kitArreglo);
  };

  return (
    <div className={styles.contenedorPrincipal}>
      
      <div className={styles.encabezado}>
        <h2>Mapa del Laboratorio</h2>
        <div className={styles.filtros}>
          {['todas', 'disponible', 'ocupada'].map(f => (
            <button 
              key={f} 
              onClick={() => setFiltro(f)} 
              className={`${styles.btnFiltro} ${filtro === f ? styles.btnFiltroActivo : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid del mapa de mesas físico */}
      <div className={styles.gridMesas}>
        {mesas.filter(m => filtro === 'todas' || m.estado_actual === filtro).map(m => {
          const col = obtenerColorMesa(m.estado_actual);
          const ses = sesionesActivas.find(s => s.mesa_id === m.id);
          
          return (
            <div 
              key={m.id} 
              onClick={() => abrirModalMesa(m, ses)} 
              className={styles.mesaCard}
              style={{ background: col.bg, borderColor: col.border }}
            >
              <div className={styles.mesaTitulo} style={{ color: col.text }}>
                Mesa {m.id.replace(/MESA[-_ ]?/i, '').padStart(2, '0')}
              </div>
              <div className={styles.mesaEstado} style={{ color: col.text }}>
                {m.estado_actual.replace('_', ' ').toUpperCase()}
              </div>
              
              {ses && (
                <div className={styles.mesaUsuario}>
                  👤 {ses.nombre_alumno.split(' ')[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de administración y consulta de mesa */}
      {mesaSeleccionada && (
        <div className={styles.modalOverlay} onClick={() => setMesaSeleccionada(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
              <h3>Detalles Mesa {mesaSeleccionada.mesa.id.replace(/MESA[-_ ]?/i, '')}</h3>
              <button onClick={() => setMesaSeleccionada(null)} className={styles.btnCerrarModal}>&times;</button>
            </div>
            
            <div className={styles.equiposGrid}>
              {[
                mesaSeleccionada.mesa.osciloscopio, 
                mesaSeleccionada.mesa.multimetro1, 
                mesaSeleccionada.mesa.multimetro2, 
                mesaSeleccionada.mesa.fuente, 
                mesaSeleccionada.mesa.generador
              ].map((eq, i) => eq && (
                <div key={i} className={styles.equipoItem}>
                  <img src={eq.imagen_url} alt={eq.nombre_modelo} />
                  <span>{eq.nombre_modelo}</span>
                </div>
              ))}
            </div>

            <div className={styles.modalBody}>
              
              <div className={styles.seccionMantenimiento}>
                <label>Reporte de Mantenimiento Público:</label>
                <textarea 
                  value={editNotas} 
                  onChange={(e) => setEditNotas(e.target.value)}
                  placeholder="Ej. El generador tiene el botón atascado..."
                />
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 700, color: '#1e3a8a', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={editUsarTimer}
                    onChange={(e) => setEditUsarTimer(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#1e40af' }}
                  />
                  Usar temporizador de fin de clase (Bloques de 2h: cierre automático a las :45)
                </label>
              </div>

              <div className={styles.seccionKit}>
                <div className={styles.kitHeader}>
                  <label>Kit de Accesorios Asignado:</label>
                  <button onClick={agregarItemKit} className={styles.btnAñadirKit}>
                    + Añadir Accesorio
                  </button>
                </div>
                
                {editKitList.length === 0 ? (
                  <p className={styles.kitVacio}>No hay accesorios registrados en esta mesa.</p>
                ) : (
                  <div className={styles.listaKit}>
                    {editKitList.map((item, index) => (
                      <div key={index} className={styles.kitItemRow}>
                        <input 
                          type="text" 
                          value={item.nombre} 
                          onChange={(e) => actualizarItemKit(index, 'nombre', e.target.value)}
                          placeholder="Ej. Cables Caimán-Caimán"
                          className={styles.inputNombre}
                        />
                        <input 
                          type="number" 
                          min="1"
                          value={item.cantidad_ideal} 
                          onChange={(e) => actualizarItemKit(index, 'cantidad_ideal', e.target.value)}
                          className={styles.inputCantidad}
                        />
                        <button 
                          onClick={() => eliminarItemKit(index)}
                          className={styles.btnEliminarKit}
                          title="Eliminar"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {mesaSeleccionada.sesion && (
                <div className={styles.seccionSesion}>
                  <strong>Sesión Activa: {mesaSeleccionada.sesion.nombre_alumno}</strong>
                  {mesaSeleccionada.sesion.nota_alumno && (
                    <p>"{mesaSeleccionada.sesion.nota_alumno}"</p>
                  )}
                </div>
              )}

              <div className={styles.modalAcciones}>
                <button onClick={() => setMesaSeleccionada(null)} className={styles.btnCancelar}>
                  Cancelar
                </button>
                <button onClick={handleGuardarCambios} disabled={guardando} className={styles.btnGuardar}>
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}