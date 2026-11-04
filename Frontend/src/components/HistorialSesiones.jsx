import { useState, useEffect } from 'react';
import styles from './HistorialSesiones.module.css';

const STORAGE_KEY_SEMESTRES = 'labcontrol_semestres_registrados';
const STORAGE_KEY_SEMESTRE_ACTIVO = 'labcontrol_semestre_activo';

// Calcula el semestre correspondiente a la fecha actual
const obtenerSemestrePorFecha = (fecha = new Date()) => {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const periodo = mes >= 1 && mes <= 6 ? 'ENERO - JUNIO' : 'AGOSTO - DICIEMBRE';
  return `${periodo} ${anio}`;
};

// Calcula cuál es el siguiente semestre cronológico dado un semestre actual
const calcularSiguienteSemestre = (semestreTexto) => {
  const match = semestreTexto?.toUpperCase().match(/(ENERO - JUNIO|AGOSTO - DICIEMBRE)\s+(\d{4})/);
  if (!match) return obtenerSemestrePorFecha();
  const periodo = match[1];
  const anio = parseInt(match[2], 10);
  if (periodo === 'ENERO - JUNIO') {
    return `AGOSTO - DICIEMBRE ${anio}`;
  }
  return `ENERO - JUNIO ${anio + 1}`;
};

// Carga la lista de semestres registrados (empezando con AGOSTO - DICIEMBRE 2026)
const cargarSemestresGuardados = () => {
  const base = ['AGOSTO - DICIEMBRE 2026'];
  const actual = obtenerSemestrePorFecha();
  if (!base.includes(actual)) base.push(actual);
  try {
    const guardados = JSON.parse(localStorage.getItem(STORAGE_KEY_SEMESTRES) || '[]');
    if (Array.isArray(guardados)) {
      guardados.forEach((s) => {
        if (typeof s === 'string' && !base.includes(s)) base.push(s);
      });
    }
  } catch (e) {}
  return base;
};

// Deserializa el kit_accesorios de la mesa en un arreglo [{ cantidad, descripcion }]
const extraerAccesoriosMesa = (kitObj) => {
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
      cantidad: item.cantidad_ideal ?? 1,
      descripcion: (item.nombre || 'ACCESORIO').toUpperCase()
    }));
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).map(([key, item]) => {
      if (typeof item !== 'object' || item === null) {
        return { cantidad: 1, descripcion: key.toUpperCase() };
      }
      return {
        cantidad: item.cantidad_ideal ?? 1,
        descripcion: (item.nombre || key).toUpperCase()
      };
    });
  }
  return [];
};

// Construye la lista completa de materiales (genéricos + equipos principales asignados a la mesa)
const construirMaterialesMesa = (mesa) => {
  if (!mesa) return [];
  const lista = [...extraerAccesoriosMesa(mesa.kit_accesorios)];

  const formatearEquipo = (prefijo, eq) => {
    if (!eq) return null;
    const marca = (eq.marca || '').trim().toUpperCase();
    const modelo = (eq.nombre_modelo || '').trim().toUpperCase();
    return `${prefijo} ${marca} ${modelo}`.replace(/\s+/g, ' ').trim();
  };

  const equiposPrincipales = [
    formatearEquipo('MULTÍMETRO', mesa.multimetro1),
    formatearEquipo('MULTÍMETRO', mesa.multimetro2),
    formatearEquipo('FUENTE', mesa.fuente),
    formatearEquipo('OSCILOSCOPIO', mesa.osciloscopio),
    formatearEquipo('GENERADOR', mesa.generador)
  ].filter(Boolean);

  equiposPrincipales.forEach((desc) => {
    lista.push({ cantidad: 1, descripcion: desc });
  });

  return lista;
};

// Divide la lista de materiales en 3 bloques para las 3 tablas del encabezado oficial
const dividirEnTresTablas = (items) => {
  const porTabla = Math.max(4, Math.ceil(items.length / 3));
  return [
    items.slice(0, porTabla),
    items.slice(porTabla, porTabla * 2),
    items.slice(porTabla * 2)
  ];
};

export default function HistorialSesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [mesaFiltro, setMesaFiltro] = useState('MESA-01');
  const [semestres, setSemestres] = useState(() => cargarSemestresGuardados());
  const [semestreFiltro, setSemestreFiltro] = useState(() => {
    const guardado = localStorage.getItem(STORAGE_KEY_SEMESTRE_ACTIVO);
    const lista = cargarSemestresGuardados();
    return guardado && lista.includes(guardado) ? guardado : lista[lista.length - 1];
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [folioActual, setFolioActual] = useState(1);
  const [totalRegistrosSemestre, setTotalRegistrosSemestre] = useState(0);
  const registrosPorPagina = 10;
  const token = localStorage.getItem('token');

  // Registra y abre el próximo semestre limpio (ej. ENERO - JUNIO 2027, AGOSTO - DICIEMBRE 2027, etc.)
  const handleRegistrarProximoSemestre = () => {
    const ultimoSemestre = semestres[semestres.length - 1] || 'AGOSTO - DICIEMBRE 2026';
    const siguiente = calcularSiguienteSemestre(ultimoSemestre);
    if (!window.confirm(`¿Deseas habilitar y cambiar al nuevo semestre "${siguiente}" limpio (Folio N° 01)?`)) {
      return;
    }
    const nuevaLista = semestres.includes(siguiente) ? semestres : [...semestres, siguiente];
    setSemestres(nuevaLista);
    setSemestreFiltro(siguiente);
    setFechaFiltro('');
    setPaginaActual(1);
    localStorage.setItem(STORAGE_KEY_SEMESTRES, JSON.stringify(nuevaLista));
    localStorage.setItem(STORAGE_KEY_SEMESTRE_ACTIVO, siguiente);
  };

  const handleCambiarSemestre = (nuevoSemestre) => {
    setSemestreFiltro(nuevoSemestre);
    setFechaFiltro('');
    setPaginaActual(1);
    localStorage.setItem(STORAGE_KEY_SEMESTRE_ACTIVO, nuevoSemestre);
  };

  // Carga el inventario completo de mesas (con sus kits y modelos asignados)
  useEffect(() => {
    const cargarMesas = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/mesas');
        if (res.ok) {
          const data = await res.json();
          const ordenadas = data.sort((a, b) => a.numero_mesa - b.numero_mesa);
          setMesas(ordenadas);
        }
      } catch (e) {
        console.error('Error al cargar mesas:', e);
      }
    };
    cargarMesas();
  }, []);

  // Carga las sesiones cerradas clasificadas por semestre y mesa, paginadas de 10 en 10 (1 folio cada 10 registros)
  useEffect(() => {
    const cargarHistorial = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams({
          estado: 'cerrada',
          page: String(paginaActual),
          limit: String(registrosPorPagina)
        });
        if (mesaFiltro) {
          params.set('mesa_id', mesaFiltro);
        }
        if (semestreFiltro) {
          params.set('semestre', semestreFiltro);
        }
        if (fechaFiltro) {
          params.set('fecha', fechaFiltro);
        }

        const url = `http://localhost:3000/api/sesiones?${params.toString()}`;
        const respuesta = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || 'Error al cargar');

        if (datos.registros) {
          setSesiones(datos.registros);
          const totPag = Math.max(1, datos.totalPaginas || 1);
          setTotalPaginas(totPag);
          setFolioActual(datos.folio || Math.max(1, totPag - paginaActual + 1));
          setTotalRegistrosSemestre(datos.totalRegistros || 0);
        } else {
          const cerradas = datos.filter(s => s.estado_sesion === 'cerrada');
          cerradas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setSesiones(cerradas);
          setTotalPaginas(1);
          setFolioActual(1);
          setTotalRegistrosSemestre(cerradas.length);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [paginaActual, mesaFiltro, semestreFiltro, fechaFiltro, token]);

  useEffect(() => {
    setPaginaActual(1);
  }, [fechaFiltro, mesaFiltro, semestreFiltro]);

  const formatearHora = (fechaString) => {
    if (!fechaString) return '--:--';
    return new Date(fechaString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const formatearFecha = (fechaString) => {
    return new Date(fechaString).toLocaleDateString('es-MX');
  };

  const getIcono = (estado) => estado ? '✔' : '✘';

  const mesaActivaObj = mesas.find(m => m.id === mesaFiltro) || mesas[0] || null;
  const numeroMesaTexto = mesaActivaObj
    ? String(mesaActivaObj.numero_mesa).padStart(2, '0')
    : (mesaFiltro ? mesaFiltro.replace(/MESA[-_ ]?/i, '').padStart(2, '0') : '01');
  const folioTexto = String(folioActual).padStart(2, '0');
  const proximoSemestreSugerido = calcularSiguienteSemestre(semestres[semestres.length - 1] || semestreFiltro);
  const tablasMateriales = dividirEnTresTablas(construirMaterialesMesa(mesaActivaObj));

  const imprimirReporte = () => {
    window.print();
  };

  if (cargando && sesiones.length === 0 && mesas.length === 0) {
    return <p style={{ padding: '2rem' }}>Cargando historial...</p>;
  }
  if (error) return <p style={{ color: 'red', padding: '2rem' }}>Error: {error}</p>;

  return (
    <div className={styles.contenedorPrincipal}>
      
      {/* Controles de filtrado por semestre, mesa y fecha */}
      <div className={styles.seccionControles}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Bitácora de Laboratorio</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Semestre seleccionado: <strong>{semestreFiltro}</strong> ({totalRegistrosSemestre} registros en Mesa {numeroMesaTexto})
          </p>
        </div>
        
        <div className={styles.acciones}>
          <div className={styles.filtroCaja}>
            <label htmlFor="select-semestre">Semestre:</label>
            <select
              id="select-semestre"
              value={semestreFiltro}
              onChange={(e) => handleCambiarSemestre(e.target.value)}
              className={styles.selectMesa}
            >
              {semestres.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRegistrarProximoSemestre}
              className={styles.btnNuevoSemestre}
              title={`Abrir y clasificar nuevo semestre limpio: ${proximoSemestreSugerido}`}
            >
              + Nuevo Semestre ({proximoSemestreSugerido})
            </button>

            <label htmlFor="select-mesa">Mesa:</label>
            <select
              id="select-mesa"
              value={mesaFiltro}
              onChange={(e) => setMesaFiltro(e.target.value)}
              className={styles.selectMesa}
            >
              {mesas.map(m => (
                <option key={m.id} value={m.id}>
                  Mesa {String(m.numero_mesa).padStart(2, '0')}
                </option>
              ))}
              {mesas.length === 0 && <option value="MESA-01">Mesa 01</option>}
            </select>

            <label htmlFor="filtro-fecha">Filtrar por día:</label>
            <input 
              type="date" 
              id="filtro-fecha"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
            />
            {fechaFiltro && (
              <button onClick={() => setFechaFiltro('')} className={styles.btnLimpiar}>
                Limpiar
              </button>
            )}
          </div>
          
          <button onClick={imprimirReporte} className={styles.btnImprimir}>
            🖨️ Imprimir Formato
          </button>
        </div>
      </div>

      {/* Encabezado oficial de la bitácora (visible en pantalla y al imprimir) */}
      <div className={styles.formatoValeHeader}>
        <div className={styles.filaTitulosVale}>
          <span className={styles.tituloLab}>LABORATORIO DE ELECTRÓNICA DICIS</span>
          <span className={styles.claveSemestre}>CLAVE: {semestreFiltro}</span>
          <span className={styles.mesaFolio}>MESA N° {numeroMesaTexto} FOLIO N° {folioTexto}</span>
        </div>

        <p className={styles.notaVale}>
          NOTA: AL RECIBIR LA MESA Y FIRMAR EL VALE, REVISAR QUE TODO ESTE COMPLETO.{' '}
          <strong className={styles.subrayadoNota}>
            SI ALGÚN INSTRUMENTO NO FUNCIONA O FALTA ALGO REPORTARLO INMEDIATAMENTE CON EL ENCARGADO DEL TURNO.
          </strong>
        </p>

        <p className={styles.notaVale}>
          FAVOR DE ENTREGAR LA <strong>MESA ORDENADA</strong> (EQUIPO, PUNTAS ENROLLADAS, SILLAS, ETC.) Y LIMPIA DE BASURA. LA FIRMA DE ESTE VALE NO ES TRANSFERIBLE POR LO QUE USTED DEBE ENTREGAR LA MESA PERSONALMENTE.
        </p>

        {/* 3 Tablas de CANT. / DESCRIPCIÓN dinámicas según el inventario de la mesa seleccionada */}
        <div className={styles.gridTablasMateriales}>
          {tablasMateriales.map((grupo, idx) => (
            <table key={idx} className={styles.tablaMateriales}>
              <thead>
                <tr>
                  <th className={styles.colCant}>CANT.</th>
                  <th>DESCRIPCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {grupo.length === 0 ? (
                  <tr>
                    <td className={styles.colCant}>-</td>
                    <td>SIN MATERIAL ASIGNADO</td>
                  </tr>
                ) : (
                  grupo.map((item, i) => (
                    <tr key={i}>
                      <td className={styles.colCant}>{item.cantidad}</td>
                      <td className={styles.colDesc}>{item.descripcion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ))}
        </div>
      </div>

      {/* Tabla del formato de bitácora imprimible */}
      <div className={styles.tablaWrapper}>
        <table className={styles.tablaBitacora}>
          <thead>
            <tr>
              <th rowSpan="2">Alumno</th>
              <th rowSpan="2">Hora de<br/>entrada</th>
              <th colSpan="2" className={styles.bordeGrosor}>Osciloscopio (Entrada)</th>
              <th colSpan="2" className={styles.bordeGrosor}>Multímetro (Entrada)</th>
              <th rowSpan="2">Materia</th>
              <th rowSpan="2">Profesor</th>
              <th colSpan="2" className={styles.bordeGrosor}>Osciloscopio (Salida)</th>
              <th colSpan="2" className={styles.bordeGrosor}>Multímetro (Salida)</th>
              <th rowSpan="2">Hora<br/>salida</th>
              <th rowSpan="2">Firma<br/>admin</th>
            </tr>
            <tr>
              <th className={styles.subHeader}>Osc 1</th>
              <th className={styles.subHeader}>Osc 2</th>
              <th className={styles.subHeader}>Mult 1</th>
              <th className={styles.subHeader}>Mult 2</th>
              
              <th className={styles.subHeader}>Osc 1</th>
              <th className={styles.subHeader}>Osc 2</th>
              <th className={styles.subHeader}>Mult 1</th>
              <th className={styles.subHeader}>Mult 2</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.length === 0 ? (
              <tr>
                <td colSpan="14" style={{ textAlign: 'center', padding: '2rem' }}>
                  Sin registros en {semestreFiltro} para la Mesa {numeroMesaTexto} (Bitácora limpia — Folio N° 01).
                </td>
              </tr>
            ) : (
              sesiones.map((sesion) => (
                <tr key={sesion.id}>
                  <td className={styles.textoIzquierda}>
                    <strong>{sesion.nombre_alumno}</strong><br/>
                    <span className={styles.mesaSubtexto}>Mesa {sesion.mesa_id?.replace('MESA-', '')} | {formatearFecha(sesion.created_at)}</span>
                  </td>
                  <td>{formatearHora(sesion.hora_entrada)}</td>
                  
                  <td className={sesion.osc1_entrada ? styles.ok : styles.fallo}>{getIcono(sesion.osc1_entrada)}</td>
                  <td className={sesion.osc2_entrada ? styles.ok : styles.fallo}>{getIcono(sesion.osc2_entrada)}</td>
                  <td className={sesion.mult1_entrada ? styles.ok : styles.fallo}>{getIcono(sesion.mult1_entrada)}</td>
                  <td className={sesion.mult2_entrada ? styles.ok : styles.fallo}>{getIcono(sesion.mult2_entrada)}</td>
                  
                  <td>{sesion.materia || '-'}</td>
                  <td>{sesion.nombre_profesor || '-'}</td>
                  
                  <td className={sesion.osc1_salida ? styles.ok : styles.fallo}>{getIcono(sesion.osc1_salida)}</td>
                  <td className={sesion.osc2_salida ? styles.ok : styles.fallo}>{getIcono(sesion.osc2_salida)}</td>
                  <td className={sesion.mult1_salida ? styles.ok : styles.fallo}>{getIcono(sesion.mult1_salida)}</td>
                  <td className={sesion.mult2_salida ? styles.ok : styles.fallo}>{getIcono(sesion.mult2_salida)}</td>
                  
                  <td>
                    {sesion.hora_salida 
                      ? new Date(sesion.hora_salida).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}) 
                      : '--:--'}
                  </td>
                  <td className={styles.firmaEspacio}>
                    {sesion.perfiles_admin?.firma_url ? (
                      <img 
                        src={sesion.perfiles_admin.firma_url} 
                        alt="Firma" 
                        style={{ maxHeight: '40px', maxWidth: '80px', objectFit: 'contain' }} 
                      />
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Sin firma</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Interfaz de Paginación / Cambio de Folio (cada 10 registros por mesa y semestre) */}
      <div className={styles.paginacionContainer}>
        <button 
          onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
          disabled={paginaActual === 1 || cargando}
          className={styles.btnPaginacion}
        >
          Anterior
        </button>
        
        <span className={styles.textoPaginacion}>
          {semestreFiltro} | Mesa <strong>{numeroMesaTexto}</strong> | Folio N° <strong>{folioTexto}</strong> (Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>)
        </span>
        
        <button 
          onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
          disabled={paginaActual === totalPaginas || cargando}
          className={styles.btnPaginacion}
        >
          Siguiente
        </button>
      </div>

    </div>
  );
}
