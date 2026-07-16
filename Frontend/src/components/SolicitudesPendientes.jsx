import { useState, useEffect, useCallback } from 'react';
import styles from './SolicitudesPendientes.module.css';

export default function SolicitudesPendientes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  // Obtiene la lista de solicitudes con estado 'solicitada' desde el backend
  const obtenerSolicitudes = useCallback(async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) setCargando(true);
      const respuesta = await fetch('http://localhost:3000/api/sesiones?estado=solicitada', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'Error del servidor'); 
      setSolicitudes(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [token]);

  // Polling para mantener la lista de peticiones sincronizada cada 10 segundos
  useEffect(() => {
    obtenerSolicitudes(true);
    const intervalo = setInterval(() => obtenerSolicitudes(false), 10000); 
    return () => clearInterval(intervalo);
  }, [obtenerSolicitudes]);

  // Gestiona la aprobación o rechazo de una sesión pendiente
  const procesarSolicitud = async (idSesion, accion) => {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/sesiones/${idSesion}/${accion}`, { 
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!respuesta.ok) throw new Error(`Error al ${accion} la solicitud`);
      obtenerSolicitudes(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (cargando && solicitudes.length === 0) return <div className={styles.statusMsg}>Cargando solicitudes...</div>;
  if (error) return <div className={styles.errorMsg}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Solicitudes Pendientes</h2>
        <button className={styles.btnRefresh} onClick={() => obtenerSolicitudes(true)}>
          🔄 Actualizar
        </button>
      </div>

      {solicitudes.length === 0 ? (
        <div className={styles.emptyState}>No hay solicitudes pendientes.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Alumno</th>
                <th className={styles.hideMobile}>Mesa</th>
                <th className={styles.hideMobile}>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((sol) => (
                <tr key={sol.id}>
                  <td>
                    <div className={styles.cellMain}>{sol.nombre_alumno || 'Alumno'}</div>
                    {/* Badge de mesa visible solo en dispositivos móviles */}
                    <div className={styles.cellMesaMovil}>
                      <span className={styles.badgeMesa}>Mesa {sol.mesa_id?.replace('MESA-', '')}</span>
                    </div>
                    <div className={styles.cellSub}>ID: {sol.id.substring(0, 8)}</div>
                  </td>
                  
                  {/* Columnas ocultas en dispositivos móviles */}
                  <td className={styles.hideMobile}>
                    <span className={styles.badgeMesa}>Mesa {sol.mesa_id?.replace('MESA-', '')}</span>
                  </td>
                  <td className={styles.hideMobile}>
                    <span className={styles.badgeEstado}>En ventanilla</span>
                  </td>
                  
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnAprobar} onClick={() => procesarSolicitud(sol.id, 'aprobar')}>
                        Recibir
                      </button>
                      <button className={styles.btnRechazar} onClick={() => procesarSolicitud(sol.id, 'rechazar')}>
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}