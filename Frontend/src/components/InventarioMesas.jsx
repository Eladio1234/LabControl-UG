import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './InventarioMesas.module.css';
import ModalMesa from './ModalMesa.jsx';

export default function InventarioMesas() {
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mesaAEditar, setMesaAEditar] = useState(null);
  
  // URL base de la aplicación del alumno para generar los códigos QR
  const baseUrlAlumno = import.meta.env.VITE_ALUMNO_APP_URL || 'http://localhost:5173';

  // Obtiene la lista general de mesas del inventario
  const obtenerMesas = async () => {
    try {
      setCargando(true);
      const res = await fetch('http://localhost:3000/api/mesas');
      if (!res.ok) throw new Error('Error al conectar con el servidor');
      setMesas(await res.json());
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setCargando(false); 
    }
  };

  useEffect(() => { obtenerMesas(); }, []);

  // Retorna el badge visual correspondiente al estado actual de la mesa
  const getEstadoBadge = (estado) => {
    const estados = {
      'disponible': { clase: styles.badgeSuccess, texto: 'Disponible' },
      'ocupada': { clase: styles.badgeWarning, texto: 'Ocupada' },
      'en_peticion': { clase: styles.badgeWarning, texto: 'Pendiente' },
      'revision_pendiente': { clase: styles.badgeDanger, texto: 'En Revisión' }
    };
    const config = estados[estado] || { clase: '', texto: estado };
    return <span className={`${styles.badge} ${config.clase}`}>{config.texto}</span>;
  };

  // Genera y descarga el código QR físico de la mesa en formato PNG
  const descargarQR = (id) => {
    const canvas = document.getElementById(`qr-${id}`);
    if (canvas) {
      const link = document.createElement('a');
      link.download = `QR_${id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gestión de Inventario</h2>
        <button 
          className={styles.btnAgregar} 
          onClick={() => { setMesaAEditar(null); setMostrarModal(true); }}
        >
          + Agregar Mesa
        </button>
      </div>

      {/* Modal para inserción y actualización de mesas */}
      {mostrarModal && (
        <ModalMesa 
          onClose={() => setMostrarModal(false)} 
          onSaveSuccess={obtenerMesas} 
          mesaAEditar={mesaAEditar} 
        />
      )}

      {/* Tabla del inventario físico */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mesa</th>
              <th className={styles.hideMobile}>Equipo Principal</th>
              <th className={styles.hideMobile}>Medición</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mesas.map((m) => (
              <tr key={m.id}>
                <td data-label="MESA">
                  <strong>Mesa {m.numero_mesa}</strong>
                  <div className={styles.subtext}>{m.id}</div>
                </td>
                <td className={styles.hideMobile} data-label="EQUIPO">
                  {m.osciloscopio?.nombre_modelo || 'N/A'}
                </td>
                <td className={styles.hideMobile} data-label="MEDICIÓN">
                  {m.multimetro1?.nombre_modelo || 'N/A'}
                </td>
                <td data-label="ESTADO">{getEstadoBadge(m.estado_actual)}</td>
                <td data-label="ACCIONES">
                  <div className={styles.actions}>
                    <button 
                      className={styles.btnEditar} 
                      onClick={() => { setMesaAEditar(m); setMostrarModal(true); }}
                    >
                      Editar
                    </button>
                    <button className={styles.btnQR} onClick={() => descargarQR(m.id)}>
                      QR
                    </button>
                  </div>
                  {/* Canvas oculto utilizado únicamente para la renderización del QR descargable */}
                  <div style={{ display: 'none' }}>
                    <QRCodeCanvas id={`qr-${m.id}`} value={`${baseUrlAlumno}/mesa/${m.id}`} size={300} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}