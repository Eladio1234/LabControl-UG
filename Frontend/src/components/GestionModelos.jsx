import { useState, useEffect } from 'react';
import styles from './GestionModelos.module.css';

export default function GestionModelos() {
  const [modelos, setModelos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Recuperación del token de sesión para autorizar las peticiones
  const token = localStorage.getItem('token');
  
  const [form, setForm] = useState({ marca: '', nombre_modelo: '', tipo_equipo: 'osciloscopio', imagen_url: '' });
  
  // Estados para controlar el flujo de edición
  const [modeloEditando, setModeloEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ marca: '', nombre_modelo: '', tipo_equipo: '', imagen_url: '' });

  // Carga del catálogo de modelos desde la API
  const cargarModelos = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:3000/api/modelos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setModelos(data);
    } catch (error) {
      console.error("Error al cargar modelos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarModelos(); }, []);

  // Envía el formulario para registrar un nuevo modelo
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await fetch('http://localhost:3000/api/modelos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      setForm({ marca: '', nombre_modelo: '', tipo_equipo: 'osciloscopio', imagen_url: '' });
      cargarModelos();
    } catch (error) { 
      console.error("Error al guardar:", error); 
    } finally { 
      setGuardando(false); 
    }
  };

  // Remueve un modelo del inventario por su ID
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este modelo?')) return;
    try {
      await fetch(`http://localhost:3000/api/modelos/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      cargarModelos();
    } catch (error) { 
      console.error("Error al eliminar:", error); 
    }
  };

  // Prepara los estados para mostrar la información actual en el modal de edición
  const handleEdit = (modelo) => {
    setModeloEditando(modelo.id);
    setFormEdit({ 
      marca: modelo.marca, 
      nombre_modelo: modelo.nombre_modelo, 
      tipo_equipo: modelo.tipo_equipo, 
      imagen_url: modelo.imagen_url || '' 
    });
  };

  // Envía las modificaciones del modelo al servidor
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3000/api/modelos/${modeloEditando}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formEdit)
      });
      setModeloEditando(null);
      cargarModelos();
    } catch (error) { 
      console.error("Error al actualizar:", error); 
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestionar Modelos de Equipo</h2>
      
      {/* Formulario de Registro */}
      <form onSubmit={handleSubmit} className={styles.formSection}>
        <div className={styles.inputGroup}>
          <label>Marca</label>
          <input type="text" value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Modelo</label>
          <input type="text" value={form.nombre_modelo} onChange={(e) => setForm({...form, nombre_modelo: e.target.value})} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Tipo de Equipo</label>
          <select value={form.tipo_equipo} onChange={(e) => setForm({...form, tipo_equipo: e.target.value})}>
            <option value="osciloscopio">Osciloscopio</option>
            <option value="fuente">Fuente de Poder</option>
            <option value="multimetro">Multímetro</option>
            <option value="generador">Generador de Funciones</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label>URL Imagen</label>
          <input type="url" value={form.imagen_url} onChange={(e) => setForm({...form, imagen_url: e.target.value})} />
        </div>
        <button type="submit" className={styles.btnSubmit} disabled={guardando}>
          {guardando ? 'Registrando...' : '+ Registrar Modelo'}
        </button>
      </form>

      {/* Tabla del Catálogo */}
      <div className={styles.tableWrapper}>
        {cargando ? <p className={styles.loadingText}>Cargando catálogo...</p> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo de Equipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modelos.map(m => (
                <tr key={m.id}>
                  <td data-label="TIPO" className={styles.tipoCelda}>{m.tipo_equipo.replace('_', ' ')}</td>
                  <td data-label="MARCA">{m.marca}</td>
                  <td data-label="MODELO"><strong>{m.nombre_modelo}</strong></td>
                  <td data-label="ACCIONES">
                    <div className={styles.actionsCell}>
                      <button className={styles.btnEdit} onClick={() => handleEdit(m)}>✏️</button>
                      <button className={styles.btnDelete} onClick={() => handleDelete(m.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Modificación */}
      {modeloEditando && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Editar Modelo</h3>
            <form onSubmit={handleUpdate} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label>Marca</label>
                <input type="text" value={formEdit.marca} onChange={(e) => setFormEdit({...formEdit, marca: e.target.value})} required />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Modelo</label>
                <input type="text" value={formEdit.nombre_modelo} onChange={(e) => setFormEdit({...formEdit, nombre_modelo: e.target.value})} required />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Tipo de Equipo</label>
                <select value={formEdit.tipo_equipo} onChange={(e) => setFormEdit({...formEdit, tipo_equipo: e.target.value})}>
                  <option value="osciloscopio">Osciloscopio</option>
                  <option value="fuente">Fuente de Poder</option>
                  <option value="multimetro">Multímetro</option>
                  <option value="generador">Generador de Funciones</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>URL de la Imagen</label>
                <input type="url" value={formEdit.imagen_url} onChange={(e) => setFormEdit({...formEdit, imagen_url: e.target.value})} placeholder="https://..." />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setModeloEditando(null)}>Cancelar</button>
                <button type="submit" className={styles.btnSubmitModal}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}