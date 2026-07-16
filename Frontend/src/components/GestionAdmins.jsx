import { useState, useEffect } from 'react';
import styles from './GestionAdmins.module.css';

export default function GestionAdmins() {
  const [admins, setAdmins] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Control de rol y credenciales de autenticación
  const miRol = localStorage.getItem('admin_rol') || 'admin'; 
  const token = localStorage.getItem('token');

  const [form, setForm] = useState({ nombre_completo: '', email: '', password: '', rol: 'admin' });
  
  // Estados para control del flujo de edición
  const [adminEditando, setAdminEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nombre_completo: '', email: '', rol: '' });

  // Carga la lista global de administradores registrados
  const cargarAdmins = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/admins', { headers: { 'Authorization': `Bearer ${token}` } });
      const datos = await res.json();
      if (res.ok) setAdmins(datos);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setCargando(false); 
    }
  };

  useEffect(() => { cargarAdmins(); }, []);

  // Procesa el registro de un nuevo administrador en la plataforma
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: 'Creando administrador...', tipo: 'info' });
    try {
      const res = await fetch('http://localhost:3000/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || 'Error al crear usuario');
      
      setMensaje({ texto: '✅ Administrador creado con éxito', tipo: 'exito' });
      setForm({ nombre_completo: '', email: '', password: '', rol: 'admin' });
      cargarAdmins(); 
    } catch (error) { 
      setMensaje({ texto: `❌ ${error.message}`, tipo: 'error' }); 
    }
  };

  // Remueve un perfil de administrador de la base de datos y del servicio de autenticación
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este administrador de forma permanente?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido del servidor');
      
      cargarAdmins();
    } catch (error) { 
      alert(`⚠️ Motivo del fallo: ${error.message}`); 
    }
  };

  // Prepara los estados locales con la información del administrador a editar
  const handleEdit = (admin) => {
    setAdminEditando(admin.id);
    setFormEdit({ nombre_completo: admin.nombre_completo, email: admin.email, rol: admin.rol });
  };

  // Envía las modificaciones del perfil seleccionado al servidor
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:3000/api/admins/${adminEditando}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formEdit)
      });
      if (!res.ok) throw new Error('Error al actualizar');
      setAdminEditando(null);
      cargarAdmins();
    } catch (error) { 
      alert(error.message); 
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.mainTitle}>Gestión de Administradores</h2>

      {/* Formulario de registro visible únicamente para Super Administradores */}
      {miRol === 'super_admin' && (
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Registrar Nuevo Perfil</h3>
          
          {mensaje.texto && (
            <div className={`${styles.alert} ${styles[mensaje.tipo]}`}>
              {mensaje.texto}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.gridForm}>
            <div className={styles.inputGroup}>
              <label>Nombre Completo</label>
              <input 
                type="text" required value={form.nombre_completo}
                onChange={(e) => setForm({...form, nombre_completo: e.target.value})}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Correo Electrónico</label>
              <input 
                type="email" required value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Contraseña Temporal</label>
              <input 
                type="text" required value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Rol en el Sistema</label>
              <select 
                value={form.rol} onChange={(e) => setForm({...form, rol: e.target.value})}
              >
                <option value="admin">Administrador (Solo revisa mesas)</option>
                <option value="super_admin">Super Admin (Control Total)</option>
              </select>
            </div>
            
            <div className={styles.actionRow}>
              <button type="submit" className={styles.btnSubmit}>
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      <h3 className={styles.tableTitle}>Usuarios Registrados</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              {miRol === 'super_admin' && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id}>
                <td data-label="NOMBRE" className={styles.nameCell}>{admin.nombre_completo}</td>
                <td data-label="ROL">
                  <span className={`${styles.badge} ${admin.rol === 'super_admin' ? styles.badgeSuper : styles.badgeAdmin}`}>
                    {admin.rol === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                {miRol === 'super_admin' && (
                  <td data-label="ACCIONES">
                    <div className={styles.actionsCell}>
                      <button className={styles.btnEdit} onClick={() => handleEdit(admin)}>✏️</button>
                      {/* Restricción de seguridad para prevenir la auto-eliminación */}
                      {admin.id !== localStorage.getItem('admin_id') && (
                        <button className={styles.btnDelete} onClick={() => handleDelete(admin.id)}>🗑️</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edición de credenciales y privilegios */}
      {adminEditando && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Editar Administrador</h3>
            <form onSubmit={handleUpdate} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <input type="text" value={formEdit.nombre_completo} onChange={(e) => setFormEdit({...formEdit, nombre_completo: e.target.value})} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Rol</label>
                <select value={formEdit.rol} onChange={(e) => setFormEdit({...formEdit, rol: e.target.value})}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setAdminEditando(null)}>Cancelar</button>
                <button type="submit" className={styles.btnSubmitModal}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}