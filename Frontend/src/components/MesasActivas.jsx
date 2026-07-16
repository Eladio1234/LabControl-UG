import { useState, useEffect, useCallback } from 'react';
import styles from './MesasActivas.module.css';

export default function MesasActivas() {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [sesionCerrando, setSesionCerrando] = useState(null);
  const [formSalida, setFormSalida] = useState({ osc1: true, osc2: true, mult1: true, mult2: true, nota_admin: '' });
  const token = localStorage.getItem('token');

  // Obtiene las sesiones activas o en proceso de entrega finalizadas por el alumno
  const cargarMesasActivas = useCallback(async (mostrarLoader = true) => {
    if (mostrarLoader) setCargando(true);
    try {
      const res = await fetch('http://localhost:3000/api/sesiones', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || 'Error al cargar');
      setSesiones(datos.filter(s => ['activa', 'finalizada_alumno'].includes(s.estado_sesion)));
    } catch (err) { 
      console.error(err); 
    } finally { 
      setCargando(false); 
    }
  }, [token]);

  // Polling para mantener actualizada la lista de mesas activas
  useEffect(() => {
    cargarMesasActivas();
    const i = setInterval(() => cargarMesasActivas(false), 10000);
    return () => clearInterval(i);
  }, [cargarMesasActivas]);

  // Procesa el cierre definitivo y la liberación física de la mesa
  const handleFinalizarSesion = async (e) => {
    e.preventDefault();
    const adminId = localStorage.getItem('admin_id');
    try {
      const res = await fetch(`http://localhost:3000/api/sesiones/${sesionCerrando.id}/finalizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formSalida, admin_id: adminId })
      });
      if (!res.ok) throw new Error('Error al liberar mesa');
      setSesionCerrando(null);
      cargarMesasActivas();
    } catch (err) { 
      alert(err.message); 
    }
  };

  // Abre el modal de revisión validando previamente la firma digital del administrador
  const handleAbrirRevision = (sesion) => {
    const tieneFirma = localStorage.getItem('firma_url');

    if (!tieneFirma || tieneFirma === 'null' || tieneFirma === 'undefined') {
      alert("⚠️ ¡Acceso denegado! Debes subir tu firma digital en la sección 'Mi Perfil' antes de poder revisar y liberar equipos.");
      return; 
    }

    setFormSalida({ osc1: true, osc2: true, mult1: true, mult2: true, nota_admin: '' });
    setSesionCerrando(sesion);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Control de Mesas en Uso</h2>

      {cargando ? (
        <p className={styles.loading}>Cargando información...</p>
      ) : sesiones.length === 0 ? (
        <div className={styles.emptyState}>No hay mesas en uso actualmente.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Alumno</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.id}>
                  <td data-label="MESA">
                    <span className={styles.badgeMesa}>Mesa {s.mesa_id?.replace('MESA-', '')}</span>
                  </td>
                  <td data-label="ALUMNO" className={styles.nombreCell}>{s.nombre_alumno}</td>
                  <td data-label="ESTADO">
                    <span className={s.estado_sesion === 'activa' ? styles.statusActiva : styles.statusRevision}>
                      {s.estado_sesion === 'activa' ? 'En Uso' : 'Revisión'}
                    </span>
                  </td>
                  <td data-label="ACCIÓN">
                    <button className={styles.btnAccion} onClick={() => handleAbrirRevision(s)}>
                      {s.estado_sesion === 'finalizada_alumno' ? 'Revisar' : 'Forzar Salida'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de revisión y liberación de equipo */}
      {sesionCerrando && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Revisión Mesa {sesionCerrando.mesa_id.replace('MESA-', '')}</h3>
              <button className={styles.btnClose} onClick={() => setSesionCerrando(null)}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Alumno:</span>
                <span className={styles.infoValue}>{sesionCerrando.nombre_alumno}</span>
              </div>

              {sesionCerrando.nota_alumno && (
                <div className={styles.notaAlumnoBox}>
                  <span className={styles.notaLabel}>Nota dejada por el alumno:</span>
                  <p>{sesionCerrando.nota_alumno}</p>
                </div>
              )}

              <form onSubmit={handleFinalizarSesion}>
                <h4 className={styles.sectionTitle}>Estado de Entrega del Equipo</h4>
                <div className={styles.gridChecks}>
                  {['osc1', 'osc2', 'mult1', 'mult2'].map(key => (
                    <label key={key} className={`${styles.checkCard} ${formSalida[key] ? styles.checkActive : styles.checkInactive}`}>
                      <input 
                        type="checkbox" 
                        checked={formSalida[key]} 
                        onChange={(e) => setFormSalida({...formSalida, [key]: e.target.checked})} 
                      />
                      <span className={styles.checkText}>{key.toUpperCase()} OK</span>
                    </label>
                  ))}
                </div>

                <div className={styles.observacionesGroup}>
                  <label>Observaciones del Administrador (Opcional)</label>
                  <textarea 
                    className={styles.textarea} 
                    placeholder="Describe si hay algún daño, cable faltante o incidencia..." 
                    value={formSalida.nota_admin}
                    onChange={(e) => setFormSalida({...formSalida, nota_admin: e.target.value})} 
                  />
                </div>

                <div className={styles.actions}>
                  <button type="button" onClick={() => setSesionCerrando(null)} className={styles.btnCancel}>Cancelar</button>
                  <button type="submit" className={styles.btnSave}>Liberar Mesa</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}