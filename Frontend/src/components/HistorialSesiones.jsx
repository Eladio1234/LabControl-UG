import { useState, useEffect } from 'react';
import styles from './HistorialSesiones.module.css';

export default function HistorialSesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const registrosPorPagina = 10; 
  const token = localStorage.getItem('token');

  useEffect(() => {
    const cargarHistorial = async () => {
      setCargando(true);
      try {
        const url = `http://localhost:3000/api/sesiones?estado=cerrada&page=${paginaActual}&limit=${registrosPorPagina}`;
        
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
          setTotalPaginas(datos.totalPaginas);
        } else {
          const cerradas = datos.filter(s => s.estado_sesion === 'cerrada');
          cerradas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setSesiones(cerradas);
          setTotalPaginas(1);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [paginaActual, token]); 

  useEffect(() => {
    setPaginaActual(1);
  }, [fechaFiltro]);

  const formatearHora = (fechaString) => {
    if (!fechaString) return '--:--';
    return new Date(fechaString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const formatearFecha = (fechaString) => {
    return new Date(fechaString).toLocaleDateString('es-MX');
  };

  const getIcono = (estado) => estado ? '✔' : '✘';

  // Aplica filtro de búsqueda por fecha (solo a los registros de la página actual)
  const sesionesFiltradas = sesiones.filter(sesion => {
    if (!fechaFiltro) return true;
    const fechaObj = new Date(sesion.created_at);
    const fechaLocal = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}-${String(fechaObj.getDate()).padStart(2, '0')}`;
    return fechaLocal === fechaFiltro;
  });

  const imprimirReporte = () => {
    window.print();
  };

  if (cargando && sesiones.length === 0) return <p style={{ padding: '2rem' }}>Cargando historial...</p>;
  if (error) return <p style={{ color: 'red', padding: '2rem' }}>Error: {error}</p>;

  return (
    <div className={styles.contenedorPrincipal}>
      
      {/* Controles del reporte */}
      <div className={styles.seccionControles}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Bitácora de Laboratorio</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Reporte generado el {new Date().toLocaleDateString('es-MX')}
          </p>
        </div>
        
        <div className={styles.acciones}>
          <div className={styles.filtroCaja}>
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
            {sesionesFiltradas.length === 0 ? (
              <tr>
                <td colSpan="14" style={{ textAlign: 'center', padding: '2rem' }}>
                  No hay registros para mostrar en esta vista.
                </td>
              </tr>
            ) : (
              sesionesFiltradas.map((sesion) => (
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

      {/* Interfaz de Paginación */}
      {totalPaginas > 1 && (
        <div className={styles.paginacionContainer}>
          <button 
            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
            disabled={paginaActual === 1 || cargando}
            className={styles.btnPaginacion}
          >
            Anterior
          </button>
          
          <span className={styles.textoPaginacion}>
            Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
          </span>
          
          <button 
            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas || cargando}
            className={styles.btnPaginacion}
          >
            Siguiente
          </button>
        </div>
      )}

    </div>
  );
}