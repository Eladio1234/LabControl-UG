import { supabase } from '../config/supabase.js'; // Asegúrate de importar tu cliente
import { Toaster, toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import InventarioMesas from '../components/InventarioMesas';
import SolicitudesPendientes from '../components/SolicitudesPendientes';
import MesasActivas from '../components/MesasActivas';
import HistorialSesiones from '../components/HistorialSesiones';
import ResumenMesas from '../components/ResumenMesas';
import GestionAdmins from '../components/GestionAdmins';
import MiPerfil from '../components/MiPerfil';
import GestionModelos from '../components/GestionModelos';

export default function AdminDashboard() {
  const [vistaActiva, setVistaActiva] = useState('resumen');
  const [adminNombre, setAdminNombre] = useState('Cargando...');
  const [adminRol, setAdminRol] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  // Validación de sesión activa y carga de credenciales del administrador
  useEffect(() => {
    const nombre = localStorage.getItem('admin_nombre');
    const rol = localStorage.getItem('admin_rol');
    
    if (!localStorage.getItem('token')) {
      navigate('/');
    } else {
      setAdminNombre(nombre);
      setAdminRol(rol);
    }
  }, [navigate]);

  useEffect(() => {
    const channel = supabase
      .channel('sesiones_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sesiones_laboratorio' },
        (payload) => {
          console.log("Cambio detectado:", payload); // Revisa esto en la consola del navegador
          
          if (payload.new && payload.new.mesa_id) {
            toast(`Sesión Mesa ${payload.new.mesa_id.replace('MESA-', '')} cambió a: ${payload.new.estado_sesion}`);
          }
        }
      )
      .subscribe((status) => {
        console.log("Estado de la suscripción a Realtime:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth-lab-dicis-0');
  };

  const cambiarVista = (vista) => {
    setVistaActiva(vista);
    setMenuAbierto(false);
  };

  return (
    <div className={styles.dashboardLayout}>
      <Toaster position="top-right" reverseOrder={false} />
      {menuAbierto && (
        <div className={styles.overlay} onClick={() => setMenuAbierto(false)}></div>
      )}

      {/* Barra lateral de navegación */}
      <aside className={`${styles.sidebar} ${menuAbierto ? styles.sidebarAbierto : ''}`}>
        <div className={styles.logoArea}>
          <div className={styles.logoContenedor}>
            <svg className={styles.logoIcono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h2>LabControl</h2>
          </div>
          <span className={styles.badge}>UG</span>
        </div>
        
        <nav className={styles.navMenu}>
          <button className={`${styles.navItem} ${vistaActiva === 'resumen' ? styles.active : ''}`} onClick={() => cambiarVista('resumen')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            Resumen General
          </button>
          
          <button className={`${styles.navItem} ${vistaActiva === 'solicitudes' ? styles.active : ''}`} onClick={() => cambiarVista('solicitudes')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Solicitudes Pendientes
          </button>

          <button className={`${styles.navItem} ${vistaActiva === 'activas' ? styles.active : ''}`} onClick={() => cambiarVista('activas')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><line x1="5.52" y1="16" x2="18.48" y2="16"></line></svg>
            Mesas en Uso
          </button>

          <button className={`${styles.navItem} ${vistaActiva === 'inventario' ? styles.active : ''}`} onClick={() => cambiarVista('inventario')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Inventario Mesas
          </button>

          <button className={`${styles.navItem} ${vistaActiva === 'historial' ? styles.active : ''}`} onClick={() => cambiarVista('historial')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Historial Sesiones
          </button>

          {/* Acceso condicional restringido a perfiles super_admin */}
          {String(adminRol).trim() === 'super_admin' && (
            <button className={`${styles.navItem} ${vistaActiva === 'gestion_admins' ? styles.active : ''}`} onClick={() => cambiarVista('gestion_admins')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Gestionar Admins
            </button>
          )}

          <button className={`${styles.navItem} ${vistaActiva === 'gestion_modelos' ? styles.active : ''}`} onClick={() => cambiarVista('gestion_modelos')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            Modelos Equipo
          </button>

          <button className={`${styles.navItem} ${vistaActiva === 'mi_perfil' ? styles.active : ''}`} onClick={() => cambiarVista('mi_perfil')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Mi Perfil
          </button>
        </nav>

        <div className={styles.userArea}>
          <div className={styles.avatar}>{adminNombre.charAt(0).toUpperCase()}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{adminNombre}</p>
            <p className={styles.userRole}>
              {String(adminRol).trim() === 'super_admin' ? 'Super Admin' : 'Administrador'}
            </p>
          </div>
        </div>
      </aside>

      {/* Contenedor principal de pantallas */}
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <div className={styles.headerIzquierda}>
            <button className={styles.menuToggleBtn} onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1>
              {vistaActiva === 'resumen' ? 'Panel General' : 
               vistaActiva === 'inventario' ? 'Inventario de Laboratorio' : 
               vistaActiva === 'solicitudes' ? 'Solicitudes Pendientes' : 
               vistaActiva === 'activas' ? 'Control de Mesas en Uso' :
               vistaActiva === 'gestion_admins' ? 'Gestión de Administradores' :  
               vistaActiva === 'mi_perfil' ? 'Mi Perfil' :
               vistaActiva === 'gestion_modelos' ? 'Modelos de Equipos' : 
               'Historial de Sesiones'}
            </h1>
          </div>
          
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>Cerrar Sesión</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </header>

        {/* Sección de componentes dinámicos */}
        <div className={styles.contenedorVista}>
          {vistaActiva === 'resumen' && <ResumenMesas />}
          {vistaActiva === 'solicitudes' && <SolicitudesPendientes />}
          {vistaActiva === 'activas' && <MesasActivas />}
          {vistaActiva === 'inventario' && <InventarioMesas />}
          {vistaActiva === 'historial' && <HistorialSesiones />}
          {vistaActiva === 'gestion_admins' && <GestionAdmins />}
          {vistaActiva === 'mi_perfil' && <MiPerfil />}
          {vistaActiva === 'gestion_modelos' && <GestionModelos />}
        </div>
      </main>
    </div>
  );
}